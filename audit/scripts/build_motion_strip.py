#!/usr/bin/env python3
"""Build a normalized motion strip from one or two transparent 2x2 pose boards."""

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
    spec = json.loads(path.read_text(encoding="utf-8"))
    if int(spec["input"]["columns"]) != 2 or int(spec["input"]["rows"]) != 2:
        raise ValueError("This builder currently supports only a 2x2 pose board")
    return spec


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


def extract_sprites(
    board: Image.Image,
    *,
    spec: dict[str, Any],
    board_name: str,
) -> tuple[list[Image.Image], list[dict[str, Any]]]:
    input_spec = spec["input"]
    columns = int(input_spec["columns"])
    rows = int(input_spec["rows"])
    alpha_threshold = int(input_spec.get("alpha_threshold", 8))
    edge_margin = int(input_spec.get("edge_margin_px", 8))

    rgba = board.convert("RGBA")
    alpha_min, _ = rgba.getchannel("A").getextrema()
    if alpha_min > alpha_threshold:
        raise ValueError(f"{board_name} must contain transparent background pixels")

    cells = split_board(rgba, columns=columns, rows=rows)
    sprites: list[Image.Image] = []
    reports: list[dict[str, Any]] = []

    for index, cell in enumerate(cells, start=1):
        bbox = alpha_bbox(cell, alpha_threshold)
        if bbox is None:
            raise ValueError(f"{board_name} pose {index} is empty")

        left, top, right, bottom = bbox
        touching = {
            "left": left < edge_margin,
            "top": top < edge_margin,
            "right": right > cell.width - edge_margin,
            "bottom": bottom > cell.height - edge_margin,
        }
        touched = [name for name, value in touching.items() if value]
        if touched:
            raise ValueError(
                f"{board_name} pose {index} is too close to cell edges: {', '.join(touched)}"
            )

        sprite = cell.crop(bbox).convert("RGBA")
        sprites.append(sprite)
        reports.append(
            {
                "pose": index,
                "bbox": [left, top, right, bottom],
                "source_size": [sprite.width, sprite.height],
            }
        )

    return sprites, reports


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
    parser.add_argument("keypose_board", type=Path)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--inbetween-board",
        type=Path,
        help="Optional second 2x2 board. Its poses are interleaved with the key poses.",
    )
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--debug-dir", type=Path)
    args = parser.parse_args()

    spec = load_spec(args.spec)
    key_board = Image.open(args.keypose_board).convert("RGBA")
    key_sprites, key_reports = extract_sprites(
        key_board,
        spec=spec,
        board_name="keypose board",
    )

    sequence = key_sprites
    sequence_labels = list(spec["input"]["keypose_order"])
    reports: dict[str, Any] = {"keyposes": key_reports}

    if args.inbetween_board:
        inbetween_board = Image.open(args.inbetween_board).convert("RGBA")
        inbetween_sprites, inbetween_reports = extract_sprites(
            inbetween_board,
            spec=spec,
            board_name="inbetween board",
        )
        if len(inbetween_sprites) != len(key_sprites):
            raise ValueError("Key-pose and in-between boards must contain the same pose count")
        sequence = [sprite for pair in zip(key_sprites, inbetween_sprites) for sprite in pair]
        sequence_labels = [
            label
            for pair in zip(
                spec["input"]["keypose_order"],
                spec["input"]["inbetween_order"],
            )
            for label in pair
        ]
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
        if args.inbetween_board:
            save_debug_cells(
                inbetween_sprites,
                directory=args.debug_dir,
                prefix="inbetween",
            )

    metadata_path = args.metadata or args.output.with_suffix(".json")
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata = {
        "version": 1,
        "spec": spec["name"],
        "frame_count": len(normalized),
        "frame_order": sequence_labels,
        "cell": {"width": cell_width, "height": cell_height},
        "output": args.output.name,
        "source": {
            "keypose_board": args.keypose_board.name,
            "inbetween_board": args.inbetween_board.name if args.inbetween_board else None,
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
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
