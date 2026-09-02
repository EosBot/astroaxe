import { expect, test } from "@playwright/test";

const MOMENTO = "instant=2026-06-21T12%3A00%3A00%2B00%3A00&latitude=-23.55&longitude=-46.63";

/**
 * Marcadores do insumo que nunca podem aparecer numa página.
 *
 * Os mesmos que `src/lib/security/leak-scanner.ts` procura nos artefatos de build.
 * Aqui a verificação é sobre o texto renderizado, que é o que a pessoa recebe.
 */
const MARCADORES_DE_ACERVO = [
  "Corpus local",
  "_texto_",
  "/mnt/e/Ocultismo",
  "source-system:",
  // Nomes de obra e autor são o acervo de pesquisa, e não saem para a tela.
  "Heptameron",
  "Agrippa",
  "Arbatel",
  "Lemegeton",
  "Saraceni",
];

test("publica o grafo de funções sem expor a proveniência por claim", async ({ page }) => {
  await page.goto("/metodologia");

  await expect(
    page.getByRole("heading", { name: "As perguntas que as tradições respondem juntas." }),
  ).toBeVisible();

  // Marbas e Omolu ocupam a mesma função com as categorias visíveis lado a lado —
  // é a separação de categorias que impede a leitura sincrética.
  await expect(page.getByText("Marbas")).toBeVisible();
  await expect(page.getByText("espírito goético").first()).toBeVisible();
  await expect(page.getByText("Orixá").first()).toBeVisible();

  // A sustentação é dita em palavras; um percentual seria lido como certeza.
  await expect(
    page.getByText("três ou mais escolas independentes chegaram à mesma posição").first(),
  ).toBeVisible();

  const texto = await page.locator("body").innerText();
  for (const marcador of MARCADORES_DE_ACERVO) expect(texto).not.toContain(marcador);
  expect(texto).not.toMatch(/\d+\s?%/);
});

test("pede instante e lugar antes de responder qualquer coisa", async ({ page }) => {
  await page.goto("/tempo-cerimonial");

  await expect(
    page.getByRole("heading", { name: "Informe um instante e um lugar." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "As regras, lado a lado." })).toHaveCount(0);
  // Formulário funciona sem JavaScript: é GET com campos nomeados.
  await expect(page.locator("form.timing-form")).toHaveAttribute("method", "get");
});

test("mostra as obras lado a lado, com desfechos distintos e sem vencedor", async ({ page }) => {
  await page.goto(`/tempo-cerimonial?${MOMENTO}&sunLongitude=90&moonLongitude=90`);

  await expect(page.getByRole("heading", { name: "As regras, lado a lado." })).toBeVisible();
  // Identificadas pelo que pedem, nunca pela obra de onde vieram.
  for (const regra of ["Lua crescente, leitura ampla", "Dia planetário do assunto"])
    await expect(page.getByRole("heading", { name: regra })).toBeVisible();

  // Lua nova contraria umas e é incomputável para Agrippa: os dois estados
  // convivem na tela, e nada os concilia.
  await expect(page.getByText("O momento contraria o que esta regra pede.").first()).toBeVisible();
  await expect(page.getByText("Não há dado suficiente para julgar por esta regra.")).toBeVisible();

  const texto = await page.locator("body").innerText();
  expect(texto).toContain("não uma recomendação de momento nem promessa de resultado");
  for (const marcador of MARCADORES_DE_ACERVO) expect(texto).not.toContain(marcador);
});

test("declara a incerteza em vez de inventar horário no modo polar", async ({ page }) => {
  await page.goto(
    "/tempo-cerimonial?instant=2026-06-21T12%3A00%3A00%2B00%3A00&latitude=78.22&longitude=15.63",
  );

  await expect(page.getByText(/não há hora planetária/)).toBeVisible();
  await expect(page.getByText("Regente do dia")).toHaveCount(0);
});

test("é navegável por teclado e não estoura a largura em nenhum viewport", async ({ page }) => {
  await page.goto(`/tempo-cerimonial?${MOMENTO}`);

  await page.keyboard.press("Tab");
  const focado = await page.evaluate(() => document.activeElement?.tagName ?? "");
  expect(["A", "BUTTON", "INPUT"]).toContain(focado);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("alcança as superfícies novas pela navegação, e não só pelo sitemap", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Tempo" }).first()).toBeVisible();
});
