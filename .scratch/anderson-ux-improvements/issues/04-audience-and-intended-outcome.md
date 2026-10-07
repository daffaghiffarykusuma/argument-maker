# 04: Capture and preserve Audience and Intended outcome

**What to build:** An author can record who the argument is for and what those people should understand or do. These optional planning fields behave like other board content, survive continuation of work, and remain outside audience-facing writing.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Provide optional Audience and Intended outcome prompts near the existing Question or Answer; this works with the current workspace and does not require the new starting flow.
- [ ] Leaving either field empty does not prevent structural completeness, navigation, preview, or writing export.
- [ ] Editing both fields participates in undo/redo without losing unrelated board content.
- [ ] Values survive editable-board export/import and enabled local-draft save/restore.
- [ ] A board containing only one or both planning fields counts as user work for replacement and unsaved-work protection.
- [ ] Older supported boards without these fields still load; malformed newly recognized field types are rejected without replacing the active board.
- [ ] Audience and Intended outcome do not appear in Copy Outline, Markdown, text, or print output; existing treatment of Reasoning notes is unchanged.
- [ ] Use existing browser behavior checks for entry and output privacy, plus focused public session/file/local-draft tests for round-trips, history, and replacement protection.
- [ ] Verify usable layout and keyboard access on desktop and mobile without changing local-saving defaults or cross-tab conflict behavior.

