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
  await expect(page.getByText("Hora desconhecida · leitura sem casas e Ascendente")).toBeVisible();

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
    page.getByRole("heading", { name: "Um arquivo do céu que você informou." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perfil Horizonte" })).toBeVisible();
  await expect(page.getByText("Precisão").locator("strong")).toHaveText("Sem hora");
  await expect(page.getByText("Tempo do Céu", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/Autoria:/).first()).toBeVisible();

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
  await journal.getByRole("button", { name: "Excluir" }).click();
  await expect(journal.getByText("Reflexão excluída.")).toBeVisible();

  await page.getByLabel("Nome ou apelido").fill("Perfil Aurora");
  await page.getByLabel("Não sei minha hora").uncheck();
  await page.getByLabel("Hora de nascimento").fill("08:45");
  await page.getByLabel("Cidade de nascimento").fill("Aurora");
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: PLACE_TWO.label }).click();
  await page.getByRole("button", { name: "Salvar e recalcular" }).click();
  await expect(page.getByText("Dados atualizados e mapa recalculado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perfil Aurora" })).toBeVisible();
  await expect(page.getByText("Precisão").locator("strong")).toHaveText("Com hora");

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
      },
    ],
  });
  expect(JSON.stringify(accountExport.body)).not.toMatch(/passwordHash|tokenHash|inputFingerprint/);

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
  await page.getByRole("button", { name: "Excluir este mapa" }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText("Este mapa foi excluído.")).toBeVisible();

  const afterInterfaceDelete = await profiles(page);
  expect(afterInterfaceDelete).toHaveLength(1);
  expect(afterInterfaceDelete[0]?.id).toBe(firstProfileId);
  const finalDelete = await sameOriginApi(page, `/api/profiles/${firstProfileId}`, {
    method: "DELETE",
  });
  expect(finalDelete.status).toBe(204);
  expect(await profiles(page)).toEqual([]);

  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Seu arquivo ainda está vazio." })).toBeVisible();
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
  await page.goto("/");
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
    page.getByRole("heading", { name: `Seu céu se abre assim, ${input.displayName}.` }),
  ).toBeVisible();
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
