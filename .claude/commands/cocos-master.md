---
name: cocos-master
description: Cocos Creator 3.x + TypeScript game development workflow covering scene/prefab/component implementation, resources loading, UUID/meta troubleshooting, build configuration, and runtime bug fixing. Use when requests involve Cocos files like assets/**/*.ts, .scene, .prefab, .meta, settings/**, or tasks such as adding gameplay features, repairing node/component references, diagnosing loading errors, and preparing Web or WeChat mini game builds.
---

# Cocos Master Workflow

Follow this workflow in order unless the user explicitly asks for a different sequence.

## 1. Establish project context first (required)

- Detect engine version from `package.json` (`creator.version`) and keep APIs compatible with that version.
- Map key directories before edits: `assets/scenes`, `assets/scripts`, `assets/resources`, `assets/prefabs`, `settings`, `profiles`.
- Preserve `.meta` files whenever moving, renaming, or deleting any asset or folder.
- Prefer TypeScript component architecture (`@ccclass`, `@property`, `Component` subclasses) and avoid ad-hoc global state.

## 2. Select task path

- Feature implementation: modify `assets/scripts/**`, wire scene/prefab references, and keep serialized field names stable.
- Runtime bug fixing: reproduce with logs, isolate lifecycle vs async loading vs binding vs state sync issues.
- Asset/reference troubleshooting: run bundled scripts to detect missing `.meta` or locate UUID references.
- Build/release troubleshooting: inspect `settings/**`, scene entry config, and platform-specific packaging behavior.

## 3. Implement with Cocos-safe patterns

### Lifecycle and events
- Use `onLoad` for one-time setup and node/component lookup.
- Use `start` for logic that depends on other components being initialized.
- Use `update` only when frame-loop behavior is required.
- Remove event listeners and timers in `onDestroy`.

### Node and property binding
- Keep `@property` definitions typed and nullable when editor assignment may be absent.
- Guard every external reference (`Node`, `Sprite`, `Label`, custom component) before usage.
- Prefer explicit serialized references over long runtime `find()` chains.
- If renaming serialized fields, update all usages in scripts/scenes/prefabs together.

### Resource loading
- Keep runtime-loaded assets under `assets/resources/**`.
- Use resource paths without file extensions for `resources.load`.
- Report load errors with both scene name and asset path.
- Cache hot assets intentionally and release large temporary assets when no longer needed.

## 4. Run diagnostics before deep refactors

- Check meta integrity:
  - `python3 ".claude/skills/scripts/check_meta_integrity.py" --project .`
- Locate UUID usages:
  - `python3 ".claude/skills/scripts/find_uuid_usage.py" --project . --uuid <uuid>`
- Run both checks after merge conflicts touching `assets/**` or when encountering "Missing Script/Missing Asset" errors.

## 5. Debug in a strict sequence

1. Capture exact error text and call stack.
2. Identify layer: script runtime, scene serialization, resource loading, or network/state.
3. If UUID/meta related, run bundled scripts first instead of manual blind edits.
4. Apply the smallest compatible change and keep scene/prefab serialization stable.
5. Re-test full scene flow and entry scene behavior for the target platform.

## 6. Finish with delivery checks

- Confirm scene flow and launch scene settings are correct.
- Confirm there are no orphan assets or dangling `.meta` files.
- Confirm TypeScript compiles and no new editor/runtime warnings are introduced.
- Confirm Web vs WeChat mini game differences for storage/network APIs are handled.
- Summarize changed scenes, prefabs, and scripts in the final report for reviewers.

## References

- Read `references/cocos-workflow.md` for detailed implementation and debugging steps.
- Read `references/cocos-checklists.md` for task-specific checklists and ready-to-run commands.
