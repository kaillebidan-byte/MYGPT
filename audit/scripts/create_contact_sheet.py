#!/usr/bin/env python3
"""Create an annotated contact sheet for a sprite atlas."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def checkerboard(size: tuple[int, int], tile: int = 12) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size, (238, 238, 238))
    draw = ImageDraw.Draw(image)
    for y in range(0, height, tile):
        for x in range(0, width, tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle(
                    (x, y, min(x + tile - 1, width - 1), min(y + tile - 1, height - 1)),
                    fill=(210, 210, 210),
                )
    return image


def create_contact_sheet(image: Image.Image, spec: dict, states: list[str]) -> Image.Image:
    canvas = spec["canvas"]
    columns = int(canvas["columns"])
    rows = int(canvas["rows"])
    cell_width = int(canvas["cell_width"])
    cell_height = int(canvas["cell_height"])
    label_width = 150
    header_height = 28

    sheet = Image.new(
        "RGB",
        (label_width + columns * cell_width, header_height + rows * cell_height),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for column in range(columns):
        draw.text((label_width + column * cell_width + 6, 8), f"F{column + 1}", fill="black", font=font)

    rgba = image.convert("RGBA")
    for row in range(rows):
        label = states[row] if row < len(states) else f"row-{row + 1}"
        draw.text(
            (8, header_height + row * cell_height + 8),
            f"{row + 1}: {label}",
            fill="black",
            font=font,
        )
        for column in range(columns):
            box = (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
            cell = rgba.crop(box)
            background = checkerboard((cell_width, cell_height))
            background.paste(cell, (0, 0), cell)
            x = label_width + column * cell_width
            y = header_height + row * cell_height
            sheet.paste(background, (x, y))
            draw.rectangle(
                (x, y, x + cell_width - 1, y + cell_height - 1),
                outline=(80, 80, 80),
                width=1,
            )
    return sheet


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--states", default="")
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    states = [state.strip() for state in args.states.split(",") if state.strip()] or list(spec["states"])
    image = Image.open(args.input).convert("RGBA")
    sheet = create_contact_sheet(image, spec, states)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
