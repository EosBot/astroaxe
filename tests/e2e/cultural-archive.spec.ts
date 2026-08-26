import { expect, test } from "@playwright/test";

test("publishes long cultural readings with visible provenance", async ({ page }) => {
  await page.goto("/acervo-cultural");

  await expect(
    page.getByRole("heading", { name: "Conhecimento situado, com origem visível." }),
  ).toBeVisible();
  await expect(page.getByText("801")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: /Xangô, trovão e memória/ })).toBeVisible();
  await expect(
    page.getByText("Conselho cultural AstroAxe", { exact: false }).first(),
  ).toBeVisible();

  const narrative = page.locator("article").filter({ hasText: "Xangô, trovão e memória" });
  await narrative.getByText("Ver afirmações e fontes").click();
  const source = narrative.getByRole("link", { name: /Yoruba Legends/ }).first();
  await expect(source).toHaveAttribute("href", "https://www.sacred-texts.com/afr/yl/yl08.htm");
  await expect(narrative.getByText("Capítulo VI, páginas 8–9", { exact: false })).toBeVisible();
});

test("supports keyboard skip navigation and does not overflow the viewport", async ({ page }) => {
  await page.goto("/acervo-cultural");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Ir para o conteúdo principal" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page).toHaveURL(/#conteudo-principal$/);

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
