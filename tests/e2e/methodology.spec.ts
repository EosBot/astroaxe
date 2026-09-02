import { expect, test } from "@playwright/test";

test("publishes the research method without claiming measured accuracy", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(
    page.getByRole("heading", {
      name: "Um método rastreável, sem transformar profundidade em caixa-preta.",
    }),
  ).toBeVisible();
  const stages = page.getByRole("list", { name: "Etapas públicas do método AstroAxe" });
  // As etapas vêm de PUBLIC_REGENCY_METHOD_CARD. A asserção dizia "Interpretar",
  // que o model card não usa desde que a cadeia virou "Extrair" — defasagem que
  // passou despercebida porque E2E exige servidor de pé.
  for (const stage of ["Calcular", "Extrair", "Cruzar", "Testar", "Explicar"])
    await expect(stages).toContainText(stage);
  // Mesma defasagem da lista de etapas: o texto vive em PUBLIC_REGENCY_METHOD_CARD
  // e diz "Ainda não há acurácia publicada". O que importa é a página declarar
  // que não publica acurácia, e é isso que se verifica.
  await expect(page.getByText(/Ainda não há acurácia publicada/i)).toBeVisible();
  await expect(page.getByText(/sem métrica de acurácia publicada/i)).toBeVisible();
  // A versão aparece no resumo e no rodapé do método; qualquer uma das duas
  // serve para provar que ela é publicada.
  await expect(page.getByText(/AstroAxe Regências 3.0/).first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
