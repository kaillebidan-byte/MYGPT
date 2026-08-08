#!/usr/bin/env python3
"""Compose four repaired pose cells into the original 2x2 board geometry."""

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


def normalize_near_key(
    image: Image.Image,
    *,
    target_key: tuple[int, int, int],
    border_width: int,
    tolerance: float,
) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8).copy()
    local_key = np.array(detect_key(rgb, border_width), dtype=np.int16)
    distance = np.linalg.norm(rgb.astype(np.int16) - local_key, axis=2)
    mask = distance <= tolerance
    rgb[mask] = np.array(target_key, dtype=np.uint8)
    return Image.fromarray(rgb, mode="RGB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--cells", type=Path, nargs=4, metavar=LABELS, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--border-width", type=int, default=12)
    parser.add_argument("--background-tolerance", type=float, default=18.0)
    args = parser.parse_args()

    metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
    board_w, board_h = map(int, metadata["board_size"])
    cell_w, cell_h = map(int, metadata["cell_size"])
    target_key = tuple(int(v) for v in metadata["key_rgb"])

    if [slot["label"] for slot in metadata["slots"]] != list(LABELS):
        raise ValueError("Metadata slot order must be K1,K2,K3,K4")

    canvas = Image.new("RGB", (board_w, board_h), target_key)

    for label, path, slot in zip(LABELS, args.cells, metadata["slots"]):
        with Image.open(path) as source:
            cell = source.convert("RGB")

        ratio = cell.width / cell.height
        target_ratio = cell_w / cell_h
        if abs(ratio - target_ratio) > 0.03:
            raise ValueError(
                f"{label} aspect ratio {ratio:.4f} differs from target cell ratio {target_ratio:.4f}"
            )

        if cell.size != (cell_w, cell_h):
            cell = cell.resize((cell_w, cell_h), Image.Resampling.LANCZOS)

        cell = normalize_near_key(
            cell,
            target_key=target_key,
            border_width=args.border_width,
            tolerance=args.background_tolerance,
        )

        left, top, right, bottom = map(int, slot["box"])
        if (right - left, bottom - top) != (cell_w, cell_h):
            raise ValueError(f"Metadata box for {label} does not match cell size")
        canvas.paste(cell, (left, top))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, format="PNG", optimize=True)

    report = {
        "version": 1,
        "output": args.output.name,
        "board_size": [board_w, board_h],
        "cell_size": [cell_w, cell_h],
        "key_rgb": list(target_key),
        "key_hex": "#%02X%02X%02X" % target_key,
        "cells": [path.name for path in args.cells],
        "background_tolerance": args.background_tolerance,
    }
    report_path = args.output.with_suffix(".json")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "report": str(report_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
