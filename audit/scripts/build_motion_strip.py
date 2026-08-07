#!/usr/bin/env python3
"""Build a normalized motion strip from transparent pose boards or individual pose images."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int] | None:
    alpha = image.convert("RGBA").getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def load_spec(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def split_board(
    image: Image.Image,
    *,
    columns: int,
    rows: int,
) -> list[Image.Image]:
    rgba = image.convert("RGBA")
    if rgba.width % columns or rgba.height % rows:
        raise ValueError(
            f"Pose board size {rgba.width}x{rgba.height} is not divisible by {columns}x{rows}"
        )
    cell_width = rgba.width // columns
    cell_height = rgba.height // rows
    cells: list[Image.Image] = []
    for row in range(rows):
        for column in range(columns):
            cells.append(
                rgba.crop(
                    (
                        column * cell_width,
                        row * cell_height,
                        (column + 1) * cell_width,
                        (row + 1) * cell_height,
                    )
                )
            )
    return cells


def extract_sprite(
    image: Image.Image,
    *,
    alpha_threshold: int,
    edge_margin: int,
    source_name: str,
    pose_index: int,
) -> tuple[Image.Image, dict[str, Any]]:
    rgba = image.convert("RGBA")
    alpha_min, _ = rgba.getchannel("A").getextrema()
    if alpha_min > alpha_threshold:
        raise ValueError(f"{source_name} pose {pose_index} must contain transparent background pixels")

    bbox = alpha_bbox(rgba, alpha_threshold)
    if bbox is None:
        raise ValueError(f"{source_name} pose {pose_index} is empty")

    left, top, right, bottom = bbox
    touching = {
        "left": left < edge_margin,
        "top": top < edge_margin,
        "right": right > rgba.width - edge_margin,
        "bottom": bottom > rgba.height - edge_margin,
    }
    touched = [name for name, value in touching.items() if value]
    if touched:
        raise ValueError(
            f"{source_name} pose {pose_index} is too close to image edges: {', '.join(touched)}"
        )

    sprite = rgba.crop(bbox).convert("RGBA")
    report = {
        "pose": pose_index,
        "bbox": [left, top, right, bottom],
        "input_size": [rgba.width, rgba.height],
        "source_size": [sprite.width, sprite.height],
    }
    return sprite, report


def extract_sprites_from_board(
    board: Image.Image,
    *,
    spec: dict[str, Any],
    board_name: str,
) -> tuple[list[Image.Image], list[dict[str, Any]]]:
    input_spec = spec["input"]
    columns = int(input_spec["columns"])
    rows = int(input_spec["rows"])
    if columns != 2 or rows != 2:
        raise ValueError("Board input currently supports only a 2x2 pose board")

    alpha_threshold = int(input_spec.get("alpha_threshold", 8))
    edge_margin = int(input_spec.get("edge_margin_px", 8))
    cells = split_board(board.convert("RGBA"), columns=columns, rows=rows)

    sprites: list[Image.Image] = []
    reports: list[dict[str, Any]] = []
    for index, cell in enumerate(cells, start=1):
        sprite, report = extract_sprite(
            cell,
            alpha_threshold=alpha_threshold,
            edge_margin=edge_margin,
            source_name=board_name,
            pose_index=index,
        )
        sprites.append(sprite)
        reports.append(report)
    return sprites, reports


def extract_sprites_from_images(
    paths: list[Path],
    *,
    spec: dict[str, Any],
    source_name: str,
) -> tuple[list[Image.Image], list[dict[str, Any]]]:
    input_spec = spec["input"]
    alpha_threshold = int(input_spec.get("alpha_threshold", 8))
    edge_margin = int(input_spec.get("edge_margin_px", 8))

    sprites: list[Image.Image] = []
    reports: list[dict[str, Any]] = []
    for index, path in enumerate(paths, start=1):
        with Image.open(path) as image:
            sprite, report = extract_sprite(
                image,
                alpha_threshold=alpha_threshold,
                edge_margin=edge_margin,
                source_name=source_name,
                pose_index=index,
            )
        report["file"] = path.name
        sprites.append(sprite)
        reports.append(report)
    return sprites, reports


def load_pose_source(
    *,
    board_path: Path | None,
    image_paths: list[Path] | None,
    spec: dict[str, Any],
    source_name: str,
) -> tuple[list[Image.Image], list[dict[str, Any]]]:
    if (board_path is None) == (image_paths is None):
        raise ValueError(f"{source_name} requires exactly one board or four individual images")

    if image_paths is not None:
        if len(image_paths) != 4:
            raise ValueError(f"{source_name} requires exactly four individual images")
        return extract_sprites_from_images(image_paths, spec=spec, source_name=source_name)

    assert board_path is not None
    with Image.open(board_path) as board:
        return extract_sprites_from_board(board, spec=spec, board_name=source_name)


def parse_frame_plan(
    value: str,
    *,
    key_labels: list[str],
    inbetween_labels: list[str],
) -> list[str]:
    labels = [item.strip() for item in value.split(",") if item.strip()]
    expected = key_labels + inbetween_labels

    if len(labels) != len(expected):
        raise ValueError(
            f"frame plan must contain exactly {len(expected)} labels: {', '.join(expected)}"
        )
    if len(set(labels)) != len(labels):
        raise ValueError("frame plan must use each keypose and inbetween label exactly once")
    if set(labels) != set(expected):
        missing = sorted(set(expected) - set(labels))
        unknown = sorted(set(labels) - set(expected))
        details: list[str] = []
        if missing:
            details.append(f"missing: {', '.join(missing)}")
        if unknown:
            details.append(f"unknown: {', '.join(unknown)}")
        raise ValueError("invalid frame plan (" + "; ".join(details) + ")")

    key_order = [label for label in labels if label in key_labels]
    if key_order != key_labels:
        raise ValueError(
            "frame plan must preserve keypose order: " + ", ".join(key_labels)
        )

    inbetween_order = [label for label in labels if label in inbetween_labels]
    if inbetween_order != inbetween_labels:
        raise ValueError(
            "frame plan must preserve inbetween chronological order: "
            + ", ".join(inbetween_labels)
        )

    return labels


def normalize_sprites(
    sprites: list[Image.Image],
    *,
    cell_width: int,
    cell_height: int,
    padding: int,
    max_upscale: float,
) -> list[Image.Image]:
    available_width = cell_width - 2 * padding
    available_height = cell_height - 2 * padding
    if available_width <= 0 or available_height <= 0:
        raise ValueError("Output padding leaves no drawable area")

    max_width = max(sprite.width for sprite in sprites)
    max_height = max(sprite.height for sprite in sprites)
    common_scale = min(
        available_width / max_width,
        available_height / max_height,
        max_upscale,
    )
    if common_scale <= 0:
        raise ValueError("Calculated scale is invalid")

    normalized: list[Image.Image] = []
    for sprite in sprites:
        size = (
            max(1, round(sprite.width * common_scale)),
            max(1, round(sprite.height * common_scale)),
        )
        normalized.append(sprite.resize(size, Image.Resampling.LANCZOS))
    return normalized


def build_strip(
    sprites: list[Image.Image],
    *,
    cell_width: int,
    cell_height: int,
    padding: int,
) -> Image.Image:
    output = Image.new(
        "RGBA",
        (cell_width * len(sprites), cell_height),
        (0, 0, 0, 0),
    )
    baseline = cell_height - padding
    for index, sprite in enumerate(sprites):
        x = index * cell_width + (cell_width - sprite.width) // 2
        y = baseline - sprite.height
        if y < padding:
            raise ValueError(f"Normalized pose {index + 1} exceeds the output cell")
        output.alpha_composite(sprite, (x, y))
    return output


def save_debug_cells(
    cells: list[Image.Image],
    *,
    directory: Path,
    prefix: str,
) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    for index, cell in enumerate(cells, start=1):
        cell.save(directory / f"{prefix}-{index}.png", format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "keypose_board",
        type=Path,
        nargs="?",
        help="Transparent 2x2 key-pose board.",
    )
    parser.add_argument(
        "--keypose-images",
        type=Path,
        nargs=4,
        metavar=("K1", "K2", "K3", "K4"),
        help="Four separate transparent key-pose images in K1 K2 K3 K4 order.",
    )
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--inbetween-board",
        type=Path,
        help="Optional transparent 2x2 in-between board containing I1 I2 I3 I4 in chronological order.",
    )
    parser.add_argument(
        "--inbetween-images",
        type=Path,
        nargs=4,
        metavar=("I1", "I2", "I3", "I4"),
        help="Optional four separate transparent in-between images in chronological order.",
    )
    parser.add_argument(
        "--frame-plan",
        help=(
            "Explicit comma-separated final frame order using K1..K4 and I1..I4. "
            "Example loop: K1,I1,K2,I2,K3,I3,K4,I4. "
            "Example one-shot: K1,I1,K2,I2,I3,K3,I4,K4. "
            "If omitted with inbetweens, the legacy interleave order is used for compatibility."
        ),
    )
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--debug-dir", type=Path)
    args = parser.parse_args()

    if (args.keypose_board is None) == (args.keypose_images is None):
        parser.error("provide exactly one of keypose_board or --keypose-images")
    if args.inbetween_board is not None and args.inbetween_images is not None:
        parser.error("provide at most one of --inbetween-board or --inbetween-images")

    spec = load_spec(args.spec)
    key_sprites, key_reports = load_pose_source(
        board_path=args.keypose_board,
        image_paths=args.keypose_images,
        spec=spec,
        source_name="keypose source",
    )

    key_labels = list(spec["input"]["keypose_order"])
    sequence = key_sprites
    sequence_labels = key_labels
    plan_source = "keyposes-only"
    reports: dict[str, Any] = {"keyposes": key_reports}

    has_inbetweens = args.inbetween_board is not None or args.inbetween_images is not None
    inbetween_sprites: list[Image.Image] | None = None
    if args.frame_plan and not has_inbetweens:
        parser.error("--frame-plan requires --inbetween-board or --inbetween-images")

    if has_inbetweens:
        inbetween_sprites, inbetween_reports = load_pose_source(
            board_path=args.inbetween_board,
            image_paths=args.inbetween_images,
            spec=spec,
            source_name="inbetween source",
        )
        if len(inbetween_sprites) != len(key_sprites):
            raise ValueError("Key-pose and in-between sources must contain the same pose count")

        inbetween_labels = list(spec["input"]["inbetween_order"])
        if len(inbetween_labels) != len(inbetween_sprites):
            raise ValueError("Spec inbetween_order must match the number of in-between poses")

        sprite_by_label = {
            **dict(zip(key_labels, key_sprites)),
            **dict(zip(inbetween_labels, inbetween_sprites)),
        }

        if args.frame_plan:
            sequence_labels = parse_frame_plan(
                args.frame_plan,
                key_labels=key_labels,
                inbetween_labels=inbetween_labels,
            )
            plan_source = "explicit"
        else:
            sequence_labels = [
                label
                for pair in zip(key_labels, inbetween_labels)
                for label in pair
            ]
            plan_source = "legacy-interleave"

        sequence = [sprite_by_label[label] for label in sequence_labels]
        reports["inbetweens"] = inbetween_reports

    output_spec = spec["output"]
    cell_width = int(output_spec["cell_width"])
    cell_height = int(output_spec["cell_height"])
    padding = int(output_spec.get("padding_px", 16))
    max_upscale = float(output_spec.get("max_upscale", 1.0))

    normalized = normalize_sprites(
        sequence,
        cell_width=cell_width,
        cell_height=cell_height,
        padding=padding,
        max_upscale=max_upscale,
    )
    strip = build_strip(
        normalized,
        cell_width=cell_width,
        cell_height=cell_height,
        padding=padding,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.output, format="PNG", optimize=True)

    if args.debug_dir:
        save_debug_cells(key_sprites, directory=args.debug_dir, prefix="keypose")
        if inbetween_sprites is not None:
            save_debug_cells(
                inbetween_sprites,
                directory=args.debug_dir,
                prefix="inbetween",
            )

    metadata_path = args.metadata or args.output.with_suffix(".json")
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata = {
        "version": 3,
        "spec": spec["name"],
        "frame_count": len(normalized),
        "frame_order": sequence_labels,
        "frame_plan_source": plan_source,
        "cell": {"width": cell_width, "height": cell_height},
        "output": args.output.name,
        "source": {
            "keypose_board": args.keypose_board.name if args.keypose_board else None,
            "keypose_images": [path.name for path in args.keypose_images] if args.keypose_images else None,
            "inbetween_board": args.inbetween_board.name if args.inbetween_board else None,
            "inbetween_images": [path.name for path in args.inbetween_images] if args.inbetween_images else None,
        },
        "reports": reports,
    }
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output),
                "metadata": str(metadata_path),
                "frame_count": len(normalized),
                "frame_order": sequence_labels,
                "frame_plan_source": plan_source,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
