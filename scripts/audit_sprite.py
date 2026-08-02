#!/usr/bin/env python3
"""Audit, normalize, and preview an animated sprite atlas."""

from __future__ import annotations

import argparse
import json
import statistics
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageStat

from create_contact_sheet import create_contact_sheet
from create_preview import create_preview
from normalize_sprite import alpha_bbox, normalize_atlas


def coefficient_of_variation(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = statistics.mean(values)
    return statistics.pstdev(values) / mean if mean else 0.0


def composite_for_diff(image: Image.Image) -> Image.Image:
    background = Image.new("RGBA", image.size, (255, 255, 255, 255))
    background.alpha_composite(image.convert("RGBA"))
    return background.convert("RGB")


def mean_absolute_difference(a: Image.Image, b: Image.Image) -> float:
    diff = ImageChops.difference(composite_for_diff(a), composite_for_diff(b)).convert("L")
    return float(ImageStat.Stat(diff).mean[0])


def transparent_rgb_ratio(image: Image.Image, tolerance: int) -> float:
    rgba = image.convert("RGBA")
    pixels = rgba.get_flattened_data() if hasattr(rgba, "get_flattened_data") else rgba.getdata()
    total_transparent = 0
    residue = 0
    for red, green, blue, alpha in pixels:
        if alpha == 0:
            total_transparent += 1
            if max(red, green, blue) > tolerance:
                residue += 1
    return residue / total_transparent if total_transparent else 0.0


def row_audit(
    image: Image.Image,
    row_index: int,
    state: str,
    spec: dict[str, Any],
    expected_active: bool,
) -> dict[str, Any]:
    canvas = spec["canvas"]
    thresholds = spec["audit"]
    columns = int(canvas["columns"])
    cell_width = int(canvas["cell_width"])
    cell_height = int(canvas["cell_height"])
    alpha_threshold = int(thresholds["alpha_threshold"])
    edge_margin = int(thresholds["edge_margin_px"])

    frames: list[Image.Image] = []
    frame_reports: list[dict[str, Any]] = []
    baselines: list[int] = []
    widths: list[int] = []
    heights: list[int] = []
    issues: list[dict[str, Any]] = []

    for column in range(columns):
        box = (
            column * cell_width,
            row_index * cell_height,
            (column + 1) * cell_width,
            (row_index + 1) * cell_height,
        )
        cell = image.crop(box).convert("RGBA")
        frames.append(cell)
        bbox = alpha_bbox(cell, alpha_threshold)
        report: dict[str, Any] = {"frame": column + 1, "empty": bbox is None}
        if bbox:
            left, top, right, bottom = bbox
            width = right - left
            height = bottom - top
            baselines.append(bottom)
            widths.append(width)
            heights.append(height)
            touching = {
                "left": left <= edge_margin,
                "top": top <= edge_margin,
                "right": right >= cell_width - edge_margin,
                "bottom": bottom >= cell_height - edge_margin,
            }
            report.update(
                {
                    "bbox": [left, top, right, bottom],
                    "width": width,
                    "height": height,
                    "baseline": bottom,
                    "touching_edges": [name for name, value in touching.items() if value],
                }
            )
            if any(touching.values()):
                issues.append(
                    {
                        "code": "cell_edge_contact",
                        "frame": column + 1,
                        "edges": report["touching_edges"],
                    }
                )
        frame_reports.append(report)

    nonempty = sum(not frame["empty"] for frame in frame_reports)
    if expected_active and nonempty != columns:
        issues.append({"code": "missing_frames", "nonempty": nonempty, "expected": columns})
    if not expected_active and nonempty:
        issues.append({"code": "unused_row_not_empty", "nonempty": nonempty})

    baseline_range = max(baselines) - min(baselines) if baselines else 0
    height_cv = coefficient_of_variation([float(value) for value in heights])
    width_cv = coefficient_of_variation([float(value) for value in widths])
    if expected_active and baseline_range > int(thresholds["baseline_tolerance_px"]):
        issues.append(
            {
                "code": "baseline_variance",
                "value": baseline_range,
                "allowed": thresholds["baseline_tolerance_px"],
            }
        )
    if expected_active and height_cv > float(thresholds["height_cv_tolerance"]):
        issues.append(
            {
                "code": "height_variance",
                "value": round(height_cv, 4),
                "allowed": thresholds["height_cv_tolerance"],
            }
        )
    if expected_active and width_cv > float(thresholds["width_cv_tolerance"]):
        issues.append(
            {
                "code": "width_variance",
                "value": round(width_cv, 4),
                "allowed": thresholds["width_cv_tolerance"],
            }
        )

    adjacent_diffs = [
        mean_absolute_difference(frames[index], frames[(index + 1) % columns])
        for index in range(columns)
    ]
    duplicates: list[list[int]] = []
    for index, value in enumerate(adjacent_diffs):
        if value <= float(thresholds["near_duplicate_mad"]):
            duplicates.append([index + 1, (index + 1) % columns + 1])
    if expected_active and duplicates:
        issues.append({"code": "near_duplicate_frames", "pairs": duplicates})

    warnings: list[dict[str, Any]] = []
    if (
        expected_active
        and adjacent_diffs
        and statistics.median(adjacent_diffs) < float(thresholds["low_motion_mad_warning"])
    ):
        warnings.append(
            {
                "code": "low_motion",
                "median_adjacent_mad": round(statistics.median(adjacent_diffs), 3),
                "threshold": thresholds["low_motion_mad_warning"],
            }
        )

    return {
        "row": row_index + 1,
        "state": state,
        "expected_active": expected_active,
        "passed": not issues,
        "metrics": {
            "nonempty_frames": nonempty,
            "baseline_range_px": baseline_range,
            "height_cv": round(height_cv, 4),
            "width_cv": round(width_cv, 4),
            "adjacent_frame_mad": [round(value, 3) for value in adjacent_diffs],
        },
        "frames": frame_reports,
        "issues": issues,
        "warnings": warnings,
    }


def build_repair_instruction(rows: list[dict[str, Any]]) -> str | None:
    failed = [row for row in rows if not row["passed"] and row["expected_active"]]
    if not failed:
        return None
    parts: list[str] = []
    for row in failed:
        codes = ", ".join(issue["code"] for issue in row["issues"])
        parts.append(f"{row['row']}行目（{row['state']}）: {codes}")
    return "次の行だけを再生成し、問題のない行とキャラクターデザインは維持する。" + " / ".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument(
        "--expected-states",
        default="",
        help="Comma-separated active states; omitted means spec states",
    )
    parser.add_argument("--normalize", action=argparse.BooleanOptionalAction, default=True)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    expected_states = [state.strip() for state in args.expected_states.split(",") if state.strip()] or list(
        spec["states"]
    )
    canvas = spec["canvas"]
    expected_size = (int(canvas["width"]), int(canvas["height"]))
    image = Image.open(args.input).convert("RGBA")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    canvas_passed = image.size == expected_size
    residue_ratio = transparent_rgb_ratio(image, int(spec["audit"]["transparent_rgb_tolerance"]))
    transparency_passed = residue_ratio <= float(spec["audit"]["transparent_rgb_failure_ratio"])

    row_reports: list[dict[str, Any]] = []
    if canvas_passed:
        for row_index in range(int(canvas["rows"])):
            state = expected_states[row_index] if row_index < len(expected_states) else f"unused-{row_index + 1}"
            row_reports.append(
                row_audit(image, row_index, state, spec, row_index < len(expected_states))
            )

    passed = canvas_passed and transparency_passed and all(row["passed"] for row in row_reports)
    report = {
        "version": 1,
        "passed": passed,
        "input": args.input.name,
        "spec": spec["name"],
        "canvas": {
            "passed": canvas_passed,
            "actual": {"width": image.width, "height": image.height},
            "expected": {"width": expected_size[0], "height": expected_size[1]},
        },
        "transparency": {
            "passed": transparency_passed,
            "transparent_rgb_residue_ratio": round(residue_ratio, 8),
            "allowed": spec["audit"]["transparent_rgb_failure_ratio"],
        },
        "rows": row_reports,
        "repair_instruction": build_repair_instruction(row_reports),
        "outputs": {
            "audit": "audit.json",
            "contact_sheet": "contact-sheet.png",
            "preview": "preview.gif",
            "normalized": "normalized-spritesheet.webp" if args.normalize else None,
        },
    }
    (args.output_dir / "audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    if canvas_passed:
        contact = create_contact_sheet(image, spec, expected_states)
        contact.save(args.output_dir / "contact-sheet.png", format="PNG", optimize=True)
        preview_frames = create_preview(image, spec, expected_states)
        duration = round(1000 / max(1, int(spec.get("animation", {}).get("fps", 8))))
        preview_frames[0].save(
            args.output_dir / "preview.gif",
            save_all=True,
            append_images=preview_frames[1:],
            duration=duration,
            loop=0,
            optimize=False,
            disposal=2,
        )
        if args.normalize:
            normalized = normalize_atlas(image, spec, len(expected_states))
            normalized.save(
                args.output_dir / "normalized-spritesheet.webp",
                format="WEBP",
                lossless=True,
                method=6,
            )

    print(json.dumps({"passed": passed, "audit": str(args.output_dir / "audit.json")}, ensure_ascii=False))
    raise SystemExit(0 if passed else 2)


if __name__ == "__main__":
    main()
