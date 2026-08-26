# Registro de mudanças do cálculo astrológico

## Feedback supervisionado da Tríade v3 — 2026-08-25

- **ANTES:** o resultado não recolhia confirmação, aproximação ou correção conhecida pelo usuário.
- **DEPOIS:** o final da Tríade pergunta se a leitura corresponde e se a pessoa conhece seus Orixás
  de frente, cabeça e costas. Com consentimento explícito, salva respostas dirigidas, predição
  recalculada no servidor, correções, origem da confirmação e versões do método.
- **MOTIVO:** formar um dataset supervisionado para medir acertos e inversões de polaridade em vez de
  ajustar o motor por relatos informais não rastreáveis.
- **IMPACTO:** nova tabela `regency_feedback`, uma entrada atualizável por perfil/método/questionário
  e inclusão no export da conta. O registro é apagado em cascata com o perfil e não é enviado a LLM.

## Tríade de Regências 3.0 com calibração dirigida — 2026-08-25

- **ANTES:** a matriz possuía 25 Orixás elegíveis, mas não incluía Logunan e Egunitá; o resultado
  era calculado imediatamente e sinais próximos podiam favorecer o polo oposto sem autorrelato.
- **DEPOIS:** `regency-matrix-0.5.0-v3-questionnaire-research` reúne 27 candidatos e acrescenta os
  catorze polos das sete linhas descritas no recorte de Rubens Saraceni. Antes do cálculo, sete
  perguntas neutras geram features auditáveis; “ambos” divide a força e “prefiro não responder”
  não produz contribuição. A API aceita somente `POST` com questionário completo.
- **MOTIVO:** distinguir pares simbolicamente próximos — inclusive Ogum e Iansã — e permitir que
  Oxumarê, Logunan e Egunitá participem por evidência explícita, sem confundir presença no catálogo
  com seleção automática.
- **IMPACTO:** o mesmo mapa pode produzir resultado diferente após as respostas. Engine, matriz,
  configuração, questionário e contrato público foram versionados. As respostas não são persistidas
  nem devolvidas; pesos, limiares e correspondências internas continuam apenas no servidor.

## Nomenclatura técnica dos horóscopos — 2026-08-25

- **ANTES:** fallbacks podiam expor IDs internos e nomes ingleses, como `sun`, `true_node` e
  `sextile`, além de produzir artigo gramatical incorreto.
- **DEPOIS:** um catálogo central traduz corpos, pontos e aspectos, escolhe o gênero correto e usa
  fallback seguro. O exemplo reportado passa a ser: “Sol em trânsito forma um sextil com Nodo Norte
  natal. O orbe é de 0.55°, e o aspecto está a 89% do pico geométrico.”
- **MOTIVO:** impedir vazamento de identificadores técnicos e padronizar todos os módulos que narram
  aspectos.
- **IMPACTO:** somente nomenclatura e templates mudam; ângulos, orbes e posições permanecem iguais.

## Contrato público de regências 2.1 — 2026-08-25

- **ANTES:** o contrato público v2 não oferecia retry no estado de falha e continha um disclaimer
  sem acentuação correta.
- **DEPOIS:** `AstroAxe Regências 2.1 — pesquisa aplicada` preserva o mesmo cálculo server-side,
  corrige a apresentação e permite repetir apenas a consulta protegida.
- **MOTIVO:** tornar o módulo recuperável e alinhar sua linguagem ao padrão editorial do site.
- **IMPACTO:** matriz, pesos, seleção e abstenção não mudam. A versão pública e o texto retornado
  mudam; nenhum detalhe proprietário adicional é enviado ao navegador.

## Linguagem de intensidade dos trânsitos — 2026-08-25

- **ANTES:** a proximidade matemática de um aspecto ao pico aparecia como “exatidão relativa”,
  expressão que poderia ser confundida com precisão da interpretação.
- **DEPOIS:** `built-in-transits-2.0.1` apresenta o mesmo valor determinístico como “proximidade
  geométrica ao pico”.
- **MOTIVO:** distinguir medida angular de certeza narrativa ou previsão.
- **IMPACTO:** somente o texto editorial e sua versão mudam; orbe, intensidade calculada, seleção,
  janela temporal e cache astronômico permanecem iguais.

## Método autoral de regências v2 — pesquisa de 2026-08-25

- **ANTES:** o scorer aceitava fatores astrológicos e temporais; a nova coleção local e a tabela
  numerológica 1–16 ainda não possuíam contrato calculável nem independência por família.
- **DEPOIS:** `regency-numerology-0.1.0-research` produz lentes 1–16 e 1–9 separadas;
  `regency-matrix-0.4.0-v2-research` combina claims publicados, derivados e numerológicos; e
  `regency-evidence-graph-0.1.0-research` registra obra, família, escola, confiança e conflitos.
- **MOTIVO:** incorporar o novo estudo sem contar cópias como consenso, misturar algoritmos de
  redução ou apagar divergências entre correspondências.
- **IMPACTO:** scorer, robustez e avaliador aceitam features numerológicas auditáveis. A mudança
  passa a alimentar o módulo autenticado por endpoint server-side. O navegador recebe somente nomes,
  intensidade qualitativa, estabilidade categórica, versão pública e limites; a receita permanece
  fora dos chunks cliente.

## Painel lunar avançado de 2026-08-24

- **ANTES:** o Ciclo Lunar era uma leitura editorial estática de quatro fases, sem progressão
  secundária, mapa de retorno mensal, aspectos lunares atuais ou critério auditável de Lua fora de
  curso.
- **DEPOIS:** `lunar-dashboard-1.0.0` calcula, com instante de referência explícito, a fase natal
  pelo ângulo Sol–Lua, a progressão secundária dia-por-ano, a casa natal da Lua progredida quando a
  hora é conhecida, uma mansão lunar tropical árabe entre 28 divisões e o estado de Lua fora de
  curso. O Retorno Lunar usa `planetary-returns-1.0.0`; trânsitos filtram a Lua a partir da engine
  vigente. A definição operacional de Lua fora de curso é: nenhum aspecto maior exato
  (conjunção, sextil, quadratura, trígono ou oposição) da Lua com Sol, Mercúrio, Vênus, Marte,
  Júpiter ou Saturno antes do próximo ingresso de signo.
- **MOTIVO:** separar relógios natais, progressivos, mensais e horários e tornar cada camada
  reproduzível, em vez de misturar tradições ou apresentar calendário genérico como previsão
  personalizada.
- **IMPACTO:** a Área Lua passa a exigir a cidade atual para casas e ângulos do Retorno Lunar. Sem
  hora natal, a progressão continua calculada, mas sua casa permanece indisponível. Mansões árabes
  tropicais não são tratadas como Nakshatras védicos; eleição lunar é apresentada como tradição
  simbólica, sem recomendação médica, cirúrgica ou garantia financeira.

## Retornos planetários e calendário anual de 2026-08-24

- **ANTES:** o guia anual era uma composição editorial baseada apenas no mapa natal.
- **DEPOIS:** `planetary-returns-1.0.0` calcula o instante exato do retorno solar/lunar por
  efemérides; `annual-sky-calendar-1.0.0` calcula eclipses, visibilidade local, estações retrógradas
  e contatos natais.
- **MOTIVO:** separar o mapa natal permanente dos mapas anuais e mensais e tornar datas e ângulos
  auditáveis.
- **IMPACTO:** a Revolução Solar exige cidade do aniversário e exibe Ascendente, MC, planetas e
  orbe próprios; o mesmo input explícito permanece determinístico.

## Biorritmo com alertas e compatibilidade de 2026-08-24

- **ANTES:** `classical-primary-secondary-2.0.0` oferecia janela de 31 dias e ciclos
  primários/secundários.
- **DEPOIS:** `classical-primary-secondary-alerts-3.0.0` amplia a janela para 61 dias, identifica
  cruzamentos próximos de zero e compara a convergência dos três ciclos entre duas datas.
- **MOTIVO:** entregar visão mensal, alertas de transição e comparação sem atribuir validade médica
  ao método.
- **IMPACTO:** o mesmo par de datas produz resultado diferente por versão; caches e snapshots devem
  incluir a versão 3.

## Horóscopo e Biorritmo editorial de 2026-08-24

- **ANTES:** Biorritmo `classical-cycles-1.0.0` expunha apenas o valor diário de três ciclos; o
  Tempo do Céu dependia exclusivamente de templates publicados e bloqueava datas futuras.
- **DEPOIS:** Biorritmo `classical-primary-secondary-2.0.0` acrescenta uma série determinística de
  31 dias e os ciclos secundários Domínio, Paixão e Sabedoria. O Horóscopo permite navegar até 90
  dias à frente e usa a matriz pré-escrita `built-in-transits-2.0.1` quando não existe um override
  editorial publicado, variando corpo em trânsito, corpo natal, aspecto, orbe e fase.
- **MOTIVO:** transformar valores isolados em instrumentos legíveis, com gráfico, contexto e
  continuidade temporal, preservando cálculo determinístico e textos versionados.
- **IMPACTO:** a mesma data passa a exibir explicações para todos os aspectos selecionados e o
  Biorritmo ganha dados derivados. Nenhuma posição natal é recalculada ou alterada.

## Sinastria editorial ampliada de 2026-08-24

- **ANTES:** a sinastria `major-cross-aspects-1.0.0` comparava somente Sol, Lua, Mercúrio, Vênus e
  Marte, limitava a leitura aos doze aspectos mais exatos e não possuía capítulos para compromisso,
  expansão, transformação, sombra ou propósito.
- **DEPOIS:** a versão `major-cross-aspects-editorial-2.0.0` compara treze corpos e pontos natais,
  incluindo Júpiter, Saturno, Urano, Netuno, Plutão, Quíron, Lilith média e Nodo Norte. Os 36
  aspectos maiores mais exatos alimentam nove capítulos. Cada interpretação combina textos
  editoriais determinísticos próprios do par de corpos, do tipo de aspecto, dos signos e do orbe.
- **MOTIVO:** oferecer ao público leigo uma leitura reconhecível, profunda e específica para cada
  encontro, sem delegar o cálculo nem a interpretação básica a uma geração opaca.
- **IMPACTO:** o mesmo par de mapas pode passar a exibir mais aspectos e novos capítulos. O cálculo
  natal persistido não muda; a alteração afeta somente a seleção e a narrativa da sinastria. A
  versão foi elevada para tornar essa mudança auditável.

## Ampliação de pontos natais de 2026-08-23

- **ANTES:** o snapshot público continha os dez corpos planetários principais. Meio do Céu já era
  calculado, mas MC e Fundo do Céu não possuíam capítulos editoriais; Quíron, Nodo Norte e Lilith
  não integravam o conjunto solicitado ao motor.
- **DEPOIS:** a configuração western-2026-08-23-extended-points calcula treze posições:
  dez planetas, Quíron, Nodo Norte verdadeiro e Lilith média. O Nodo Sul é apresentado como ponto
  derivado exatamente oposto ao Nodo Norte. MC e Fundo do Céu recebem signo, grau e interpretação
  próprios quando a hora natal é conhecida.
- **MOTIVO:** completar o instrumento natal com pontos amplamente usados em leituras contemporâneas,
  preservando distinção entre corpos calculados, pontos matemáticos e ângulos dependentes da hora.
- **IMPACTO:** novos mapas e mapas explicitamente recalculados produzem três posições persistidas a
  mais e alteram configVersion. Snapshots legados com dez posições continuam válidos e legíveis;
  eles não são alterados silenciosamente. Nodo Sul permanece derivado apenas na apresentação.

## Correção de apresentação de 2026-08-21

- **ANTES:** as longitudes eram calculadas em zodíaco tropical, mas os nomes de
  signos exibidos na interface permaneciam em inglês. O resultado visual do
  Ascendente mostrava a longitude absoluta de 0° a 360°.
- **DEPOIS:** signos planetários são derivados deterministicamente da longitude
  e apresentados em português do Brasil. O Ascendente mostra o grau de 0° a
  30° dentro do signo, preservando a longitude e os nomes técnicos originais no
  envelope auditável.
- **MOTIVO:** alinhar a apresentação ao idioma do produto e remover uma unidade
  visual enganosa que fazia uma posição correta parecer incorreta.
- **IMPACTO:** o mesmo nascimento mantém versão, longitudes, casas, aspectos e
  dados persistidos; mudam somente os rótulos visuais e a unidade apresentada
  para o grau do Ascendente.

# 2026-08-24 — `western-editorial-reports-1.0.0`

- **ANTES:** Nodos, Amor, Sexual, Profissional, Revolução Solar e Área Lua exibiam resumos curtos e
  desiguais; as oito fases lunares não formavam um percurso pedagógico completo.
- **DEPOIS:** uma camada editorial pura e versionada transforma posições e cúspides já calculadas
  em capítulos personalizados. A Revolução Solar calculada oferece 20 capítulos (oito funções e
  doze casas); a Área Lua explica as oito fases e destaca a fase natal; os demais módulos conectam
  planetas e casas pertinentes com índice de leitura.
- **MOTIVO:** elevar profundidade e acessibilidade para entusiastas iniciantes sem gerar páginas por
  repetição, copiar concorrentes ou atribuir casas quando a hora natal é desconhecida.
- **IMPACTO:** nenhum valor astronômico mudou. A nova versão altera somente interpretação e
  apresentação; relatórios registram `western-editorial-reports-1.0.0` e continuam dependentes do
  snapshot natal/retorno validado.
