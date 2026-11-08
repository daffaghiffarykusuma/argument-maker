import type { Locator } from 'playwright';

/** Choose a visible research result as an author would. Destination disclosure must be open. */
export async function attachGatheredFact(destination: Locator, factNumber: number) {
  await destination.getByText('Choose Gathered Facts', { exact: true }).click();
  await destination.getByRole('article', { name: `Gathered Fact ${factNumber}`, exact: true })
    .getByRole('button', { name: 'Attach fact', exact: true }).click();
}
