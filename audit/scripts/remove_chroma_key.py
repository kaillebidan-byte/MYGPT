#!/usr/bin/env python3
"""Convert a flat chroma-key background to alpha transparency."""

from __future__ import annotations

import argparse
import json
import math
from collections import Counter
from pathlib import Path

from PIL import Image


def parse_rgb(value: str) -> tuple[int, int, int]:
    text = value.strip().lstrip("#")
    if len(text) != 6:
        raise argparse.ArgumentTypeError("color must be RRGGBB or #RRGGBB")
    try:
        return tuple(int(text[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]
    except ValueError as exc:
        raise argparse.ArgumentTypeError("color must be hexadecimal") from exc


def border_pixels(image: Image.Image, width: int) -> list[tuple[int, int, int]]:
    rgb = image.convert("RGB")
    w, h = rgb.size
    width = max(1, min(width, w // 2, h // 2))
    pixels: list[tuple[int, int, int]] = []

    for y in range(width):
        for x in range(w):
            pixels.append(rgb.getpixel((x, y)))
            pixels.append(rgb.getpixel((x, h - 1 - y)))

    for x in range(width):
        for y in range(width, h - width):
            pixels.append(rgb.getpixel((x, y)))
            pixels.append(rgb.getpixel((w - 1 - x, y)))

    return pixels


def detect_key_color(image: Image.Image, border_width: int) -> tuple[int, int, int]:
    samples = border_pixels(image, border_width)
    if not samples:
        raise ValueError("cannot sample image border")
    return Counter(samples).most_common(1)[0][0]


def dominant_key_channel(
    key: tuple[int, int, int],
    *,
    minimum_dominance: int,
) -> tuple[int, tuple[int, int]] | None:
    dominant = max(range(3), key=lambda index: key[index])
    others = tuple(index for index in range(3) if index != dominant)
    if key[dominant] - max(key[others[0]], key[others[1]]) < minimum_dominance:
        return None
    return dominant, others


def remove_chroma(
    image: Image.Image,
    *,
    key: tuple[int, int, int],
    hard_threshold: float,
    feather: float,
    despill: bool,
    despill_distance: float,
    despill_margin: int,
    despill_min_dominance: int,
) -> tuple[Image.Image, dict[str, int]]:
    rgba = image.convert("RGBA")
    source = rgba.load()
    output = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    target = output.load()

    soft_threshold = hard_threshold + max(0.0, feather)
    hard_sq = hard_threshold * hard_threshold
    soft_sq = soft_threshold * soft_threshold
    despill_sq = max(0.0, despill_distance) ** 2
    dominant = (
        dominant_key_channel(key, minimum_dominance=max(0, despill_min_dominance))
        if despill
        else None
    )

    cleared = 0
    feathered = 0
    kept = 0
    despilled = 0

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = source[x, y]
            channels = [r, g, b]
            dr = r - key[0]
            dg = g - key[1]
            db = b - key[2]
            distance_sq = dr * dr + dg * dg + db * db

            if distance_sq <= hard_sq:
                target[x, y] = (r, g, b, 0)
                cleared += 1
                continue

            if feather > 0 and distance_sq < soft_sq:
                distance = math.sqrt(distance_sq)
                factor = (distance - hard_threshold) / feather
                new_alpha = max(0, min(255, round(a * factor)))
                feathered += 1
            else:
                new_alpha = a
                kept += 1

            if dominant is not None and new_alpha > 0 and distance_sq <= despill_sq:
                dominant_index, other_indices = dominant
                cap = max(channels[other_indices[0]], channels[other_indices[1]]) + despill_margin
                if channels[dominant_index] > cap:
                    channels[dominant_index] = max(0, min(255, cap))
                    despilled += 1

            target[x, y] = (*channels, new_alpha)

    return output, {
        "cleared": cleared,
        "feathered": feathered,
        "kept": kept,
        "despilled": despilled,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--key",
        type=parse_rgb,
        help="Explicit chroma color as RRGGBB. If omitted, detect the most common border color.",
    )
    parser.add_argument("--border-width", type=int, default=12)
    parser.add_argument(
        "--threshold",
        type=float,
        default=42.0,
        help="RGB-distance cleared to alpha=0. Tuned for small chroma variation in generated boards.",
    )
    parser.add_argument(
        "--feather",
        type=float,
        default=18.0,
        help="Additional RGB-distance range used for soft alpha falloff beyond --threshold.",
    )
    parser.add_argument(
        "--no-despill",
        action="store_true",
        help="Disable dominant-channel chroma spill suppression on near-key edge pixels.",
    )
    parser.add_argument(
        "--despill-distance",
        type=float,
        default=120.0,
        help="Maximum RGB-distance from the key color eligible for despill.",
    )
    parser.add_argument(
        "--despill-margin",
        type=int,
        default=12,
        help="Allowed dominant-key-channel margin above the strongest non-key channel after despill.",
    )
    parser.add_argument(
        "--despill-min-dominance",
        type=int,
        default=64,
        help="Minimum key-channel dominance required before automatic despill is enabled.",
    )
    parser.add_argument("--metadata", type=Path)
    args = parser.parse_args()

    with Image.open(args.input) as image:
        key = args.key or detect_key_color(image, args.border_width)
        result, counts = remove_chroma(
            image,
            key=key,
            hard_threshold=args.threshold,
            feather=args.feather,
            despill=not args.no_despill,
            despill_distance=args.despill_distance,
            despill_margin=args.despill_margin,
            despill_min_dominance=args.despill_min_dominance,
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, format="PNG", optimize=True)

    metadata = {
        "version": 2,
        "input": args.input.name,
        "output": args.output.name,
        "key_rgb": list(key),
        "key_hex": "#%02X%02X%02X" % key,
        "border_width": args.border_width,
        "threshold": args.threshold,
        "feather": args.feather,
        "despill": not args.no_despill,
        "despill_distance": args.despill_distance,
        "despill_margin": args.despill_margin,
        "despill_min_dominance": args.despill_min_dominance,
        "pixels": counts,
    }
    metadata_path = args.metadata or args.output.with_suffix(".chroma.json")
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
