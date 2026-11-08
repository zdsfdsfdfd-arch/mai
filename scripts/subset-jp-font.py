#!/usr/bin/env python3
"""Subset Shippori Mincho (SIL OFL) to the Japanese glyphs the slides use.

The full font is ~8.7 MB; the deck only needs a few dozen kanji/kana,
so we scan src/ for CJK characters and ship a tiny WOFF2.

Usage:
  pip install fonttools brotli
  python3 scripts/subset-jp-font.py path/to/ShipporiMincho-Medium.ttf

The source TTF is available at
https://github.com/google/fonts/tree/main/ofl/shipporimincho
"""
import pathlib
import re
import sys

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "fonts" / "shippori-mincho-subset.woff2"
CJK = re.compile(r"[　-ヿ㐀-䶿一-鿿＀-￯]")


def used_chars() -> str:
    chars = set()
    for path in (ROOT / "src").rglob("*.js"):
        chars.update(CJK.findall(path.read_text(encoding="utf-8")))
    return "".join(sorted(chars))


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    text = used_chars()
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = subset.load_font(sys.argv[1], options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    subset.save_font(font, str(OUT), options)
    print(f"{len(text)} glyphs -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    print(text)


if __name__ == "__main__":
    main()
