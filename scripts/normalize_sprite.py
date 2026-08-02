#!/usr/bin/env python3
"""Normalize per-cell sprite scale and baseline while preserving atlas geometry."""

from __future__ import annotations

import argparse
import json
import statistics
from pathlib import Path
from typing import Iterable

from PIL import Image


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def _median_int(values: Iterable[int], fallback: int) -> int:
    collected = list(values)
    return max(1, round(statistics.median(collected))) if collected else fallback


def normalize_atlas(image: Image.Image, spec: dict, active_rows: int) -> Image.Image:
    canvas = spec["canvas"]
    audit = spec["audit"]
    columns = int(canvas["columns"])
    rows = int(canvas["rows"])
    cell_width = int(canvas["cell_width"])
    cell_height = int(canvas["cell_height"])
    alpha_threshold = int(audit.get("alpha_threshold", 8))
    padding = int(audit.get("normalization_padding_px", 8))
    target_occupancy = float(audit.get("target_cell_occupancy", 0.78))

    source = image.convert("RGBA")
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))

    for row in range(rows):
        cells: list[Image.Image] = []
        bboxes: list[tuple[int, int, int, int] | None] = []
        for column in range(columns):
            box = (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
            cell = source.crop(box)
            cells.append(cell)
            bboxes.append(alpha_bbox(cell, alpha_threshold))

        if row >= active_rows:
            continue

        widths = [box[2] - box[0] for box in bboxes if box]
        heights = [box[3] - box[1] for box in bboxes if box]
        median_width = _median_int(widths, max(1, cell_width - 2 * padding))
        median_height = _median_int(heights, max(1, cell_height - 2 * padding))

        max_target_width = max(
            1, min(cell_width - 2 * padding, round(cell_width * target_occupancy))
        )
        max_target_height = max(
            1, min(cell_height - 2 * padding, round(cell_height * target_occupancy))
        )
        scale = min(max_target_width / median_width, max_target_height / median_height, 1.0)
        target_width = max(1, round(median_width * scale))
        target_height = max(1, round(median_height * scale))
        baseline = cell_height - padding

        for column, (cell, bbox) in enumerate(zip(cells, bboxes)):
            if bbox is None:
                continue
            sprite = cell.crop(bbox)
            source_width, source_height = sprite.size
            fit_scale = min(target_width / source_width, target_height / source_height)
            new_size = (
                max(1, round(source_width * fit_scale)),
                max(1, round(source_height * fit_scale)),
            )
            sprite = sprite.resize(new_size, Image.Resampling.LANCZOS)
            x = column * cell_width + (cell_width - sprite.width) // 2
            y = row * cell_height + baseline - sprite.height
            output.alpha_composite(sprite, (x, y))

    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--active-rows", type=int, default=9)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    image = Image.open(args.input).convert("RGBA")
    normalized = normalize_atlas(image, spec, args.active_rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    normalized.save(args.output, format="WEBP", lossless=True, method=6)


if __name__ == "__main__":
    main()
