import { describe, expect, it } from "vitest";

import {
  EDITORIAL_REPORT_VERSION,
  houseForLongitude,
  houseTheme,
  interpretHouse,
  interpretPlacement,
  signLens,
} from "./editorial-report";

describe("versioned editorial astrology reports", () => {
  it("varies the reading by body, sign, house and degree", () => {
    const venus = interpretPlacement({
      body: "venus",
      sign: "Escorpião",
      degree: 12.4,
      house: 8,
      context: "No amor.",
    });
    const mercury = interpretPlacement({
      body: "mercury",
      sign: "Gêmeos",
      degree: 4.2,
      house: 3,
      context: "No trabalho.",
    });
    expect(venus.version).toBe(EDITORIAL_REPORT_VERSION);
    expect(venus.title).toBe("Vênus em Escorpião na Casa 8");
    expect(venus.lead).toContain("12.40°");
    expect(venus.dailyLife).toContain("recursos compartilhados");
    expect(venus).not.toEqual(mercury);
  });

  it("does not invent a house when birth time is unavailable", () => {
    const reading = interpretPlacement({
      body: "moon",
      sign: "Câncer",
      degree: 9,
      context: "Na intimidade.",
    });
    expect(reading.title).toBe("Lua em Câncer");
    expect(reading.dailyLife).toContain("Sem hora natal confiável");
  });

  it("keeps all twelve house and sign lenses addressable", () => {
    expect(houseTheme(10)).toContain("carreira");
    expect(signLens("Capricórnio").strength).toContain("responsabilidade");
  });

  it("builds house chapters and locates wrapped longitudes", () => {
    const reading = interpretHouse({
      house: 10,
      sign: "Capricórnio",
      degree: 4.5,
      context: "Na carreira.",
    });
    expect(reading.title).toBe("Casa 10 em Capricórnio");
    expect(reading.lead).toContain("carreira");
    expect(houseForLongitude(355, [350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320])).toBe(
      1,
    );
  });
});
