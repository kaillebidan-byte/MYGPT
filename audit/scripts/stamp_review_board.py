#!/usr/bin/env python3
"""Create a display-only copy of a motion board with a stage/result banner.

The input image is never modified. The output adds a banner outside the original
canvas so audit/repair inputs stay clean and untouched.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def load_font(size: int) -> ImageFont.ImageFont:
    for name in ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--stage", choices=("INITIAL", "REPAIR"), required=True)
    parser.add_argument("--status", choices=("PASS", "FAIL"), required=True)
    parser.add_argument("--banner-height", type=int, default=72)
    args = parser.parse_args()

    with Image.open(args.input) as source:
        image = source.convert("RGB")

    banner_h = max(40, args.banner_height)
    canvas = Image.new("RGB", (image.width, image.height + banner_h), (24, 24, 24))
    canvas.paste(image, (0, banner_h))

    draw = ImageDraw.Draw(canvas)
    status_bg = (34, 110, 62) if args.status == "PASS" else (150, 42, 42)
    draw.rectangle((0, 0, image.width, banner_h), fill=status_bg)

    font = load_font(max(18, int(banner_h * 0.44)))
    text = f"{args.stage} | {args.status}"
    box = draw.textbbox((0, 0), text, font=font)
    tw = box[2] - box[0]
    th = box[3] - box[1]
    x = max(12, (image.width - tw) // 2)
    y = max(4, (banner_h - th) // 2 - box[1])
    draw.text((x, y), text, font=font, fill=(255, 255, 255))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, format="PNG", optimize=True)
    print(args.output)


if __name__ == "__main__":
    main()
