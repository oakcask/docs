#!/usr/bin/env python3
"""Generate report TOC.md files from Markdown headings."""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path


HEADING_RE = re.compile(r"^(#{2,6})\s+(.+?)\s*#*\s*$")


def github_anchor(text: str) -> str:
    text = text.strip().lower()
    chars: list[str] = []
    previous_space = False

    for char in text:
        category = unicodedata.category(char)
        if char.isspace():
            if not previous_space:
                chars.append("-")
                previous_space = True
            continue
        if char == "-":
            chars.append(char)
            previous_space = False
            continue
        if category[0] in {"L", "N"}:
            chars.append(char)
            previous_space = False

    return "".join(chars).strip("-")


def extract_headings(path: Path) -> list[tuple[int, str]]:
    headings: list[tuple[int, str]] = []
    in_fence = False

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        match = HEADING_RE.match(line)
        if match:
            headings.append((len(match.group(1)), match.group(2).strip()))

    return headings


def numeric_section_files(sections_dir: Path) -> list[Path]:
    files = []
    for path in sections_dir.glob("*.md"):
        if path.stem.isdigit():
            files.append(path)
    return sorted(files, key=lambda path: int(path.stem))


def appendix_files(project_dir: Path) -> list[Path]:
    files = [
        path
        for path in project_dir.glob("APPENDIX*.md")
        if path.is_file() and path.name != "TOC.md"
    ]
    return sorted(files, key=lambda path: (path.name != "APPENDIX.md", path.name))


def render_toc(project_dir: Path) -> str:
    sections_dir = project_dir / "sections"
    if not sections_dir.is_dir():
        raise SystemExit(f"missing sections directory: {sections_dir}")

    lines = ["## 目次", ""]

    for section_path in numeric_section_files(sections_dir):
        headings = extract_headings(section_path)
        chapter_title = next((title for level, title in headings if level == 2), None)
        if chapter_title is None:
            raise SystemExit(f"missing level-2 chapter heading: {section_path}")

        rel_path = section_path.relative_to(project_dir).as_posix()
        lines.append(f"- [{chapter_title}]({rel_path})")

        used_anchors: dict[str, int] = {}
        for level, title in headings:
            anchor = github_anchor(title)
            count = used_anchors.get(anchor, 0)
            used_anchors[anchor] = count + 1
            if count:
                anchor = f"{anchor}-{count}"
            if level != 3:
                continue
            lines.append(f"  - [{title}]({rel_path}#{anchor})")

    for appendix_path in appendix_files(project_dir):
        headings = extract_headings(appendix_path)
        appendix_title = next((title for level, title in headings if level == 2), None)
        if appendix_title is None:
            continue
        rel_path = appendix_path.relative_to(project_dir).as_posix()
        lines.append(f"- [{appendix_title}]({rel_path})")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate report TOC.md")
    parser.add_argument("project_dir", nargs="?", default=".")
    parser.add_argument("--check", action="store_true", help="fail if TOC.md is stale")
    parser.add_argument("--stdout", action="store_true", help="print instead of writing")
    args = parser.parse_args()

    project_dir = Path(args.project_dir).resolve()
    content = render_toc(project_dir)
    toc_path = project_dir / "TOC.md"

    if args.stdout:
        sys.stdout.write(content)
        return 0

    if args.check:
        if not toc_path.exists():
            print(f"missing {toc_path}", file=sys.stderr)
            return 1
        current = toc_path.read_text(encoding="utf-8")
        if current != content:
            print(f"stale {toc_path}", file=sys.stderr)
            return 1
        return 0

    toc_path.write_text(content, encoding="utf-8")
    print(f"wrote {toc_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
