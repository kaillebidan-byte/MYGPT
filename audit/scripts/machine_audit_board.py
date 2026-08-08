#!/usr/bin/env python3
"""Machine-check mechanical properties of a raw 2x2 chroma motion board.

This script intentionally does not judge character identity or motion semantics.
It reports geometry/chroma signals that can supplement visual review.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image


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
    # Quantize slightly so tiny generated variations do not defeat mode detection.
    q = (samples // 4) * 4
    counts = Counter(map(tuple, q.tolist()))
    coarse = np.array(counts.most_common(1)[0][0], dtype=np.int16)
    d = np.linalg.norm(samples.astype(np.int16) - coarse, axis=1)
    nearby = samples[d <= 8]
    if len(nearby) == 0:
        nearby = samples
    key = np.median(nearby, axis=0).astype(np.uint8)
    return tuple(int(v) for v in key)


def centered_empty_gap(mask: np.ndarray, axis: int) -> int:
    # mask=True means non-chroma / foreground-like.
    occupied = mask.any(axis=axis)
    n = occupied.shape[0]
    c = n // 2
    left = c - 1
    while left >= 0 and not occupied[left]:
        left -= 1
    right = c
    while right < n and not occupied[right]:
        right += 1
    return max(0, right - left - 1)


def band_fraction(mask: np.ndarray, *, vertical: bool, half_width: int) -> float:
    h, w = mask.shape
    if vertical:
        c = w // 2
        band = mask[:, max(0, c - half_width) : min(w, c + half_width)]
    else:
        c = h // 2
        band = mask[max(0, c - half_width) : min(h, c + half_width), :]
    return float(band.mean()) if band.size else 0.0


def quadrant_bboxes(mask: np.ndarray) -> list[dict[str, object]]:
    h, w = mask.shape
    xs = [(0, w // 2), (w // 2, w)]
    ys = [(0, h // 2), (h // 2, h)]
    names = ["top-left", "top-right", "bottom-left", "bottom-right"]
    out: list[dict[str, object]] = []
    i = 0
    for y0, y1 in ys:
        for x0, x1 in xs:
            q = mask[y0:y1, x0:x1]
            yy, xx = np.where(q)
            if len(xx) == 0:
                bbox = None
            else:
                bbox = [int(x0 + xx.min()), int(y0 + yy.min()), int(x0 + xx.max() + 1), int(y0 + yy.max() + 1)]
            out.append({"slot": names[i], "bbox": bbox})
            i += 1
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--border-width", type=int, default=12)
    parser.add_argument("--foreground-distance", type=float, default=60.0)
    parser.add_argument("--edge-margin", type=int, default=12)
    parser.add_argument("--center-band", type=int, default=6)
    parser.add_argument("--aspect-target", type=float, default=2.0 / 3.0)
    parser.add_argument("--aspect-tolerance", type=float, default=0.08)
    args = parser.parse_args()

    with Image.open(args.input) as image:
        rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)

    h, w, _ = rgb.shape
    key = detect_key(rgb, args.border_width)
    delta = rgb.astype(np.int16) - np.array(key, dtype=np.int16)
    distance = np.linalg.norm(delta, axis=2)
    non_chroma = distance > args.foreground_distance

    aspect = w / h
    aspect_pass = abs(aspect - args.aspect_target) <= args.aspect_tolerance

    edge = max(1, min(args.edge_margin, w // 2, h // 2))
    outer = np.zeros_like(non_chroma)
    outer[:edge, :] = True
    outer[h - edge :, :] = True
    outer[:, :edge] = True
    outer[:, w - edge :] = True
    outer_non_chroma_pixels = int(np.logical_and(non_chroma, outer).sum())

    v_contam = band_fraction(non_chroma, vertical=True, half_width=args.center_band)
    h_contam = band_fraction(non_chroma, vertical=False, half_width=args.center_band)

    whiteish = (
        (rgb.min(axis=2) >= 235)
        & ((rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)) <= 12)
    )
    v_white = band_fraction(whiteish, vertical=True, half_width=args.center_band)
    h_white = band_fraction(whiteish, vertical=False, half_width=args.center_band)

    border = border_pixels(rgb, args.border_width).astype(np.int16)
    border_distance = np.linalg.norm(border - np.array(key, dtype=np.int16), axis=1)
    border_key_match_ratio = float((border_distance <= 24.0).mean())

    result = {
        "version": 1,
        "input": args.input.name,
        "width": w,
        "height": h,
        "aspect_ratio": round(aspect, 6),
        "aspect_target": round(args.aspect_target, 6),
        "aspect_pass": bool(aspect_pass),
        "key_rgb": list(key),
        "key_hex": "#%02X%02X%02X" % key,
        "border_key_match_ratio": round(border_key_match_ratio, 6),
        "foreground_distance": args.foreground_distance,
        "outer_edge_non_chroma_pixels": outer_non_chroma_pixels,
        "vertical_center_gap_px": centered_empty_gap(non_chroma, axis=0),
        "horizontal_center_gap_px": centered_empty_gap(non_chroma, axis=1),
        "vertical_center_band_non_chroma_ratio": round(v_contam, 6),
        "horizontal_center_band_non_chroma_ratio": round(h_contam, 6),
        "vertical_center_band_white_ratio": round(v_white, 6),
        "horizontal_center_band_white_ratio": round(h_white, 6),
        "quadrant_bboxes": quadrant_bboxes(non_chroma),
        "mechanical_flags": {
            "wrong_aspect": not aspect_pass,
            "outer_edge_contact": outer_non_chroma_pixels > 0,
            "center_vertical_contamination": v_contam > 0.005,
            "center_horizontal_contamination": h_contam > 0.005,
            "divider_like_vertical_white_band": v_white > 0.5,
            "divider_like_horizontal_white_band": h_white > 0.5,
            "border_not_uniform": border_key_match_ratio < 0.98,
        },
        "scope_note": "Machine audit covers mechanical geometry/chroma signals only; identity, motion semantics, limb continuity, endpoint, and subtle attached shadows still require visual review.",
    }

    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
