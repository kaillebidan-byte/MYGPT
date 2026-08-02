#!/usr/bin/env python3
"""Create one animated GIF preview showing all active rows at once."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def create_preview(
    image: Image.Image,
    spec: dict,
    states: list[str],
    scale: float = 0.5,
) -> list[Image.Image]:
    canvas = spec["canvas"]
    columns = int(canvas["columns"])
    cell_width = int(canvas["cell_width"])
    cell_height = int(canvas["cell_height"])
    active_rows = len(states)
    label_width = 120
    output_cell_width = max(1, round(cell_width * scale))
    output_cell_height = max(1, round(cell_height * scale))
    font = ImageFont.load_default()
    rgba = image.convert("RGBA")
    frames: list[Image.Image] = []

    for column in range(columns):
        frame = Image.new(
            "RGBA",
            (label_width + output_cell_width, active_rows * output_cell_height),
            (255, 255, 255, 255),
        )
        draw = ImageDraw.Draw(frame)
        for row, state in enumerate(states):
            box = (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
            cell = rgba.crop(box).resize(
                (output_cell_width, output_cell_height), Image.Resampling.LANCZOS
            )
            y = row * output_cell_height
            draw.text((6, y + 8), state, fill="black", font=font)
            frame.alpha_composite(cell, (label_width, y))
            draw.rectangle(
                (
                    label_width,
                    y,
                    label_width + output_cell_width - 1,
                    y + output_cell_height - 1,
                ),
                outline=(100, 100, 100, 255),
                width=1,
            )
        frames.append(frame.convert("P", palette=Image.Palette.ADAPTIVE))
    return frames


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--states", default="")
    parser.add_argument("--scale", type=float, default=0.5)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    states = [state.strip() for state in args.states.split(",") if state.strip()] or list(spec["states"])
    image = Image.open(args.input).convert("RGBA")
    frames = create_preview(image, spec, states, args.scale)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    duration = round(1000 / max(1, int(spec.get("animation", {}).get("fps", 8))))
    frames[0].save(
        args.output,
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        optimize=False,
        disposal=2,
    )


if __name__ == "__main__":
    main()
