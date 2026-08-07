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


def remove_chroma(
    image: Image.Image,
    *,
    key: tuple[int, int, int],
    hard_threshold: float,
    feather: float,
) -> tuple[Image.Image, dict[str, int]]:
    rgba = image.convert("RGBA")
    source = rgba.load()
    output = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    target = output.load()

    soft_threshold = hard_threshold + max(0.0, feather)
    hard_sq = hard_threshold * hard_threshold
    soft_sq = soft_threshold * soft_threshold

    cleared = 0
    feathered = 0
    kept = 0

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = source[x, y]
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
                target[x, y] = (r, g, b, new_alpha)
                feathered += 1
                continue

            target[x, y] = (r, g, b, a)
            kept += 1

    return output, {"cleared": cleared, "feathered": feathered, "kept": kept}


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
    parser.add_argument("--threshold", type=float, default=24.0)
    parser.add_argument("--feather", type=float, default=24.0)
    parser.add_argument("--metadata", type=Path)
    args = parser.parse_args()

    with Image.open(args.input) as image:
        key = args.key or detect_key_color(image, args.border_width)
        result, counts = remove_chroma(
            image,
            key=key,
            hard_threshold=args.threshold,
            feather=args.feather,
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, format="PNG", optimize=True)

    metadata = {
        "version": 1,
        "input": args.input.name,
        "output": args.output.name,
        "key_rgb": list(key),
        "key_hex": "#%02X%02X%02X" % key,
        "border_width": args.border_width,
        "threshold": args.threshold,
        "feather": args.feather,
        "pixels": counts,
    }
    metadata_path = args.metadata or args.output.with_suffix(".chroma.json")
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == "__main__":
    main()
