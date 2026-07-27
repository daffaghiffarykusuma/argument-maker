# argument-maker

Helps you create well-thought arguments for writing blog posts, scripting videos, giving reviews, and similar work.

The workspace starts in **Gather Facts**, where source-linked facts are collected once and can then be reused across Situation, Complication, and Supporting Arguments. **Construct Argument** shapes the SCQA and supporting reasons, while **Preview** shows the Mermaid structure and evidence grouped by destination.

Downloaded `.argument.json` files use schema version 2 and include the complete board-scoped Gathered Facts collection. Version-1 files are intentionally unsupported.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To test:

```bash
bun test
```

Bun is the package manager, script runner, and primary test runner. Vite is the development server and production bundler.
