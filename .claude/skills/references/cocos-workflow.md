# Cocos Workflow Reference

## Scope

Use this reference for Cocos Creator 3.x + TypeScript projects when implementing features or fixing runtime issues involving scenes, prefabs, and assets.

## Feature Implementation Flow

1. Confirm entry points
- Identify affected scene/prefab in `assets/scenes` and `assets/prefabs`.
- Identify script owners in `assets/scripts/**`.

2. Plan component boundary
- Keep one component focused on one responsibility.
- Move shared logic to utility modules instead of duplicating in scene scripts.

3. Implement script change
- Keep serialized property names stable.
- Use explicit `@property` typing and null checks.
- Emit precise logs containing scene and node context.

4. Wire editor references
- Bind nodes/components in the editor for stable runtime behavior.
- Avoid long dynamic node traversal as a default pattern.

5. Verify behavior
- Re-test full scene transition flow.
- Verify async resource loading and fallback paths.
- Verify no new warning/error appears in console.

## Runtime Bug Triage

1. Classify error
- Lifecycle: `onLoad/start/update` ordering or destroyed object access.
- Binding: missing node/component, null serialized reference.
- Resource: wrong `resources.load` path or missing asset.
- Serialization: broken UUID after move/rename/merge conflict.

2. UUID/meta branch
- If stack or logs mention UUID/missing asset/script:
  - Run `python3 "${CODEX_HOME:-$HOME/.codex}/skills/cocos-master/scripts/check_meta_integrity.py" --project <project-root>`
  - Run `python3 "${CODEX_HOME:-$HOME/.codex}/skills/cocos-master/scripts/find_uuid_usage.py" --project <project-root> --uuid <uuid>`

3. Fix minimally
- Avoid scene-wide rewrites for isolated issues.
- Keep existing serialized data compatible when possible.

## Build and Platform Notes

- For Web target:
  - Validate resource caching and network endpoints.
- For WeChat mini game target:
  - Validate storage, network domain config, and platform APIs.
- Always verify launch scene config before packaging.
