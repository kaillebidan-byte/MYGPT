#!/usr/bin/env python3
"""Compose a canonical 2x2 repair board by selecting cells from INITIAL and EDITED boards."""

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
    left = rgb[width:h - width, :width, :].reshape(-1, 3)
    right = rgb[width:h - width, w - width:, :].reshape(-1, 3)
    return np.concatenate([top, bottom, left, right], axis=0)


def detect_key(image: Image.Image, border_width: int) -> tuple[int, int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
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


def parse_hex(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        raise argparse.ArgumentTypeError("target key must be RRGGBB or #RRGGBB")
    try:
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("invalid target key") from exc


def split_board(image: Image.Image) -> dict[str, Image.Image]:
    rgb = image.convert("RGB")
    w, h = rgb.size
    x = w // 2
    y = h // 2
    boxes = {
        "K1": (0, 0, x, y),
        "K2": (x, 0, w, y),
        "K3": (0, y, x, h),
        "K4": (x, y, w, h),
    }
    return {label: rgb.crop(box) for label, box in boxes.items()}


def normalize_near_key(
    image: Image.Image,
    *,
    target_key: tuple[int, int, int],
    border_width: int,
    tolerance: float,
) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8).copy()
    local_key = np.array(detect_key(image, border_width), dtype=np.int16)
    distance = np.linalg.norm(rgb.astype(np.int16) - local_key, axis=2)
    mask = distance <= tolerance
    rgb[mask] = np.array(target_key, dtype=np.uint8)
    return Image.fromarray(rgb, mode="RGB")


def fit_cell(
    image: Image.Image,
    *,
    size: tuple[int, int],
    target_key: tuple[int, int, int],
    border_width: int,
    tolerance: float,
) -> Image.Image:
    cell = normalize_near_key(
        image,
        target_key=target_key,
        border_width=border_width,
        tolerance=tolerance,
    )
    tw, th = size
    scale = min(tw / cell.width, th / cell.height)
    nw = max(1, round(cell.width * scale))
    nh = max(1, round(cell.height * scale))
    cell = cell.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, target_key)
    canvas.paste(cell, ((tw - nw) // 2, (th - nh) // 2))
    return normalize_near_key(
        canvas,
        target_key=target_key,
        border_width=border_width,
        tolerance=tolerance,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--initial", type=Path, required=True)
    parser.add_argument("--edited", type=Path, required=True)
    parser.add_argument(
        "--use-edited",
        nargs="*",
        choices=LABELS,
        default=[],
        help="Slots to take from EDITED; all others are taken from INITIAL.",
    )
    parser.add_argument("--target-key", type=parse_hex)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1536)
    parser.add_argument("--border-width", type=int, default=12)
    parser.add_argument("--background-tolerance", type=float, default=18.0)
    args = parser.parse_args()

    if args.width % 2 or args.height % 2:
        raise ValueError("output width and height must both be divisible by 2")

    with Image.open(args.initial) as im:
        initial = im.convert("RGB")
    with Image.open(args.edited) as im:
        edited = im.convert("RGB")

    initial_cells = split_board(initial)
    edited_cells = split_board(edited)
    target_key = args.target_key or detect_key(initial, args.border_width)

    cell_size = (args.width // 2, args.height // 2)
    use_edited = set(args.use_edited)
    canvas = Image.new("RGB", (args.width, args.height), target_key)

    boxes = {
        "K1": (0, 0),
        "K2": (cell_size[0], 0),
        "K3": (0, cell_size[1]),
        "K4": (cell_size[0], cell_size[1]),
    }
    sources: dict[str, str] = {}

    for label in LABELS:
        source = edited_cells[label] if label in use_edited else initial_cells[label]
        prepared = fit_cell(
            source,
            size=cell_size,
            target_key=target_key,
            border_width=args.border_width,
            tolerance=args.background_tolerance,
        )
        canvas.paste(prepared, boxes[label])
        sources[label] = "EDITED" if label in use_edited else "INITIAL"

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, format="PNG", optimize=True)

    report = {
        "version": 1,
        "output": args.output.name,
        "board_size": [args.width, args.height],
        "cell_size": list(cell_size),
        "key_rgb": list(target_key),
        "key_hex": "#%02X%02X%02X" % target_key,
        "sources": sources,
        "initial_size": list(initial.size),
        "edited_size": list(edited.size),
        "background_tolerance": args.background_tolerance,
    }
    report_path = args.output.with_suffix(".json")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "report": str(report_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
