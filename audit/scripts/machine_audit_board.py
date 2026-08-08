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
from PIL import Image, ImageFilter


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


def centered_empty_gap(mask: np.ndarray, axis: int) -> int:
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


def dilate_mask(mask: np.ndarray, radius: int) -> np.ndarray:
    if radius <= 0:
        return mask.copy()
    size = radius * 2 + 1
    image = Image.fromarray((mask.astype(np.uint8) * 255), mode="L")
    return np.asarray(image.filter(ImageFilter.MaxFilter(size))) > 0


def background_quality_metrics(
    rgb: np.ndarray,
    *,
    key: tuple[int, int, int],
    distance: np.ndarray,
    core_foreground_distance: float,
    exclusion_radius: int,
    deviation_distance: float,
) -> dict[str, float | int]:
    core_foreground = distance > core_foreground_distance
    safe_background = ~dilate_mask(core_foreground, exclusion_radius)
    safe_count = int(safe_background.sum())

    deviation = (distance > deviation_distance) & safe_background
    deviation_count = int(deviation.sum())
    deviation_ratio = deviation_count / safe_count if safe_count else 0.0

    rgb_f = rgb.astype(np.float32)
    key_f = np.array(key, dtype=np.float32)
    key_norm = float(np.linalg.norm(key_f))
    rgb_norm = np.linalg.norm(rgb_f, axis=2)
    dot = np.tensordot(rgb_f, key_f, axes=([2], [0]))
    cosine = dot / np.maximum(rgb_norm * key_norm, 1e-6)
    scale = dot / max(key_norm * key_norm, 1e-6)
    residual = np.linalg.norm(rgb_f - scale[..., None] * key_f, axis=2)

    shadow_like = (
        safe_background
        & (cosine >= 0.99)
        & (scale >= 0.20)
        & (scale <= 0.92)
        & (residual <= 25.0)
    )
    shadow_count = int(shadow_like.sum())
    shadow_ratio = shadow_count / safe_count if safe_count else 0.0

    return {
        "safe_background_pixels": safe_count,
        "background_deviation_pixels": deviation_count,
        "background_deviation_ratio": deviation_ratio,
        "shadow_like_background_pixels": shadow_count,
        "shadow_like_background_ratio": shadow_ratio,
    }


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
    parser.add_argument("--core-foreground-distance", type=float, default=100.0)
    parser.add_argument("--background-exclusion-radius", type=int, default=5)
    parser.add_argument("--background-deviation-distance", type=float, default=24.0)
    parser.add_argument("--background-deviation-ratio-limit", type=float, default=0.002)
    parser.add_argument("--shadow-like-ratio-limit", type=float, default=0.001)
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

    bg = background_quality_metrics(
        rgb,
        key=key,
        distance=distance,
        core_foreground_distance=args.core_foreground_distance,
        exclusion_radius=args.background_exclusion_radius,
        deviation_distance=args.background_deviation_distance,
    )

    background_not_uniform = bg["background_deviation_ratio"] > args.background_deviation_ratio_limit
    shadow_like_background = bg["shadow_like_background_ratio"] > args.shadow_like_ratio_limit

    result = {
        "version": 2,
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
        "background_quality": {
            "core_foreground_distance": args.core_foreground_distance,
            "exclusion_radius": args.background_exclusion_radius,
            "deviation_distance": args.background_deviation_distance,
            "safe_background_pixels": int(bg["safe_background_pixels"]),
            "background_deviation_pixels": int(bg["background_deviation_pixels"]),
            "background_deviation_ratio": round(float(bg["background_deviation_ratio"]), 6),
            "shadow_like_background_pixels": int(bg["shadow_like_background_pixels"]),
            "shadow_like_background_ratio": round(float(bg["shadow_like_background_ratio"]), 6),
        },
        "quadrant_bboxes": quadrant_bboxes(non_chroma),
        "mechanical_flags": {
            "wrong_aspect": not aspect_pass,
            "outer_edge_contact": outer_non_chroma_pixels > 0,
            "center_vertical_contamination": v_contam > 0.005,
            "center_horizontal_contamination": h_contam > 0.005,
            "divider_like_vertical_white_band": v_white > 0.5,
            "divider_like_horizontal_white_band": h_white > 0.5,
            "border_not_uniform": border_key_match_ratio < 0.98,
            "background_not_uniform": bool(background_not_uniform),
            "shadow_like_background": bool(shadow_like_background),
        },
        "scope_note": "Machine audit covers mechanical geometry and chroma/background signals only; identity, motion semantics, limb continuity, and endpoint still require visual review. Very subtle attached shadows may still require visual review.",
    }

    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
