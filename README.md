# argument-maker

Helps you create well-thought arguments for writing blog posts, scripting videos,
giving reviews, and similar work.

Frame a Question and tentative Answer, gather facts once and attach them where
they support your reasoning, then review the structure and export it as an
outline, Markdown, text, or PDF. Everything stays in your browser; boards save as
portable `.argument.json` files.

- **[User guide](docs/user-guide.md)**: workflow, facts and citations, review,
  saving, undo, and keyboard shortcuts.
- **[Development](docs/development.md)**: setup, checks, project layout, and the
  browser test harness.
- **[Glossary](GLOSSARY.md)**: product terminology.

## Quick start

```bash
bun install
bun run dev
```

```bash
bun run lint && bun run typecheck && bun run test:unit   # fast checks
bun run test:browser                                # Chromium workflows (Node.js 24)
```
