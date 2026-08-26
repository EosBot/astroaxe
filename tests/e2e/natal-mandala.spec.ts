import { expect, test, type Page } from "@playwright/test";

const PLACE = {
  label: "Cidade Horizonte, Brasil",
  latitude: -12.5,
  longitude: -38.5,
  timezone: "America/Bahia",
};

test("opens with an immersive observatory stage on mobile and desktop", async ({ page }) => {
  test.setTimeout(90_000);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Veja seu céu. Entenda o que ele movimenta." }),
    ).toBeVisible();
    await expect(page.locator(".celestial-observatory-3d")).toBeVisible();
    await expect(page.locator(".system-map")).toHaveAttribute("data-ambient-active", "true");
    await expectNoHorizontalOverflow(page);
    const stageHeight = await page
      .locator(".experience-grid")
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(stageHeight).toBeGreaterThanOrEqual(viewport.height * 0.85);
    await page.getByLabel("Nome ou apelido").scrollIntoViewIfNeeded();
    await expect(page.getByLabel("Nome ou apelido")).toBeVisible();
  }
});

test("keeps the natal instrument usable from 320px through desktop", async ({ page }) => {
  test.setTimeout(90_000);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("401 (Unauthorized)"))
      consoleErrors.push(message.text());
  });
  await mockMapFlow(page);
  await page.setViewportSize({ width: 320, height: 780 });
  await completeOnboarding(page);

  for (const viewport of [
    { width: 320, height: 780 },
    { width: 768, height: 900 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("heading", { name: "O mapa natal de Lu" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Seu mapa natal, Lu" })).toBeFocused();
    await expect(page.locator(".skip-link")).not.toBeInViewport();
    await expect(page.locator(".natal-planet-chapter")).toHaveCount(14);
    await expect(page.getByRole("button", { name: "Ler Lilith média" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Meio do Céu em/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Fundo do Céu em/ })).toBeVisible();
    await expect(page.locator(".natal-angle-dock")).toContainText("ASC");
    await expect(page.locator(".natal-angle-dock")).toContainText("DSC");
    await expect(page.locator(".natal-angle-dock")).toContainText("MC");
    await expect(page.locator(".natal-angle-dock")).toContainText("FC");
    const angleBoxes = await page.locator(".natal-angle-dock > div").evaluateAll((items) =>
      items.map((item) => {
        const box = item.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );
    for (let left = 0; left < angleBoxes.length; left += 1) {
      for (let right = left + 1; right < angleBoxes.length; right += 1) {
        const a = angleBoxes[left]!;
        const b = angleBoxes[right]!;
        expect(
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
        ).toBe(true);
      }
    }
    await expect(page.locator(".account-prompt")).not.toBeInViewport();
    await expectNoHorizontalOverflow(page);
    const stageHeight = await page
      .locator(".natal-sky-stage")
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(stageHeight).toBeGreaterThanOrEqual(viewport.height * 0.82);
    await page.waitForTimeout(700);
    if (viewport.width === 320)
      await page.screenshot({ path: "test-results/natal-mandala-320.png" });
    if (viewport.width === 1440)
      await page.screenshot({ path: "test-results/natal-mandala-desktop.png" });
  }

  await page.getByRole("link", { name: "Descer para interpretar" }).click();
  await expect(
    page.getByRole("heading", { name: "Do desenho do céu à experiência." }),
  ).toBeInViewport();
  await expect(page.locator(".natal-reading-intro")).toHaveAttribute("data-visible", "true");
  await page.waitForTimeout(650);
  await page.screenshot({ path: "test-results/natal-reading-desktop.png" });

  const mars = page.getByRole("button", { name: "Ler Marte" });
  await mars.focus();
  await page.keyboard.press("Enter");
  await expect(mars).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Corpo em foco").locator("..")).toContainText("Marte");

  const markerBoxes = await page.locator(".natal-planet-marker").evaluateAll((markers) =>
    markers.map((marker) => {
      const box = marker.getBoundingClientRect();
      return `${Math.round(box.x)}:${Math.round(box.y)}`;
    }),
  );
  expect(new Set(markerBoxes).size).toBe(markerBoxes.length);
  expect(consoleErrors).toEqual([]);
});

test("removes reveal animation when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockMapFlow(page);
  await completeOnboarding(page);
  await expect(page.locator(".natal-wheel-frame .natal-wheel")).toHaveCSS("animation-name", "none");
});

async function completeOnboarding(page: Page): Promise<void> {
  const hydrated = page.waitForResponse((response) => response.url().endsWith("/api/auth/status"));
  await page.goto("/");
  await hydrated;
  await page.getByLabel("Nome ou apelido").fill("Lu");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Data de nascimento").fill("1990-06-10");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Hora de nascimento").fill("08:30");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Cidade de nascimento").fill("Horizonte");
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: PLACE.label }).click();
  await page.getByRole("button", { name: "Calcular meu céu" }).click();
  await expect(page.getByRole("heading", { name: "Seu mapa natal, Lu" })).toBeAttached();
}

async function mockMapFlow(page: Page): Promise<void> {
  await page.route("**/api/geocoding?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ places: [PLACE] }),
    }),
  );
  await page.route("**/api/maps", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(mapResponse()),
    }),
  );
}

function mapResponse() {
  const ids = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "chiron",
    "true_node",
    "mean_lilith",
  ];
  return {
    profileId: "123e4567-e89b-42d3-a456-426614174000",
    chartId: "223e4567-e89b-42d3-a456-426614174000",
    chart: {
      mode: "timed",
      engineVersion: "browser-fixture",
      configVersion: "browser-fixture",
      inputFingerprint: "browser-fixture".padEnd(64, "x"),
      jdUt: 2_440_000,
      planets: ids.map((id, index) => ({
        id,
        longitude: index < 3 ? 359 + index * 0.4 : index * 34,
        latitude: 0,
        speed: 1,
        retrograde: id === "mars",
        sign: "Aries",
        signDegree: index,
      })),
      houses: {
        requestedSystem: "placidus",
        actualSystem: "placidus",
        cusps: Array.from({ length: 12 }, (_, index) => index * 30),
        ascendant: 120,
        midheaven: 30,
      },
      warnings: [],
    },
  };
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: element.className,
          left: box.left,
          right: box.right,
        };
      })
      .filter(({ left, right }) => left < -1 || right > clientWidth + 1)
      .slice(0, 8);
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth, offenders };
  });
  expect(dimensions.scrollWidth, JSON.stringify(dimensions.offenders)).toBeLessThanOrEqual(
    dimensions.clientWidth,
  );
}
