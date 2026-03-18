#!/usr/bin/env python3
"""
Check Cocos Creator asset/meta consistency.

Checks:
1. Every asset file under assets/ has a sidecar .meta file.
2. Every asset directory under assets/ has a sidecar .meta file.
3. Every .meta file points to an existing file or directory.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Iterable, List


IGNORED_NAMES = {".DS_Store", "Thumbs.db"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Cocos .meta integrity.")
    parser.add_argument(
        "--project",
        default=".",
        help="Cocos project root path (default: current directory).",
    )
    parser.add_argument(
        "--assets",
        default="assets",
        help="Assets directory relative to project root (default: assets).",
    )
    return parser.parse_args()


def is_ignored(path: Path) -> bool:
    return path.name in IGNORED_NAMES or path.name.startswith(".")


def iter_asset_files(assets_dir: Path) -> Iterable[Path]:
    for root, _, files in os.walk(assets_dir):
        root_path = Path(root)
        for filename in files:
            file_path = root_path / filename
            if is_ignored(file_path):
                continue
            yield file_path


def iter_asset_dirs(assets_dir: Path) -> Iterable[Path]:
    for root, dirs, _ in os.walk(assets_dir):
        root_path = Path(root)
        for directory in dirs:
            dir_path = root_path / directory
            if is_ignored(dir_path):
                continue
            yield dir_path


def main() -> int:
    args = parse_args()
    project_root = Path(args.project).resolve()
    assets_dir = (project_root / args.assets).resolve()

    if not assets_dir.exists() or not assets_dir.is_dir():
        print(f"[ERROR] Assets directory not found: {assets_dir}")
        return 2

    missing_meta_for_files: List[Path] = []
    missing_meta_for_dirs: List[Path] = []
    dangling_meta: List[Path] = []

    for file_path in iter_asset_files(assets_dir):
        if file_path.suffix == ".meta":
            target = Path(str(file_path)[: -len(".meta")])
            if not target.exists():
                dangling_meta.append(file_path)
            continue

        meta_path = file_path.with_name(file_path.name + ".meta")
        if not meta_path.exists():
            missing_meta_for_files.append(file_path)

    for dir_path in iter_asset_dirs(assets_dir):
        meta_path = dir_path.with_name(dir_path.name + ".meta")
        if not meta_path.exists():
            missing_meta_for_dirs.append(dir_path)

    if not missing_meta_for_files and not missing_meta_for_dirs and not dangling_meta:
        print("[OK] No meta integrity issues found.")
        return 0

    print("[FAIL] Meta integrity issues detected.")

    if missing_meta_for_files:
        print(f"\nMissing .meta for files ({len(missing_meta_for_files)}):")
        for path in missing_meta_for_files:
            print(f"  - {path.relative_to(project_root)}")

    if missing_meta_for_dirs:
        print(f"\nMissing .meta for directories ({len(missing_meta_for_dirs)}):")
        for path in missing_meta_for_dirs:
            print(f"  - {path.relative_to(project_root)}")

    if dangling_meta:
        print(f"\nDangling .meta files ({len(dangling_meta)}):")
        for path in dangling_meta:
            print(f"  - {path.relative_to(project_root)}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
