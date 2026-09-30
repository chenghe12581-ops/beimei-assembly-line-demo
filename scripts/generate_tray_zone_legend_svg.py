#!/usr/bin/env python3
"""Create a tray legend SVG without embedded slot numbers or area strokes."""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "pics" / "北煤机托盘区位.svg"
TARGET = ROOT / "public" / "tray-visualization" / "tray-zone-legend.svg"
SVG_NAMESPACE = "http://www.w3.org/2000/svg"
XLINK_NAMESPACE = "http://www.w3.org/1999/xlink"
MOVE_PATTERN = re.compile(r"^M(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)")


def is_slot_number_path(element: ET.Element) -> bool:
    if element.tag != f"{{{SVG_NAMESPACE}}}path":
        return False
    match = MOVE_PATTERN.match(element.attrib.get("d", ""))
    if not match:
        return False
    x = float(match.group(1))
    y = float(match.group(2))
    return 1000 <= x <= 16000 and 4300 <= y <= 4700


def main() -> None:
    ET.register_namespace("", SVG_NAMESPACE)
    ET.register_namespace("xlink", XLINK_NAMESPACE)
    tree = ET.parse(SOURCE)
    root = tree.getroot()

    background = next((child for child in root if child.tag == f"{{{SVG_NAMESPACE}}}rect" and child.attrib.get("opacity") == "0.1"), None)
    if background is not None:
        background.set("opacity", "0.28")

    for child in list(root):
        if child.tag == f"{{{SVG_NAMESPACE}}}rect" and "stroke" in child.attrib:
            root.remove(child)
        elif is_slot_number_path(child):
            root.remove(child)

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    tree.write(TARGET, encoding="utf-8", xml_declaration=False)
    print(f"generated {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
