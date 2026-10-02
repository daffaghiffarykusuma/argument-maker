# Effect assessment for Argument Maker

Assessed 2026-10-01 against the current repository and official Effect documentation. This is a recommendation, not an adoption decision or an integration test.

## Recommendation

We can use Effect with this app. A broad migration would add more complexity than it removes today. Keep the board model and session in ordinary TypeScript. Consider a small Schema experiment if file formats or migrations become substantially harder to maintain, and reconsider the Effect runtime if the app gains remote synchronization, API integrations, or AI workflows.

## Compatibility and release status

The app uses Bun, Vite, ES modules, and strict TypeScript with a declared TypeScript range of `^7.0.2`. Mermaid is its only direct runtime dependency. These settings fit Effect's documented installation requirements: TypeScript 5.9 or newer, with TypeScript 7 recommended, Bun support, and browser integration through Vite. React appears in the browser example but is not a requirement of the core library. This establishes technical feasibility; no Effect package was installed or compiled against this app. Sources: [package.json](../package.json), [tsconfig.json](../tsconfig.json), [Effect v4 installation](https://effect.website/docs/v4/getting-started/installation).

The official core release page identifies `effect@4.0.0` as the first stable v4 release, replacing its beta and release-candidate series. The site now directs its main documentation entry to v4, while some older unversioned links redirect to v3. Use version-matched documentation for any experiment. The release notes also distinguish stable APIs from APIs marked `@stability unstable`, which may change in minor releases. Sources: [4.0.0 release](https://github.com/Effect-TS/effect/releases/tag/effect@4.0.0), [current documentation entry](https://effect.website/docs/v4/onboarding).

## Where it would help

Effect represents a computation as `Effect<Success, Error, Requirements>`. Expected failures and dependencies propagate through composition, supporting consistent error handling across multi-step operations. Unexpected defects remain possible and are not included in the typed error parameter. This is useful when many fallible operations must cooperate; it does not eliminate bugs. Source: [error types](https://effect.website/docs/v4/error-management/two-error-types).

Its concurrency tools support bounded parallel work, interruption, and cleanup. Those would become useful for batches of source requests, cancellable AI generation, or remote save pipelines. Wrapping a third-party Promise does not make its underlying work cancellable. The wrapped API must cooperate with an abort signal or cleanup action. Sources: [concurrency](https://effect.website/docs/v4/concurrency/basic-concurrency), [creating effects](https://effect.website/docs/v4/getting-started/creating-effects).

Schema combines runtime validation, type inference, encoding, and decoding. Synchronous decoding can be used at an input boundary without converting the whole application to Effect-returning functions. That makes imported board files the most plausible narrow candidate. Sources: [Schema introduction](https://effect.website/docs/v4/schema/introduction), [Schema basic usage](https://effect.website/docs/v4/schema/basic-usage).

Incremental adoption is supported: wrap existing asynchronous operations with `Effect.tryPromise`, then execute the composed operation at an application boundary with `Effect.runPromise` or an exit-returning runner. Keep errors handled explicitly when crossing back to ordinary Promises. Sources: [adoption FAQ](https://effect.website/), [running effects](https://effect.website/docs/v4/getting-started/running-effects).

## Fit with the current code

| Area | Current implementation | Assessment |
| --- | --- | --- |
| Board editing and history | Pure board commands with a small session handling undo and redo | Little benefit from a runtime migration. |
| File import | A typed success/failure result plus explicit validation | Schema may reduce duplicated shape declarations as formats grow. There is already a usable error boundary. |
| Local drafts | Injected storage methods, handled failures, and a stored-content comparison that pauses conflicting saves | Effect would reorganize existing behavior. It would not decide cross-tab conflict policy. |
| Browser operations | File reading, clipboard writes, and Mermaid rendering | Too few coordinated asynchronous operations to justify a broad runtime today. |

Local evidence: [board commands](../src/board/argument-board.ts), [session](../src/board/argument-board-session.ts), [file contract](../src/board/export-file-contract.ts), [local drafts](../src/board/local-draft.ts), [browser controller](../src/ui/argument-board-browser.ts).

The import contract accepts incomplete drafts and preserves unknown fields by returning the validated original object. It also checks global ID uniqueness and fact-reference integrity. Any Schema experiment must preserve those rules, including nested unknown fields, existing messages, and older version-2 files. Structural schemas alone do not establish those relational checks. Version-1 files remain intentionally unsupported.

The browser controller already rejects stale Mermaid results using `renderVersion`. Preserve equivalent protection even if an Effect wrapper is introduced. File reading and clipboard writes currently lack local rejection handling; ordinary `try/catch` and useful feedback can address those gaps without adopting a runtime.

## Costs and a sensible next step

The main cost is teaching contributors an execution model involving lazy programs, generators, typed failures, defects, and managed lifetimes. Adapters and service definitions are worthwhile when they remove repeated orchestration; this app currently offers few such opportunities. Keeping Effect behind a boundary would limit that cost.

Do not assume a fixed bundle increase or a performance improvement. The v3 documentation quotes roughly 25 KB gzipped for its minimum runtime, but that is neither a v4 measurement nor a measurement of this app. V4's lack of runtime dependencies also does not imply zero shipped JavaScript. Measure actual production chunks for the chosen imports. Sources: [v3 bundle discussion](https://effect.website/docs/v3/additional-resources/myths), [v4 release](https://github.com/Effect-TS/effect/releases/tag/effect@4.0.0).

If import maintenance becomes a real problem, compare one Schema implementation against the existing parser behind the same public interface. Require preserved file behavior, clearer maintenance, passing typecheck and relevant tests, and an acceptable measured bundle change. Otherwise, spend the effort on the app's current workflows. This assessment changed documentation only; it makes no test or performance claims.
