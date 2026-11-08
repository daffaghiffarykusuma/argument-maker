const harness = "./browser-harness.ts";
const { withBrowserWorkflow }: typeof import("./browser-harness") = await import(harness);
await withBrowserWorkflow(3027, async (browser, url) => {
  for (const [path, name] of [
    ["./writing-review.ts", "verifyWritingReview"],
    ["./review-navigation-06.ts", "verifyReviewNavigation06"],
    ["./planning-context.ts", "verifyPlanningContext"],
  ]) {
    const workflow = await import(path!);
    await workflow[name!](browser, url);
    console.log(`Ticket 07 regression passed: ${name}`);
  }
  const page = await browser.newPage();
  try {
    await page.goto(url);
    await page.getByRole("tab", { name: "Preview", exact: true }).click();
    const path = "./clipboard.ts";
    const { verifyClipboardFeedback } = await import(path);
    await verifyClipboardFeedback(page);
    console.log("Ticket 07 regression passed: clipboard pending, denied, unavailable, retry");
  } finally { await page.close(); }
});
