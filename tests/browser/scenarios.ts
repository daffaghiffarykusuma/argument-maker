import type { Scenario } from "./scenario-harness.ts";

/**
 * Every browser scenario, by name. Each one opens its own pages against the
 * shared app and browser. Modules load lazily so listing names stays cheap.
 */
export const scenarios = {
  "question-first": () => import("./question-first.ts").then((m) => m.verifyQuestionFirst),
  "planning-context": () => import("./planning-context.ts").then((m) => m.verifyPlanningContext),
  "source-reuse": () => import("./source-reuse.ts").then((m) => m.verifySourceReuse),
  "reasoning-review": () => import("./reasoning-review.ts").then((m) => m.verifyReasoningReview),
  workflow: () => import("./workflow.ts").then((m) => m.verifyWorkflow),
  "compact-header": () => import("./compact-header.ts").then((m) => m.verifyCompactHeader),
  "focused-construction": () => import("./focused-construction.ts").then((m) => m.verifyFocusedConstruction),
  "responsive-outline": () => import("./responsive-outline.ts").then((m) => m.verifyResponsiveOutline),
  "fact-guidance": () => import("./fact-guidance.ts").then((m) => m.verifyFactGuidance),
  "fact-summaries": () => import("./fact-summaries.ts").then((m) => m.verifyFactSummaries),
  "fact-picker": () => import("./fact-picker.ts").then((m) => m.verifyFactPicker),
  "descriptive-citations": () => import("./descriptive-citations.ts").then((m) => m.verifyDescriptiveCitations),
  "evidence-link-return": () => import("./evidence-link-return.ts").then((m) => m.verifyEvidenceLinkReturn),
  "review-navigation": () => import("./review-navigation.ts").then((m) => m.verifyReviewNavigation),
  "writing-review": () => import("./writing-review.ts").then((m) => m.verifyWritingReview),
  "unified-exports": () => import("./unified-exports.ts").then((m) => m.verifyUnifiedExports),
  "preview-security": () => import("./preview-security.ts").then((m) => m.verifyPreviewSecurity),
} satisfies Record<string, () => Promise<Scenario>>;

/** Run only when named explicitly: they capture screenshots rather than assert behaviour. */
export const optInScenarios = {
  "compact-header-visual": () => import("./compact-header-visual.ts").then((m) => m.captureCompactHeaderVisuals),
} satisfies Record<string, () => Promise<Scenario>>;

export type ScenarioName = keyof typeof scenarios | keyof typeof optInScenarios;
export const scenarioNames = Object.keys(scenarios) as Array<keyof typeof scenarios>;
