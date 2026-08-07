#!/usr/bin/env python3
"""Generate a non-character 2x2 layout guide for a portrait motion board."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def build_guide(
    *,
    width: int,
    height: int,
    outer_margin: int,
    center_gap_x: int,
    center_gap_y: int,
) -> tuple[Image.Image, list[dict[str, object]]]:
    if width <= 0 or height <= 0:
        raise ValueError("width and height must be positive")
    if outer_margin < 0 or center_gap_x < 0 or center_gap_y < 0:
        raise ValueError("margins and gaps must be non-negative")

    mid_x = width // 2
    mid_y = height // 2
    half_gap_x = center_gap_x // 2
    half_gap_y = center_gap_y // 2

    left_x0 = outer_margin
    left_x1 = mid_x - half_gap_x
    right_x0 = mid_x + half_gap_x
    right_x1 = width - outer_margin
    top_y0 = outer_margin
    top_y1 = mid_y - half_gap_y
    bottom_y0 = mid_y + half_gap_y
    bottom_y1 = height - outer_margin

    if min(left_x1 - left_x0, right_x1 - right_x0, top_y1 - top_y0, bottom_y1 - bottom_y0) <= 0:
        raise ValueError("margins or center gaps leave no usable slot area")

    slots = [
        ("K1", (left_x0, top_y0, left_x1, top_y1)),
        ("K2", (right_x0, top_y0, right_x1, top_y1)),
        ("K3", (left_x0, bottom_y0, left_x1, bottom_y1)),
        ("K4", (right_x0, bottom_y0, right_x1, bottom_y1)),
    ]

    image = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    outline = (70, 70, 70)
    fill = (246, 246, 246)
    gap_fill = (225, 225, 225)

    draw.rectangle((mid_x - half_gap_x, 0, mid_x + half_gap_x, height), fill=gap_fill)
    draw.rectangle((0, mid_y - half_gap_y, width, mid_y + half_gap_y), fill=gap_fill)

    font = load_font(max(24, min(width, height) // 22))
    records: list[dict[str, object]] = []
    for label, rect in slots:
        draw.rectangle(rect, fill=fill, outline=outline, width=max(2, width // 256))
        x0, y0, x1, y1 = rect
        center_x = (x0 + x1) // 2
        center_y = (y0 + y1) // 2
        text_box = draw.textbbox((0, 0), label, font=font)
        text_w = text_box[2] - text_box[0]
        text_h = text_box[3] - text_box[1]
        draw.text((center_x - text_w // 2, center_y - text_h // 2), label, fill=outline, font=font)
        records.append(
            {
                "label": label,
                "safe_rect": [x0, y0, x1, y1],
                "center": [center_x, center_y],
            }
        )

    return image, records


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1536)
    parser.add_argument("--outer-margin", type=int, default=72)
    parser.add_argument("--center-gap-x", type=int, default=96)
    parser.add_argument("--center-gap-y", type=int, default=112)
    parser.add_argument("--metadata", type=Path)
    args = parser.parse_args()

    image, slots = build_guide(
        width=args.width,
        height=args.height,
        outer_margin=args.outer_margin,
        center_gap_x=args.center_gap_x,
        center_gap_y=args.center_gap_y,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.output, format="PNG", optimize=True)

    metadata = {
        "version": 1,
        "width": args.width,
        "height": args.height,
        "outer_margin": args.outer_margin,
        "center_gap_x": args.center_gap_x,
        "center_gap_y": args.center_gap_y,
        "slots": slots,
        "note": "Layout-only guide. Do not reproduce boxes, labels, or guide marks in generated artwork.",
    }
    metadata_path = args.metadata or args.output.with_suffix(".json")
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "metadata": str(metadata_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
