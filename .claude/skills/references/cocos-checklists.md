# Cocos Checklists

## Quick Discovery Commands

```bash
rg --files assets/scripts
rg --files assets/scenes assets/prefabs
rg "resources\\.load|director\\.loadScene|scheduleOnce|onLoad|start|update" assets/scripts
```

## Before Editing Scenes/Prefabs

- Identify affected `.scene` / `.prefab` files.
- Confirm corresponding script files and expected serialized fields.
- Snapshot current references (UUID or node binding) if change is risky.

## Before Large Asset Refactor

- Run:
  - `python3 "${CODEX_HOME:-$HOME/.codex}/skills/cocos-master/scripts/check_meta_integrity.py" --project <project-root>`
- Confirm:
  - No missing `.meta` for files/folders
  - No dangling `.meta` without target file/folder

## When "Missing Script" or "Missing Asset" Appears

1. Extract UUID from error output.
2. Run:
   - `python3 "${CODEX_HOME:-$HOME/.codex}/skills/cocos-master/scripts/find_uuid_usage.py" --project <project-root> --uuid <uuid>`
3. Fix the smallest broken reference path first.

## Pre-Commit Checklist

- Game flow still works across key scenes.
- No newly introduced console errors/warnings.
- No missing/dangling `.meta`.
- Changed scripts, scenes, and prefabs are listed in commit summary.

## Pre-Release Checklist

- Launch scene and scene transition path are correct.
- Asset loading paths under `assets/resources/**` are valid.
- Target platform specific behavior verified (Web / WeChat mini game).
