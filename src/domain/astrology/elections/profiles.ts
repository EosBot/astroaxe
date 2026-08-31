import { electionProfileSchema, type ElectionProfile } from "./contracts";

/**
 * Perfis semeados, **apenas os que têm regra localizada numa fonte**.
 *
 * O roteiro pedia Heptameron, Agrippa, Arbatel e Ars Paulina. Heptameron,
 * Agrippa e Arbatel estão representados; Khan Secretum acrescenta uma quarta
 * observação independente. **Ars Paulina** não vira perfil porque sua regra
 * não é de eleição: ela vincula o selo
 *   ao dia e à hora escolhidos, em vez de dizer qual hora escolher.
 *
 * Quem for adicionar um perfil: encontre a passagem, cite-a no `locator` e só
 * então escreva as condições. Um perfil sem locator não entra — o schema recusa.
 * E se a regra da obra não for sobre escolher o momento, ela não vira perfil:
 * forçá-la para caber no tipo seria deturpar a fonte.
 */
export const seededElectionProfiles: readonly ElectionProfile[] = [
  {
    id: "profile:agrippa-operation-planet",
    title: "Agrippa — planeta da operação forte e regente do dia e da hora",
    version: "0.1.0-research",
    sourceSystemId: "source-system:agrippa",
    locator:
      "De occulta philosophia, livro II, caps. XXIX–XXX, ed. inglesa J. F. (1651), pp. 279–281",
    conditions: {
      required: [
        { kind: "operation_planetary_day" },
        { kind: "operation_planetary_hour" },
        {
          kind: "source_requirement",
          requirement:
            "planeta da operação dignificado, afortunado, poderoso e dominante na figura do céu",
        },
      ],
      forbidden: [],
      preferred: [],
    },
    declaredUncertainty:
      "O motor observa regência de dia e hora, mas ainda não avalia dignidades, força acidental, Lua, Mercúrio e a figura completa exigida por Agrippa. O perfil permanece unavailable enquanto esses requisitos não forem computáveis.",
  },
  {
    id: "profile:arbatel-planetary-governance",
    title: "Arbatel — operar no dia do planeta que o espírito olímpico governa",
    version: "0.1.0-research",
    sourceSystemId: "source-system:arbatel",
    locator: "Corpus local, _texto_olimpicos, verbetes dos sete espíritos olímpicos",
    conditions: {
      required: [{ kind: "planetary_day", planet: "sun" }],
      forbidden: [],
      preferred: [{ kind: "planetary_hour", planet: "sun" }],
    },
    declaredUncertainty:
      "O Arbatel atribui a cada espírito olímpico o governo dos assuntos do seu planeta, mas o material consultado não fixa a hora como exigência — apenas o campo planetário. A hora entra como preferência, não como regra.",
  },
  {
    id: "profile:kabbala-teurgica-lua-visivel",
    title: "Kabbala teúrgica — Lua saindo da combustão, já visível",
    version: "0.1.0-research",
    sourceSystemId: "source-system:khan-secretum",
    locator:
      "Corpus local, Khan Secretum — Manual Prático de Kabbala Teúrgica, seção sobre o tempo da Lua",
    conditions: {
      required: [{ kind: "lunar_phase", phases: ["crescent", "first_quarter"] }],
      forbidden: [{ kind: "lunar_phase", phases: ["new", "balsamic"] }],
      preferred: [],
    },
    declaredUncertainty:
      "A obra afirma que a Lua depois da combustão, quando começa a fazer-se visível, é boa para operações de todo tipo. O texto não delimita em graus onde termina esse período; a fase crescente é a leitura mais próxima que o motor lunar oferece.",
  },
  {
    id: "profile:heptameron-lua-crescente-nao-combusta",
    title: "Heptameron — Lua crescente e fora de combustão",
    version: "0.1.0-research",
    sourceSystemId: "source-system:heptameron",
    locator:
      "Heptameron, seção IX, «Of the manner of working»: “Let the Moon be increasing and equal, if it may then be done, and let her not be combust.”",
    conditions: {
      required: [{ kind: "lunar_phase", phases: ["crescent", "first_quarter", "gibbous"] }],
      forbidden: [{ kind: "lunar_phase", phases: ["new", "balsamic"] }],
      preferred: [],
    },
    declaredUncertainty:
      "A obra diz “increasing and equal … not combust”. “Crescente” cobre três das oito fases do motor lunar; a combustão é definida por distância angular ao Sol, que o motor não expõe, então ela é aproximada pelas fases de conjunção. O que a obra chama de “equal” não foi traduzido em condição por não haver leitura correspondente.",
  },
].map((profile) => electionProfileSchema.parse(profile));

/**
 * Sistemas pedidos pelo roteiro que não devem virar perfil.
 *
 * Está aqui em vez de num comentário para que a lacuna seja legível por código e
 * apareça em teste, em vez de ser esquecida.
 */
export const electionProfileGaps: readonly {
  sourceSystemId: string;
  missing: string;
}[] = [
  {
    sourceSystemId: "source-system:ars-paulina",
    missing:
      "A regra da Ars Paulina não é filtro de eleição. Ela manda observar «the time of the years Day and hour that you call the Angells» e construir o selo para aquele dia e hora — é regra de construção vinculada à hora escolhida, não critério para escolhê-la. Um perfil de eleição a representaria mal.",
  },
];
