#!/usr/bin/env python3
"""Split a raw 2x2 repair board into four exact cell images and metadata."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image


LABELS = ("K1", "K2", "K3", "K4")


def border_pixels(rgb: np.ndarray, width: int) -> np.ndarray:
    h, w, _ = rgb.shape
    width = max(1, min(width, w // 2, h // 2))
    top = rgb[:width, :, :].reshape(-1, 3)
    bottom = rgb[h - width :, :, :].reshape(-1, 3)
    left = rgb[width : h - width, :width, :].reshape(-1, 3)
    right = rgb[width : h - width, w - width :, :].reshape(-1, 3)
    return np.concatenate([top, bottom, left, right], axis=0)


def detect_key(rgb: np.ndarray, border_width: int) -> tuple[int, int, int]:
    samples = border_pixels(rgb, border_width)
    q = (samples // 4) * 4
    counts = Counter(map(tuple, q.tolist()))
    coarse = np.array(counts.most_common(1)[0][0], dtype=np.int16)
    d = np.linalg.norm(samples.astype(np.int16) - coarse, axis=1)
    nearby = samples[d <= 8]
    if len(nearby) == 0:
        nearby = samples
    key = np.median(nearby, axis=0).astype(np.uint8)
    return tuple(int(v) for v in key)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--border-width", type=int, default=12)
    args = parser.parse_args()

    with Image.open(args.input) as source:
        image = source.convert("RGB")

    if image.width % 2 or image.height % 2:
        raise ValueError(f"Board size must be divisible by 2x2: {image.width}x{image.height}")

    cell_w = image.width // 2
    cell_h = image.height // 2
    key = detect_key(np.asarray(image, dtype=np.uint8), args.border_width)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    slots = []
    index = 0
    for row in range(2):
        for col in range(2):
            label = LABELS[index]
            box = (
                col * cell_w,
                row * cell_h,
                (col + 1) * cell_w,
                (row + 1) * cell_h,
            )
            cell = image.crop(box)
            path = args.output_dir / f"{label}.png"
            cell.save(path, format="PNG", optimize=True)
            slots.append(
                {
                    "label": label,
                    "file": path.name,
                    "row": row,
                    "column": col,
                    "box": list(box),
                }
            )
            index += 1

    metadata_path = args.metadata or (args.output_dir / "repair_cells.json")
    metadata = {
        "version": 1,
        "source": args.input.name,
        "board_size": [image.width, image.height],
        "cell_size": [cell_w, cell_h],
        "key_rgb": list(key),
        "key_hex": "#%02X%02X%02X" % key,
        "order": list(LABELS),
        "slots": slots,
    }
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output_dir": str(args.output_dir), "metadata": str(metadata_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
