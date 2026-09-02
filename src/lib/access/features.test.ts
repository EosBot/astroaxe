import { describe, expect, it } from "vitest";

import {
  FEATURE_CATALOG,
  requiredTierFor,
  resolveAccessTier,
  tierAllows,
  type FeatureId,
} from "./features";

describe("fronteira do freemium", () => {
  it("mantém gratuitos exatamente o mapa natal, o horóscopo e o sombrio", () => {
    const abertos = Object.entries(FEATURE_CATALOG)
      .filter(([, tier]) => tier === "anonymous")
      .map(([feature]) => feature)
      .sort();

    // A lista é curta de propósito, e é decisão comercial do produto. Se algo
    // entrar aqui sem o dono ter pedido, este teste avisa antes de o recurso
    // virar gratuito em produção.
    expect(abertos).toEqual(["horoscope", "natal-chart", "shadow-horoscope"]);
  });

  it("nunca cobra por exportar os próprios dados", () => {
    // Acesso e portabilidade são direito do titular na LGPD. Cobrar por isso
    // transformaria um direito em recurso pago.
    expect(requiredTierFor("data-export")).not.toBe("paid");
  });

  it("fecha as ferramentas cerimoniais", () => {
    const cerimoniais = Object.keys(FEATURE_CATALOG).filter((feature) =>
      feature.startsWith("ceremonial-"),
    ) as FeatureId[];

    expect(cerimoniais.length).toBeGreaterThan(0);
    for (const feature of cerimoniais) expect(requiredTierFor(feature)).toBe("paid");
  });

  it("deixa quem não entrou ver só o que é aberto", async () => {
    const tier = await resolveAccessTier(null);

    expect(tier).toBe("anonymous");
    expect(tierAllows(tier, "natal-chart")).toBe(true);
    expect(tierAllows(tier, "transits")).toBe(false);
    expect(tierAllows(tier, "ceremonial-windows")).toBe(false);
  });

  it("separa nível grátis de nível pago, mesmo enquanto coincidem", () => {
    // Hoje qualquer conta vale como paga, porque o produto está em teste. A
    // hierarquia precisa existir mesmo assim: é ela que permite ligar a
    // cobrança mudando uma função, e não trinta rotas.
    expect(tierAllows("free", "natal-chart")).toBe(true);
    expect(tierAllows("free", "transits")).toBe(false);
    expect(tierAllows("paid", "transits")).toBe(true);
  });

  it("recusa recurso sem nível declarado em vez de liberar por omissão", () => {
    expect(() => requiredTierFor("recurso-inexistente" as FeatureId)).toThrow();
  });
});
