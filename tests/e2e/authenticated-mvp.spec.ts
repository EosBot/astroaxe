import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

const PLACE_ONE = {
  label: "Cidade Horizonte, Brasil",
  latitude: -12.5,
  longitude: -38.5,
  timezone: "America/Bahia",
};
const PLACE_TWO = {
  label: "Vila Aurora, Brasil",
  latitude: -23.5,
  longitude: -46.6,
  timezone: "America/Sao_Paulo",
};

test("completes the authenticated MVP lifecycle", async ({ page }) => {
  test.setTimeout(300_000);
  const email = `e2e-${randomUUID()}@example.invalid`;
  const password = `E2e-${randomUUID()}-safe`;
  const newPassword = `E2e-${randomUUID()}-rotated`;
  const observed = new Map<string, number>();

  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.startsWith("/api/")) observed.set(pathname, (observed.get(pathname) ?? 0) + 1);
  });
  await mockGeocoding(page);

  await createGuestMap(page, {
    displayName: "Perfil Horizonte",
    birthDate: "1990-06-15",
    placeQuery: "Horizonte",
    place: PLACE_ONE,
  });
  await expect(
    page.getByText("Sem uma hora conhecida, mostramos somente posições planetárias confiáveis."),
  ).toBeVisible();

  const registerResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/register") && response.request().method() === "POST",
  );
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta e salvar" }).click();
  expect((await (await registerResponse).json()) as { claimedProfiles: number }).toMatchObject({
    claimedProfiles: 1,
  });
  await page.getByRole("link", { name: "Abrir meu arquivo celeste" }).click();

  await expect(
    page.getByRole("heading", { name: "Bem-vindo ao seu observatório, Perfil Horizonte." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Além dos dez planetas." })).toBeVisible();
  await page.getByRole("button", { name: "Ativar sons de interface" }).click();
  await expect(page.getByRole("button", { name: "Desativar sons de interface" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await captureEvidence(page, "astroaxe-overview");
  await captureAccountModules(page);
  await openSecondaryModule(page, "Orixás");
  await expect(page.getByRole("heading", { name: "Antes da sua Tríade" })).toBeVisible({
    timeout: 30_000,
  });
  for (const radio of await page.getByRole("radio", { name: /Os dois movimentos/ }).all())
    await radio.click();
  const regencyResponse = page.waitForResponse(
    (response) => response.url().includes("/regency") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Cruzar respostas e revelar tríade" }).click();
  expect((await regencyResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Tríade de Regências AstroAxe" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/Leitura autoral em validação/)).toBeVisible();
  await expect(page.getByText(/Estabilidade entre fontes:/).first()).toBeVisible();
  await expect(page.getByText(/não substituem confirmação religiosa/)).toBeVisible();
  await captureEvidence(page, "astroaxe-orixas");

  // Consent-gated feedback: unchecked consent must not reach the server.
  await page.getByRole("combobox", { name: "Como você avalia a tríade?" }).selectOption("close");
  await page.getByRole("radio", { name: "Não ou não tenho certeza" }).click();
  await page
    .getByRole("combobox", { name: "Como você conhece essa informação?" })
    .selectOption("personal_recognition");
  await expect(page.getByRole("button", { name: "Enviar avaliação" })).toBeDisabled();
  await page.getByLabel(/Autorizo o uso destas respostas/).check();
  const feedbackResponse = page.waitForResponse(
    (response) => response.url().includes("/regency") && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  expect((await feedbackResponse).status()).toBe(201);
  await expect(page.getByText("Obrigado por fortalecer a pesquisa.")).toBeVisible();
  await page.getByRole("button", { name: "Desativar sons de interface" }).click();
  await page.getByRole("button", { name: "Mapa natal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Perfil Horizonte", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Além dos dez planetas." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quíron" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lilith média" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nodo Norte" })).toBeVisible();
  await captureEvidence(page, "astroaxe-map-modern-points");
  await expect(
    page.locator(".account-view:not([hidden])").getByText("Precisão").locator("strong"),
  ).toHaveText("Sem hora");

  await page.getByRole("button", { name: "Horóscopo", exact: true }).click();
  const cyclesView = page.locator(".account-view:not([hidden])");
  await expect(cyclesView.getByText("Tempo do Céu", { exact: false }).first()).toBeVisible();
  await expect(cyclesView.getByText(/Autoria:/).first()).toBeVisible();

  const journal = page.getByRole("region", { name: "O que este céu movimentou em você?" });
  await journal.getByLabel("Reflexão de hoje").fill("Registro sintético para validar o diário.");
  await journal.getByRole("button", { name: "Guardar reflexão" }).click();
  await expect(journal.getByText("Reflexão guardada somente no seu arquivo.")).toBeVisible();
  await journal
    .getByLabel("Reflexão de hoje")
    .fill("Registro sintético atualizado e preservado por versão.");
  const journalUpdateResponse = page.waitForResponse(
    (response) => response.url().includes("/journal") && response.request().method() === "PUT",
  );
  await journal.getByRole("button", { name: "Guardar reflexão" }).click();
  const updatedJournal = (await (await journalUpdateResponse).json()) as {
    entry: { content: string };
  };
  expect(updatedJournal.entry.content).toContain("Registro sintético atualizado");
  const journalExport = await sameOriginApi(page, "/api/journal/export");
  expect(journalExport.status).toBe(200);
  expect(JSON.stringify(journalExport.body)).toContain("Registro sintético atualizado");
  await journal.getByText(/Reflexões anteriores/).click();
  const journalDeleteResponse = page.waitForResponse(
    (response) => response.url().includes("/journal/") && response.request().method() === "DELETE",
  );
  await journal.getByRole("button", { name: "Excluir" }).click();
  expect((await journalDeleteResponse).status()).toBe(204);
  await expect(journal.getByText("Reflexão excluída.")).toBeVisible();

  await openSecondaryModule(page, "Configurações");
  await page.getByLabel("Nome ou apelido").fill("Perfil Aurora");
  await page.getByLabel("Não sei minha hora").uncheck();
  await page.getByLabel("Hora de nascimento").fill("08:45");
  await page.getByLabel("Cidade de nascimento").fill("Aurora");
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: PLACE_TWO.label }).click();
  const profileUpdateResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/profiles/") && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Salvar e recalcular" }).click();
  expect((await profileUpdateResponse).status()).toBe(200);
  await expect(page.getByText("Dados atualizados e mapa recalculado.")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: "Perfil Aurora", exact: true })).toBeVisible();
  await expect(
    page.locator(".account-view:not([hidden])").getByText("Precisão").locator("strong"),
  ).toHaveText("Com hora");

  const accountExport = await sameOriginApi(page, "/api/auth/export");
  expect(accountExport.status).toBe(200);
  expect(accountExport.body).toMatchObject({
    format: "astroaxe-account-export",
    version: 1,
    account: { email },
    profiles: [
      {
        displayName: "Perfil Aurora",
        birthDate: "1990-06-15",
        birthTime: "08:45",
        chart: { calculationMode: "timed" },
        chartRevisions: [{ calculationMode: "untimed" }],
        journal: [],
        regencyFeedback: [
          {
            methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
            matrixVersion: expect.any(String),
            configVersion: expect.any(String),
            scorerVersion: expect.any(String),
            questionnaireVersion: "regency-questionnaire-1.0.0",
            verdict: "close",
            knowsOrisas: false,
            confirmationBasis: "personal_recognition",
          },
        ],
      },
    ],
  });
  expect(JSON.stringify(accountExport.body)).not.toMatch(/passwordHash|tokenHash|inputFingerprint/);

  const profileForWithdrawal = (await profiles(page))[0];
  const withdrawal = await sameOriginApi(
    page,
    `/api/profiles/${profileForWithdrawal?.id}/regency?methodVersion=${encodeURIComponent("AstroAxe Regências 3.0 — pesquisa aplicada")}&questionnaireVersion=regency-questionnaire-1.0.0`,
    { method: "DELETE" },
  );
  expect(withdrawal.status).toBe(204);
  const exportAfterWithdrawal = await sameOriginApi(page, "/api/auth/export");
  expect(exportAfterWithdrawal.body).toMatchObject({
    profiles: [{ displayName: "Perfil Aurora", regencyFeedback: [] }],
  });

  const firstProfiles = await profiles(page);
  expect(firstProfiles).toHaveLength(1);
  const firstProfileId = firstProfiles[0]?.id;
  expect(firstProfileId).toBeTruthy();

  const logout = await sameOriginApi(page, "/api/auth/logout", { method: "POST" });
  expect(logout.status).toBe(200);
  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Este arquivo é pessoal." })).toBeVisible();
  expect((await sameOriginApi(page, "/api/profiles")).status).toBe(401);

  await createGuestMap(page, {
    displayName: "Perfil Travessia",
    birthDate: "1988-11-03",
    placeQuery: "Horizonte",
    place: PLACE_ONE,
  });
  await page.getByRole("button", { name: "Já tenho conta" }).click();
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") && response.request().method() === "POST",
  );
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar e salvar" }).click();
  expect((await (await loginResponse).json()) as { claimedProfiles: number }).toMatchObject({
    claimedProfiles: 1,
  });
  await expect(page.getByText("Mapa salvo na sua conta.")).toBeVisible();

  const withSecondProfile = await profiles(page);
  expect(withSecondProfile.map((profile) => profile.displayName)).toEqual([
    "Perfil Aurora",
    "Perfil Travessia",
  ]);
  await page.goto("/conta");
  await page.getByRole("button", { name: "Mapa natal", exact: true }).click();
  await page.getByRole("button", { name: /Perfil Travessia/ }).focus();
  await page.keyboard.press("Enter");
  await openSecondaryModule(page, "Configurações");
  await page.getByRole("button", { name: "Excluir este mapa" }).click();
  await page.getByLabel(/Digite EXCLUIR MAPA/).fill("EXCLUIR MAPA");
  await page.getByRole("button", { name: "Excluir mapa definitivamente" }).click();
  await expect(page.getByRole("heading", { name: "Perfil Aurora", exact: true })).toBeVisible();

  const afterInterfaceDelete = await profiles(page);
  expect(afterInterfaceDelete).toHaveLength(1);
  expect(afterInterfaceDelete[0]?.id).toBe(firstProfileId);
  const finalDelete = await sameOriginApi(page, `/api/profiles/${firstProfileId}`, {
    method: "DELETE",
  });
  expect(finalDelete.status).toBe(204);
  expect(await profiles(page)).toEqual([]);

  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Seu arquivo ainda está vazio." })).toBeVisible({
    timeout: 30_000,
  });
  const passwordChange = await sameOriginApi(page, "/api/auth/password", {
    method: "PUT",
    body: { currentPassword: password, newPassword },
  });
  expect(passwordChange.status).toBe(200);
  expect((await sameOriginApi(page, "/api/auth/logout", { method: "POST" })).status).toBe(200);

  const oldLogin = await sameOriginApi(page, "/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  expect(oldLogin.status).toBe(401);
  const newLogin = await sameOriginApi(page, "/api/auth/login", {
    method: "POST",
    body: { email, password: newPassword },
  });
  expect(newLogin.status).toBe(200);
  const accountDelete = await sameOriginApi(page, "/api/auth/account", {
    method: "DELETE",
    body: { currentPassword: newPassword, confirmation: "EXCLUIR" },
  });
  expect(accountDelete.status).toBe(200);
  expect((await sameOriginApi(page, "/api/profiles")).status).toBe(401);
  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Este arquivo é pessoal." })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  for (const route of ["/api/maps", "/api/auth/register", "/api/auth/login", "/api/profiles"]) {
    expect(observed.get(route), `${route} should use the real application`).toBeGreaterThan(0);
  }
  expect(
    [...observed.keys()].some((route) => route.endsWith("/transits")),
    "transits should use the real application",
  ).toBe(true);
  expect([...observed.keys()].some((route) => route.includes("nominatim"))).toBe(false);
  expect(observed.get("/api/journal/export")).toBeGreaterThan(0);
  expect(observed.get("/api/auth/export")).toBeGreaterThan(0);
});

async function createGuestMap(
  page: Page,
  input: {
    displayName: string;
    birthDate: string;
    placeQuery: string;
    place: typeof PLACE_ONE;
  },
): Promise<void> {
  const hydrated = page.waitForResponse((response) => response.url().endsWith("/api/auth/status"));
  await page.goto("/");
  await hydrated;
  await page.getByLabel("Nome ou apelido").fill(input.displayName);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Data de nascimento").fill(input.birthDate);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Não sei minha hora").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Cidade de nascimento").fill(input.placeQuery);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: input.place.label }).click();
  await page.getByRole("button", { name: "Calcular meu céu" }).click();
  await expect(
    page.getByRole("heading", { name: `Seu mapa natal, ${input.displayName}` }),
  ).toBeVisible({ timeout: 30_000 });
}

async function mockGeocoding(page: Page): Promise<void> {
  await page.route("**/api/geocoding?*", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q")?.toLocaleLowerCase();
    const place = query?.includes("aurora") ? PLACE_TWO : PLACE_ONE;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ places: [place] }),
    });
  });
}

async function profiles(page: Page): Promise<Array<{ id: string; displayName: string }>> {
  const response = await sameOriginApi(page, "/api/profiles");
  expect(response.status).toBe(200);
  const body = response.body as { profiles: Array<{ id: string; displayName: string }> };
  return body.profiles;
}

async function sameOriginApi(
  page: Page,
  path: string,
  init?: { method: "POST" | "PUT" | "DELETE"; body?: Record<string, string> },
): Promise<{ status: number; body: unknown }> {
  return page.evaluate(
    async ({ requestPath, requestInit }) => {
      const response = await fetch(requestPath, {
        method: requestInit?.method,
        headers: requestInit?.body ? { "Content-Type": "application/json" } : undefined,
        body: requestInit?.body ? JSON.stringify(requestInit.body) : undefined,
      });
      const body: unknown = response.status === 204 ? null : await response.json();
      return { status: response.status, body };
    },
    { requestPath: path, requestInit: init },
  );
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function captureEvidence(page: Page, name: string): Promise<void> {
  if (process.env.VISUAL_EVIDENCE !== "1") return;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `.planning/screenshots/comparison/${name}-${test.info().project.name}.png`,
    fullPage: true,
  });
}

async function captureAccountModules(page: Page): Promise<void> {
  const modules = [
    { button: "Horóscopo", heading: /Horóscopo de Perfil Horizonte/, slug: "horoscope" },
    {
      button: "Horóscopo sombrio",
      heading: "Aquilo que pede integração.",
      slug: "shadow-horoscope",
    },
    { button: "Sinastria", heading: "Sinastria", slug: "synastry" },
    {
      button: "Mapa completo",
      heading: "A arquitetura do céu em que você nasceu.",
      slug: "complete-map",
    },
    { button: "Biorritmo", heading: /Biorritmo de Perfil Horizonte/, slug: "biorhythm" },
    { button: "Nodos lunares", heading: "Nodos Lunares", slug: "lunar-nodes" },
    { button: "Mapa do amor", heading: "Mapa do Amor", slug: "love-map" },
    { button: "Mapa sexual", heading: /Prazer em se conhecer/, slug: "sexual-map" },
    {
      button: "Mapa profissional",
      heading: /Vocação é uma direção cultivada/,
      slug: "professional-map",
    },
    {
      button: "Revolução Solar 2026",
      heading: "Um ano para orientar, não aprisionar.",
      slug: "solar-return",
    },
    {
      button: "Área Lua",
      heading: "Da memória natal ao mês que começa agora.",
      slug: "lunar-area",
    },
  ] as const;
  for (const item of modules) {
    const target = page.getByRole("button", { name: item.button, exact: true });
    if (!(await target.isVisible())) await page.getByText("Mais módulos", { exact: true }).click();
    await target.click();
    await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureEvidence(page, `astroaxe-${item.slug}`);
  }
  await page.getByText("Mais módulos", { exact: true }).click();
  await page.getByRole("button", { name: "Revolução Solar 2026", exact: true }).click();
  await page.getByLabel("Cidade onde passou ou passará o aniversário").fill("Horizonte");
  await page.getByRole("button", { name: "Buscar cidade" }).click();
  const solarReturnResponse = page.waitForResponse(
    (response) => response.url().includes("/returns?kind=solar") && response.status() === 200,
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: PLACE_ONE.label }).click();
  await solarReturnResponse;
  await expect(page.getByText("Instante exato", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Eclipses e viradas retrógradas de 2026" }),
  ).toBeVisible();
  await captureEvidence(page, "astroaxe-annual-guide-loaded");
  await openSecondaryModule(page, "Área Lua");
  await page.getByLabel("Cidade atual").fill("Horizonte");
  await page.getByRole("button", { name: "Buscar cidade" }).click();
  const lunarResponse = page.waitForResponse(
    (response) => response.url().includes("/lunar?") && response.status() === 200,
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: PLACE_ONE.label }).click();
  await lunarResponse;
  await expect(page.getByRole("heading", { name: /O mês começa em/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "O ponteiro das próximas horas" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Como duas necessidades emocionais convivem" }),
  ).toBeVisible();
  const electionHeading = page.getByRole("heading", {
    name: /A Lua (está fora de curso|ainda aplica a um aspecto)/,
  });
  await expect(electionHeading).toBeVisible();
  await electionHeading.scrollIntoViewIfNeeded();
  await expectNoHorizontalOverflow(page);
  await captureEvidence(page, "astroaxe-lunar-area-loaded");
}

async function openSecondaryModule(page: Page, label: string): Promise<void> {
  const button = page.getByRole("button", { name: label, exact: true });
  if (!(await button.isVisible())) await page.getByText("Mais módulos", { exact: true }).click();
  await button.click();
}
