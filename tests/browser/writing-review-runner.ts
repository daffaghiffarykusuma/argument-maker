const harnessModule = "./browser-harness.ts";
const { withBrowserWorkflow }: typeof import("./browser-harness") = await import(harnessModule);
const modulePath = "./writing-review.ts";
const { verifyWritingReview } = await import(modulePath);

await withBrowserWorkflow(3008, verifyWritingReview);
console.log("Writing review browser workflow passed");
