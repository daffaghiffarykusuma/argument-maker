# 02: Guide users through incomplete facts and unavailable attachments

**What to build:** Authors can begin a Gathered Fact without an immediate error state and can understand why research is unavailable for attachment. Guidance leads them to gather a fact, finish an incomplete fact, or recognize that eligible facts are already attached.

**Blocked by:** None (can start immediately).

**Status:** complete (local; no external tracker configured)

- [x] Untouched fact-entry fields show useful writing prompts; missing-information feedback appears after the relevant interaction, without weakening structural completeness rules.
- [x] Incomplete Gathered Facts remain editable drafts and continue to survive board downloads and enabled local saving.
- [x] When no Gathered Facts exist, the attachment area explains the situation and provides an action to gather one.
- [x] When unattached research exists but is incomplete, the attachment area identifies the need to complete it and provides a useful route to do so.
- [x] When every eligible fact is already attached to the destination, the attachment area explains that state instead of reporting that no complete facts exist.
- [x] Mixed states remain actionable: unfinished unattached research is not concealed by an all-attached message for complete facts.
- [x] Editing and moving between fact fields preserves keyboard focus, shared-fact synchronization, disclosure state, and existing filter behavior.
- [x] Verify the empty, incomplete, all-attached, and mixed states through existing browser behavior checks, including recovery into a successful attachment.
- [x] Inspect new and interacted-with fact states on desktop and mobile; validate keyboard operation and status announcements.

Verification: [implementation checks and rendered evidence](../../../docs/issues/anderson-ux-verification.md).
