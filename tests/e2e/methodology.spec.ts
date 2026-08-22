import { expect, test } from "@playwright/test";

test("publishes the research method without claiming measured accuracy", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(
    page.getByRole("heading", { name: "Da posição no céu à decisão explicável." }),
  ).toBeVisible();
  const stages = page.getByRole("list", { name: "Etapas do método AstroAxe" });
  for (const stage of ["Mapa", "Fatores", "Correspondências", "Score", "Decisão"])
    await expect(stages).toContainText(stage);
  await expect(page.getByText(/nenhuma porcentagem de acurácia é publicada/i)).toBeVisible();
  await expect(page.getByText(/Método autoral AstroAxe; versão de pesquisa/)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
