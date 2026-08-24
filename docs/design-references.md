# Referências visuais — NFTmap e Astrarise

**Análise inicial:** 2026-08-19

**Implementação revisada:** 2026-08-21

**Escopo:** contrato de experiência e direção visual do AstroAxe

## Método e limites

As referências foram abertas em Chromium a `1440×1000` e `390×844`. Astrarise foi inspecionado diretamente. No caso do NFTmap, foi possível analisar o registro visual responsivo publicado pelo Awwwards; o domínio original `nftmap.com` não concluiu o carregamento e não deve ser tratado como referência funcional atual.

- [NFTmap — Explore a solar system, Awwwards](https://www.awwwards.com/inspiration/ntfmap-provenance-record-nftmap-buy-yourself-a-planet)
- [Astrarise](https://astrarise.vercel.app/)

Screenshots de trabalho ficaram somente em `/tmp`; não foram incorporados ao repositório nem usados como assets.

## Leitura das referências

### NFTmap

O elemento publicado coloca o sistema solar no centro da interface: fundo quase preto, órbitas concêntricas, Sol luminoso, planetas em escalas distintas e um card ancorado ao corpo selecionado. Navegação e ações ficam nas bordas para preservar o palco central.

**Aproveitável:**

- espaço orbital como estrutura de navegação, não apenas decoração;
- um objeto selecionado por vez, com anotação próxima à origem;
- profundidade produzida por escala, brilho e sobreposição controlada;
- centro visual forte e controles periféricos;
- mandala como instrumento explorável.

**Limites observados:**

- a miniatura mobile reduz a cena inteira até perder legibilidade e área de toque;
- estética preto+ciano e glow aproxima o produto de Web3/jogo espacial;
- tooltip claro sobre cena escura parece um elemento importado se não compartilhar tokens;
- muitos corpos simultâneos competem com a ação principal.

### Astrarise

Astrarise usa uma galáxia Three.js de partículas em tela cheia como hero e suporte para uma narrativa de scroll. Há marca condensada em caixa alta, CTA branco no canto, texto grande sobre a cena e controles que alteram cor, quantidade de partículas, raio, ramificações e aleatoriedade. O projeto declara Three.js, GSAP e Tailwind CSS em sua apresentação.

**Aproveitável:**

- uma única cena generativa memorável como assinatura;
- narrativa editorial que emerge depois do impacto visual;
- sensação de profundidade e resposta direta à interação;
- parâmetros visuais que tornam o universo pessoal, quando ligados a dados reais.

**Anti-patterns visíveis no mobile:**

- o mesmo enquadramento desktop é recortado, não recomposto;
- título e parágrafo ocupam a cena e sofrem clipping na dobra;
- badges flutuantes cobrem conteúdo e reduzem a área útil;
- marca e CTA disputam o topo;
- partículas densas prejudicam leitura, bateria e hierarquia;
- dependência de WebGL deixa pouco valor sem a camada visual.

## Síntese para o Observatório Ritual

AstroAxe deve herdar **a lógica espacial do NFTmap** e **a presença imersiva do Astrarise**, mas não suas identidades. A metáfora não é “viajar pelo espaço” nem “comprar um planeta”: é observar o próprio céu com calma e abrir camadas de significado.

### Elementos-assinatura por momento

**Carta em formação (onboarding):** data, hora e local acrescentam coordenadas legíveis ao instrumento. No cálculo, as marcas resolvem na mandala natal real. Nome personaliza a leitura, mas não finge participar do cálculo.

**Janela de Trânsito (dashboard futuro):** uma mandala tratada como instrumento de observatório. Um meridiano de cobre cruza a roda; ao abrir a leitura, o trânsito principal percorre uma única vez sua órbita e ancora uma ficha editorial com planeta, aspecto, início, pico e fim. Depois da revelação, a cena fica estável.

Cada tela escolhe no máximo um desses gestos. Partículas, shimmer, parallax e sons não devem competir com ele.

### Matéria visual

Usar referências de observação — latão envelhecido, vidro fumê, papel de efemérides, tinta noturna e linhas cartográficas — em vez de “misticismo neon”. A identidade afro-brasileira deve vir de linguagem, conteúdo com autoria e padrões encomendados/aprovados, nunca de glifos sagrados usados como ornamento.

## Tokens de direção

Os valores são ponto de partida e exigem teste de contraste antes de implementação.

### Cor

| Token                |     Valor | Uso                                  |
| -------------------- | --------: | ------------------------------------ |
| `breu`               | `#070A10` | fundo principal                      |
| `azul-atlantico`     | `#123047` | superfícies e profundidade           |
| `nevoa`              | `#D8D3C7` | texto principal                      |
| `cobre-instrumento`  | `#C47A4A` | foco, seleção e CTA primário         |
| `verde-agua-tecnico` | `#68A8A4` | dados, foco secundário e coordenadas |

- Não usar ciano elétrico como cor dominante.
- Cor ligada a Orixá aparece apenas dentro de conteúdo cultural aprovado e não redefine os tokens globais.
- Glow é consequência de foco/seleção, nunca borda padrão de todo card.

### Tipografia

- **Display:** `Anybody Variable`, explorando largura condensada com moderação para títulos de observatório.
- **Leitura:** `Literata`, para narrativa e interpretações longas.
- **Dados:** `IBM Plex Mono`, para graus, duração, engine/config e labels técnicos.
- Títulos não devem ficar permanentemente em caixa alta; usar caixa alta somente em marcações instrumentais curtas.
- Corpo mobile mínimo de `1rem`, entrelinha de `1.5–1.65` e linha de leitura entre 45–72 caracteres no desktop.

### Espaço, forma e grid

- escala espacial: `4, 8, 12, 16, 24, 32, 48, 72, 96`;
- raio instrumental `6px`, cards editoriais `18px`, pills apenas para estados;
- desktop: grid de 12 colunas, palco/mandala em 7 e trilho editorial em 5;
- largura de conteúdo `min(1280px, calc(100vw - 64px))`;
- linhas de órbita e divisores codificam relações reais; não adicionar círculos decorativos sem semântica.

## Layout por breakpoint

### Desktop

```text
┌ marca ───── navegação ───────────── ações ┐
│                                            │
│  mandala / janela de trânsito │ leitura   │
│  palco estável, 7 colunas      │ 5 col.    │
│                                │ evidência │
│                                            │
└ tempo do céu ─ próximos movimentos ───────┘
```

- O canvas pode ocupar `60–72vh`, sem esconder o início do conteúdo.
- Ficha do objeto selecionado fica ancorada quando houver espaço; caso contrário, usa o trilho lateral.
- Navegação, privacidade e ações essenciais continuam DOM/HTML, nunca dentro do canvas.

### Mobile

```text
┌ marca ───────────── menu ┐
│ mandala simplificada     │
│ 42–50vh, foco central    │
├ ficha do trânsito        ┤
│ leitura em fluxo normal  │
│ evidência / ação         │
└ navegação inferior       ┘
```

- Reenquadrar a cena; nunca apenas encolher o desktop.
- Reduzir corpos, partículas e DPR; preservar o objeto relevante.
- Tooltip vira ficha abaixo da mandala ou bottom sheet acessível.
- Tap substitui hover; nenhuma informação depende de gesto oculto.
- Badges, selos e controles de demonstração não flutuam sobre o conteúdo.

## Motion

| Movimento                       | Duração alvo | Regra                          |
| ------------------------------- | -----------: | ------------------------------ |
| revelação da Janela de Trânsito | `900–1400ms` | uma vez, interrompível         |
| entrada de ficha/painel         |  `220–280ms` | opacity + pequeno deslocamento |
| hover/foco                      |  `140–180ms` | sem escala excessiva           |
| troca de planeta/camada         |  `300–450ms` | continuidade espacial          |
| ambiente                        |        lento | pausar fora de viewport/aba    |

- Não usar scroll-jacking.
- Com `prefers-reduced-motion`, mostrar estado final sem órbita animada, parallax ou partículas.
- Limitar DPR do canvas e densidade por viewport/capacidade; o número “200000 partículas” do Astrarise é demonstração, não meta.
- Canvas deve pausar em aba oculta e nunca bloquear input, formulário ou leitura.
- Som é opt-in e não participa do feedback essencial.

## Estado implementado até 2026-08-23

- O onboarding usa palco orbital, entradas em sequência e transições curtas com CSS.
- A camada `celestial-particles.tsx` usa partículas Canvas determinísticas, com limites de 180 no
  desktop e 72 no mobile, alvo de 30 fps e DPR máximo de `1.5`.
- A cena pausa fora do viewport e com a aba oculta. `prefers-reduced-motion` entrega uma composição
  estática.
- Formulário, mensagens, foco e ações permanecem no DOM; a camada visual não intercepta input.
- As composições foram verificadas em `1440×1000` e `390×844`.
- O resultado possui mandala natal real, explorável e ligada aos dados calculados, com ficha
  equivalente no DOM e composição própria para mobile.

## Evolução da abertura em 2026-08-22

- A página inicial passou a usar um palco de viewport inteira, com nebulosa em camadas, até 180
  partículas determinísticas com profundidade e parallax óptico sutil em ponteiros precisos.
- O formulário virou uma superfície de vidro fumê sobre a cena, sem retirar foco, semântica ou
  contraste dos campos.
- No mobile, observação celeste e coleta de coordenadas são momentos consecutivos no scroll, em vez
  de uma miniatura da composição desktop.
- Canvas continua decorativo, limitado a 30 fps e DPR `1.5`, pausando fora do viewport e com a aba
  oculta. Redução de movimento remove avanço em profundidade e resposta ao ponteiro.

## Critérios de aceite permanentes

- A página permanece compreensível e navegável com WebGL, JS, motion ou som indisponíveis.
- Nenhum texto essencial é renderizado dentro do canvas.
- Mobile possui composição própria e não apresenta clipping horizontal a `320px`.
- A mandala mantém alvo de toque, foco visível, alternativa textual e ficha equivalente por teclado/leitor de tela.
- O conteúdo conserva contraste sobre o pior frame possível da cena.
- Uma tela usa no máximo um efeito ambiente e um momento de revelação.
- Performance é medida em dispositivo intermediário real; reduzir densidade é preferível a degradar interação.
- Elementos culturais têm proveniência e aprovação registradas; não são aplicados como textura genérica.

## Evidência normativa aplicada à conta

Na revisão autenticada de 2026-08-23, o desenho foi confrontado com fontes primárias atuais:

- WCAG 2.2, critérios 1.4.10 (reflow), 2.4.11 (foco não obscurecido) e 2.5.8 (tamanho de alvo),
  publicados pelo W3C;
- padrão de diálogo modal do WAI-ARIA Authoring Practices, adotando o elemento `dialog` nativo para
  confinamento de foco, tecla Escape e retorno ao fluxo;
- documentação oficial do Motion para animação de layout e preferência de movimento reduzido.

Consequências no produto: nenhuma coordenada essencial fica em rótulo flutuante sujeito a colisão;
ações destrutivas exigem etapa separada e confirmação digitada; grids recompõem para uma coluna; e
motion nunca é requisito para compreender ou concluir o fluxo.

## Decisão

Adotar as referências como estudos de **espacialidade, foco e coreografia**, não como moodboard cromático. O Observatório Ritual será mais quente, editorial e legível: o céu fornece estrutura; a tradição fornece contexto; a interface fornece calma.

O próximo marco visual é medir frame time e resposta ao toque em dispositivo físico intermediário,
antes de elevar novamente a densidade. A memória de retomada está em `docs/PROJECT_MEMORY.md`.

## Complemento editorial — Astrolink e Personare

**Revisão:** 2026-08-22

As superfícies públicas de [Astrolink sobre a Casa 1](https://www.astrolink.com.br/casa1) e do
[Personare sobre Ascendente e Descendente](https://www.personare.com.br/conteudo/ascendente-descendente-m242633)
foram usadas como referência de arquitetura da informação, não como fonte para copiar identidade,
texto ou componentes. Ambas tratam Ascendente/Casa 1 como parte central do mapa e relacionam o
Descendente à Casa 7; o Personare também organiza a compreensão do mapa por planetas, signos, casas
e aspectos.

O resultado do AstroAxe passa a aplicar essa profundidade por camadas: mandala em uma primeira dobra
dedicada, eixo ASC–DSC explícito, casas numeradas e capítulos editoriais no scroll. A interpretação
continua separada dos dados astronômicos calculados, declara seu caráter simbólico e não imita a
linguagem visual, comercial ou autoral das referências.
