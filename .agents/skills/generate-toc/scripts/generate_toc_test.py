#!/usr/bin/env python3

import tempfile
import unittest
from pathlib import Path

from generate_toc import render_toc


class GenerateTocTest(unittest.TestCase):
    def make_project(self) -> Path:
        temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(temporary_directory.cleanup)
        project_dir = Path(temporary_directory.name)
        (project_dir / "sections").mkdir()
        return project_dir

    def write(self, project_dir: Path, relative_path: str, content: str) -> None:
        path = project_dir / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def test_renders_flat_chapters_in_numeric_order(self) -> None:
        project_dir = self.make_project()
        self.write(project_dir, "sections/10.md", "## 10. Tenth\n")
        self.write(
            project_dir,
            "sections/2.md",
            "## 2. Second\n\n### 2.1 Detail\n",
        )
        self.write(project_dir, "sections/draft.md", "## Draft\n")

        self.assertEqual(
            render_toc(project_dir),
            "## 目次\n\n"
            "- [2. Second](sections/2.md)\n"
            "  - [2.1 Detail](sections/2.md#21-detail)\n"
            "- [10. Tenth](sections/10.md)\n",
        )

    def test_renders_parts_and_chapters_in_numeric_order(self) -> None:
        project_dir = self.make_project()
        self.write(project_dir, "sections/02/PART.md", "# Part 2\n")
        self.write(project_dir, "sections/02/10.md", "## 10. Tenth\n")
        self.write(project_dir, "sections/01/PART.md", "# Part 1\n")
        self.write(
            project_dir,
            "sections/01/02.md",
            "## 2. Second\n\n### 2.1 Detail\n",
        )

        self.assertEqual(
            render_toc(project_dir),
            "## 目次\n\n"
            "- [Part 1](sections/01/PART.md)\n"
            "  - [2. Second](sections/01/02.md)\n"
            "    - [2.1 Detail](sections/01/02.md#21-detail)\n"
            "- [Part 2](sections/02/PART.md)\n"
            "  - [10. Tenth](sections/02/10.md)\n",
        )

    def test_rejects_mixed_layouts(self) -> None:
        project_dir = self.make_project()
        self.write(project_dir, "sections/1.md", "## 1. First\n")
        self.write(project_dir, "sections/01/PART.md", "# Part 1\n")

        with self.assertRaisesRegex(
            SystemExit,
            "cannot mix flat chapters and part directories under sections",
        ):
            render_toc(project_dir)


if __name__ == "__main__":
    unittest.main()
