#!/usr/bin/env python3
"""Compose four prepared repair cells into a canonical 2x2 portrait board.

The output geometry is independent of the INITIAL board geometry so a bad
INITIAL aspect ratio can be repaired instead of preserved.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

LABELS = ("K1", "K2", "K3", "K4")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--cells", type=Path, nargs=4, metavar=LABELS, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--target-width", type=int, default=1024)
    parser.add_argument("--target-height", type=int, default=1536)
    args = parser.parse_args()

    metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
    target_key = tuple(int(v) for v in metadata["key_rgb"])

    if args.target_width % 2 or args.target_height % 2:
        raise ValueError("Target board size must be divisible by 2x2")

    board_w = args.target_width
    board_h = args.target_height
    cell_w = board_w // 2
    cell_h = board_h // 2
    target_ratio = cell_w / cell_h

    canvas = Image.new("RGB", (board_w, board_h), target_key)
    boxes = [
        (0, 0, cell_w, cell_h),
        (cell_w, 0, board_w, cell_h),
        (0, cell_h, cell_w, board_h),
        (cell_w, cell_h, board_w, board_h),
    ]

    reports = []
    for label, path, box in zip(LABELS, args.cells, boxes):
        with Image.open(path) as source:
            cell = source.convert("RGB")

        ratio = cell.width / cell.height
        if abs(ratio - target_ratio) > 0.03:
            raise ValueError(
                f"{label} prepared cell ratio {ratio:.4f} differs from canonical ratio {target_ratio:.4f}"
            )

        original_size = [cell.width, cell.height]
        if cell.size != (cell_w, cell_h):
            cell = cell.resize((cell_w, cell_h), Image.Resampling.LANCZOS)

        canvas.paste(cell, box[:2])
        reports.append(
            {
                "label": label,
                "file": path.name,
                "input_size": original_size,
                "box": list(box),
            }
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, format="PNG", optimize=True)

    report = {
        "version": 2,
        "output": args.output.name,
        "source_initial_board_size": metadata.get("board_size"),
        "board_size": [board_w, board_h],
        "cell_size": [cell_w, cell_h],
        "key_rgb": list(target_key),
        "key_hex": "#%02X%02X%02X" % target_key,
        "cells": reports,
    }
    report_path = args.output.with_suffix(".json")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "report": str(report_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
