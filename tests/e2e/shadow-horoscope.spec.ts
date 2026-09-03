import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

test("opens the versioned shadow horoscope for an authenticated profile", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  const email = `shadow-${randomUUID()}@example.invalid`;
  const password = `Shadow-${randomUUID()}-safe`;
  const registration = await sameOriginPost(page, "/api/auth/register", { email, password });
  expect(registration.status).toBe(201);

  const map = await sameOriginPost(page, "/api/maps", {
    displayName: "Perfil Sombra",
    date: "1990-06-15",
    timePrecision: "unknown",
    latitude: -12.5,
    longitude: -38.5,
    timezone: "America/Bahia",
    location: "Cidade Horizonte, Brasil",
    houseSystem: "placidus",
  });
  expect(map.status).toBe(201);

  await page.goto("/conta");
  await expect(
    page.getByRole("heading", { name: "Bem-vindo ao seu observatório, Perfil Sombra." }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Horóscopo sombrio", exact: true }).click();

  const shadowView = page.locator(".account-view:not([hidden])");
  await expect(
    shadowView.getByRole("heading", { name: "Aquilo que pede integração." }),
  ).toBeVisible();
  await expect(
    shadowView
      .getByText(/Isto descreve uma possibilidade simbólica do trânsito, não uma sentença/)
      .first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    shadowView.getByRole("heading", {
      name: /O (ego|afeto|controle)|A (carência|mente|irritação|certeza)/,
    }),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

async function sameOriginPost(
  page: Page,
  path: string,
  body: Record<string, string | number>,
): Promise<{ status: number; body: unknown }> {
  return page.evaluate(
    async ({ requestPath, requestBody }) => {
      const response = await fetch(requestPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      return { status: response.status, body: await response.json() };
    },
    { requestPath: path, requestBody: body },
  );
}
