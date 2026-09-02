export const PUBLIC_REGENCY_METHOD_VERSION = "AstroAxe Regências 3.0 — pesquisa aplicada";

export const PUBLIC_REGENCY_METHOD_SUMMARY = {
  inputs: [
    "mapa natal calculado",
    "padrões temporais disponíveis",
    "camadas numerológicas versionadas",
    "autorrelato guiado por movimentos simbólicos",
  ],
  controls: [
    "proveniência por família de fonte",
    "cruzamento comparativo entre escolas com proveniência preservada",
    "análise de estabilidade e possibilidade de abstenção",
    "respostas do questionário são cálculo-apenas e não são persistidas",
    "feedback de calibração exige consentimento separado e pode ser retirado individualmente",
  ],
  disclosedLimitations: [
    "hora desconhecida reduz os fatores disponíveis",
    "resultado não equivale a confirmação religiosa",
    "métricas de validação só serão publicadas com amostra suficiente",
  ],
} as const;

/**
 * Conteúdo do _model card_ público, na profundidade que `docs/BLUEPRINT.md` §5.0
 * exige da página de metodologia: entradas, processo, versionamento, avaliação e
 * limites conhecidos.
 *
 * Fica no domínio, e não na página, porque é contrato: muda com versão e é
 * coberto por teste. Nenhum identificador interno de artefato entra aqui — a
 * página é superfície pública e a matriz, os coeficientes e as regras de
 * desempate continuam fora dela.
 */
export const PUBLIC_REGENCY_METHOD_CARD = {
  chain: [
    {
      title: "Calcular",
      summary: "O céu natal sai de data, hora e lugar — determinístico, sem IA.",
      detail:
        "O céu natal é calculado a partir de data, hora e lugar informados. O cálculo é determinístico e não usa IA: o mesmo nascimento produz sempre o mesmo mapa, e mudanças no motor astronômico passam por testes de regressão antes de valer.",
    },
    {
      title: "Extrair",
      summary: "O mapa vira fatores discretos e versionados.",
      detail:
        "Do mapa saem fatores discretos — signo do Ascendente, planetas angulares, dignidades, retrogradação, dia e hora planetária, camada numerológica derivada da data. Cada fator é uma feature versionada, não uma impressão de leitura.",
    },
    {
      title: "Cruzar",
      summary: "Os fatores encontram as correspondências, pesadas por origem.",
      detail:
        "Os fatores encontram as correspondências documentadas. O cruzamento pesa a origem de cada afirmação: repetição editorial da mesma linhagem não vale como segunda confirmação, e afirmações concorrentes ficam registradas como conflito em vez de serem promediadas.",
    },
    {
      title: "Testar",
      summary: "A leitura é perturbada antes de virar resultado.",
      detail:
        "Antes de apresentar um papel, o sistema verifica se a leitura se sustenta quando a evidência é perturbada. Convergência insuficiente não vira resultado fraco: vira papel em aberto.",
    },
    {
      title: "Explicar",
      summary: "O que sustenta o papel fica visível, inclusive o que ficou em aberto.",
      detail:
        "O resultado mostra os fatores que o sustentam, a versão aplicada e o que ficou em aberto. Você consegue ver por que aquele papel apareceu — e quando o método preferiu não afirmar.",
    },
  ],
  condensation: {
    layers: [
      {
        title: "Fonte",
        detail:
          "Cada tradição afirma o que afirma, com identidade própria: escola, obra, edição e posição citável. Nada é normalizado nesta camada, e ela não vai para a interface — serve para sabermos o que reestudar quando uma leitura se mostra errada.",
      },
      {
        title: "Função",
        detail:
          "Extraímos a posição estrutural independente do nome: quem abre a passagem, quem detém o metal e o ofício da guerra, quem impõe o limite do corpo. Cada função carrega a pergunta que responde, e é esse teste que autoriza comparar tradições — sem ele, aproximar nomes parecidos vira sincretismo por semelhança de vocabulário.",
      },
      {
        title: "Condensação",
        detail:
          "As afirmações são agrupadas por função. Convergência entre linhagens independentes aumenta a sustentação; divergência é registrada como conflito, nunca resolvida por média — promediar apagaria a discordância em vez de a expor.",
      },
    ],
    lineageRule:
      "Sustentação se conta por linhagem, não por obra. Quatro livros do mesmo autor são quatro obras e uma voz: tratá-los como quatro confirmações inflaria justamente a fonte mais presente do acervo e faria passar por consenso entre escolas o que é a exposição de uma só. É uma regra que reduz números, e é por isso que ela existe.",
    strengthLabels: [
      {
        label: "Uma escola",
        detail: "A posição aparece numa linhagem só. Fica registrada como tal.",
      },
      { label: "Corroborada", detail: "Duas linhagens independentes chegam à mesma posição." },
      { label: "Convergente", detail: "Três ou mais linhagens independentes convergem." },
    ],
    limit:
      "O que afirmamos é posição análoga — “ocupa a mesma função estrutural” —, nunca identidade entre entidades. É o que a comparação de fato estabelece e o que se sustenta sob escrutínio. Dizer “é o mesmo ente” seria outra afirmação, que nenhuma fonte sustenta e que derrubaria o método junto. Categorias distintas permanecem distintas: uma entidade de guia não vira Orixá por ocupar posição análoga a ele.",
  },
  versioning: {
    principle:
      "Toda alteração capaz de mudar um resultado gera nova versão e passa por testes de regressão. Versões antigas não são reescritas: quando uma leitura se mostra errada, nasce uma versão nova que registra o que mudou e por quê.",
    surfaces: [
      { label: "Versão do método", value: PUBLIC_REGENCY_METHOD_VERSION },
      { label: "Estado", value: "Pesquisa aplicada — sem métrica de acurácia publicada" },
      { label: "Camadas versionadas", value: "Cálculo, features, correspondências, decisão" },
      { label: "Registro de mudança", value: "Nova versão a cada alteração de resultado" },
    ],
  },
  evaluation: {
    intro:
      "Uma configuração nova não substitui a anterior por parecer melhor. Ela precisa passar por uma política de promoção declarada, sobre um conjunto de avaliação congelado e identificado por digest — se o conteúdo muda, o digest muda, e a comparação anterior deixa de valer.",
    criteria: [
      "pelo menos 30 rótulos de validação em cada papel obrigatório antes de qualquer comparação valer",
      "nenhuma queda de acerto na primeira posição nem entre as três primeiras",
      "aumento de no máximo cinco pontos percentuais na taxa de abstenção — não se compra acerto encolhendo a cobertura",
    ],
    decisionStates:
      "A decisão técnica tem três estados: evidência insuficiente, não elegível e elegível para revisão cultural. O último não publica nem promove nada — apenas abre a etapa de revisão humana e análise dos erros. Nenhuma aprovação cultural é automatizada.",
  },
  /**
   * Como o acervo de pesquisa é tratado.
   *
   * Descreve o processo e as classes de material, e nunca os títulos. É o mesmo
   * padrão dos cartões de modelo publicados por laboratórios de IA: explica-se a
   * metodologia inteira, as avaliações e os limites, sem enumerar a bibliografia.
   * Aqui isso é dobrado em necessidade — enumerar entregaria o acervo que dá
   * vantagem ao método e exporia obra de terceiro que apenas serviu de insumo.
   */
  corpus: {
    summary:
      "Um acervo extenso de tradições escritas alimenta este método. O que chega até você não é o acervo: é o que restou depois de conferir cada afirmação contra a passagem que a sustenta, descartar o que não se sustentou e contar a evidência por linhagem em vez de por volume. A síntese é nossa, e é ela que o site publica.",
    classes: [
      {
        title: "Escolas praticantes",
        detail:
          "Compêndios doutrinários e material de formação de casas que declaram a própria linhagem. É a parte mais volumosa do acervo — e a que mais engana. Quatro livros de um autor produzem muita página e uma voz só.",
      },
      {
        title: "Tradições cerimoniais escritas",
        detail:
          "Compilações históricas de correspondências e de regras de momento, em edições que divergem entre si. Duas edições do mesmo texto são uma testemunha repetida, não duas testemunhas.",
      },
      {
        title: "Registro institucional e acadêmico",
        detail:
          "Inventários de patrimônio, dossiês de organismos internacionais e artigos revisados por pares. Chegam por fora das escolas praticantes, e é essa distância que transforma coincidência em evidência.",
      },
    ],
    controls: [
      "Achar o arquivo não fecha a lacuna. Nenhuma afirmação entra sem a passagem lida.",
      "Cópia e tradução não confirmam nada. A conta é por linhagem, não por título.",
      "Quando as fontes discordam, o método diz de que tipo é a briga: grafia, posto ou engano de quem escreveu. Erro de autor não vira tradição.",
      "Meia correspondência fica de fora, mesmo quando cairia bem. É o descarte que dá valor ao que sobra.",
      "Verificação automática impede que qualquer referência ao acervo atravesse para uma resposta pública.",
    ],
  },
  limits: [
    {
      title: "Sem hora natal, a leitura encolhe",
      detail:
        "Casas, ângulos e tudo que depende de horário saem de cena. O sistema não preenche a lacuna com estimativa silenciosa: ele trabalha com menos fatores e diz que trabalhou com menos.",
    },
    {
      title: "O método pode se abster",
      detail:
        "Quando a convergência não fecha um papel, ele fica em aberto. Um papel em aberto é informação, não falha — a alternativa seria afirmar com a mesma cara de certeza algo que a evidência não sustenta.",
    },
    {
      title: "Não é confirmação religiosa",
      detail:
        "O resultado é interpretação do mapa pelo método autoral AstroAxe. Não atribui identidade religiosa, não substitui jogo de búzios, iniciação ou a palavra de um sacerdote, e não deve ser lido como diagnóstico de nada.",
    },
    {
      title: "A lista de leitura não é o método",
      detail:
        "O que se confere aqui é o processo, e ele está inteiro nesta página: como a evidência é contada, o que derruba uma afirmação, o que o método se recusa a dizer. Uma bibliografia não responderia nenhuma dessas perguntas.",
    },
    {
      title: "Ainda não há acurácia publicada",
      detail:
        "Publicar percentual de acerto exige população, amostra e protocolo de validação declarados. Enquanto isso não existir, o score expressa aderência ao método, não porcentagem de certeza espiritual.",
    },
  ],
} as const;
