# PRD: Command Desk UI Refresh

## Problem Statement

Argument Maker already supports the core SCQA and Minto Pyramid structure, including a default board with three Supporting Arguments and three Supporting Data or Facts items under each Supporting Argument. The current production interface exposes that structure, but it does not yet feel as clean, modern, dense, and review-ready as the selected Command Desk prototype.

The user needs a faster-feeling, more beautiful working surface that still preserves the product's purpose: help users build an Argument Board by separating SCQA framing, the Answer, Supporting Arguments, Supporting Data or Facts, and Evidence Links.

The design must improve visual quality without sacrificing webpage speed performance.

## Solution

Implement the selected Command Desk direction in the main app as a dark-only, performance-light UI refresh.

The production app should present an operator-style workspace with:

- A compact command rail or command area for board actions.
- A prominent but not decorative board title and status area.
- A clear SCQA frame across the top of the workspace.
- A Supporting Arguments section where each argument is visibly separate from its Supporting Data or Facts.
- Three default Supporting Arguments and three default Supporting Data or Facts under each argument, matching the existing product model.
- Evidence Links attached to each Supporting Data or Facts row, not to the Supporting Argument claim.
- A rendered Argument Preview that remains secondary to editing but easy to inspect.
- A readiness/review surface that explains missing structure, incomplete Evidence Links, and invalid Evidence Links without scoring truth or persuasiveness.

The implementation should keep the app local-first, dark-only, accessible, and fast.

## User Stories

1. As an Argument Maker user, I want the app to open into a polished Command Desk workspace, so that it feels like a serious tool for constructing arguments.
2. As an Argument Maker user, I want SCQA fields to remain visible as the top-level frame, so that I can separate context from supporting reasoning.
3. As an Argument Maker user, I want Situation, Complication, Question, and Answer to be visually grouped but individually editable, so that I can revise one part without losing the whole frame.
4. As an Argument Maker user, I want the Answer to feel like the root of the argument, so that the Minto Pyramid structure is easy to understand.
5. As an Argument Maker user, I want three Supporting Arguments available by default, so that I start with a practical Minto-style structure.
6. As an Argument Maker user, I want each Supporting Argument to be labeled as a Supporting Argument, so that I do not confuse reasoning claims with facts.
7. As an Argument Maker user, I want each Supporting Argument to have three Supporting Data or Facts rows by default, so that I am prompted to substantiate each claim.
8. As an Argument Maker user, I want Supporting Data or Facts to be visually nested under the Supporting Argument they support, so that the hierarchy is obvious.
9. As an Argument Maker user, I want each Supporting Data or Facts row to include a separate statement field, so that each fact, observation, example, or estimate can be reviewed independently.
10. As an Argument Maker user, I want each Supporting Data or Facts row to include its own Evidence Link field, so that sources are tied to the specific statement they support.
11. As an Argument Maker user, I want Evidence Links to remain separate from Supporting Arguments, so that the app does not imply that a source proves an entire reasoning claim.
12. As an Argument Maker user, I want Data Type selection to remain available for each Supporting Data or Facts item, so that I can distinguish Fact, Observation, Example, and Estimate.
13. As an Argument Maker user, I want Support Mode to remain available for each Supporting Argument, so that I can mark whether the argument is Reasoning or Evidence-backed.
14. As an Argument Maker user, I want the UI to make evidence-backed Supporting Arguments feel more demanding than reasoning-only arguments, so that incomplete evidence is easier to notice.
15. As an Argument Maker user, I want the board controls to use compact icon buttons, so that the working surface is not crowded by repeated text commands.
16. As an Argument Maker user, I want tooltips and accessible labels on compact controls, so that icon-only actions remain understandable and accessible.
17. As an Argument Maker user, I want adding, moving, duplicating, and deleting Supporting Arguments to remain possible, so that I can adapt the default structure.
18. As an Argument Maker user, I want adding, moving, duplicating, and deleting Supporting Data or Facts to remain possible, so that I can adjust the evidence beneath each argument.
19. As an Argument Maker user, I want the Argument Preview to render the argument structure visually, so that I can inspect flow and hierarchy without reading raw Mermaid as the main preview.
20. As an Argument Maker user, I want the Mermaid source to remain secondary, so that I can copy or inspect it when needed without it replacing the visual preview.
21. As an Argument Maker user, I want readiness checks to remain visible, so that I can see which parts of the board still need work.
22. As an Argument Maker user, I want readiness checks to focus on structure and traceability, so that the app does not pretend to judge truth, persuasiveness, or legal sufficiency.
23. As an Argument Maker user, I want invalid Evidence Links to be flagged at the Supporting Data or Facts level, so that I know exactly which source needs correction.
24. As an Argument Maker user, I want incomplete evidence-backed support to be flagged clearly, so that I can finish review-critical rows before exporting.
25. As an Argument Maker user, I want the page to remain fast, so that the visual upgrade does not make the app feel heavy.
26. As an Argument Maker user, I want the app to remain dark-only, so that the interface stays consistent with the existing product direction.
27. As an Argument Maker user, I want the color system to remain accessible, so that text, controls, and review states are readable.
28. As an Argument Maker user, I want the layout to work on desktop and mobile widths, so that I can review or edit the board on different screens.
29. As an Argument Maker user, I want mobile layout to avoid horizontal scrolling, so that the dense 3-by-3 default structure remains usable.
30. As an Argument Maker user, I want imported `.argument.json` boards to render in the refreshed UI without data loss, so that old boards remain usable.
31. As an Argument Maker user, I want exported files to preserve the same board schema, so that the UI refresh does not create compatibility problems.
32. As an Argument Maker user, I want undo and redo to continue working after visual changes, so that editing remains safe.
33. As an Argument Maker user, I want clearing the board to still require confirmation when there is touched content, so that I do not lose work accidentally.
34. As an Argument Maker user, I want the board to still start empty in content but structured in slots, so that I am guided without receiving invented claims or evidence.
35. As an Argument Maker user, I want placeholder copy to be plain-language, so that I can use the app without knowing SCQA or Minto terminology first.
36. As a reviewer, I want the UI to reveal the relationship between Answer, Supporting Arguments, and Supporting Data or Facts, so that I can audit the argument quickly.
37. As a reviewer, I want source links to be attached to exact facts/data, so that I can challenge evidence precisely.
38. As a reviewer, I want estimates to be visibly classified, so that assumptions are not presented as verified facts.
39. As a reviewer, I want the visual preview to show hierarchy, so that I can quickly see whether the argument structure makes sense.
40. As a future implementer, I want the UI refresh to preserve existing domain concepts, so that the change is mostly presentational rather than a schema rewrite.

## Implementation Decisions

- Use the Command Desk prototype as the selected visual direction.
- Preserve the existing Argument Board model: SCQA, Answer, Supporting Arguments, Supporting Data or Facts, Data Type, Evidence Link, Export File, and Argument Preview.
- Do not change the default board structure unless implementation finds drift. The expected default is three Supporting Arguments and three Supporting Data or Facts under each Supporting Argument.
- Do not introduce autosave or browser persistence as part of this UI refresh.
- Do not change `.argument.json` import/export schema as part of this UI refresh.
- Keep the app dark-only.
- Keep the app local-first.
- Keep raw Mermaid source secondary to a rendered Argument Preview.
- Keep the Argument Preview read-only.
- Keep readiness review focused on structure and evidence traceability, not truth, quality of reasoning, compliance, or persuasiveness.
- Build the refreshed layout around a Command Desk shell:
  - A compact command area for preview, copy, download, upload, undo, redo, and clear actions.
  - A high-clarity board title and status area.
  - A SCQA grid or responsive equivalent.
  - A Supporting Arguments work area.
  - A sticky or responsive preview/review area where screen size allows.
- Make the separation between Supporting Argument and Supporting Data or Facts visually explicit:
  - Supporting Argument is the reasoning claim.
  - Supporting Data or Facts are child rows beneath that claim.
  - Evidence Link belongs to the child row.
- Treat the data row as a repeatable unit with text statement, Evidence Link, Data Type, and row controls.
- Maintain compact controls but require accessible labels and tooltips for icon-only actions.
- Prefer CSS and existing browser APIs over new visual dependencies.
- Avoid heavy images, large decorative assets, animation-heavy effects, or runtime libraries for the UI refresh.
- Use stable responsive constraints so controls, cards, data rows, and preview panels do not overlap or resize unpredictably.
- Keep typography and spacing restrained: this is a working tool, not a landing page.
- Keep cards at modest radius and avoid nested decorative card stacks beyond real repeated items.
- Treat the production implementation as a visual/layout refactor of the renderer and stylesheet, with small view-model adjustments only if needed to make status counts or labels cleaner.
- Candidate implementation modules:
  - Board rendering module for SCQA and Supporting Argument layout.
  - Supporting Data or Facts row renderer.
  - Toolbar and command controls.
  - Argument Preview renderer integration.
  - Readiness checklist/review display.
  - Styles/theme layer for Command Desk layout, responsive behavior, and accessibility states.
- Candidate deep module opportunity:
  - A render-ready board structure or layout view model that exposes counts, hierarchy labels, completion states, and preview metadata without coupling tests to DOM details.
- Do not create an ADR for this change unless the implementation introduces a hard-to-reverse architectural trade-off. The current direction is a reversible UI refresh.

## Testing Decisions

- Tests should verify external behavior and user-visible outcomes, not CSS implementation details.
- Existing board model tests should continue to confirm that default boards contain three Supporting Arguments and three Supporting Data or Facts per argument.
- Existing command/session tests should continue to confirm add, move, duplicate, delete, undo, redo, import, export, clear, and copy behavior.
- Existing output tests should continue to confirm hierarchy-preserving outline and Mermaid preview output.
- Existing review tests should continue to confirm structural readiness checks and Evidence Link validation behavior.
- Existing browser smoke tests should be updated or extended to verify the refreshed UI still supports the core board flow.
- Browser smoke coverage should include:
  - SCQA field editing.
  - Supporting Argument editing.
  - Supporting Data or Facts editing.
  - Evidence Link editing.
  - Support Mode changes.
  - Data Type changes.
  - Preview toggle.
  - Rendered Argument Preview presence.
  - Accessible labels/tooltips on icon controls.
- Add visual/responsive verification for the refreshed Command Desk layout:
  - Desktop width with preview visible.
  - Mobile width without horizontal overflow.
  - Dense default state with three Supporting Arguments and nine Supporting Data or Facts.
- Add accessibility-oriented checks where practical:
  - Focus-visible states.
  - Sufficient contrast for primary text, labels, controls, and status colors.
  - Usable labels for form fields and controls.
- Performance checks should focus on keeping the app lightweight:
  - No new heavy UI dependencies.
  - No large decorative image assets.
  - No unnecessary runtime animation loops.
  - Main build should remain successful.

## Out of Scope

- Changing the Argument Board schema.
- Adding autosave or persistent browser storage.
- Adding user accounts, cloud sync, backend storage, collaboration, or authentication.
- Adding AI-generated arguments, fact-checking, legal validation, compliance validation, or source credibility scoring.
- Changing the export file format beyond incidental ordering or compatibility-preserving metadata.
- Replacing the rendered Argument Preview with raw Mermaid as the primary preview.
- Adding light mode.
- Implementing the four rejected prototype directions.
- Publishing or deploying the refreshed UI.
- Creating new issue tracker tickets from this PRD in this pass.

## Further Notes

- The selected prototype is Command Desk.
- The rejected prototype directions should be deleted from the prototype workspace so future implementation work has one clear source of visual intent.
- The main implementation should preserve the user's accepted product language: Argument Board, SCQA, Answer, Minto Pyramid, Supporting Argument, Supporting Data or Facts, Evidence Link, Export File, and Argument Preview.
- The app should continue to avoid invented evidence. Empty default slots are acceptable and intentional.
- The prototype was useful for visual direction, but production implementation should reuse existing app behavior instead of copying static prototype markup directly.
