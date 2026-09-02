import { describe, expect, it } from "vitest";

import {
  FEATURE_CATALOG,
  requiredTierFor,
  resolveAccessTier,
  tierAllows,
  type FeatureId,
} from "./features";

describe("fronteira do freemium", () => {
  it("mantém aberto exatamente o que o dono decidiu deixar aberto", () => {
    const abertos = Object.entries(FEATURE_CATALOG)
      .filter(([, tier]) => tier === "anonymous")
      .map(([feature]) => feature)
      .sort();

    // Só as duas páginas de vitrine ficam abertas a quem não tem conta, e elas
    // podem porque não guardam nada de ninguém. Tudo que envolve dado de
    // nascimento exige cadastro, inclusive o que é gratuito.
    expect(abertos).toEqual(["ceremonial-timing", "cultural-archive"]);
  });

  it("nunca cobra por exportar os próprios dados", () => {
    // Acesso e portabilidade são direito do titular na LGPD. Cobrar por isso
    // transformaria um direito em recurso pago.
    expect(requiredTierFor("data-export")).not.toBe("paid");
  });

  it("fecha as ferramentas cerimoniais que descobrem, e não as que só conferem", () => {
    // A distinção é o produto: conferir um instante que a pessoa traz é vitrine;
    // descobrir instantes, catalogar correspondências e guardar registro é o que
    // a assinatura paga.
    expect(requiredTierFor("ceremonial-timing")).toBe("anonymous");
    for (const feature of [
      "ceremonial-windows",
      "ceremonial-planner",
      "ceremonial-correspondences",
    ] as FeatureId[])
      expect(requiredTierFor(feature)).toBe("paid");
  });

  it("exige conta até para o que é gratuito", async () => {
    const tier = await resolveAccessTier(null);

    expect(tier).toBe("anonymous");
    // Gratuito não quer dizer anônimo: o mapa natal guarda data, hora e lugar
    // de nascimento, e dado pessoal sem titular é dado que ninguém pode apagar.
    expect(tierAllows(tier, "natal-chart")).toBe(false);
    expect(tierAllows(tier, "ceremonial-timing")).toBe(true);
    expect(tierAllows(tier, "transits")).toBe(false);
    expect(tierAllows(tier, "ceremonial-windows")).toBe(false);
  });

  it("separa nível grátis de nível pago, mesmo enquanto coincidem", () => {
    // Hoje qualquer conta vale como paga, porque o produto está em teste. A
    // hierarquia precisa existir mesmo assim: é ela que permite ligar a
    // cobrança mudando uma função, e não trinta rotas.
    expect(tierAllows("free", "natal-chart")).toBe(true);
    expect(tierAllows("anonymous", "natal-chart")).toBe(false);
    expect(tierAllows("free", "transits")).toBe(false);
    expect(tierAllows("paid", "transits")).toBe(true);
  });

  it("recusa recurso sem nível declarado em vez de liberar por omissão", () => {
    expect(() => requiredTierFor("recurso-inexistente" as FeatureId)).toThrow();
  });
});
