#!/usr/bin/env python3
"""
Find where a Cocos UUID is referenced in project text files.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, List, Tuple


TEXT_SUFFIXES = {
    ".meta",
    ".scene",
    ".prefab",
    ".anim",
    ".json",
    ".txt",
    ".md",
    ".ts",
    ".js",
    ".effect",
    ".chunk",
    ".fnt",
    ".plist",
    ".yaml",
    ".yml",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find UUID usage in Cocos project files.")
    parser.add_argument("--project", default=".", help="Project root path (default: current dir).")
    parser.add_argument("--uuid", required=True, help="UUID string to locate.")
    parser.add_argument(
        "--search-path",
        action="append",
        dest="search_paths",
        default=[],
        help="Relative path to scan. Repeatable. Default: assets and settings.",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=200,
        help="Maximum number of matches to print (default: 200).",
    )
    return parser.parse_args()


def iter_text_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if path.name.startswith("."):
            continue
        yield path


def find_matches(file_path: Path, needle: str) -> List[Tuple[int, str]]:
    matches: List[Tuple[int, str]] = []
    try:
        with file_path.open("r", encoding="utf-8", errors="ignore") as fh:
            for idx, line in enumerate(fh, start=1):
                if needle in line:
                    matches.append((idx, line.rstrip()))
    except OSError:
        return []
    return matches


def main() -> int:
    args = parse_args()
    project_root = Path(args.project).resolve()
    search_paths = args.search_paths or ["assets", "settings"]

    roots: List[Path] = []
    for rel in search_paths:
        root = (project_root / rel).resolve()
        if root.exists() and root.is_dir():
            roots.append(root)

    if not roots:
        print("[ERROR] No valid search directories found.")
        return 2

    results: List[Tuple[Path, int, str]] = []
    for root in roots:
        for file_path in iter_text_files(root):
            for line_no, line in find_matches(file_path, args.uuid):
                results.append((file_path, line_no, line))
                if len(results) >= args.max_results:
                    break
            if len(results) >= args.max_results:
                break
        if len(results) >= args.max_results:
            break

    if not results:
        print(f"[MISS] UUID not found: {args.uuid}")
        return 1

    print(f"[OK] Found {len(results)} match(es) for UUID: {args.uuid}\n")
    for file_path, line_no, line in results:
        rel = file_path.relative_to(project_root)
        print(f"{rel}:{line_no}: {line}")

    if len(results) >= args.max_results:
        print(f"\n[INFO] Output truncated at --max-results={args.max_results}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
