// The markup each region last received, so a refresh that changes nothing leaves the region untouched.
const written = new WeakMap<Element, string>();

/**
 * Replace one region of the app with fresh markup from that region's only
 * renderer, keeping open disclosures and the focused control. Partial
 * updates go through here instead of hand-patching individual elements.
 */
export function replaceRegion(region: Element | null, html: string) {
  if (!region || written.get(region) === html) return;
  const disclosures = new Map(
    [...region.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")].map((details) => [
      details.dataset.disclosure!,
      details.open,
    ]),
  );
  const active = document.activeElement;
  const focusedId = active instanceof HTMLElement && region.contains(active) ? active.id : undefined;
  region.innerHTML = html;
  written.set(region, html);
  for (const details of region.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")) {
    const open = disclosures.get(details.dataset.disclosure!);
    if (open !== undefined) details.open = open;
  }
  if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
}
