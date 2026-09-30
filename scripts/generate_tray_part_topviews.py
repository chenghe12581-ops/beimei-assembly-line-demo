#!/usr/bin/env python3
"""Generate transparent top-view silhouettes for tray material legends."""

from __future__ import annotations

import struct
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "public" / "models"
OUTPUT_DIR = ROOT / "public" / "part-topviews"
PART_NAMES = [f"0162-01-010101-{index:02d}" for index in range(1, 5)]
CANVAS_SIZE = (1024, 384)
PADDING = 54


def read_binary_stl_triangles(path: Path) -> list[tuple[tuple[float, float], ...]]:
    data = path.read_bytes()
    if len(data) < 84:
        raise ValueError(f"Invalid STL file: {path}")

    triangle_count = struct.unpack_from("<I", data, 80)[0]
    expected_size = 84 + triangle_count * 50
    if expected_size != len(data):
        raise ValueError(f"Only binary STL files are supported: {path}")

    triangles: list[tuple[tuple[float, float], ...]] = []
    offset = 84
    for _ in range(triangle_count):
        values = struct.unpack_from("<12fH", data, offset)
        triangles.append(
            (
                (values[3], values[4]),
                (values[6], values[7]),
                (values[9], values[10]),
            )
        )
        offset += 50
    return triangles


def render_top_view(source: Path, target: Path) -> None:
    triangles = read_binary_stl_triangles(source)
    points = [point for triangle in triangles for point in triangle]
    min_x = min(point[0] for point in points)
    max_x = max(point[0] for point in points)
    min_y = min(point[1] for point in points)
    max_y = max(point[1] for point in points)

    width, height = CANVAS_SIZE
    model_width = max(max_x - min_x, 1.0)
    model_height = max(max_y - min_y, 1.0)
    scale = min((width - PADDING * 2) / model_width, (height - PADDING * 2) / model_height)
    offset_x = (width - model_width * scale) / 2
    offset_y = (height - model_height * scale) / 2

    def project(point: tuple[float, float]) -> tuple[float, float]:
        x = offset_x + (point[0] - min_x) * scale
        y = height - (offset_y + (point[1] - min_y) * scale)
        return (x, y)

    mask = Image.new("L", CANVAS_SIZE, 0)
    draw = ImageDraw.Draw(mask)
    for triangle in triangles:
        draw.polygon([project(point) for point in triangle], fill=255)

    outline = ImageChops.subtract(mask.filter(ImageFilter.MaxFilter(19)), mask)
    shadow = mask.filter(ImageFilter.GaussianBlur(12))
    shadow = ImageChops.offset(shadow, 0, 10)

    image = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    image.paste((15, 23, 42, 34), mask=shadow)
    image.paste((71, 85, 105, 230), mask=outline)
    image.paste((148, 163, 184, 224), mask=mask)
    image = image.resize((512, 192), Image.Resampling.LANCZOS)
    image.save(target, optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for part_name in PART_NAMES:
        source = MODEL_DIR / f"{part_name}.stl"
        target = OUTPUT_DIR / f"{part_name}.png"
        render_top_view(source, target)
        print(f"generated {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
