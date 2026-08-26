import { expect, test } from "@playwright/test";

test("publishes the research method without claiming measured accuracy", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(
    page.getByRole("heading", {
      name: "Um método rastreável, sem transformar profundidade em caixa-preta.",
    }),
  ).toBeVisible();
  const stages = page.getByRole("list", { name: "Etapas públicas do método AstroAxe" });
  for (const stage of ["Calcular", "Interpretar", "Cruzar", "Testar", "Explicar"])
    await expect(stages).toContainText(stage);
  await expect(page.getByText(/Métricas de acurácia só serão publicadas/i)).toBeVisible();
  await expect(page.getByText(/AstroAxe Regências 3.0/)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
