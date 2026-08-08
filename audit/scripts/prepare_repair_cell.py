#!/usr/bin/env python3
"""Prepare one repair-job output as a canonical 2:3 cell.

A repair job may return either one pose or a 2x2 board. In board mode only the
requested K1..K4 quadrant is retained. The result is fitted without aspect
distortion onto a canonical chroma cell.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

LABELS = ("K1", "K2", "K3", "K4")
SLOT_INDEX = {"K1": (0, 0), "K2": (1, 0), "K3": (0, 1), "K4": (1, 1)}


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
    rgb[distance <= tolerance] = np.array(target_key, dtype=np.uint8)
    return Image.fromarray(rgb, mode="RGB")


def crop_board_slot(image: Image.Image, label: str) -> Image.Image:
    if image.width % 2 or image.height % 2:
        raise ValueError(
            f"board-mode input must be divisible by 2x2, got {image.width}x{image.height}"
        )
    col, row = SLOT_INDEX[label]
    cw = image.width // 2
    ch = image.height // 2
    return image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))


def fit_on_canvas(
    image: Image.Image,
    *,
    width: int,
    height: int,
    key: tuple[int, int, int],
) -> Image.Image:
    scale = min(width / image.width, height / image.height)
    size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )
    resized = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (width, height), key)
    x = (width - resized.width) // 2
    y = (height - resized.height) // 2
    canvas.paste(resized, (x, y))
    return canvas


def parse_hex(value: str) -> tuple[int, int, int]:
    text = value.lstrip("#")
    if len(text) != 6:
        raise ValueError("--target-key must be #RRGGBB")
    return tuple(int(text[i : i + 2], 16) for i in (0, 2, 4))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--slot", choices=LABELS, required=True)
    parser.add_argument("--mode", choices=("cell", "board"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--target-width", type=int, default=512)
    parser.add_argument("--target-height", type=int, default=768)
    parser.add_argument("--target-key", help="Target chroma as #RRGGBB")
    parser.add_argument("--border-width", type=int, default=12)
    parser.add_argument("--background-tolerance", type=float, default=18.0)
    args = parser.parse_args()

    with Image.open(args.input) as source_image:
        source = source_image.convert("RGB")

    selected = crop_board_slot(source, args.slot) if args.mode == "board" else source
    target_key = (
        parse_hex(args.target_key)
        if args.target_key
        else detect_key(np.asarray(selected, dtype=np.uint8), args.border_width)
    )

    selected = normalize_near_key(
        selected,
        target_key=target_key,
        border_width=args.border_width,
        tolerance=args.background_tolerance,
    )
    prepared = fit_on_canvas(
        selected,
        width=args.target_width,
        height=args.target_height,
        key=target_key,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    prepared.save(args.output, format="PNG", optimize=True)

    report = {
        "version": 1,
        "input": args.input.name,
        "slot": args.slot,
        "input_mode": args.mode,
        "input_size": [source.width, source.height],
        "selected_size": [selected.width, selected.height],
        "output_size": [prepared.width, prepared.height],
        "target_key_rgb": list(target_key),
        "target_key_hex": "#%02X%02X%02X" % target_key,
    }
    report_path = args.output.with_suffix(".json")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "report": str(report_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
