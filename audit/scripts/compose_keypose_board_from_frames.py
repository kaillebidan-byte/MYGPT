#!/usr/bin/env python3
"""Compose four chroma-key pose images into one canonical 2x2 motion board.

The image model produces one full-body pose per image. This script owns board geometry,
common scale, baseline alignment, safe gaps, and chroma normalization.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image


def border_pixels(rgb: np.ndarray, width: int = 12) -> np.ndarray:
    h, w, _ = rgb.shape
    width = max(1, min(width, h // 2, w // 2))
    return np.concatenate([
        rgb[:width].reshape(-1, 3),
        rgb[h-width:].reshape(-1, 3),
        rgb[width:h-width, :width].reshape(-1, 3),
        rgb[width:h-width, w-width:].reshape(-1, 3),
    ])


def detect_key(rgb: np.ndarray) -> tuple[int, int, int]:
    samples = border_pixels(rgb)
    quant = (samples // 4) * 4
    coarse = np.array(Counter(map(tuple, quant.tolist())).most_common(1)[0][0], dtype=np.int16)
    distance = np.linalg.norm(samples.astype(np.int16) - coarse, axis=1)
    nearby = samples[distance <= 10]
    if len(nearby) == 0:
        nearby = samples
    key = np.median(nearby, axis=0).astype(np.uint8)
    return tuple(int(v) for v in key)


def chroma_to_rgba(image: Image.Image, *, key: tuple[int, int, int], soft: float, hard: float) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    delta = rgb.astype(np.float32) - np.array(key, dtype=np.float32)
    distance = np.linalg.norm(delta, axis=2)
    alpha = np.clip((distance - soft) / max(hard - soft, 1e-6), 0.0, 1.0)
    alpha = np.rint(alpha * 255).astype(np.uint8)
    rgba = np.dstack([rgb, alpha])
    return Image.fromarray(rgba, mode="RGBA")


def alpha_bbox(image: Image.Image, threshold: int = 24) -> tuple[int, int, int, int] | None:
    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    ys, xs = np.where(alpha > threshold)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def parse_hex(value: str) -> tuple[int, int, int]:
    text = value.strip().lstrip("#")
    if len(text) != 6:
        raise ValueError("target key must be RRGGBB or #RRGGBB")
    return tuple(int(text[i:i+2], 16) for i in (0, 2, 4))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames", type=Path, nargs=4, required=True, metavar=("F1", "F2", "F3", "F4"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1536)
    parser.add_argument("--outer-margin", type=int, default=48)
    parser.add_argument("--center-gap-x", type=int, default=96)
    parser.add_argument("--center-gap-y", type=int, default=112)
    parser.add_argument("--slot-padding", type=int, default=16)
    parser.add_argument("--target-key", help="Optional output chroma key, e.g. #F000E0")
    parser.add_argument("--soft-distance", type=float, default=24.0)
    parser.add_argument("--hard-distance", type=float, default=70.0)
    args = parser.parse_args()

    if args.width <= 0 or args.height <= 0:
        raise ValueError("width and height must be positive")

    mid_x, mid_y = args.width // 2, args.height // 2
    hx, hy = args.center_gap_x // 2, args.center_gap_y // 2
    slots = [
        (args.outer_margin, args.outer_margin, mid_x - hx, mid_y - hy),
        (mid_x + hx, args.outer_margin, args.width - args.outer_margin, mid_y - hy),
        (args.outer_margin, mid_y + hy, mid_x - hx, args.height - args.outer_margin),
        (mid_x + hx, mid_y + hy, args.width - args.outer_margin, args.height - args.outer_margin),
    ]

    prepared: list[Image.Image] = []
    reports: list[dict[str, object]] = []
    detected_keys: list[tuple[int, int, int]] = []

    for index, path in enumerate(args.frames, start=1):
        with Image.open(path) as src:
            rgb = np.asarray(src.convert("RGB"), dtype=np.uint8)
            key = detect_key(rgb)
            detected_keys.append(key)
            rgba = chroma_to_rgba(src, key=key, soft=args.soft_distance, hard=args.hard_distance)
        bbox = alpha_bbox(rgba)
        if bbox is None:
            raise ValueError(f"F{index} has no detectable foreground")
        crop = rgba.crop(bbox)
        prepared.append(crop)
        reports.append({
            "frame": f"F{index}",
            "file": path.name,
            "detected_key": list(key),
            "bbox": list(bbox),
            "foreground_size": [crop.width, crop.height],
        })

    available_w = min(x1 - x0 for x0, _, x1, _ in slots) - 2 * args.slot_padding
    available_h = min(y1 - y0 for _, y0, _, y1 in slots) - 2 * args.slot_padding
    if available_w <= 0 or available_h <= 0:
        raise ValueError("slot geometry leaves no drawable area")

    max_w = max(img.width for img in prepared)
    max_h = max(img.height for img in prepared)
    common_scale = min(available_w / max_w, available_h / max_h)
    if common_scale <= 0:
        raise ValueError("invalid common scale")

    target_key = parse_hex(args.target_key) if args.target_key else detected_keys[0]
    board = Image.new("RGBA", (args.width, args.height), (*target_key, 255))

    for index, (sprite, slot) in enumerate(zip(prepared, slots), start=1):
        size = (max(1, round(sprite.width * common_scale)), max(1, round(sprite.height * common_scale)))
        sprite = sprite.resize(size, Image.Resampling.LANCZOS)
        x0, y0, x1, y1 = slot
        x = x0 + (x1 - x0 - sprite.width) // 2
        baseline = y1 - args.slot_padding
        y = baseline - sprite.height
        if y < y0 + args.slot_padding:
            raise ValueError(f"F{index} exceeds its safe slot after normalization")
        board.alpha_composite(sprite, (x, y))
        reports[index - 1]["placed_bbox"] = [x, y, x + sprite.width, y + sprite.height]

    rgb_board = Image.new("RGB", board.size, target_key)
    rgb_board.paste(board.convert("RGB"), mask=board.getchannel("A"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rgb_board.save(args.output, format="PNG", optimize=True)

    metadata = {
        "version": 1,
        "board_size": [args.width, args.height],
        "target_key": list(target_key),
        "outer_margin": args.outer_margin,
        "center_gap_x": args.center_gap_x,
        "center_gap_y": args.center_gap_y,
        "slot_padding": args.slot_padding,
        "common_scale": common_scale,
        "slots": [list(slot) for slot in slots],
        "frames": reports,
        "note": "Board geometry is deterministic. Chroma extraction preserves sufficiently non-key shadows/effects so later audit can still reject them.",
    }
    meta_path = args.metadata or args.output.with_suffix(".json")
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "metadata": str(meta_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
