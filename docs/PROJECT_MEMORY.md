# Memória canônica do projeto

## 3 de setembro de 2026 — Em andamento: reescrita completa do Horóscopo Sombrio

- Biblioteca de perfis de sombra por signo criada em .
- Substituído por versão totalmente personalizada que combina perfis de signo, casas e posições planetárias para gerar leituras únicas e satíricas.
- Removidas variáveis não utilizadas (, , agora utilizadas) e função shadowMeaning não utilizada.
- Typecheck e lint passaram sem avisos.

**Status multiagente:** auditoria do módulo iniciada. Agente trabalhando agora em
`src/components/account/astrology-module-panels.tsx`, `src/components/account/transit-reading.tsx`
e arredores; nenhuma alteração de código aplicada até o momento. Não editar esses arquivos
simultaneamente. Próxima gravação aqui será feita ao entrar na implementação.

**Achados iniciais da auditoria:**

- O módulo atual (`ShadowHoroscopeView`) usa só Sol, Lua, Mercúrio, Vênus e Marte; ignora casas,
  aspectos, ascendente, MC, Saturno, Plutão e Netuno.
- O texto atual é genérico, curto e tem tom “integração”, não o tom ácido/humorístico pedido.
- Os trânsitos sombrios (`variant="shadow"`) usam composição pré-escrita por aspecto, mas sem
  variação por planeta/signo nem camadas psicológicas.
- Há dados disponíveis no `ProfileRecord`: planetas com signo/grau/retrogradação, casas (quando
  hora conhecida) e aspectos com tipo/orbe/força.

---

## 3 de setembro de 2026 — freemium, ferramentas cerimoniais e auditoria

**Fronteira do freemium.** O dono definiu que só mapa natal, horóscopo e horóscopo
sombrio são gratuitos, e que gratuito exige conta. `/tempo-cerimonial` e
`/acervo-cultural` seguem abertos a quem não tem conta, porque não guardam dado de
ninguém. O catálogo em `src/lib/access/features.ts` passou a declarar o nível de
cada recurso; `hasPaidPlan` é o único ponto a mudar quando a cobrança entrar.

Exigir conta para o mapa natal encerrou o funil de experimentar antes de assinar.
A sessão de convidado foi removida: com zero perfis órfãos no banco, apagar a
reivindicação em `auth/register` e `auth/login` não deixou nada preso.
`GUEST_SESSION_SECRET` **permanece**, porque serve de chave HMAC para o rate limit
de `geocoding` e `ceremonial/timing`.

**Quatro ferramentas cerimoniais**, todas pagas e reunidas em `/ferramentas`:
buscador de janelas, diretório de correspondências, planejador e tábua operacional.
A camada de orientação saiu do produto — as recusas ficaram, porque declinar não é
orientar.

**Desempenho da varredura.** A primeira versão levava 115 ms por hora planetária, o
que faria um mês levar 83 segundos. Medindo em vez de supor: descobrir nascer e pôr
do sol custa 24,5 ms; posicionar Sol e Lua custa 0,2 ms. Derivar as doze horas de um
segmento do mesmo par de eventos, e deixar `evaluateElections` receber a hora já
resolvida — ela a recalculava uma vez por critério — levou a 2,83 ms por hora.

**Turbopack.** O `build` passava `--webpack` desde o commit de bootstrap, sem motivo
registrado, e o cache corrompia sozinho (`WasmHash._updateWithBuffer`). Turbopack
gera a mesma saída standalone e três builds consecutivos terminam limpos. O sintoma
perigoso não é o build morrer: é o gate de vazamento varrer menos artefato de
repente, que foi como um build parcial quase passou por bom.

**Auditoria de segurança.** Um furo real, aberto por mim: `/api/maps` passou a criar
perfil na conta do titular e continuava sem checagem de origem — CSRF em conta
logada. Fechado, com teste de regressão. Também foram adicionados limites de corpo
às sete rotas de `auth`, que respondem sem sessão.

`npm audit` acusa `mysql2` (alto) via Prisma. Verificado que o pacote está ausente
do bundle standalone e da imagem do container: o projeto usa PostgreSQL e o driver
nunca é carregado. Corrigir exigiria Prisma 8.0.0-rc, e não se troca produção por
release candidate para fechar achado inalcançável.

**Achados em aberto:** não há `Content-Security-Policy` nem `Strict-Transport-Security`.
CSP em Next exige nonce nos scripts inline e quebra a página se feito às cegas; HSTS
pertence à borda TLS, que ainda não existe. Ambos ficam para quando houver ambiente
com TLS.

## Atualização 2026-09-02 — o acervo sai da interface, e a página de tempo ganha o invólucro certo

- **Defeito de layout, meu.** A página de tempo usava `methodology-main` e
  `methodology-header`, classes que **não existem** — zero definições no CSS. O
  invólucro correto é `observatory-shell methodology-shell` com
  `article.methodology-document` e `header.methodology-hero`, como nas demais.
  Copiei o padrão de memória em vez de conferir, e a página saiu sem estilo algum.
- **O acervo saía na interface, e não deveria.** A página de tempo nomeava
  Heptameron, Agrippa, Arbatel e Khan Secretum; o acervo cultural abria título,
  URL e locator por afirmação; e o registro público de correções citava duas
  escolas pelo nome. O `BLUEPRINT` §5.0 já dizia que a proveniência por claim sai
  da interface — o que estava publicado é que contrariava a decisão.
- **A regra passou a ser publicada pelo que pede.** "Lua crescente, leitura ampla"
  entrega a informação inteira; dizer de qual grimório ela saiu entrega a curadoria
  e expõe obra de terceiro. O tipo público não tem mais campo para nome de obra.
- **No acervo cultural a troca foi por classe de evidência**, e não por remoção. A
  afirmação declara se se apoia em fonte primária de comunidade, inventário
  institucional, etnografia ou análise acadêmica. Isso preserva o sinal de
  confiança — e a atribuição a instituição pública protege contra leitura de
  apropriação — sem publicar a bibliografia.
- **O model card ganhou a seção que faltava**, no padrão de cartão de modelo de
  laboratório de IA: descreve as classes de material do acervo e os controles que
  impedem afirmação frouxa, sem enumerar títulos. Explica o processo inteiro e não
  a lista de leitura.
- **Dois achados de processo, ambos meus.** Um servidor `next start` de onze horas
  antes continuou preso à porta 3100 depois de um `kill` que falhou, e todas as
  verificações recentes bateram nele em vez do build novo — foi o que fez o
  vazamento parecer não corrigido. E o vazamento das correções só apareceu porque
  uma jornada varre o **texto renderizado**; nenhum teste unitário o pegaria.
- Por isso os nomes de obra e autor entraram no scanner de vazamento. Nome de
  potência — Michael, Hagiel, Omolu — continua publicável; de qual obra ele veio,
  não. O gate roda contra o build e aprova 165 artefatos.
- Checkpoint: **691 testes passando**; typecheck, lint, formatação, build e gate de
  vazamento limpos; **20 de 20 jornadas E2E** sem stack, em desktop e mobile.

## Atualização 2026-09-02 — três asserções E2E defasadas, encontradas ao rodar tudo

- Rodar a suíte E2E inteira contra servidor de produção real expôs **três
  asserções defasadas em `methodology.spec.ts`**, nenhuma delas causada pelas
  mudanças desta sequência.
- A lista de etapas esperava "Interpretar"; o model card diz **"Extrair"** desde o
  commit `8a36b24`, anterior a tudo que fiz. O texto de acurácia esperava uma
  frase que a página não usa. E a versão do método passou a aparecer em dois
  lugares, o que violava o modo estrito do Playwright.
- **Passaram despercebidas porque E2E exige servidor de pé**, e a suíte não roda
  nos portões rápidos. É uma classe de defeito que só aparece quando alguém
  executa — a mesma lição que já se repetiu cinco vezes nesta sequência.
- As quatro falhas restantes — `authenticated-mvp` e `cultural-archive` — dependem
  de banco com dados publicados e login, e não são executáveis sem a stack. Não
  foram tocadas nem mascaradas.
- Estado E2E: **20 de 20 passando** entre as jornadas que não dependem de stack —
  metodologia, superfícies cerimoniais e mandala natal, em desktop e mobile.

## Atualização 2026-09-02 — retenção, tombstones e as cinco aprovações emitidas

- **Retenção de backup.** `backup-postgres.sh` remove backups além de 30 dias com
  o checksum junto. O filtro é estreito de propósito — só os arquivos que o script
  nomeia, no diretório informado. Uma varredura ampla apagaria o que não devia num
  diretório apontado por engano.
- **Registro de exclusão.** Guarda **que** algo foi apagado e nunca **o que** era:
  tombstone com conteúdo seria guardar o dado que a pessoa pediu para remover, num
  lugar que a exclusão não alcança. A janela de 37 dias é **derivada**, não
  recebida — deixá-la a cargo do chamador permitiria gravar tombstone que expira
  antes do backup correspondente, e aí uma restauração ressuscitaria o registro sem
  que nada apontasse.
- A exclusão de plano grava o tombstone **na mesma transação**. Apagar sem
  registrar deixaria a restauração ressuscitar; registrar sem apagar guardaria
  marca de exclusão que não houve. As sessões em cascata ganham marca própria,
  porque a restauração traz linhas e não o plano como unidade.
- A tabela **não tem cascata** com plano ou sessão, deliberadamente: o tombstone
  precisa sobreviver ao registro que descreve, e uma chave estrangeira em cascata
  apagaria a prova junto com o dado.
- **As cinco aprovações da task 39 estão emitidas.** Cada uma saiu **depois** que o
  controle correspondente passou a existir — foi por isso que três ficaram de fora
  até o código chegar. Aprovar controle inexistente é aprovação vazia, e o registro
  guarda essa cronologia.
- **O que ainda bloqueia a prontidão de release não é mais aprovação**: é o
  checkpoint em ambiente real — migration em staging isolado, ensaio de restauração,
  Sonar e cópia externa criptografada. Nenhum deles é escrevível daqui.
- As migrations `20260902010000` e `20260902020000` **não foram aplicadas**.
  Aplicar é decisão de quem opera o banco.
- Checkpoint: **688 testes passando** e 5 ignorados; typecheck, lint, formatação,
  build de produção e gate de vazamento limpos.

## Atualização 2026-09-02 — portão de idade: atestação, porque verificação não tem via gratuita

- O responsável condicionou implementar à existência de forma 100% gratuita. A
  investigação separou duas coisas que a palavra "verificação" junta.
- **Verificar de fato não tem caminho gratuito.** Documento e selfie, estimativa
  facial de idade e gov.br por convênio custam por consulta; cartão de crédito
  custa e exclui quem não tem. Nenhuma opção livre existe.
- **Declarar e barrar é gratuito**, e foi o que se implementou. Custa zero porque
  é campo, coluna e checagem.
- **O produto não tinha de onde derivar a idade.** `User` guarda só email, senha e
  timestamps; a `birthDate` que existia é de `BirthProfile`, que é o **sujeito do
  mapa** e pode ser outra pessoa — inclusive uma criança para quem o titular
  calcula o mapa. Confundir as duas teria criado um portão que barra a pessoa
  errada.
- A declaração é colhida **quando o titular vai usar o planejador**, e não no
  cadastro. Pedir data de nascimento a quem só quer calcular um mapa coletaria
  dado sem finalidade; quem nunca abrir o planejador nunca é perguntado.
- O texto exibido vive em código e é **versionado**, e o registro guarda a versão.
  Declaração feita sob texto antigo não vale: se o texto mudou, a pessoa concordou
  com outra coisa.
- A idade é contada por componentes de data, não por divisão de milissegundos por
  365,25 — que erra em bissexto e na véspera do aniversário, e aqui um dia decide
  se alguém entra.
- A migration recusa declaração incompleta por CHECK: ou os três campos estão
  preenchidos, ou os três estão nulos. Data sem saber que texto a pessoa viu não
  sustenta nada.
- **Aprovação `adult_access` emitida**, com a ressalva no próprio registro de que
  é atestação e não verificação, e de que adotar verificação real é emitir
  aprovação nova. A prontidão de release continua bloqueada por retenção de backup
  e tombstones, que seguem inexistentes.
- Checkpoint: **681 testes passando**; typecheck, lint, formatação e build de
  produção limpos. A migration `20260902010000` **não foi aplicada** — aplicar é
  decisão de quem opera o banco.

## Atualização 2026-09-01 — aprovações de release: duas emitidas, três recusadas por vazias

- O responsável pediu a lista das aprovações que a task 39 exige, para emiti-las.
  Levantar a lista mudou a resposta: **a maior parte não era aprovável**, porque o
  que seria aprovado não existe.
- **Emitidas.** Governança de dado sensível — guardar planos e sessões cifrados —
  e base legal, declarada como **consentimento colhido no cadastro**.
- **A ressalva vive dentro do registro.** A LGPD trata convicção religiosa como
  dado sensível (art. 11) e para essa categoria o consentimento em regra precisa
  ser específico e destacado, não o aceite geral do cadastro. O responsável foi
  informado e escolheu o consentimento de cadastro. A escolha é dele; o registro
  guarda a ressalva para que revisá-la seja emitir uma versão nova, e não refazer
  a arqueologia da decisão.
- **Não emitidas, de propósito:** retenção de backup, tombstones de exclusão e
  verificação de idade adulta. Busca precisa no código retorna **zero ocorrências**
  de `tombstone` e nenhum portão de idade; `backup-postgres.sh` não tem retenção
  configurada. Aprovar controle inexistente é aprovação vazia, e a prontidão de
  release continua bloqueada pelos três.
- **Lacuna encontrada ao responder:** nenhuma task do roteiro constrói a
  verificação de idade adulta, embora a task 39 a pressuponha resolvida. Está
  registrada como lacuna em vez de descoberta no dia do release.
- **Item riscado da task 39:** "revisão de direitos e aprovação do bundle exato"
  não é aprovável porque não existe bundle desde 26 de agosto e as colunas de
  direitos saíram na migration `20260826140000`. Sobreviveu à reescrita da Wave 6
  porque reenquadrei a Wave 7 apenas parcialmente — corrigido agora.
- O mecanismo é o que a task pedia: valida forma — tipo, escopo, papel, data,
  expiração, revogação — e **não finge validar correção jurídica**. Ausência,
  revogação e vencimento bloqueiam com o mesmo peso, porque tratar "venceu" como
  menos grave que "nunca houve" transformaria prazo em sugestão. As rotas conferem
  a cada requisição, então a aprovação bloqueia ativação de fato.
- Checkpoint: **671 testes passando**; typecheck, lint e formatação limpos.

## Atualização 2026-09-01 — Wave 6 concluída e o executável da Wave 7 entregue

- **Wave 6 fechada (T28–T33).** O grafo de funções entrou em `/metodologia`, a
  ferramenta de tempo ganhou rota própria `/tempo-cerimonial`, os registros de
  prática ganharam cifra e ciclo de vida por dono, e doze jornadas Playwright
  passam em desktop e mobile contra servidor de produção real.
- **Wave 7, o que dava para fazer:** T34 (endurecer o runtime), T37 (gate de
  não-vazamento) e T38 (reconciliar a documentação). **T35, T36 e T39 continuam
  bloqueadas** e não por falta de código: precisam, respectivamente, de ambiente
  de destino, contrato de fornecedor de alertas e aprovações estruturadas do
  responsável. Marcá-las como feitas seria mentira.
- **F1, F2 e F4 rodadas como auditoria.** A F2 achou três lacunas reais nas
  minhas próprias rotas: a rota pública de tempo sem limite de taxa, as rotas de
  plano e sessão lendo corpo sem limite de tamanho apesar de o guard já existir, e
  a redação do logger sem cobrir intenção, notas, observação e desfecho. Todas
  corrigidas.
- **O padrão que atravessou a sequência inteira:** rodar contra dado real derrubou
  suposição minha cinco vezes. O `reconciled: true` do relatório de corpus, os
  scanners que acusavam meu próprio texto de negação, o marcador `family:` que
  casava com `font-family:` do CSS, o contexto de build de 8,1 GB, e a
  justificativa do Compose no `AGENTS.md` que era falsa para este projeto. Nenhuma
  delas apareceria em revisão de código: todas exigiram executar.
- **Um erro de processo que me custou confiança e vale registrar:** encadeei build
  e commit num comando só e commitei sem conferir o resultado. A mensagem afirmava
  build limpo quando o build tinha falhado — por corrupção de cache do webpack, não
  pelo código. A afirmação acabou verdadeira, mas eu não tinha como saber. Portão
  se confere antes de afirmar.
- Estado: **33 commits** à frente de `origin/develop`, sem push. 665 testes
  passando e 5 ignorados; typecheck, lint, formatação e build de produção limpos.

## Atualização 2026-09-01 — o motivo de manter o Compose na raiz estava errado

- A auditoria da task 34 esbarrou numa afirmação do `AGENTS.md` apresentada como
  verificada: mover os arquivos Compose para uma subpasta renomearia o projeto de
  `orixas-mapa-astral` para o nome da pasta e **órfãos todos os volumes**,
  inclusive o PostgreSQL histórico.
- **É falso para este projeto.** `compose.yml` declara `name: astroaxe` na
  primeira linha, e os volumes declaram nome próprio — `astroaxe_postgres18_data`.
  O nome do projeto nunca foi `orixas-mapa-astral`.
- Repeti o teste que a documentação dizia ter feito, agora com o compose **real**:
  copiado para uma subpasta `docker/`, `docker compose config` seguiu reportando
  `name: astroaxe` e `astroaxe_postgres18_data`. Nada seria órfão.
- O teste original de 28 de agosto deve ter rodado sobre um arquivo sem a linha
  `name:` — daí o nome ter derivado da pasta. A observação estava certa; a
  **generalização para este projeto** é que não estava.
- A decisão de manter os arquivos na raiz continua de pé, mas por um motivo mais
  modesto e verdadeiro: é onde o Compose procura o `.env`. Registrar o motivo
  errado é pior do que registrar um motivo pequeno, porque a próxima pessoa
  decide com base nele.
- A entrada histórica de 28 de agosto não foi reescrita. O registro é cronológico
  e o que aconteceu naquele dia aconteceu; esta entrada é a correção.

## Atualização 2026-08-31 — Task 16: o relatório de integridade, e o que ele achou

- `src/domain/ceremonial/corpus-integrity.ts` reconcilia o corpus derivado com o
  inventário do acervo. Função pura: mesmas entradas, mesmo relatório, sem
  relógio, sem disco e sem estado de sessão — é o que permite compará-lo entre
  execuções sem que a diferença seja do ambiente. A agregação do JSONL vive na
  fronteira, em `scripts/corpus-integrity-report.ts`.
- **Executado contra o corpus real: 429 documentos, 29.296 chunks, 16 categorias.**
- **Achado 1 — o corpus não sabe de onde veio.** Os 429 documentos estão **sem
  `sourcePath` e sem `contentHash`**: a derivação de 27 de agosto não preservou o
  vínculo com o arquivo do acervo. A consequência prática é séria e não era
  visível antes: **o relatório não consegue detectar cópia da mesma obra**, porque
  detectar exige hash. Nós _sabemos_ que há três cópias do Lemegeton — foi assim
  que a task 23 as tratou como uma linhagem —, mas isso foi conferido à mão, e não
  há hoje verificação automática que pegue a próxima duplicata.
- **Achado 2 — cinco documentos colidem de título.** O `manifest.json` do corpus
  declara 434 documentos e o relatório agrupa 429 títulos distintos. Título é a
  única identidade que o JSONL carrega, então cinco documentos estão sendo somados
  a outros. Enquanto o hash não existir, a identidade do corpus é o nome do arquivo
  — e nome não é identidade.
- **Achado 3, e este é um defeito meu.** A primeira execução devolveu
  `reconciled: true`. Era falso: não havia inventário e nenhum documento carregava
  caminho de origem, ou seja, **não havia o que reconciliar**. Um booleano é
  incapaz de distinguir "conferi e bate" de "não tive como conferir", e o valor
  cômodo era justamente o que parecia sucesso. Trocado por
  `status: "reconciled" | "gaps_found" | "not_reconcilable"`. Contra o corpus real
  ele responde `not_reconcilable`, que é a verdade.
- O relatório **não** classifica direitos nem sensibilidade. Essas colunas saíram
  do banco em `20260826140000` e o modelo que as exigia foi descartado; recriá-las
  aqui reintroduziria pela porta dos fundos um aparato que o produto decidiu não
  ter.
- **O que fica em aberto, e não tentei resolver de passagem:** repropagar
  `sourcePath` e `contentHash` para os 29.296 chunks exige re-derivar o corpus, e
  isso é decisão do responsável, não efeito colateral de uma task de relatório. O
  relatório existe justamente para que a lacuna seja medida antes de alguém decidir.
- Checkpoint: **621 testes passando**; typecheck, lint e formatação limpos.

## Atualização 2026-08-31 — Wave 6 reescrita: publicar o domínio como obra

- A Wave 6 estava com **texto superado desde 26 de agosto** e era o único bloco do
  roteiro que não podia ser executado como estava. Foi escrita para o modo
  `disabled|public|local`, com bundle filtrado por direitos, rota que servia
  artefato-fonte e proveniência exibida na interface — nada disso existe.
- A reescrita partiu do `BLUEPRINT` §5.0: runtime único, e a separação real é entre
  **insumo** e **obra**. O site publica a obra e nunca o insumo, e a proveniência por
  claim sai da interface, permanecendo registrada internamente para permitir
  corrigir o método quando uma fonte se mostrar errada.
- **O que a Wave passou a ser:** dar superfície ao que as waves 4 e 5 construíram.
  Hoje existem no domínio, verificados e sem nenhuma interface que os alcance,
  horas planetárias, quatro perfis de eleição ligados à fonte, registros de
  entidade, política de orientação segura, o congelamento com o relatório de
  divergências e um grafo de nove funções com 43 atribuições. É código testado que
  o produto não mostra.
- **A regra que passou a governar a Wave inteira:** publica-se o que _nós_
  afirmamos — função, posição análoga, força da sustentação, conflito registrado,
  limite declarado. Não se publica escola, obra, edição nem locator por claim. A
  regra de linhagem é pública e já está em `/metodologia`; as linhagens de cada
  atribuição não são. A task 29 exige que isso seja garantido **por tipo**, e não
  por disciplina de quem escreve o componente.
- A task 30, tempo e eleições, é o maior valor não entregue: o domínio existe
  inteiro desde as tasks 17 e 18 e nenhuma tela o alcança.
- **Uma decisão de produto ficou explicitamente aberta na task 28**, em vez de eu a
  tomar de passagem: se a superfície é seção nova de `/metodologia` ou rota
  própria. O nome `laboratorio-cerimonial` vem do modelo descartado e descrevia
  leitura de fonte; se a rota nascer, precisa de nome que descreva o que ela
  entrega.
- F2, F3 e F4 também carregavam o modelo antigo e foram reenquadradas. A mudança
  que mais importa é a de F4: o adversário deixou de ser "o modo público alcança
  dado local", que não existe mais, e passou a ser passagem literal de obra de
  terceiro, caminho de acervo, locator ou escola de claim aparecendo em resposta
  pública ou artefato de build.
- **Uma lacuna apareceu ao verificar essa afirmação.** Eu ia declarar o roteiro
  inteiro executável e fui conferir: a **task 16 não tinha bloco nenhum**. A
  consolidação de 28 de agosto preservou as tasks abertas com seus critérios, e
  essa ficou de fora — sobrevivia só como a palavra "a reescrever" numa célula de
  tabela. O texto original foi recuperado do histórico do Git e reescrito.
- Duas premissas dela tinham caído. A task pedia FTS5 do `node:sqlite` e dizia
  "no embeddings/external model"; em 27 de agosto o acervo foi vetorizado com
  `BAAI/bge-m3` e a busca semântica passou a viver em `query.py`. O modelo roda
  offline, então a premissa que a task protegia — não vazar corpus para serviço de
  terceiro — continua respeitada; foi a decisão posterior que prevaleceu, e as
  tasks 22 a 27 já foram executadas em cima dela. O que resta da task 16 é o
  **relatório de integridade**, e é só isso que o bloco novo pede.
- Com isso **o roteiro inteiro fica executável**: não resta bloco com texto
  superado nem task aberta sem critério. Waves 1 a 5 concluídas; 6 e 7 abertas e
  escritas contra o que o projeto de fato é.

## Atualização 2026-08-31 — Tasks 24, 25 e 26: a Wave 5 fecha

- **Task 24, Theurgia-Goetia.** O Livro II do Lemegeton está no acervo na edição de
  Benjamin Rowe (1999), conferida contra o microfilme do Sloane MS 2731 do Museu
  Britânico. Ele declara um ofício **coletivo** para os Espíritos Chefes, e foi
  assim que entrou: a atribuição é da classe que a fonte nomeia, não de um
  espírito que ela não singularizou. Categoria `aerial_spirit` para que não sejam
  lidos como os 72 da Goetia — e ainda assim **mesma `family:lemegeton`**, porque
  Goetia, Theurgia e Almadel são três livros de uma compilação, não três
  testemunhas. Entrou junto o Ars Almadel, cujos anjos da Primeira Altitude
  sustentam a geração literalmente.
- **Task 25, e o defeito sistêmico que ela revelou.** O texto olímpico do acervo
  separa a glosa moderna do compilador — "atua em todos os assuntos planetários de
  X" — da citação do grimório. **As cinco atribuições olímpicas repousavam na
  glosa**, e o locator até dizia isso em voz alta, entre parênteses. Conferidas
  contra o Arbatel original, quatro se sustentaram e uma não: o grimório diz que
  Ophiel governa as coisas de Mercúrio, dá espíritos familiares e ensina todas as
  artes, e nada diz sobre abrir, fechar ou ordenar passagem. **Ophiel saiu de
  `path-opening`**, que perdeu uma linhagem. Correção registrada e publicada.
- É o segundo defeito da mesma classe encontrado nesta sequência. O primeiro foi
  `school:trithemius`, herdado de suposição; este foi a glosa de um compilador
  citada como se fosse a fonte. Ambos passaram por muitas revisões sem serem
  vistos, e os dois só apareceram quando alguém foi ler o texto que o locator
  prometia.
- **Task 26.** Categoria `planetary_intelligence`, que é o ponto inteiro da task.
  Hagiel entrou em atração e em geração. Vênus passou a reunir um arcanjo, um
  espírito olímpico e uma inteligência planetária, além dos Orixás, com teste
  provando que as categorias não se fundem. E a mesma obra resolve sozinha a
  variância de Marte, listando "Camael, Madimiel, Martiel, Samael, Zamael" como
  outros nomes de Khamael: ali a fonte declara a variante ortográfica, e não há
  divergência a registrar.
- **O que `generative-waters` acabou revelando.** Entraram nela os anjos do Almadel
  e a inteligência Hagiel, e **nenhum dos dois envolve água**. Saíram dela a Lua
  (elemento água, obras divinatórias), Focalor e Vepar (águas que afogam) e Aratron
  (fecunda sem águas). O rótulo "águas" é da Umbanda; a função que as fontes
  sustentam é a geração e a sustentação da vida que nasce. **Renomeá-la é decisão
  metodológica pendente** — a ser tomada por mérito e com correção registrada,
  nunca de passagem. É a segunda vez que o vocabulário dá esse sinal, depois de
  `affliction-and-cure` na task 22.
- Grafo de `0.6.0-research` para `0.8.0-research`, de 37 para 43 atribuições. Sete
  funções `convergent`, duas `corroborated`, nenhuma `single_school`. Uma mudança
  subiu e outra desceu na mesma versão, que é o comportamento certo de um registro
  que não torce para o próprio produto.
- **Wave 5 concluída.** Checkpoint: **611 testes passando**; typecheck, lint e
  formatação limpos.

## Atualização 2026-08-31 — Task 23: a Goetia entra, e as funções frágeis deixam de ser frágeis

- Cinco atribuições do Lemegeton, todas com o ofício citado literalmente: Marbas
  em aflição e cura, Bune na passagem entre planos, Gusion na adivinhação, Leraie
  no ferro e na guerra, Beleth na atração e concórdia.
- **Quatro exemplares, uma voz.** O acervo tem três cópias do Lemegeton mais a
  edição ilustrada de Crowley e DuQuette. Entram sob uma única `family:lemegeton`.
- A categoria `goetic_spirit` foi acrescentada ao vocabulário do grafo — e só a
  ele. O contrato público `sacredCategorySchema`, do acervo cultural, não foi
  tocado: a categoria nova é vocabulário interno de pesquisa, não classificação
  publicada. Ela existe para que a condensação não funda panteões: espírito
  goético e Orixá podem ocupar a mesma função sem que um vire o outro, e o que se
  afirma continua sendo `analogous_position`.
- **O que mudou de verdade.** As duas funções mais frágeis do grafo deixaram de
  ser sustentadas por uma escola só. **Marbas — "Ele cura e causa doenças" —
  sustenta `affliction-and-cure` nas duas metades**, que é exatamente o que as
  fontes angélicas não faziam: lá, cura e limite do corpo moram em planetas
  distintos. E Bune, que "altera o lugar onde estão os mortos", sustenta
  `passage-between-planes`. Nenhuma função continua `single_school`.
- A corroboração é honesta: um grimório solomônico do século XVII e a Umbanda do
  século XX não se copiaram. E ela responde parcialmente à dúvida levantada na
  task 22 — o vocabulário de funções talvez não seja tão recortado pela Umbanda
  quanto pareceu, já que a Goetia reúne aflição e cura na mesma potência.
- **A exclusão que mais ensina, e que é o caso exemplar do erro de autor.** Bael
  não entrou em `generative-waters` apesar de esta tradução o chamar "senhor da
  tempestade e da fecundidade". Isso não é ofício goético: é o tradutor sobrepondo
  Baal, o deus cananeu, ao Bael do grimório — cujo ofício declarado na mesma frase
  é tornar invisível. Codificá-lo daria estatuto de tradição a um deslize de
  tradução, que é precisamente o que o registro de divergências passou a existir
  para separar.
- Também ficaram de fora Focalor e Vepar, que governam as águas para afogar homens
  e naufragar navios — domínio sobre um elemento não é a função que aquele
  elemento sugere, como já valera para a Lua —, e Buer, que "remedia os
  destemperos" sem impor o limite do corpo, a mesma metade solta que barrou Phul e
  Aratron.
- Grafo de `0.5.0-research` para `0.6.0-research`, de 32 para 37 atribuições. É a
  **primeira vez que o congelamento registra aumento de convergência**; as duas
  anteriores foram neutras. Checkpoint: **609 testes passando**; typecheck, lint e
  formatação limpos.

## Atualização 2026-08-31 — por que as fontes divergem, e como o grafo passou a dizer isso

- A pergunta que originou esta entrada é boa e o registro anterior não a
  respondia: **muitos autores simplesmente erram nas atribuições**, e um grafo
  que só marca "estas duas colidem" empresta a mesma autoridade ao engano e à
  tradição.
- **Primeiro, verifiquei se a divergência de Vênus era real ou artefato meu.** Eu
  a havia registrado a partir de uma única linha de tabela OCRizada. Fui ao texto:
  as colunas de Inteligências (Agiel, Jophiel, Graphiel, Nakhiel, Hagiel, Tiriel,
  Malka) e de Espíritos (Zazel, Hismael, Bartzabel, Sorath, Kedemel,
  Taphthartharath, Schad) estão todas corretas e alinhadas nas sete linhas. A
  tabela não está torta; `Uriel` está mesmo na coluna de arcanjo de Vênus.
- **Depois, se era erro da fonte.** Não é. Rankine e d'Este põem Uriel no posto de
  forma deliberada e consistente em **quatro lugares independentes** da obra: as
  correspondências de Vênus, a hierarquia planetária da p. 84, "As Criaturas
  Espirituais de Vênus" da p. 92 — onde dizem "Uriel, também conhecido como Auriel
  ou Oriel, é o Arcanjo de Vênus **e da Terra**" — e a tabela hebraica da p. 182.
- **O detalhe decisivo:** naquela tabela hebraica, a coluna de Vênus traz **Uriel e
  Anael juntos**. Eles conhecem Anael e ainda assim atribuem a Uriel o posto de
  arcanjo. Não é ignorância da alternativa; é outro esquema de postos.
- Do outro lado, Dalton usa `Anael` na tabela planetária e `Haniel` na oração de
  sexta-feira. Essas duas **são grafias de um mesmo nome** e não constituem
  divergência nenhuma.
- **Três coisas diferentes estavam sendo tratadas como uma só:** variante
  ortográfica, disputa de posto entre esquemas coerentes, e erro de autor.
  `conflictsWith` dizia _que_ havia colisão e nunca _como_.
- Por isso o grafo ganhou `divergences`, com `kind` em quatro valores —
  `name_variant`, `rank_scheme`, `competing_scheme`, `internal_inconsistency` —,
  explicação em prosa, locators e o campo que mais importa,
  `functionRemainsStable`. **O schema passou a recusar conflito sem divergência que
  o explique**, e a exigência vale para todo conflito futuro, não só para este.
- A divergência de Vênus ficou classificada como `rank_scheme`, com cinco locators.
- **O achado que vale para o método inteiro:** as duas escolas **concordam sobre a
  função** — Vênus é atração, beleza, união e concórdia nas duas — e discordam só
  sobre qual nome ocupa o posto. A função permanece estável sob a divergência. É a
  demonstração mais forte até agora de que condensar por função sobrevive a
  disputas de nome que derrubariam qualquer síntese feita por identidade.
- A regra nova pegou três fixtures existentes que declaravam conflito sem
  explicá-lo, inclusive a fixture adversarial da própria task 21. Todas passaram a
  declarar a natureza da colisão.
- Grafo de `0.4.0-research` para `0.5.0-research`. Nenhuma contagem de convergência
  mudou. Checkpoint: **608 testes passando**; typecheck, lint e formatação limpos.

## Atualização 2026-08-31 — Task 22: a tradição angélica entra na gramática comum

- A task foi executada no enquadramento novo da Wave 5: o entregável não é um
  workspace angélico isolado, é **a contribuição daquela tradição para o grafo de
  funções**. Cinco atribuições novas, todas com passagem lida no texto, nenhuma
  escrita de memória.
- **Duas escolas, uma linhagem.** _Alta Magia Angelical_, de Frater Dalton R.F
  (O.G.B), e _Mágica Planetária Prática_, de David Rankine e Sorita d'Este
  (Avalonia, 2007), são escolas distintas — outros autores, outro país, outro
  século de publicação — e ainda assim entraram na **mesma** `family:renaissance-ceremonial`.
  Os próprios Rankine e d'Este se descrevem trabalhando "com base na pesquisa de
  material de origem", "firmemente enraizado na tradição": transmitem a linhagem,
  não a fundam. Somaram testemunho e não somaram convergência, que é exatamente
  para isso que escola e família são campos separados.
- **Defeito encontrado e corrigido: `school:trithemius` não era sustentado pela
  obra.** A bibliografia declarada de _Alta Magia Angelical_ (p. 194) traz
  Vacchiano, David Goddard, MacGregor Mathers, Vitor Sanches, Sistemagia e Ordem
  Lótus Negro. Trithemius não aparece em lugar nenhum; Agrippa aparece uma única
  vez, de passagem, numa lista de autores que tratam do círculo mágico — não como
  fonte das correspondências. A escola passou a `school:dalton-alta-magia-angelical`,
  pelo autor que a obra declara, e a correção está registrada em
  `method-corrections.ts`, portanto publicada em `/metodologia`.
- A **família continuou** `renaissance-ceremonial`, deliberadamente: as Clavículas
  de Mathers colocam a obra a jusante do mesmo fluxo solomônico, e dar-lhe família
  própria criaria uma segunda linhagem independente onde há transmissão da mesma.
  Como era a única obra naquela família, a correção **não mexeu em nenhuma
  contagem** — mudou só a verdade do rótulo.
- **O primeiro conflito real do grafo.** Dalton põe `Anael` na tabela planetária e
  `Haniel` na oração de sexta-feira, variantes de um mesmo nome. A tabela
  sefirótica de Rankine e d'Este põe `Uriel` em Netzach. Haniel e Uriel não são
  variantes um do outro: as fontes discordam sobre qual potência ocupa a atração e
  a concórdia. Ficou registrado como conflito. Até aqui o campo `conflictsWith`
  existia sem nenhum dado real o exercendo.
- **O que ficou de fora, e por quê.** Cassiel/Saturno tem "obras de maldição e
  morte" e tanatologia, sem nenhuma cura — que a mesma tabela dá ao Sol e a
  Mercúrio. Phul e Aratron, em Rankine e d'Este, fazem o contrário: curam e
  prolongam a vida sem impor limite. `function:affliction-and-cure` pede as duas
  metades, e cada fonte sustenta uma. Nenhum entrou.
- **A observação que isso produziu, e que importa mais que as atribuições:** o
  material cerimonial **separa o que a função reúne**. Aflição e cura são uma
  potência só em Omolu e moram em planetas distintos nas fontes angélicas. Isso é
  sinal de que o vocabulário de funções pode estar recortado pela Umbanda. Revisá-lo
  é decisão metodológica própria, a ser tomada por mérito — nunca um ajuste para
  acomodar fonte.
- Também ficaram de fora `function:generative-waters` (a Lua é de elemento água,
  mas suas obras na tabela são divinatórias, e elemento não é função) e
  `function:passage-between-planes` ("projeção astral" é o que o operador faz sob
  aquele planeta, não afirmação de que a potência governa a passagem). E
  `_texto_magia_angelical_simples`, material de apoio de videoaula sem fontes
  declaradas: identificável não basta.
- Grafo de `0.3.0-research` para `0.4.0-research`, de 27 para 32 atribuições, e
  **nenhuma força de convergência mudou** — seguem seis `convergent`, uma
  `corroborated` e duas `single_school`.
- **O portão da task 21 funcionou na primeira vez em que foi exigido.** O
  congelamento quebrou sozinho ao ver a versão e a contagem mudarem, e obrigou ao
  registro ANTES/DEPOIS/MOTIVO/IMPACTO antes de aceitar o novo estado. Foi
  construído na sessão anterior e cobrou na seguinte.
- Checkpoint: **606 testes passando** e 5 ignorados; typecheck, lint e formatação
  limpos.

## Atualização 2026-08-31 — Task 21: congelamento do domínio e comportamento diante de conflito

- `src/domain/ceremonial/domain-freeze.ts` congela as cinco superfícies
  determinísticas do domínio cerimonial: eleições, política de orientação, hora
  planetária, variantes de fonte e discriminantes de sistema. Cada superfície tem
  fingerprint próprio além do global, porque um congelamento que só diz "mudou"
  obriga a caçar a mudança; este diz **onde**.
- O fingerprint cobre o **par entrada/saída**, não só a saída. Se apenas a saída
  entrasse, duas fixtures diferentes que por acaso produzem o mesmo resultado
  ficariam indistinguíveis, e trocar uma fixture passaria despercebido.
- `frozenDomainVersions` reúne as sete versões que os módulos declaram, e o teste
  as escreve literalmente. Alterar qualquer saída do domínio quebra nesse ponto, e
  a correção é registrar `ANTES/DEPOIS/MOTIVO/IMPACTO` e subir a versão — nunca
  reescrever o número esperado até o verde voltar.
- `createSourceCoverageReport` mede obra, edição, entidade, correspondência com
  locator e completude de timing, e expõe `collapsedWorkGroups`: as famílias que
  contribuíram com mais de uma atribuição para a mesma função. É a repetição de
  linhagem tornada visível — aquelas obras somam material, não somam concordância.
- `createDomainConflictReport` **não tem campo para vencedor, média ou resolução**.
  A ausência é o desenho: conciliar ali apagaria exatamente o dado que interessa.
  Um perfil que proíbe e outro que permite o mesmo instante é informação sobre as
  fontes, não ruído.
- **O congelamento achou o que a task só previa como hipótese.** A repetição de
  linhagem existe no grafo real, não apenas na fixture adversarial:
  `function:passage-between-planes` reúne duas atribuições e **uma única família**,
  ambas de Saraceni, e por isso permanece corretamente `single_school`. A regra de
  contar por linhagem já estava impedindo uma convergência falsa sem que ninguém
  tivesse verificado esse caso em particular.
- **Dois desvios do texto da task, ambos deliberados.** Ela pede "all five system
  discriminants", mas `workspaceKindSchema` tem **seis** desde a task 19 —
  `AFRO_DIASPORIC` entrou depois de o roteiro ser escrito. O congelamento cobre os
  seis, e o teste falha se um sétimo aparecer sem golden. E a evidência sanitizada
  não virou arquivo JSON: o diretório de evidências foi removido na consolidação de
  28 de agosto, então o relatório vive como asserção de teste e como linha no
  índice de evidências.
- Um defeito encontrado pelo próprio teste: a fixture chamada
  `moment:sem-longitudes` fazia o scanner de vazamento acusar a palavra
  "longitude" dentro do relatório publicável. Não era vazamento — era o nome da
  fixture descrevendo o caso pela palavra errada. O scanner ficou; a fixture virou
  `moment:lua-desconhecida`.
- `canonicalize` estava duplicada: era função privada de `dataset-freeze.ts` e
  seria copiada de novo aqui. Virou `src/domain/canonical-json.ts`, e
  `dataset-freeze.ts` passou a importá-la. A implementação é idêntica, então os
  fingerprints do dataset de calibração não mudaram.
- Checkpoint: **604 testes passando** e 5 ignorados; cobertura do código novo em
  96,46% de statements e 94,54% de branches; typecheck, lint e formatação limpos.
  Com isso a Wave 4 fecha e o ponto de retomada passa a ser a Wave 5 (tasks 22-26).

## Atualização 2026-08-31 — o trabalho de 27 e 28 de agosto entrou no Git

- Cerca de 130 arquivos estavam há três dias fora do versionamento: a consolidação
  documental inteira, a reestruturação de pastas, os módulos novos das tasks 17-20
  e o primeiro verbete. Foram treze commits temáticos, na ordem em que o trabalho
  aconteceu: reestruturação, corpus, T17, T18, T19, T20, grafo de funções, model
  card, símbolos, correção do som ambiente, primeiro verbete, consolidação
  documental e o artefato do `next dev`.
- **A documentação foi commitada por último, de propósito**, porque descreve o
  código que a precede nos commits anteriores.
- A migration `20260826020000`, já aplicada, aparece com uma linha alterada. É só
  um comentário — `docs/backup-restore.md` virou `docs/OPERATIONS.md`. Nenhum SQL
  mudou, e isso está dito na mensagem do commit para que a auditoria F1 não
  tropece no que parece ser edição de migration aplicada.
- Duas derivas de documentação foram corrigidas junto: `compose.ingest.yml`
  apontava para `docs/ceremonial-ingest.md`, que não existe mais, e o cabeçalho de
  `IMPLEMENTATION_STATUS.md` dizia 26 de agosto com conteúdo de 28.
- `.planning/` voltou a existir com 220 KB de telemetria e templates, regenerado
  por hooks depois de a memória registrar sua remoção. Continua gitignored.
- **Não houve push.** `develop` está quinze commits à frente de `origin/develop`.

## Atualização 2026-08-28 — auditoria de proveniência externa concluída

- A afirmação anterior de que Agrippa, Abimbola e Prandi haviam simplesmente
  “deixado a fila” era prematura: localizar texto não encerra a cadeia de
  verificação. A auditoria atual separa autenticidade da edição, integridade da
  passagem, identidade da entidade e aderência à função estrutural.
- **Abimbola foi confirmado nesta etapa.** O fac-símile de 1997 identifica a
  obra e o autor, e seu capítulo I declara explicitamente que `Ifá` e
  `Òrúnmìlà` nomeiam a mesma divindade, embora `Ifá` também nomeie o sistema de
  adivinhação (p. 3 da edição; p. 10 do PDF). Assim, as passagens seguintes
  sobre sabedoria, conselho e consulta sustentam a entidade e a função usadas
  no grafo. O registro da reedição também foi confrontado com Google Books e o
  original de 1976 com WorldCat.
- **Prandi permanece sustentado, mas em escopo estreito.** O PDF está no domínio
  institucional do próprio autor na USP e a p. 503 diz somente que Exu guarda a
  fronteira do além. Isso autoriza a dimensão de limiar da pergunta “abre,
  fecha e ordena a passagem entre os planos”; não autoriza, isoladamente, uma
  tese geral de que Exu “abre caminhos”.
- **Agrippa foi confirmado nesta etapa.** A passagem da transcrição de Joseph
  H. Peterson foi confrontada com a imagem da p. 280 da edição inglesa de 1651
  (scan da Michigan State University, também catalogado pela University of
  Pennsylvania); a mesma edição possui fac-símiles institucionais na Library of
  Congress e no CESIMA/PUC-SP. A página traz literalmente dignidades, condição
  afortunada e poderosa, regência do dia, hora e figura do céu. O perfil segue
  corretamente `unavailable` enquanto o motor não computar todos esses itens.
- **Bascom foi parcialmente fechado com texto primário autenticado.** A edição
  digital da Indiana University Press no JSTOR expõe a introdução e o capítulo
  III de _Sixteen Cowries_. Bascom adverte que os versos variam entre cultos e
  registra que, no corpus de Salakọ, Òrìṣàlá controla os dezesseis búzios. A nova
  atribuição é deliberadamente `school:salako-igana`: não transforma um corpus
  localizado em regra yorùbá universal.
- **Juana Elbein foi localizada, mas não encaixada.** Um scan repostado pôde ser
  autenticado por frontispício e ficha catalográfica contra Google Books,
  Smithsonian e UFBA. As passagens recuperadas definem Èṣù como princípio
  dinâmico, de comunicação e individualização; nenhuma das nove perguntas
  estruturais atuais formula essa função. Empurrá-la para “abertura de caminho”
  seria um falso positivo, portanto nenhum dado entrou.
- **Verger continua aberto.** BnF, IFAN, Google Books, Edusp e a resenha de Roger
  Bastide no Persée confirmam obra, edição, estrutura e importância, mas a busca
  não encontrou fac-símile/texto primário acessível com passagem verificável.
- O grafo `regency-function-graph-0.3.0-research` termina esta auditoria com **9
  funções e 27 atribuições**: seis `convergent`, uma `corroborated` e duas
  `single_school`. O teste dirigido possui 16 casos e passou.
- Checkpoint completo posterior à auditoria: **589 testes passando** e 5
  ignorados; cobertura 86,65% de statements, 72,95% de branches, 89,22% de
  funções e 88,76% de linhas; typecheck, lint, formatação e build de produção
  passaram. Nenhum commit foi criado.

## Atualização 2026-08-28 — Task 20: orientação acionável separada do arquivo

- `src/domain/ceremonial/guidance-policy.ts` introduz a política pura e
  versionada `ceremonial-guidance-policy-0.1.0`. Ela recebe apenas categoria,
  alvo e operação estruturados; texto livre não entra na decisão nem pode ser
  repetido numa recusa.
- Criação, atualização e exportação passam pela mesma função. Categoria ausente
  ou desconhecida falha no schema, em vez de assumir intenção segura.
- Objetivos de estudo, reflexão, memória e rotina pessoal recebem checklists
  curtos e limitados. Coerção, violência, autolesão, sacrifício ou ferimento,
  ilegalidade e promessas médicas ou financeiras retornam recusas e categorias
  de ajuda tipadas. Alvo não consentinte é recusado antes de gerar checklist.
- A visualização de fonte histórica possui contrato próprio,
  `archival_source`, com sistema, edição, locator e aviso de que descrição da
  fonte não é orientação AstroAxe. A política não reescreve nem censura o
  artefato histórico.
- Ainda não existem APIs de planner no produto. Quando forem criadas, a boundary
  deve classificar a intenção em categoria fechada e chamar esta política em
  `create`, `update` e `export`; aceitar prompt arbitrário como categoria seria
  contornar o contrato.
- Teste direcionado: 14 casos cobrindo as três operações, todas as recusas,
  consentimento, input adversarial sem eco, fail-closed e separação do arquivo.
  Checkpoint completo: **589 testes passando** e 5 ignorados; cobertura 86,71%
  de statements, 73,09% de branches, 89,30% de funções e 88,80% de linhas;
  typecheck, lint, formatação e build de produção limpos.

## Atualização 2026-08-28 — Agrippa, Abimbola e Prandi deixam a fila de fontes inacessíveis

- A edição inglesa de 1651 do livro II de Agrippa foi localizada integralmente.
  Os capítulos XXIX–XXX exigem que o planeta correspondente à operação esteja
  dignificado, afortunado e poderoso, governando o dia, a hora e a figura do céu.
  O quarto perfil de eleição foi adicionado com locator nas páginas 279–281.
- O perfil de Agrippa **não produz falso `matched`**: o motor já observa regência
  de dia e hora, mas ainda não calcula todas as dignidades e condições da figura
  exigidas pela fonte. Esse requisito fica `indeterminate` e o perfil permanece
  `unavailable` até o domínio suportá-lo.
- O novo tipo de condição dependente do planeta da operação e o requisito-fonte
  não computável elevam schema e engine de eleições de 0.1.0 para 0.2.0.
- Uma edição integral aberta de Wande Abimbola foi localizada. As páginas 9–10 de
  _Ifa: An Exposition of Ifa Literary Corpus_ sustentam Ifá como sabedoria,
  conselho, mediação e adivinhação. A atribuição entrou como família independente
  da UNESCO.
- O trecho oficial de _Mitologia dos Orixás_ disponibilizado pelo próprio Prandi
  na USP situa Exu como guardião da fronteira do além (p. 503). A passagem permite
  registrar Èṣù/Exu Òrìṣà na função de limiar sem repetir a ambiguidade entre
  Òrìṣà e entidade-guia encontrada no artigo de geodiversidade.
- O grafo agora possui **9 funções e 26 atribuições**: cinco `convergent`, duas
  `corroborated` e duas `single_school`. Permanecem sem texto integral aberto e
  verificável Verger, Juana Elbein e Bascom.
- Checkpoint: **575 testes passando** e 5 explicitamente ignorados; cobertura
  86,64% de statements, 73,05% de branches, 89,26% de funções e 88,74% de
  linhas. Typecheck, lint, formatação e build de produção passaram.

## Atualização 2026-08-28 — Erros resolvidos e pesquisa em fonte primária

### O flake não era do teste

`ambient-sound-control.test.tsx` falhava de forma intermitente com "expected 3
times, got 4". Eu havia registrado como vazamento de estado entre arquivos. Estava
errado: **era defeito do componente.** Em `toggle()`, ao desativar, o
`setEnabled(false)` só roda depois do `await playTone(...)`, e a remoção do
listener global depende da limpeza do efeito, que roda depois da pintura. Nessa
janela o rótulo já dizia "Ativar" e um clique **ainda tocava** — som que a pessoa
acabara de desligar.

A correção é um `enabledRef` que muda no mesmo tick do clique e é lido pelo
listener; o efeito passou a registrar o listener uma vez só. Verificado com 20
execuções isoladas e 3 execuções da suíte completa, todas verdes.

### Heptameron: perfil escrito a partir da fonte primária

Com autorização para pesquisar fora do acervo, o texto do Heptameron em
esotericarchives.com deu a regra que o corpus local não tinha: seção IX, «Of the
manner of working» — _"Let the Moon be increasing and equal, if it may then be
done, and let her not be combust."_ Virou o terceiro perfil de eleição.

A condição lunar passou a aceitar **conjunto de fases** em vez de uma só. As
fontes falam em "Lua crescente" e "depois da combustão", que abrangem várias das
oito fases do motor lunar; forçar fase única distorceria a regra para caber no
tipo.

### Os dois que continuam sem perfil, e por quê

- **Agrippa:** os capítulos xxix e xxx do livro II, que tratam do momento da
  operação, **não constam da digitalização pública** de esotericarchives.com —
  aparecem só no índice. A versão que circula em _The Magus_, de Barrett, é plágio
  de Agrippa e não serve como fonte.
- **Ars Paulina:** o texto existe, mas sua regra **não é de eleição**. Ela manda
  observar _"the time of the years Day and hour that you call the Angells"_ e
  construir o selo para aquele dia e hora — é regra de construção vinculada à hora
  escolhida, não critério para escolhê-la. Forçá-la a virar perfil deturparia a
  fonte.

Os dois motivos estão em `electionProfileGaps`, cobertos por teste. São
qualitativamente diferentes: um é falta de texto, o outro é regra de outra
natureza.

### Glifo de Júpiter

Refeito com arco explícito (`A`) em vez de bezier. As três tentativas anteriores
com curva de controle saíam angulares em tamanho pequeno. Agora lê como o glifo
tradicional: arco superior, haste à direita e barra inferior.

## Atualização 2026-08-28 — Ketu/Nagô e Ifá por fonte primária externa

- Com autorização para pesquisar fora do acervo, duas fontes abertas e citáveis
  entraram no grafo de funções, ambas **independentes** das escolas praticantes
  já presentes:
  - **UNESCO**, Patrimônio Cultural Imaterial (2008), dossiê do sistema de
    adivinhação Ifá: _"the deity of wisdom and intellectual development"_. Criou
    `function:divination-and-counsel` com Òrúnmìlà e **fez Ifá entrar no grafo**
    pela primeira vez.
  - **Mercator/SciELO v. 23 (2024)**, Ferreira et al., «Simbolismo da
    Geodiversidade nas Religiões Afro-Brasileiras», Tabela 2: _"Ogum é o
    responsável pelos minerais, tendo o Ferro, Aço e Manganês"_. Levou
    `function:iron-and-war-craft` de três para **quatro linhagens
    independentes**, agora incluindo uma via acadêmica.
- **O que deixei de fora, de propósito.** A mesma tabela do artigo descreve Exu
  como "aquele que abre e fecha caminhos", que casaria com `function:path-opening`
  quase palavra por palavra. Não codifiquei: o artigo trata "religiões
  afro-brasileiras" como um bloco e **não distingue** o Exu Òrìṣà de Ketu/Nagô da
  entidade-guia de Umbanda e Quimbanda. A taxonomia deste projeto exige a
  distinção, e escolhê-la por conta própria seria decidir pela fonte o que ela não
  decidiu. O motivo está no docblock de `function-graph-data.ts`.
- Também ficaram de fora Xangô (o artigo o liga à rocha e à pedreira, não à
  expansão e à sentença), Omolu (interior da Terra, não aflição e cura) e Oxum
  (águas doces, não atração e concórdia). As citações são boas, mas descrevem
  domínios geográficos, não as funções que o vocabulário define.
- **O que continuava bloqueado naquele ponto:** Prandi, Verger, Juana Elbein, Abimbola e Bascom
  seguem sem texto acessível. Britannica, Smithsonian e Metropolitan Museum
  recusaram a requisição com 403 e 429, e não há digitalização aberta dessas obras
  que eu tenha encontrado. Ketu/Nagô fica com cobertura fina até que o acervo as
  tenha.
- Estado do grafo naquele checkpoint: **9 funções**, das quais cinco `convergent`, uma
  `corroborated` e três `single_school`. A entrada posterior de Abimbola atualiza
  esse total conforme o bloco acima.

## RETOMADA — estado em 31 de agosto de 2026

Leia este bloco primeiro. As entradas abaixo dele são o histórico, da mais
recente para a mais antiga.

**Portões:** 604 testes passando e 5 ignorados; typecheck, lint e formatação
limpos. O trabalho de 27 e 28 de agosto foi commitado em 31 de agosto, em treze
commits temáticos; `develop` está quinze commits à frente de `origin/develop` e
**não foi feito push**.

**Documentação:** cinco documentos em `docs/`, um plano só. `AGENTS.md` é a porta
de entrada e traz o índice e a ordem de leitura. Não crie um sexto documento.

**Onde parei, por prioridade:**

| Frente                     | Estado                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1.1 — condensar tradições | Grafo com **9 funções e 43 atribuições**. Adivinhação reúne UNESCO, Abimbola e o corpus localizado de Salakọ em Bascom; Prandi sustenta Exu Òrìṣà no limiar; Ogum/ferro possui via acadêmica. **Cobertura ainda fina:** Verger segue sem passagem primária acessível; Juana Elbein foi autenticada, mas os trechos recuperados não cabem nas funções atuais sem forçar o vocabulário. |
| P1.2 — escrever a síntese  | Primeiro verbete publicado e verificado em banco real. É trabalho contínuo, um verbete por vez.                                                                                                                                                                                                                                                                                       |
| P1.3, P1.4, P1.5, P1.6     | Feitos. O glifo de Júpiter já foi refeito; permanece a ampliação gradual do conjunto de selos fundamentados.                                                                                                                                                                                                                                                                          |
| Wave 4 do roteiro          | **Concluída.** T18 tem quatro perfis sustentados — Agrippa, Arbatel, Khan Secretum e Heptameron. Agrippa fica `unavailable` enquanto requisitos celestes não forem computáveis; Ars Paulina permanece fora por não conter regra de eleição. T21 congelou as cinco superfícies determinísticas e o comportamento diante de conflito.                                                   |
| Wave 5                     | **Concluída** (T22–T27). O ponto de retomada passa a ser a Wave 6, cujo texto precisa ser reescrito antes de executar.                                                                                                                                                                                                                                                                |
| Wave 6                     | **Reescrita em 31 de agosto** contra a arquitetura atual. Deixou de ser \"entregar os dois modos\" e passou a ser dar superfície ao domínio das waves 4 e 5, que existe verificado e sem nenhuma interface. Aberta e executável.                                                                                                                                                      |

**A regra que mais importa neste projeto:** sustentação se conta por linhagem, não
por obra. Quatro livros do mesmo autor são uma voz. Foi assim que se descobriu
que quatro das obras mais presentes do acervo são todas de Rubens Saraceni.

**Nunca escreva claim sem a passagem que a sustenta.** As três obras de
referência ainda inacessíveis permanecem em aberto exatamente por isso. Ars
Paulina não é uma lacuna de passagem: o texto foi localizado, mas sua regra é de
construção vinculada à hora, não de eleição. Ficar em aberto ou fora do tipo é o
comportamento correto quando a fonte não autoriza a modelagem.

## Atualização 2026-08-28 — Reconciliação com o roteiro `.omo`

- **As sessões de 27 e 28 de agosto não consultaram `docs/`.** A execução
  seguiu a fila P1 de `docs/IMPLEMENTATION_STATUS.md`. O trabalho é real e está
  verificado, mas nasceu sem número de task e sem as mensagens de commit que o
  roteiro declara. Isso foi corrigido no próprio roteiro, não escondido.
- O que encaixa onde: o corpus vetorizado e sua higiene estendem a Wave 3 além
  das tasks 12-14; `structural-functions.ts`, `function-graph.ts` e a condensação
  são o **substrato da Wave 5**; os testes de convergência por linhagem e de
  posição análoga **satisfazem a Task 27**, com evidência escrita em
  `docs/IMPLEMENTATION_STATUS.md` (índice de evidências). Model card,
  símbolos, fatores determinantes, correções versionadas e o primeiro verbete não
  têm task correspondente no roteiro.
- **Contradições corrigidas no roteiro:** a tabela de status dizia "15 cancelada"
  enquanto a seção "Where to resume" mandava retomar justamente a Task 15. O
  ponto de retomada real é a Wave 4 (tasks 17-21), que segue intocada e é
  pré-requisito declarado da Wave 5 — construída antes dela.
- A **Wave 6 inteira tem texto superado** e recebeu aviso: foi escrita para o
  modelo `disabled|public|local`, com bundle público filtrado por direitos e rota
  servindo artefato-fonte. Nada disso existe desde 26 de agosto, e as colunas de
  direitos saíram do banco na migration `20260826140000`. Precisa ser reescrita
  antes de qualquer execução.
- **Causa raiz de eu ter perdido o plano:** a linha "Antes de retomar" de
  `IMPLEMENTATION_STATUS.md` listava `AGENTS.md`, `BLUEPRINT.md`, ele mesmo e
  `cultural-content-operations.md` — e não o `.omo`. O `.omo` só era citado de
  `ceremonial-ingest.md` e de uma entrada antiga desta memória. A lista de
  retomada foi corrigida. Em seguida, na consolidação documental do mesmo dia, o
  roteiro foi absorvido e o `.omo/` removido: **passou a existir um plano só**, o
  que elimina a divergência na raiz em vez de apenas a sinalizar.

## Atualização 2026-08-28 — Consolidação documental

- `docs/` passou de **vinte arquivos para cinco**. Cada assunto tem exatamente um
  lugar: `BLUEPRINT.md` (o que o produto é e por quê), `IMPLEMENTATION_STATUS.md`
  (o que falta e em que ordem, incluindo o roteiro granular), `METHOD.md` (método,
  fontes, protocolo de pesquisa e operação editorial), `OPERATIONS.md` (borda,
  orquestração, deploy, backup, email, qualidade, observabilidade, ingestão) e
  `PROJECT_MEMORY.md` (este histórico).
- **Nada foi reescrito na absorção.** O conteúdo dos documentos originais foi
  movido inteiro, com os títulos rebaixados um nível e agrupado sob um índice. O
  que mudou foram as referências cruzadas, reescritas para os novos caminhos.
- `.omo/` foi absorvido e removido: as waves abertas viraram a seção "Roteiro
  granular" de `IMPLEMENTATION_STATUS.md`, com os critérios de aceite preservados,
  e as 26 evidências viraram um índice de uma linha cada. O texto integral delas
  segue recuperável pelo histórico do Git.
- `.planning/` foi removido — 218 MB de screenshots, telemetria e templates
  genéricos, mais quatro markdowns com conteúdo de projeto que foram absorvidos
  antes (arquitetura Swarm, manifesto de infraestrutura, validação pública de
  Orixás e o relatório de QA de 24 de agosto). Era gitignored: **essa remoção não
  tem rollback pelo Git.**
- `AGENTS.md` ganhou o índice dos cinco documentos, a ordem de leitura para
  retomada e uma regra explícita: não criar um sexto documento em `docs/`. Se um
  assunto não couber nos cinco, o recorte de um deles é que está errado — foi
  abrindo arquivo novo que se chegou a vinte.
- Defeito introduzido e corrigido na mesma sessão: a reescrita de referências
  passou por dentro de um bloco de listagem histórica em `OPERATIONS.md` e
  transformou três nomes de arquivo distintos no mesmo nome. Os nomes originais
  foram restaurados a partir da cópia movida, com a anotação de onde cada um vive
  hoje.

## Atualização 2026-08-28 — Reestruturação de pastas

- A raiz tinha duas árvores de infraestrutura. `ops/` foi absorvido em `infra/`:
  `ops/prometheus` → `infra/prometheus`, `ops/ceremonial` → `infra/security`.
  Agora há **uma** raiz de infraestrutura, com `swarm/`, `cloudflare/`,
  `prometheus/` e `security/`.
- `test-support/` existia na raiz com **um arquivo** e virou `tests/support/`.
  Teste unitário continua ao lado do código que testa; `tests/` guarda só E2E e
  apoio de runtime.
- `competitor-profiles/` saiu da raiz para `docs/research/competitors/`. É
  artefato bruto de pesquisa, não documento — a conclusão relevante já vive no
  `BLUEPRINT.md`.
- `.agents/`, que estava vazio, foi removido.
- **Os arquivos Compose ficam na raiz, por decisão verificada.** Cheguei a
  planejar movê-los para `docker/` e testei antes: `docker compose config` sobre
  uma cópia numa subpasta reportou `name: composetest`, derivado do diretório. O
  nome do projeto Compose vem da pasta do arquivo, então mover renomearia o
  projeto de `orixas-mapa-astral` para `docker` e **órfãos todos os volumes** —
  inclusive o volume PostgreSQL histórico que a documentação manda preservar. É
  também onde o Compose procura o `.env`. Sete arquivos na raiz são ruído menor
  que perder volume de produção.
- O repositório em si está enxuto: **407 arquivos rastreados, nenhum acima de
  1,4 MB**. Os 7,7 GB de `scripts/` são a venv Python e o cache do modelo
  bge-m3, corretamente ignorados desde 27 de agosto.
- Defeito introduzido e corrigido: a reescrita de caminhos passou por
  `research-config.ts` e apontou `localPath` para `docs/METHOD.md`, mas o schema
  em `scorer.ts` validava com `/^docs\/[a-z0-9_./-]+\.md$/`, só minúsculas —
  dez testes quebraram. A correção foi no regex, não no caminho: os documentos
  canônicos seguem a convenção maiúscula que `BLUEPRINT.md` já usava.

## Atualização 2026-08-28 — Task 17: horas planetárias em domínio neutro

- `src/domain/astrology/planetary-hours/` passou a concentrar a sequência
  caldaica, o intervalo solar observado e o proxy equinocial. O módulo **não
  conhece Orixás**: recebe instante e lugar, devolve regente do dia, regente da
  hora, número da hora, segmento e progresso no intervalo.
- `src/domain/orixas/regency/temporal.ts` virou adaptador fino sobre ele,
  mantendo todos os exports e o vocabulário de feature do scorer. **As seis
  fixtures golden passaram sem alteração** — era o critério de aceite da task, e
  é o que prova que o refactor não mudou resultado.
- Por que separar: hora planetária é insumo das eleições cerimoniais da task 18.
  Mantê-la dentro do módulo de regências obrigaria a arrastar o modelo de
  regências para dentro de uma eleição do Heptameron, que nada tem a ver com ele.
- O modo polar continua com dois comportamentos distintos e agora testados: o
  estrito devolve `unavailable` com `limitation` em vez de inventar horário; o
  proxy equinocial devolve leitura mas com `method:
"equinoctial_local_solar_proxy"`, de modo que a incerteza viaja **no
  resultado** e não numa nota que o chamador possa ignorar.
- `resolvePlanetaryHourInInterval` valida a própria entrada. O lint apontou que o
  schema só servia de tipo; em vez de apagá-lo, passei a usá-lo — a função é
  chamada direto pelos perfis de eleição e não pode supor que alguém já conferiu
  o intervalo.
- Checkpoint: 551 testes (9 novos), typecheck, lint e formatação limpos.

## Atualização 2026-08-28 — Task 18: perfis de eleição ligados à fonte

- `src/domain/astrology/elections/` implementa o contrato, o avaliador e os
  perfis. Um perfil é a regra que **uma obra específica** dá para escolher o
  momento de um trabalho — não existe pontuação universal de bom momento, e o
  Heptameron e o Arbatel discordarem é informação, não ruído a ser mediado.
- **O tipo de saída não oferece campo de sucesso, score ou recomendação.** Há
  teste que verifica a ausência dessas chaves. Os três estados são `matched`,
  `conflicted` e `unavailable`; a decisão é de quem opera, e um número ali viraria
  promessa de resultado.
- Dado ausente vira condição `indeterminate` com motivo declarado
  (`moment_unavailable`, `lunar_longitudes_missing`) e derruba o perfil para
  `unavailable`. Horário inventado é pior que ausência de horário, porque parece
  informação.
- `evaluateElections` observa o mesmo instante sob vários perfis e devolve as
  observações lado a lado. Nada concilia, ordena por preferência ou escolhe
  vencedor.
- **Só 2 dos 4 perfis que o roteiro pedia foram escritos.** A busca no corpus
  condensado não devolveu a passagem que define o momento da operação no
  Heptameron, em Agrippa nem na Ars Paulina — as três obras estão no acervo como
  fonte, mas a regra não foi localizada. Escrever condição sem a passagem seria
  inventar a fonte, que é o oposto do que este método faz.
  - Os dois semeados têm passagem: **Arbatel** (o espírito olímpico governa os
    assuntos do seu planeta, de `_texto_olimpicos`) e **Khan Secretum** (a Lua
    depois da combustão, já visível, é boa para operações de todo tipo).
  - As lacunas vivem em `electionProfileGaps`, exportado e coberto por teste, em
    vez de num comentário que se perde. Quem for preencher: localize a passagem,
    cite no `locator` e só então escreva as condições — o schema recusa perfil sem
    locator.
- Checkpoint: 563 testes (12 novos), typecheck, lint e formatação limpos.

## Atualização 2026-08-28 — Task 19: contratos de entidade ligados à fonte

- `src/domain/ceremonial/entity-records.ts`. Uma entidade só existe **dentro de
  um sistema de origem**: nome, ofício, grau e correspondência pertencem a uma
  obra e a uma edição, nunca ao ar. O identificador carrega o sistema
  (`entity-record:<sistema>:<slug>`) e o schema recusa quando ele diverge do
  campo — assim nenhuma consulta perde o discriminante pelo caminho.
- Correspondência sem `locator` é recusada. É a posição citável que permite
  reestudar o ponto quando a leitura se mostrar errada.
- `crossSystemRelationSchema` é o **único** caminho pelo qual dois sistemas se
  tocam. Exige tipo e locator, e o vocabulário **não inclui `same_entity`**: as
  opções são `shares_name`, `analogous_position`, `derived_from` e `contradicts`.
  Nenhuma fonte sustenta identidade entre entes, e afirmá-la derrubaria o método.
- `findNameCollisions` relata homônimos entre sistemas **sem os fundir** — o
  "Michael" do Heptameron e o de Agrippa aparecem lado a lado com seus sistemas,
  e a decisão de relacioná-los fica humana e citada. É o caso que mais convida ao
  erro de alias.
- Construída **sobre** o grafo de funções, não em paralelo. O grafo afirma posição
  análoga entre tradições; este módulo guarda o que cada tradição diz da sua
  própria entidade. Um é a ponte, o outro é a margem, e a ponte não funde as
  margens. Era o risco que a reconciliação do roteiro tinha apontado.
- Checkpoint: 572 testes (9 novos), typecheck, lint e formatação limpos. Uma
  execução intermediária acusou o flake de `ambient-sound-control`, já documentado.

## Nota operacional recorrente — cache do webpack

`npm run build` falha de forma intermitente com
`TypeError: Cannot read properties of undefined (reading 'length')` em
`WasmHash._updateWithBuffer`, e despeja bundle minificado no stdout, o que
inutiliza qualquer `grep` na saída. **Não é regressão da aplicação.** Ocorreu em
25 de agosto e duas vezes em 27–28 de agosto, sempre com o mesmo remédio: mover
ou apagar `.next/cache` e repetir o build, que então passa integralmente.

Para diagnosticar, redirecione a saída para arquivo antes de filtrar — o stdout
do build contém megabytes de JavaScript minificado que casam com quase qualquer
padrão de busca.

## Atualização 2026-08-28 — Primeiro verbete derivado do corpus (P1.2)

- `20260828010000_publish_iemanja_umbanda_sagrada` publica
  `iemanja-teogonia-umbanda-sagrada`: 326 caracteres de resumo e 3.018 de corpo,
  acima da constraint de 240/1.800. É o primeiro verbete derivado do corpus
  condensado, e fixa o padrão para os próximos.
- O texto parte de uma obra identificada — _Orixás — Teogonia de Umbanda_, de
  Rubens Saraceni — e trata a origem do texto como parte do que o texto afirma.
  Ensina explicitamente a distinção que esta sessão descobriu na prática:
  **densidade de material não é amplitude de concordância**. Quatro das obras
  mais presentes do acervo são do mesmo autor, e um sistema que contasse obras
  leria como consenso o que é uma voz exposta quatro vezes.
- **Publicado sem revisor.** `reviewer_id` e `reviewed_at` ficaram nulos porque
  nenhuma revisão aconteceu. Desde `20260826150000` a revisão independente não é
  pré-condição, e registrar um parecer inexistente seria gravar ficção no banco.
  É o primeiro verbete a exercitar essa relaxação.
- A fonte entrou como `community-primary` com `usage_status` `REFERENCE_ONLY` e
  nota de licença explícita: citada por posição, nenhuma expressão da obra é
  reproduzida — o texto publicado é síntese original.
- **Verificado contra PostgreSQL 18 real**, em container isolado: as 26
  migrations aplicaram sem erro e o verbete consta `PUBLISHED`, com a claim
  ligada à fonte pelo locator. O corpus público passou de 4 para 5 verbetes.
- Contradição corrigida na documentação durante o trabalho:
  `docs/METHOD.md` afirmava que `REFERENCE_ONLY` e
  `CLAIM_ELIGIBLE` não existiam mais. Existem — como vocabulário em
  `src/lib/editorial/contracts.ts` e como coluna `cultural_sources.usage_status`.
  O que foi removido foi o **portão** que exigia `CLAIM_ELIGIBLE` para a claim
  valer. O texto foi corrigido para dizer isso com precisão.

## Atualização 2026-08-27 — P1: fatores, correções versionadas e símbolos próprios

### Tríade com fatores determinantes (P1.5)

- A resposta pública da regência passou a trazer `determiningFactors` por papel:
  os fatos astrológicos que mais sustentaram a escolha, em linguagem de leitura
  ("Ascendente em Áries", "Marte angular", "Nascimento em dia de Marte").
  `src/domain/orixas/regency/public-factors.ts` traduz a chave interna da
  feature; a **ordem** é pública, o peso não, e identificador de regra,
  coeficiente e fonte estrutural não atravessam.
- Chave desconhecida devolve `null` em vez de rótulo genérico: exibir "fator
  astrológico" sem dizer qual seria ruído com aparência de explicação.
- Papel em aberto não lista fatores. Mostrar os do primeiro colocado sugeriria
  uma conclusão que o método justamente não tomou.
- O autorrelato entra como categoria ("Movimento simbólico que você reconheceu")
  e nunca devolve a resposta dada — ele é cálculo-apenas e não é persistido.
- A view da Tríade passou a exibir os fatores e a linkar `/metodologia`.

### Registro de correções do método (P1.6)

- `method-corrections.ts` guarda as correções que o método já sofreu, com área,
  o que mudou, por quê e qual foi o efeito. A página de metodologia publica o
  registro. Um princípio de correção sem registro é promessa; agora é conferível.
- Duas entradas, ambas verificáveis nesta documentação: a de 26 de agosto, que
  substituiu a proibição de agrupar tradições pela condensação por função; e a
  de 27 de agosto, que passou a contar sustentação por linhagem e não por obra.
  A segunda **reduz** a convergência que o produto mostra, e está publicada
  justamente por isso.

### Símbolos em SVG próprio (P1.4)

- `src/components/site/celestial-glyph.tsx` desenha os 14 glifos planetários.
  A interface usava os caracteres Unicode (☉ ☾ ☿ ♀ ♂), que dependem da fonte
  instalada, caem em tofu em vários sistemas e não aceitam espessura nem tema
  consistentes.
- `src/components/site/ritual-seal.tsx` desenha cinco selos — Exu, Ogum,
  Oxóssi, Xangô e Iemanjá. São composições autorais a partir dos elementos que
  o acervo atribui a cada entidade, e cada selo registra sua fundamentação em
  `grounding`: o tridente e a encruzilhada de _Quimbanda — O Culto da Chama
  Vermelha e Preta_; a espada e a onda em ferradura de _Fundamentos
  Doutrinários de Umbanda_; as flechas, o machado de duas faces e a estrela
  sobre a onda dos pontos cantados. Entidade sem selo fundamentado não
  renderiza nada — inventar traço para completar a grade seria o oposto do que
  o método faz em toda parte.
- **Correção de rumo registrada para quem vier depois:** numa primeira leitura
  eu tinha concluído que o §10.3 proibia desenhar selos e pontos riscados e
  limitei o trabalho aos glifos planetários. Estava errado. O §10.3 proíbe
  **usar símbolo sagrado como ornamento**; o §5.0 manda redesenhá-los em vetor
  próprio, e o responsável confirmou a instrução. As duas seções não se
  contradizem: redesenhar é o que o projeto pede, usar como enfeite é o que ele
  recusa.
- Pendência de design: o glifo de Júpiter é o mais estilizado do conjunto — o
  curl superior saiu angular em vez de curvo. Legível, mas merece um passe.

## Atualização 2026-08-27 — `/metodologia` como model card

- A página deixou de ser um resumo de cinco frases e passou a publicar as cinco
  partes que `docs/BLUEPRINT.md` §5.0 exige: entradas declaradas, processo etapa
  a etapa, condensação das tradições, versionamento, avaliação e limites
  conhecidos. Fecha o item 3 do P1.
- O conteúdo mora em `PUBLIC_REGENCY_METHOD_CARD`, no domínio, e não na página.
  É contrato: muda com versão, é coberto por teste e mantém a página como
  apresentação. A faixa `.method-chain` recebe um resumo curto por etapa — a
  grade de cinco colunas estreitas não comporta parágrafo — e o detalhe longo
  vive numa seção própria.
- A página publica duas coisas que são o diferencial e não custam propriedade
  intelectual: **a regra de linhagem** ("quatro livros do mesmo autor são quatro
  obras e uma voz") e **o limite de posição análoga** ("ocupa a mesma função
  estrutural", nunca identidade; uma entidade de guia não vira Orixá por ocupar
  posição análoga a ele). A sustentação aparece em palavras — uma escola,
  corroborada, convergente — e nunca em percentual.
- Os critérios de promoção publicados são os reais, lidos de
  `regencyPromotionPolicy`: mínimo de 30 rótulos de validação por papel
  obrigatório, nenhuma queda de acerto em primeira posição ou entre as três
  primeiras, e no máximo cinco pontos percentuais de aumento na abstenção.
- Continua sem expor matriz, coeficientes, limiares, regras de desempate ou
  identificadores internos de artefato. Há teste que varre o texto renderizado
  contra `regency-matrix`, `regency-weights`, `regency-function-graph` e
  `family:`.
- O CSS reaproveita `.method-versions`, que existia estilizado no design system
  e nunca tinha sido ligado a nada. Novas classes: `.method-detail-list`,
  `.method-emphasis`, `.method-strengths` e `.method-criteria`, todas com
  colapso para uma coluna no mesmo breakpoint das demais.
- Verificado no navegador em 1440px e Pixel 7: nenhum overflow horizontal e
  todas as grades colapsam para uma coluna no mobile.
- O build falhou uma vez com `WasmHash._updateWithBuffer` — a mesma corrupção de
  cache webpack já registrada em 25 de agosto. Mover `.next/cache` e repetir
  resolveu; não era regressão da aplicação.
- Checkpoint: 520 testes passando (6 novos na página), typecheck, lint,
  formatação e build de produção limpos.

## Atualização 2026-08-27 — Grafo de funções estruturais 0.1.0

- Primeira implementação das três camadas de `docs/BLUEPRINT.md` §5.0.1, em
  `src/domain/orixas/regency/`: `structural-functions.ts` (vocabulário),
  `function-graph.ts` (atribuições e condensação) e `function-graph-data.ts`
  (dados). Artefato de pesquisa versionado
  `regency-function-graph-0.1.0-research`; **não** alimenta o scorer nem o
  runtime público, e a Tríade continua saindo da matriz v2.
- Cada função carrega a pergunta que responde. É o teste que autoriza comparar
  tradições: sem ele, a aproximação vira sincretismo por semelhança de
  vocabulário. As quatro funções da 0.1.0 são abertura de caminho e passagem,
  ferro e ofício da guerra, vitalidade solar e evidência, expansão e sentença.
- A condensação gradua a sustentação por **famílias de fonte independentes**,
  nunca pela contagem de atribuições, e a saída é qualitativa —
  `single_school`, `corroborated`, `convergent`. Não existe amostra que calibre
  um coeficiente aqui, e um percentual seria lido como certeza.
- Agrippa, Trithemius e o Heptameron ficaram na mesma família
  (`family:renaissance-ceremonial`): Trithemius foi mestre de Agrippa e o
  Heptameron circulou junto do quarto livro atribuído a ele. Contá-los como três
  confirmações inflaria a convergência justamente onde o método precisa dela
  honesta. O Arbatel, anônimo e de circulação própria, tem família separada.
- A relação declarada é sempre `analogous_position`; o tipo não oferece outra.
  As atribuições carregam `entityCategory` pelo vocabulário de
  `docs/METHOD.md`, e é isso que impede a condensação de virar
  fusão de panteões — o Exu da Quimbanda entra como `guide_entity`, nunca como
  `orisa`, e segue distinto do Èṣù yorùbá mesmo ocupando posição análoga a
  Ophiel e Raphael.
- **As atribuições vieram do corpus, não da memória.** Cada uma foi localizada
  por busca semântica em `conteudo/` e conferida no texto: Arbatel via
  `_texto_olimpicos` (Aratron/Saturno, Bethor/Júpiter, Phaleg/Marte, Och/Sol,
  Hagith/Vênus, Ophiel/Mercúrio, Phul/Lua), a linhagem angélica via
  `_texto_magia_angelical_72` (Michael/domingo, Gabriel/segunda, Raphael/quarta,
  Sachiel/quinta, Haniel/sexta, Cassiel/sábado), Exu via _Quimbanda — O Culto da
  Chama Vermelha e Preta_ e Ogum via a apostila do Templo da Pena.
- O corpus permanece insumo de autoria: nenhum código em `src/` lê `conteudo/`.
  O que atravessa a fronteira é o achado versionado com proveniência, nunca o
  texto-fonte — é o desenho do §5.0.
- **Expansão com a bibliografia afro-brasileira.** O vocabulário passou a oito
  funções, com Oxum, Iemanjá, Omolu e Obaluaiê entrando a partir das obras de
  Saraceni e do Templo da Pena localizadas no corpus. A checagem de autoria
  revelou o achado que mais afeta o método: _Teogonia de Umbanda_, _As Sete
  Linhas_, _Os Arquétipos_ e _Fundamentos Doutrinários_ são **as quatro de
  Rubens Saraceni** — uma família, não quatro. Como é a fonte mais presente do
  corpus, contar obras em vez de linhagens quadruplicaria a convergência
  justamente onde o acervo é mais denso, lendo como consenso de escolas o que é
  a exposição de um autor. As linhagens umbandistas independentes hoje
  disponíveis são quatro: Saraceni, Templo da Pena, Ramatís e Quimbanda.
- Prandi, Verger, Juana Elbein, Abimbola, Bascom e o dossiê Ifá da UNESCO estão
  catalogados em `docs/METHOD.md` como referências externas com URL,
  mas **não estão no corpus local**. Nenhuma atribuição foi escrita em nome
  deles: sem o texto à mão, a claim não tem como ser conferida.
- Checkpoint: 514 testes passando (14 novos), typecheck, lint e formatação
  limpos. O `.next` obsoleto de 26 de agosto foi removido pelo responsável e o
  typecheck voltou a passar; o erro era cache de container, não código.

## Atualização 2026-08-27 — Corpus do acervo E:\Ocultismo, condensado e higienizado

- O corpus vetorizado está **pronto e consultável** em `conteudo/`, gerado por
  `scripts/ocultismo-pipeline/` (venv Python própria). Desenho: extração
  (PDF/DOCX/ODT/TXT/RTF/JSON + OCR de imagens e de PDFs escaneados) → higiene →
  chunking → embeddings `BAAI/bge-m3` (1024d, normalizados) → FAISS de produto
  interno + parquet/jsonl/manifest. Busca: `query.py` (texto/json/jsonl, filtro
  por categoria).
- **Estado final: 29.296 chunks, 434 documentos, 17 categorias.** Os cinco
  artefatos — `manifest.json`, `chunks.parquet`, `embeddings.npy`, `index.faiss`
  e `chunks.jsonl` — estão consistentes nesse número. A RTX 2060 de 6 GB pede
  `--batch-size 8`; o default 64 estoura.
- **Higiene do corpus, introduzida em 27 de agosto.** A auditoria do índice
  recém-construído encontrou 12,6% de conteúdo que não deveria estar lá, e a
  causa estava no pipeline, não no acervo. Duas falhas de raiz foram corrigidas
  em vez de contornadas:
  - o portão de lixo em `normalize.py` somava letras **e espaço em branco**
    sobre o total, de modo que um PDF quebrado em caracteres isolados separados
    por quebras de linha passava com folga. Agora `corpus_hygiene.py` mede
    letras entre os caracteres não-brancos, comprimento médio das palavras e
    presença de palavras funcionais em português e inglês — as três, e em
    inglês também porque o acervo tem grimórios nessa língua;
  - a deduplicação comparava o hash dos primeiros 5.000 caracteres, o que só
    reconhece arquivos idênticos: quatro cópias de _Magia Prática_ do Bardon
    estavam indexadas. Agora usa assinatura de n-gramas no pipeline e, sobre o
    índice já construído, cobertura de chunk entre vetores. Os limiares foram
    calibrados contra pares conhecidos do próprio acervo — cópias ficam entre
    0,42 e 0,64 de cobertura, obras distintas não passam de 0,28, sendo o par
    mais próximo o Grande Grimório e o Grimório do Papa Honório, textos
    historicamente aparentados. Casos entre os dois limiares são relatados para
    decisão humana, nunca descartados em silêncio.
- Isso importa além do espaço em disco: `docs/BLUEPRINT.md` §5.0.1 estabelece
  que a condensação pesa convergência entre escolas independentes e que cópia e
  tradução da mesma linhagem não são duas confirmações. Bardon indexado quatro
  vezes produziria quatro votos onde existe um.
- `clean_corpus.py` aplica os portões retroativamente ao índice, selecionando
  linhas em vez de reprocessar o acervo. Removeu 42 documentos e 4.222 chunks
  numa primeira passada (cópias 2.874; fora do escopo 1.288 — inclusive um guia
  de drogas, um catálogo de contatores elétricos e 17 livros de autoajuda;
  extração ilegível 60) e mais 5 documentos e 216 chunks depois do OCR.
- **PDFs escaneados.** `ingest_scanned_pdfs.py` passou a detectar não só a
  ausência de camada de texto, mas a camada **degenerada** — foi assim que o
  Curso Básico de Astrologia tinha entrado como 173 chunks de símbolos. A
  execução de 27 de agosto achou 25 candidatos, processou os 9 pendentes em 40
  min e gerou 596 chunks, recuperando o Curso Básico de Astrologia, o Curso de
  Magia de J. R. R. Abrahão e a Apometria de Adilson Marques, antes ilegíveis.
  O Quimbanda (ilide.info) segue escaneando mal e continua praticamente ilegível.
- **Pontos cantados: 538 catalogados, 216 com letra confiável.** O número
  anterior de 529 (98%) era falso: `refine_lyrics.py` mantinha a página inteira
  quando a segmentação falhava, então artigo de blog, verbete de Wikipédia e
  página com dezenas de pontos entraram como se fossem letra — 47% das entradas
  passavam de 2.000 caracteres, quando um ponto real tem entre 90 e 430.
  `validate_lyrics.py` inverteu a ordem: limpa a navegação, tenta recortar a
  estrofe correspondente ao título e só então valida por estrutura de verso
  (comprimento e contagem de palavras por linha, vocabulário funcional do
  português). Resultado: 131 letras já válidas, 85 recuperadas por segmentação,
  313 descartadas e 9 que nunca tiveram coleta. O catálogo passou a registrar
  `lyrics_status` com o motivo. Campo vazio é resultado honesto; letra errada
  contamina busca e método. A recuperação por recorte não é perfeita — na
  amostragem, cerca de 1 em 12 ainda traz a estrofe do ponto vizinho.
- `integrate_pontos.py` tornou-se idempotente: remove os chunks de pontos já
  indexados antes de inserir os novos, porque o catálogo é reescrito a cada
  validação. E o `chunks.jsonl` passou a ser regenerado a partir do parquet em
  toda gravação — antes ficava atrás do índice, e chegou a ter 1.280 chunks a
  menos que os demais artefatos.
- Smoke test no corpus limpo: "correspondência entre planetas e anjos na cabala"
  deixou de gastar duas das três vagas do topo com a mesma cópia duplicada do
  Eliphas Levi; "curso básico de astrologia" retorna em primeiro o documento que
  antes era ilegível. As letras dos pontos deixaram de trazer navegação de blog.
- Retomada/reprocesso: `.venv/bin/python pipeline.py --output-dir conteudo
--device cuda --batch-size 8` → `ingest_scanned_pdfs.py` → `validate_lyrics.py`
  → `integrate_pontos.py --device cuda` → `clean_corpus.py` → `query.py`. Logs em
  `scripts/ocultismo-pipeline/*.log` (gitignored).
- O corpus ainda **não** está ligado ao produto: nenhum código em `src/`
  referencia `conteudo/`. Fechar essa distância é o P1 de
  `docs/IMPLEMENTATION_STATUS.md`.

## Atualização 2026-08-26 — Contradições retiradas da documentação

- O plano e os documentos foram varridos para remover o que contradizia as duas decisões do dia
  (runtime único; condensação por função). Corrigidos: escopo IN/OUT do plano — cujo "OUT"
  literalmente proibia condensar tradições —, estratégia de verificação, tabelas de waves,
  critérios de sucesso, `BLUEPRINT` §3.2 (conselho cultural como pré-condição de publicação),
  a fila P1 do `IMPLEMENTATION_STATUS`, o relatório de numerologia e o registro de fontes.
- Tasks 7, 9, 10 e 11 ficam marcadas **SUPERADA** com o motivo; a Task 15 **CANCELADA**; a
  Task 27 **INVERTIDA**; as Tasks 34, 36, 37 e 38 **REENQUADRADAS**. As descrições antigas
  permanecem como histórico do que foi construído e por quê.
- **Contradição doc↔código ainda aberta:** o banco exige `reviewer_id NOT NULL` para publicar
  verbete cultural (`20260819040000_cultural_corpus`) e `src/lib/editorial/workflow.ts` exige
  autor ≠ revisor. Num projeto de uma pessoa esse gate não pode ser satisfeito honestamente.
  A decisão remove esse tipo de trava, mas o código não foi alterado — enquanto não for, o
  comportamento real é o do banco. Está registrado em `cultural-content-operations.md`.
- O corpus condensado de `E:` está sendo refeito pelo Qwen Code 3.8, com mais material. É a
  fonte autoritativa da condensação; trabalhamos sobre a saída dele.

## Atualização 2026-08-26 — Modelo híbrido descartado

- **Decisão do responsável:** runtime único, cobertura total, sem separação público/local.
  Canônico em `docs/BLUEPRINT.md` §5.0.
- A separação real é entre **insumo** (o acervo, usado por inteiro para derivar o método) e
  **obra** (o que o site publica: método, correspondências, síntese escrita por nós).
  Publicamos a obra, nunca a fonte — não por trava, mas porque a fonte não é o produto.
- Removido do código e do banco: modo de runtime, matriz de facetas/direitos, bundle público,
  rota de artefato-fonte, `artifact-storage`, colunas rights/access/sensitivity, fila de
  revisão de importação, tabela de pareceres. Migration `20260826140000`.
- **Não perguntar de novo** sobre direitos por fonte, elegibilidade ou parecer cultural como
  pré-condição: isso foi decidido e está registrado. Paráfrase e síntese original resolvem a
  questão pela via correta — fato e ideia são livres, expressão é protegida, e a expressão
  publicada é nossa.
- Símbolos são redesenhados em SVG próprio, não recortados de scan.
- **Correção no mesmo dia:** uma formulação minha proibia fundir tradições. Estava errada e o
  responsável corrigiu. As tradições **devem ser condensadas** — muitas se complementam e os
  fundamentos se cruzam. O desenho está em `BLUEPRINT.md` §5.0.1: fonte → função abstrata →
  condensação, com saída única. A proveniência por escola não é freio, é **peso**: convergência
  entre escolas independentes é evidência forte, e só continua contável enquanto der para ver
  que eram independentes. Cópia e tradução da mesma linhagem não valem como duas confirmações.
  Único limite: afirmar posição análoga, não identidade entre entes.
- Isso inverteu a Wave 5 do plano, que era "workspaces estritamente separados", e a Task 27,
  que era uma suíte anti-vazamento entre tradições.
- Pedido de qualidade em aberto: os textos existentes estão rasos. A barra é imersão e
  detalhe, e a página de metodologia deve explicar o método como um _model card_ de big tech.

## Atualização 2026-08-26 — Task 14: linhagem, locators e fila de revisão

- Wave 3 em 14 de 39 tasks. A T14 mapeia artefatos extraídos para `obra → edição → artefato →
locator`, com `npm run ceremonial:import` (relata por padrão, grava só com `--apply`) e a
  migration `20260826130000_ceremonial_import_reviews`.
- **Regra que governa tudo:** um nome de arquivo é pista, nunca identidade. Sem mapeamento
  feito por pessoa, cada artefato abre quatro itens de fila — título, autoria, edição, idioma
  — e fica impublicável. Um `--mappings` exige nota de evidência de como a identidade foi
  estabelecida.
- **Gate de publicação na política da T9**, não na camada de consulta: o novo
  `unresolvedImport` nega **todas** as facetas, inclusive `metadata`. Conceder direitos sobre
  "lemegeton.pdf" concede direitos sobre nada que alguém identificou. Default `false`, então
  chamadores anteriores continuam compilando e continuam fail-closed.
- Variantes não colapsam: compilação e texto-fonte são edições distintas; duas traduções são
  edições distintas da mesma obra; duplicatas byte a byte convergem num artefato só.
- **Acervo real:** 729 artefatos únicos, 145 importados com texto em 139 obras, 139 edições e
  18.196 locators de página; 1.201 itens de fila abertos e **zero resolvidos**. Segunda
  execução não criou nada. Esse é o estado honesto de um corpus não catalogado.
- Testes do store rodam contra PostgreSQL 18 real (não mock), incluindo rollback transacional
  de um plano inteiro. Rodar: `CEREMONIAL_TEST_DATABASE_URL=... npx vitest run import-store`.
- **Dois defeitos achados só rodando:** (1) inventei um locator `WHOLE_ARTIFACT` que o CHECK
  da T8 recusou — a correção foi parar de inventar, não ampliar o CHECK, e artefato sem
  páginas agora recebe `NO_LOCATOR_SCHEME`; (2) inserir 18.196 locators um a um estourou a
  transação — trocado por `createMany({skipDuplicates:true})`, apoiando idempotência no índice
  único.
- Próxima retomada: Task 15, classificação de direitos e sensibilidade — a task que o próprio
  plano marca como dependente de julgamento jurídico do responsável.

## Atualização 2026-08-26 — Task 13: pipeline de extração isolado

- A Wave 3 avançou para 13 de 39 tasks. A T13 entregou o ingest cerimonial: `compose.ingest.yml`
  (projeto Compose separado, sem banco, sem Redis, sem segredo e **sem rede**) e o alvo
  `ingest-runner` com poppler 22.12.0, tesseract 5.3.0 (por+eng) e libarchive 3.6.2 fixados.
- A barreira de integridade é a parte que importa: a fonte é reaberta com `O_NOFOLLOW`,
  conferida contra o censo da T12 por tamanho e SHA-256, e **o adaptador recebe esse descritor
  como stdin, nunca um caminho**. Depois da extração o `fstat` é comparado de novo. Um symlink
  plantado ou uma troca de bytes do mesmo tamanho terminam em quarentena explícita, verificado
  contra o container real.
- Derivados nascem `UNKNOWN` / `LOCAL_ONLY` / `CULTURALLY_SENSITIVE` e o schema recusa outra
  classificação. Extração não concede direito de publicação; isso é a Task 15.
- **Decisão registrada:** áudio não é transcrito. 539 dos 801 arquivos são pontos cantados e
  recebem `NO_ADAPTER` + `AUDIO_NOT_TRANSCRIBED`. Não existe ASR local determinístico aceitável,
  o plano proíbe modelo externo, e transcrever canto sagrado é decisão cultural que ninguém
  tomou. A cobertura é reportada sobre todas as linhas do censo, nunca só sobre as tentadas.
- PDFs escaneados sem camada de texto caem num fallback `pdf-ocr` que renderiza e reconhece
  página a página. Sem ele, 20 volumes e 1.044 páginas ficariam silenciosamente vazios.
- Cinco defeitos reais só apareceram rodando o container de verdade, todos com regressão. O pior:
  volume não gravável era reportado como `OUTPUT_INVALID` por linha, tornando um mount errado
  indistinguível de um acervo corrompido sobre 801 arquivos. Falha de armazenamento agora aborta.
- **Bloqueio aberto para o responsável:** o gate de suprimentos da própria T13 recusa a imagem.
  Trivy 0.74.0 fixado reporta 201 achados bloqueantes (8 CRITICAL, 62 HIGH, 131 MEDIUM), quase
  todos pacotes Debian bookworm sem correção upstream. A política não foi afrouxada. Base trixie
  reduz Critical+High de 70 para 25, mas não a zero. A decisão está descrita no plano.
- Runbook: `docs/OPERATIONS.md`. Próxima retomada: Task 14, importação de obras, edições,
  artefatos e locators sem colapsar variantes.

## Atualização 2026-08-26 — Wave 2 dual-mode concluída (SUPERADA)

> Esta seção descreve o modelo híbrido, descartado no mesmo dia. Mantida como histórico do
> que foi construído e por quê; o estado atual está na atualização "Modelo híbrido descartado"
> no topo deste arquivo.

- A divergência anterior foi corrigida: as Tasks 7–11 do roteiro estão concluídas e a Wave 2 está
  fechada. O total observado é 11 de 39 tasks de implementação.
- T7 criou os modos imutáveis e fail-closed `disabled|public|local`, com runtime local isolado em
  loopback, Compose/credenciais/volumes próprios e vocabulário congelado de direitos, acesso,
  sensibilidade e facetas.
- T8 adicionou a migration `20260826020000_ceremonial_corpus`, com 15 tabelas aditivas para
  proveniência, sistemas separados, obras/edições/artefatos/locators, entidades/variantes, mídia,
  correspondências, timing, revisões estruturadas e envelopes privados. O banco observado possui
  22 migrations aplicadas.
- T9 centralizou a autorização pura por faceta. Modo público exige acesso público, escopos atuais
  de revisão RIGHTS e EDITORIAL e direitos elegíveis para corpo/exportação; conhecimento restrito
  fica metadata-only. Modo local exige autenticação. Entrada adulterada, modo desabilitado,
  aprovação expirada/revogada ou registro local-only negam de forma explícita.
- T10 adicionou armazenamento local seguro e uma rota dinâmica autenticada. Caminhos são sempre
  relativos e normalizados; o arquivo é aberto com `O_NOFOLLOW`, verificado como regular e
  confirmado sob o root canônico pelo descritor já aberto. MIME é validado pelos bytes; ranges usam
  o mesmo descritor. Modo público/desabilitado nega antes de autenticação, banco ou filesystem, e
  respostas nunca revelam caminho local.
- T11 adicionou bundle público canônico e estrito, seleção por política T9, hash SHA-256, relatório
  de exclusões, mídia apenas por hash e verificação independente de schema/direitos/revisões no
  destino. A migration `20260826120000_ceremonial_public_bundles` cria namespaces imutáveis e um
  ponteiro singleton ativo/anterior; ativação e rollback são transacionais e revalidam mídia.
- Checkpoint direcionado T9: typecheck e lint passaram; 28 testes de modo/política passaram. O
  checkpoint completo de coverage/build/E2E/Sonar permanece reservado ao gate da Wave 2.
- Em 26 de agosto de 2026, o responsável autorizou prosseguir com acesso/processamento do corpus
  local nas Tasks 12–13 e com as decisões de produto das Tasks 15 e 22–26. A autorização permite o
  trabalho, mas não presume licença, domínio público, competência sacerdotal ou aprovação cultural:
  classificações sem evidência continuam fail-closed e material protegido não se torna publicável.
- Checkpoint T11: 10 testes de bundle/store, typecheck, lint, migration deploy e build Docker de
  produção passaram. O banco possui 23 migrations. O primeiro build Docker sofreu `ECONNRESET` no
  `npm ci`; a repetição passou e compilou Next/TypeScript integralmente.
- Próxima retomada: Task 12, inventário read-only e retomável de `/mnt/e/Ocultismo`.

## Atualização 2026-08-26 — Wave 1 do roteiro cerimonial: Tríade v3 fechada

- Concluída a Wave 1 (`docs/IMPLEMENTATION_STATUS.md`, tarefas 1-6):
  baseline congelada, boundaries da Tríade endurecidas (mesma origem em POST/PUT/DELETE, leitor
  JSON limitado com 413/415, erro de cálculo sanitizado 503), consentimento do feedback vinculado
  a estado controlado (não é mais possível enviar sem marcar, mesmo contornando o botão),
  `orisa-research-lab.tsx` dividido em componentes menores que 250 linhas.
- Nova migration `20260826000000_regency_feedback_constraints` adiciona CHECK constraints
  (verdict, confirmation_basis, forma JSON, consistência knows_orisas/corrected_triad) como
  última defesa. Nova rota `DELETE` permite retirar um feedback específico sem apagar o mapa.
- Exportação pessoal passou a incluir as cinco versões (método/matriz/config/scorer/questionário)
  de cada feedback. Novo relatório agregado internamente restrito
  (`regency:evaluate -- --aggregate-release`) publica contagens sobre dimensões fixas
  predeclaradas com amostra mínima de 30, supressão primária abaixo de 10, supressão
  complementar e bloqueio por risco de ataque de diferenciação contra releases anteriores,
  persistidos na nova tabela `regency_benchmark_releases` (decisão explícita do responsável:
  Postgres, não arquivo). Migration `20260826010000_regency_benchmark_releases`.
- Corrigida uma regressão pré-existente no worktree sujo: `v2-config.ts`/`v2-matrix.ts` ganharam
  `import "server-only"`, o que quebrava silenciosamente `npm run regency:evaluate` fora do
  Next.js. Corrigido com `--conditions=react-server` nos scripts do `package.json`.
- Golden fixtures da Tríade v3 congelam o catálogo exato de 27 Orixás elegíveis, a tripla de
  versões matriz/config/scorer e o caso em que todos os papéis ficam em aberto sem evidência.
- O E2E autenticado (`tests/e2e/authenticated-mvp.spec.ts`) estava desatualizado desde a v3: pulava
  o questionário obrigatório antes de esperar o resultado. Passou a responder as sete perguntas,
  submeter feedback consentido, verificar as versões no export pessoal e exercitar a retirada
  seletiva (`DELETE`) antes da exclusão do perfil. Duas regressões pré-existentes foram
  descobertas e corrigidas nesse processo: `scripts/release-smoke.sh` e
  `tests/e2e/methodology.spec.ts` ainda verificavam a string "AstroAxe Regências 2.1", desatualizada
  desde a virada para 3.0 — ambas falhavam silenciosamente sob `set -e`/timeout sem imprimir erro.
- Documentação reconciliada (`/privacidade`, `/metodologia`, `docs/IMPLEMENTATION_STATUS.md`) para
  declarar explicitamente: as sete respostas do questionário são cálculo-apenas e nunca
  persistidas; o feedback exige consentimento separado, é persistido versionado e pode ser
  retirado individualmente. `docs/METHOD.md` e o relatório de pesquisa já
  declaravam essa regra corretamente.
- Checkpoint observado nesta sessão: `npm run typecheck` e `npm run lint` passaram; `npm test`
  (sem coverage) — 93 arquivos, 351 testes, todos passando; `npm run test:coverage` — mesma
  contagem, 86,45% statements / 71,98% branches / 89,17% functions / 88,62% lines (uma
  instabilidade de timeout pré-existente e não relacionada a este trabalho, em
  `profile-archive.test.tsx` sob paralelismo total, some ao rodar com `--fileParallelism=false`;
  `vitest.config.ts` ganhou `testTimeout: 15_000` como mitigação geral); `npm run build` passou;
  `npm run test:e2e` — 14 cenários passaram (5,6 min) via o wrapper oficial após as duas correções
  acima; Quality Gate do SonarQube passou após corrigir os quatro achados reais introduzidos nesta
  sessão (um bug MAJOR de `reduce()` sem valor inicial e três code smells MAJOR de espaçamento
  JSX ambíguo) — 0 novas violações, 81,6% de cobertura em código novo, 1,52275% de duplicação.
- A fundação dual-mode foi construída pelas Tasks 7–11 e depois descartada; ver o topo do arquivo. A
  ingestão, os workspaces e a criptografia continuam pendentes e agora possuem autorização do
  responsável para execução incremental, preservando os gates jurídicos e culturais fail-closed.

## Atualização 2026-08-25 — regências v3 e nomenclatura astrológica

- A Tríade passou a exigir um questionário de sete movimentos antes do cálculo. As respostas são
  sinais auxiliares usados somente na requisição e incluem opções “ambos” e “prefiro não responder”.
- Ao final, um coletor consentido pergunta se o usuário conhece seus Orixás de frente, cabeça e
  costas e aceita correções por papel. O servidor recalcula a predição antes de congelar o exemplo;
  feedbacks são versionados, exportáveis e removidos em cascata com o perfil.
- O catálogo elegível foi ampliado de 25 para 27 com Logunan e Egunitá; Oxumarê continua explícito.
  Os pares de Saraceni entram como uma família de evidência da Umbanda Sagrada, cruzável com todas
  as demais no agregado e ainda mensurável separadamente por proveniência.
- Versões: matriz `0.5.0-v3`, configuração `0.2.0-v3`, scorer `0.6.0`, questionário `1.0.0` e
  contrato público `AstroAxe Regências 3.0 — pesquisa aplicada`.
- Corpos, pontos e aspectos dos módulos astrológicos agora usam rótulos portugueses centrais e
  fallbacks seguros; o caso `sun`/`true_node`/`sextile` possui regressão textual exata.
- Checkpoint observado: 315 testes em 89 arquivos; 86,21% de statements e 88,39% de linhas;
  typecheck, lint, formatação, build de produção, E2E e Quality Gate passaram. O cache webpack do
  host voltou a apresentar a falha interna `WasmHash`; o build isolado compilou integralmente. A
  stack principal foi reconstruída e permaneceu saudável em `http://localhost`.

## Atualização 2026-08-25 — revisão integral de módulos e conteúdo

- Todos os módulos públicos e autenticados foram confrontados com o estado real do produto. Textos
  natais permanentes deixaram de se apresentar como leitura do período; trânsitos distinguem
  proximidade geométrica do pico de uma alegação de exatidão; cards com hora desconhecida não
  prometem casas ou ângulos.
- A Regência pública foi elevada para `AstroAxe Regências 2.1 — pesquisa aplicada`, sem alteração
  da matriz ou dos resultados. O módulo ganhou retry explícito e preserva o perfil quando a rota
  falha. O histórico ANTES/DEPOIS/MOTIVO/IMPACTO está no changelog de cálculo.
- `/privacidade` descreve a coleta e os controles realmente implementados, declara integrações
  inativas e separa pendências jurídicas de funcionalidades existentes. Rodapé, sitemap e release
  smoke cobrem a nova rota.
- Foram removidos a cena Canvas substituída e um contrato especulativo de analytics sem chamadores,
  com seus testes e estilos exclusivos. O TypeScript estrito com verificações de símbolos não
  utilizados passou depois da limpeza.
- O breakpoint do cabeçalho compacto passou a cobrir tablets de até 820 px, eliminando overflow no
  limiar de 768 px. As expectativas E2E foram alinhadas à interface e às versões atuais.
- Checkpoint final observado: 300 testes em 87 arquivos, 86,11% de statements e 88,31% de linhas;
  typecheck, lint, formatação, build Docker, release smoke, 14 cenários E2E e Quality Gate passaram.
  A stack principal foi reconstruída e permaneceu saudável. Sessenta e cinco arquivos estáticos do
  cliente foram examinados sem marcador proprietário.

## Atualização 2026-08-25 — aplicação do método v2 e revisão pública

- A área autenticada de Orixás passou da matriz baseline para `regency-matrix-0.4.0-v2-research`
  com a configuração v2 composta e feature numerológica derivada da data natal já armazenada.
- A interface apresenta intensidades qualitativas, não percentuais que possam ser confundidos com
  certeza. A Tríade continua podendo se abster quando a convergência não fecha um papel.
- `/metodologia` agora publica entradas, controles de qualidade, versionamento e limites, preservando
  matriz, coeficientes, limiares, regras de desempate e corpus como propriedade intelectual.
- O benchmark `regency:evaluate-v2` substitui o comando derivado antigo. O contrato sem consumidor
  de “ressonância simbólica” e o diagnóstico HTML datado foram removidos como código/artefato morto.
- Homepage, onboarding, dashboard, acervo, metadados e rodapé foram alinhados ao posicionamento v2.
  Nenhuma prova social, precisão espiritual ou acurácia sem amostra foi inventada.
- Matriz e configuração v2 foram marcadas `server-only`; a conta busca um DTO mínimo na rota
  autenticada de regência. O gate pós-build final examinou 61 chunks cliente contra quatro
  marcadores proprietários e não encontrou vazamento.
- Checkpoint observado: 305 testes em 88 arquivos passaram; cobertura global de 86,17% em
  statements e 88,45% em linhas; typecheck, lint, formatação, build de produção e Quality Gate do
  SonarQube passaram. O primeiro build encontrou cache webpack corrompido; a repetição com cache
  isolado compilou integralmente, confirmando que não era regressão da aplicação.
- O Acervo Cultural passou a distinguir visualmente o corpus técnico ampliado dos quatro verbetes
  culturalmente publicados. A página mostra apenas métricas agregadas da pesquisa e preserva a
  coleção privada, a matriz e os critérios proprietários fora da resposta pública.

## Atualização 2026-08-25 — início do método autoral v2

- O responsável autorizou cruzamento amplo do acervo `E:\Ocultismo` com astrologia, numerologia,
  Odù, Ifá, Umbandas, Candomblé, Cabala e sistemas cerimoniais para criar um novo método autoral.
- O desenho implementado está em `docs/research/orixa-method-v2/report-source.md`: grafo de
  evidências, facetas, famílias independentes, canais numerológicos e desempate por estabilidade.
- O inventário encontrou 801 arquivos, 737 hashes únicos e 64 duplicatas exatas. Há 124 PDFs únicos;
  123 possuem artefato de extração por página e 121 geraram texto útil; a única renderização ausente
  tem outra edição da mesma obra extraída, além dos documentos Office/ODT/RTF/TXT.
- Relações preliminares fortes incluem Ogum/Marte, Oxalá/Sol e Xangô/Júpiter em duas famílias. O
  mesmo trabalho do Templo da Pena contém alternativas Oxóssi/Vênus e Oxóssi/Mercúrio, reforçando a
  necessidade de facetas e conflito explícito.
- Foram adicionados cálculo numerológico puro, matriz 1–16, matriz/config v2, suporte no avaliador e
  robustez, e grafo `regency-evidence-graph-0.1.0-research`. Nenhum resultado público mudou. O
  próximo marco é ampliar locators/OCR e validar pesos em dataset consentido congelado.

## Atualização 2026-08-24 — numerologia, Odù e Ifá

- O estudo das três páginas fornecidas, literatura acadêmica e acervo privado `E:\Ocultismo` foi
  registrado em `docs/research/orixa-numerology/report-source.md`.
- Soma decimal da data, associação signo→Orixá e tabela por dia da semana são lentes editoriais
  distintas. A soma 1–16 agora pode entrar somente no scorer v2 de pesquisa e não revela Odù de Ifá.
- A variante 1–16 possui viés estrutural: após reduzir totais acima de 16, os resultados tendem a
  1–9; qualquer protótipo exige auditoria de distribuição e versão própria.
- Fontes divergem dentro das próprias Umbandas: uma etnografia registra numerologia composta em
  uma casa, enquanto Rubens Saraceni rejeita que a data natal identifique Orixá regente.
- Nenhum código, endpoint, cache ou resultado público foi alterado. Próximo passo cultural é obter
  genealogia da “Cabala de Odù” e revisão por praticantes de correntes distintas e por especialista
  de Ifá/iorùbá.

## Atualização 2026-08-24 — cadernos imersivos personalizados

- Nodos Lunares, Mapa do Amor, Mapa Sexual e Mapa Profissional ganharam cadernos longos com índice,
  leitura de posições e casas, manifestação cotidiana, potência, sombra, integração e reflexão.
- Revolução Solar libera 20 capítulos somente após calcular o retorno para a cidade do aniversário:
  oito funções planetárias e as doze casas anuais, sempre em diálogo explícito com o mapa natal.
- Área Lua passou a explicar as oito fases, distingue fase natal de fase mensal e conecta a Lua à
  casa apenas quando há hora conhecida.
- A camada narrativa pura usa `western-editorial-reports-1.0.0`; não altera efemérides nem inventa
  dados ausentes. O benchmark de concorrência foi persistido em `docs/research/competitors/raw/`.

## Atualização 2026-08-24 — módulos comerciais e QA visual

- Meu céu separa Mapa Astral Completo, Revolução Solar, Mapa Sexual, Mapa Profissional, Horóscopo
  Sombrio, Biorritmo e demais leituras.
- A navegação principal usa seis opções em uma linha e “Mais módulos” para o painel secundário, sem
  scrollbar horizontal.
- Revolução Solar exige a cidade onde ocorreu ou ocorrerá o aniversário; não reutiliza
  silenciosamente o local natal.
- Horóscopo Sombrio possui áreas equivalentes ao Horóscopo, mecanismos natais e trânsitos
  atuais/futuros em linguagem de integração.
- Biorritmo usa `classical-primary-secondary-alerts-3.0.0`, com 61 dias, dias zero e
  compatibilidade; permanece explicitamente não científico.
- QA autenticado passou em desktop e Pixel 7, navegando por todas as abas e capturando evidências em
  as capturas de `.planning/` (diretório removido em 28 de agosto de 2026).
- Próximo marco: área Lua com progressões secundárias, Retorno Lunar, trânsitos lunares, fase natal,
  sinastria lunar e Lua fora de curso.

Atualizada em **25 de agosto de 2026**, no fuso `America/Sao_Paulo`. Este é o ponto de retomada
para novas sessões de desenvolvimento. Ele registra o estado observado no workspace local; não
representa commit, CI, revisão externa ou deploy em produção.

## Ordem de leitura para continuar

1. `AGENTS.md`: regras obrigatórias do repositório, segurança e critérios de conclusão;
2. este documento: decisões vigentes, estado operacional e próximos passos;
3. `docs/IMPLEMENTATION_STATUS.md`: inventário funcional detalhado;
4. `docs/BLUEPRINT.md`: arquitetura e fases do produto;
5. `docs/BLUEPRINT.md`: contrato de experiência e motion;
6. `docs/OPERATIONS.md`: operação e retorno do PostgreSQL.

Antes de editar, execute `git status --short` e preserve todas as mudanças existentes. O worktree
estava com alterações ainda não commitadas neste handoff.

## Decisões que permanecem vigentes

- O produto é um **Observatório Ritual**: premium, calmo, editorial e legível. Não deve virar uma
  coleção de efeitos, uma estética Web3 ou uma cópia visual das referências.
- NFTmap orienta espacialidade, navegação orbital e foco em um objeto por vez. Astrarise orienta
  presença imersiva, profundidade e coreografia. AstroAxe mantém identidade própria, quente e
  instrumental.
- Mobile é recomposto, não apenas reduzido. Cada tela admite no máximo um efeito ambiente e um
  momento de revelação.
- Canvas e motion nunca carregam conteúdo essencial. Teclado, foco, contraste, alternativa textual
  e `prefers-reduced-motion` são requisitos, não melhorias opcionais.
- O cálculo ocidental continua determinístico e independente da camada narrativa. Correspondências
  com Orixás são interpretações culturais versionadas, com proveniência e incerteza explícitas.

## Estado funcional observado

- A central autenticada foi reorganizada em Visão geral, Mapa natal, Ciclos e vínculos e
  Configurações. Segurança/Privacidade deixou o fim da página e passou para Configurações junto à
  edição e remoção do mapa. A versão autenticada da mandala usa um navegador compacto de posições,
  sem reaproveitar as alturas de viewport da jornada inicial. O header passou a ocupar a largura
  real da tela, com drawer mobile ancorado, e ganhou paisagem sonora sintetizada localmente,
  silenciosa por padrão e acionada somente por controle explícito.
- A área autenticada ganhou uma superfície própria de Segurança e Privacidade, com portabilidade,
  troca de senha e exclusão de conta em cartões responsivos. A senha da zona irreversível não é
  mais compartilhada implicitamente com o formulário de troca. Cada mapa salvo agora pode ser
  excluído por sua própria zona de gerenciamento, usando diálogo modal nativo, confirmação digitada
  e atualização imediata do arquivo após o `204` da API.
- ASC, DSC, MC e FC permanecem desenhados pelos eixos astronômicos na mandala, mas seus rótulos e
  graus passaram para um trilho instrumental responsivo e sem coordenadas flutuantes. Isso elimina
  colisões quando o meridiano se aproxima do horizonte e mantém os quatro valores legíveis a 320px.
  Motion 13.1.1, MIT e compatível com React 19, foi incorporado somente para entrada da superfície
  de segurança e confirmação destrutiva, respeitando redução de movimento.
- O site possui agora um shell global com marca vetorial AstroAxé, navegação responsiva, entrada
  direta e rodapé. Após o login, /conta abre uma central de módulos em vez de apenas uma ficha.
- Novos mapas calculam treze posições persistidas: dez planetas, Quíron, Nodo Norte verdadeiro e
  Lilith média. Nodo Sul é derivado na apresentação; MC e Fundo do Céu possuem capítulos com signo e
  grau. A configuração foi elevada para western-2026-08-23-extended-points; mapas legados de dez
  posições permanecem legíveis e precisam de recálculo explícito para receber os novos pontos.
- Sinastria entre dois perfis salvos e biorritmo por data estão disponíveis na central. A sinastria
  inicial usa aspectos maiores entre corpos pessoais; o biorritmo é rotulado como tradição popular
  sem comprovação científica. Regências de Orixás continuam em pesquisa e não são simuladas.

- A busca real de cidades voltou a funcionar. `GET /api/geocoding?q=Salvador` retornou candidatos
  pela stack local após a recuperação do PostgreSQL.
- Um mapa sintético foi criado pela API com status `201`, dez planetas e Ascendente. O perfil e a
  sessão de teste foram removidos pelo identificador exato ao final.
- A apresentação dos signos agora deriva o nome em português da longitude e mostra o grau do
  Ascendente dentro do signo. A correção está em
  `src/domain/astrology/western/zodiac.ts`; o histórico e o impacto estão em
  `docs/METHOD.md`.
- Essa correção alterou a apresentação, não o núcleo astronômico. Uma divergência futura deve ser
  reproduzida com input auditável de data, hora, cidade/timezone e modo de hora conhecida antes de
  alterar engine ou configuração.
- O onboarding abre em um palco galáctico de viewport inteira, com formulário em vidro fumê e uma
  única cena orbital em `src/components/onboarding/celestial-observatory-3d.tsx`. A camada Canvas
  antiga, sem consumidor após essa substituição, foi removida com seus estilos e testes exclusivos.

## Contrato atual de motion e cena orbital

- A cena WebGL é progressiva e decorativa; falha de inicialização não bloqueia o conteúdo nem o
  formulário. Com redução de movimento, o estado permanece estático.
- A camada visual não intercepta o formulário e não contém texto ou ação essenciais.
- Viewports `1440×1000`, `390×844` e `320×700` foram inspecionados visualmente sem quebra material
  no fluxo, overflow horizontal, overlay de erro ou erro de console.
- A revelação do resultado usa uma **mandala natal real e interativa**, derivada do mapa calculado,
  com um objeto selecionado por vez, ficha editorial equivalente no DOM, ASC/DSC e casas quando a
  hora é conhecida e modo planetário explícito quando ela é desconhecida.

## PostgreSQL e runtime local

- O bootstrap de desenvolvimento executa `npm ci` antes do Turbopack. Isso mantém o volume nomeado
  `dev_node_modules` sincronizado com o `package-lock.json` após mudanças de dependências; antes
  desse ajuste, o volume antigo ocultava `motion` mesmo após reconstruir a imagem.
- O Compose usa PostgreSQL 18 no volume nomeado `astroaxe_postgres18_data`.
- O volume legado `astroaxe_postgres_data`, identificado como PostgreSQL 16, permanece preservado e
  é a base da janela de retorno. Não o monte em uma imagem PostgreSQL 18 e não execute `down -v`.
- O dump `backups/astroaxe-20260820T024048Z.dump` teve checksum verificado, foi restaurado no volume
  novo e passou pelo script de verificação de restore.
- A base restaurada usa PostgreSQL `18.6` e possui a extensão `vector`. A homologação isolada está
  com 18 migrations Prisma aplicadas, terminando em
  `20260823010000_account_verification_and_recovery`.
- App, PostgreSQL, Redis, worker, Traefik e Prometheus estavam saudáveis no fechamento; release
  smoke, métricas e regras de alerta passaram. Esse estado é volátil: uma nova sessão deve confirmar
  com `docker compose ps` e os endpoints de health antes de assumir que a stack continua no ar.
- O E2E usa volume PostgreSQL 18 isolado pelo nome do projeto Compose e não reutiliza o volume do
  runtime principal. A execução mais recente usou `ASTROAXE_HTTP_PORT=3101` porque a porta padrão
  `3100` já pertencia a outra stack preservada.
- O Redis emitiu aviso do host sobre `vm.overcommit_memory`. Não bloqueou os testes, mas deve ser
  corrigido no host antes de tratar a operação como endurecida.

O procedimento detalhado e o rollback estão em `docs/OPERATIONS.md`. O volume legado e o dump
não podem ser removidos sem backup, alvo explícito e nova autorização.

## Validação mais recente

- `npm run typecheck`: passou;
- `npm run lint`: passou;
- testes: 74 arquivos e 265 testes passaram;
- cobertura: 87,54% statements, 72,27% branches, 93,81% functions e 89,68% lines;
- a antiga implementação Canvas de partículas foi removida por não possuir consumidor;
- `npm run build`: passou;
- E2E em Chromium desktop e mobile: 14 cenários passaram;
- `npm run test:release-smoke`: passou na stack local;
- performance local: 100 requisições, concorrência 10, zero falhas e p95 de 127 ms;
- observabilidade: target, séries e quatro regras passaram;
- restore isolado do dump `backups/astroaxe-20260820T024048Z.dump`: passou;
- navegação real em Chromium: onboarding até resultado, cadastro, conta, acervo, metodologia e
  exclusão da conta sintética passaram em desktop e mobile, sem erros de console;
- `git diff --check`: passou antes deste handoff.

O Quality Gate do Sonar foi reexecutado em 23 de agosto de 2026 e passou: zero novas violações,
81,9% de cobertura no código novo e 0,61511% de duplicação no código novo.

O trabalho está consolidado na branch local `develop`, ainda sem push. A branch remota `main`
permanece intacta até aprovação humana explícita. Depois da aprovação, o fluxo autorizado é enviar
`develop` e, em seguida, reduzir `main` a um README de desenvolvimento por commit normal, sem
force-push.

## Plugins globais de desenvolvimento

Em 21 de agosto de 2026, o marketplace comunitário
`hashgraph-online/awesome-codex-plugins` foi adicionado à configuração global do Codex. Após revisão
de licença, privacidade e runtime, ficaram instalados:

- `citadel@citadel-local` `1.3.5`, fixado no tag oficial: estado/memória de código e workflows
  locais. Seus MCPs `citadel-state` e `codebase-memory` responderam a `tools/list`. O plugin é
  privilegiado e não deve iniciar workflows, branches ou comandos sem solicitação compatível;
- `codexqb@codexqb` `0.3.0`: compreensão, planejamento e QA com ativação exclusivamente explícita
  por `$codexqb`;
- `codex-rg-guard@awesome-codex-plugins` `0.2.4`: skill de busca limitada, complementada pelo MCP
  global `cxs-rg-guard` executado a partir do source tag `v0.2.4`. O servidor respondeu a
  `tools/list` e permanece somente leitura.
- `codex-lsp@codex-lsp-local` `0.2.0-local.1`: build local MIT do upstream `code-yeongyu/codex-lsp`,
  com submodule compilado e MCP validado. A configuração do projeto está em `.codex/lsp-client.json`
  e cobre TypeScript/JavaScript, ESLint, CSS, JSON, YAML e Prisma. O diagnóstico do arquivo de signos
  passou sem erros. O upstream não continha um manifesto de plugin e seu teste de empacotamento
  falhava; por isso a instalação usa um wrapper local mínimo, sem alterar o código-fonte do projeto.

O Waggle foi testado e removido: mesmo com checksum válido do release `v0.1.24`, o runtime Linux
falhou com `ImportError` interno. `claude-smart/Reflexio` e `codex-usage-tracker` não foram
instalados porque persistem interações ou prompts sem uma política de retenção/redaction compatível
com os dados sensíveis do produto. Os plugins instalados só aparecem integralmente em uma nova
sessão do Codex.

Em 22 de agosto de 2026, o carregador do Codex iniciou os MCPs do Citadel a partir da raiz do
projeto, embora o manifest `1.3.5` usasse argumentos relativos à raiz do plugin. A instalação local
foi corrigida para usar caminhos absolutos em `citadel-state` e `codebase-memory`; ambos responderam
ao handshake `initialize` a partir da raiz do AstroAxe e aparecem habilitados em `codex mcp list`.
O timeout de `SessionEnd` também foi alinhado ao limite de 3 segundos aplicado pelo Codex. Essas
alterações inicialmente viviam apenas no cache global e foram sobrescritas pelo carregador. Para
torná-las persistentes, o marketplace global `citadel-local` passou a apontar para a cópia local
fixada `/home/thalis/.codex/local-marketplaces/citadel-1.3.5-fixed`, que contém os caminhos MCP
absolutos e `SessionEnd` limitado a 3 segundos. O cache ativo recebeu a mesma correção, os dois MCPs
responderam novamente ao handshake `initialize` e `codex mcp list` resolveu ambos pela cópia fixa.
Uma atualização futura do Citadel deve ser aplicada conscientemente nessa instalação local e
revalidar manifests, hooks e handshakes antes de substituir a versão fixada.

Ainda em 22 de agosto de 2026, o A5C Babysitter foi instalado globalmente e seu processo de
onboarding foi concluído. A falha recorrente de `PostToolUse` foi rastreada ao wrapper local do
Codex LSP sem a dependência empacotada; o wrapper foi reconstruído e seus oito testes passaram.
O servidor MCP do Citadel também passou a aceitar o campo MCP `_meta`, validado por 21 chamadas
JSON-RPC. Como o AstroAxe usa ESLint/Prettier, `.codex/lsp-client.json` desabilita explicitamente o
Biome embutido para impedir que arquivos HTML acionem um servidor inexistente. O relatório HTML
temporário das 14 verificações do Babysitter não é mais retido no repositório; o estado canônico
permanece registrado nesta memória. Uma nova sessão do Codex é necessária para recarregar o
processo Citadel que já estava em memória antes da correção.

## Próximos passos recomendados

Em 22 de agosto de 2026 foi aprovada a migração da infraestrutura de produção para Docker Swarm em
VPS Contabo, mantendo Compose para desenvolvimento/E2E. A arquitetura usa Cloudflare Tunnel e
Traefik privados, app replicado, workers separados e SMTP relay gerenciado. A primeira fase adicionou
suporte fail-closed a Docker secrets por `*_FILE` no app, worker e Prisma migrate; o runbook está em
`docs/OPERATIONS.md`. Brevo SMTP é o candidato inicial de menor custo, sujeito à criação da conta,
verificação do domínio e teste de SPF/DKIM/DMARC. Nenhum cluster, secret real ou integração externa
foi criado nesta fase. A fundação stateless da Phase 2 está em `infra/swarm`: imagens exclusivamente
por digest, socket proxy filtrado, Traefik privado, duas réplicas de Cloudflare Tunnel, app replicado,
scheduler singleton, redes overlay criptografadas, migration efêmera antes da atualização, preflight,
rolling update, rollback e smoke. Esses artefatos ainda precisam ser exercitados em um Swarm de
staging com os nós, registry, tunnel e secrets reais antes de serem considerados operacionais.
O contrato de deploy foi esclarecido: homologação roda exclusivamente em Docker Compose local, pelo
projeto isolado `astroaxe_homolog`, na porta `3200`, com PostgreSQL/Redis próprios e Mailpit em
`127.0.0.1:8025`; produção roda em Docker Swarm nas VPS Contabo com domínio e Cloudflare. Os comandos
locais são `npm run homolog:up`, `homolog:smoke` e `homolog:down`; o último preserva volumes.
O primeiro startup da homologação detectou que o target `migrate-runner` não copiava a nova boundary
de Docker secrets importada por `prisma.config.ts`; o Dockerfile foi corrigido para incluir somente
esse arquivo adicional antes da repetição do smoke. A repetição também revelou a janela curta entre
o health do container Traefik e o carregamento do primeiro router; `homolog:up` passou a aguardar
explicitamente `/api/health/ready` pela entrada antes de executar o release smoke.
O email transacional agora usa a tabela `email_outbox`: o cadastro e a mensagem de boas-vindas são
atômicos, e o scheduler entrega por SMTP com lease, seis tentativas, backoff, estado `DEAD` e
`Message-ID` determinístico. Homologação envia apenas ao Mailpit; produção lê a senha Brevo por
Docker Secret e não entrega a credencial ao app web. O contrato e a preparação SPF/DKIM/DMARC estão
em `docs/OPERATIONS.md`. A migration foi aplicada na homologação e
`npm run homolog:email-smoke` validou cadastro sintético, outbox, worker e Mailpit com limpeza exata
do usuário de teste. Ainda falta validar uma entrega com domínio e conta reais em staging; nenhum
provedor externo foi configurado nesta sessão.
Verificação de email e recuperação de senha foram adicionadas sobre a mesma outbox. Tokens de ação
são de uso único, persistidos apenas como hash, expiram em 24 horas/30 minutos e são removidos pelo
worker após expirar. A redefinição revoga sessões anteriores e cria uma nova. Em homologação, uma
conta sintética confirmou o email, redefiniu a senha pelo link recebido, recebeu `401` na sessão
antiga, `200` na nova e `400` ao tentar reutilizar o token; a conta foi excluída ao final.
A primeira mandala natal funcional foi integrada ao resultado do onboarding e ao arquivo autenticado. Ela usa somente as
longitudes, casas e ângulos já calculados, oferece seleção por botões acessíveis no instrumento e na
lista, mantém as dez posições legíveis no DOM e omite casas/ASC/DSC quando a hora é desconhecida.
Marcadores próximos usam lanes radiais determinísticas que não alteram os graus exibidos. A
verificação Playwright cobriu 320px, 768px e 1440px, ausência de overflow, teclado, reduced-motion,
dez posições no DOM e colisões sintéticas; a inspeção visual corrigiu o overflow interno do primeiro
layout. O resultado pós-onboarding agora é uma jornada independente: a primeira dobra é dedicada à
mandala, as doze casas são numeradas, ASC/DSC exibem seus signos e a leitura continua em capítulos
editoriais de scroll para os ângulos e dez planetas. A entrada da mandala ocorre uma vez e os capítulos
são revelados uma vez ao entrar no viewport, com alternativa estática para redução de movimento. O
mobile possui enquadramento próprio e mantém o conteúdo editorial abaixo do instrumento. O snapshot
natal persistido é validado na API antes de alimentar a mesma componente na área
da conta, sem recalcular no navegador.

Em 24 de agosto de 2026, a área autenticada passou a apresentar Quíron, Lilith média e o eixo nodal
em um painel próprio, usando exclusivamente as longitudes já presentes no snapshot natal. O Nodo
Sul é derivado como ponto oposto ao Nodo Norte. O módulo de Orixás deixou o placeholder e abriu o
laboratório da matriz aprovada: ele mostra rankings de frente, cabeça e costas, preserva abstenções,
expõe versões e declara que a pesquisa não substitui confirmação religiosa ou jogo de búzios. Isso
não promove a matriz de pesquisa a regência religiosa validada. O áudio ambiente foi removido; há
somente tons curtos de interação em botões e links, desligados por padrão e ativados por controle
persistente na interface. A comparação visual direta com Astrarise, NFTmap, Astrolink/Orbia e
Personare está em `.planning/research/reference-sites-visual-comparison.md` (removido em 28 de agosto de 2026; conclusões absorvidas em `docs/BLUEPRINT.md`), com capturas em
as capturas de `.planning/` (diretório removido em 28 de agosto de 2026) e as capturas de `.planning/` (diretório removido em 28 de agosto de 2026). O fluxo autenticado passou
em Playwright desktop e Pixel 7; o checkpoint registrou 268 testes, 87,2% de statements, build Next
16 aprovado e Quality Gate SonarQube aprovado.

Ainda em 24 de agosto, Quíron, Lilith média e os Nodos passaram a aparecer também dentro da aba
“Mapa natal”; snapshots legados mostram os quatro slots e encaminham para recálculo, em vez de
sumirem silenciosamente. O módulo de Orixás agora se identifica visualmente como Beta/em
desenvolvimento e executa `regency-robustness-0.1.0-beta`, uma análise determinística de estabilidade
por retirada de cada escola de correspondência. Ela complementa, mas não substitui, o benchmark
com autodeclarações verificáveis. Fóruns foram usados apenas para descobrir linguagem, divergências
entre tradições e riscos metodológicos; posts anônimos sem identidade, consentimento e nascimento
verificáveis não entram no dataset. A home ganhou uma cena orbital em perspectiva 3D construída com
canvas e transformações CSS, sem nova dependência, com pausa fora da viewport e alternativa para
movimento reduzido. O som continua restrito a interações opt-in.

Após revisão visual, a primeira tentativa em CSS 3D foi substituída integralmente por uma cena
Three.js/WebGL 2. A home limita DPR, pausa fora da viewport/aba, respeita redução de movimento,
libera recursos da GPU e oferece fallback estático. A narrativa sticky e toda resposta a scroll ou
ponteiro foram removidas após feedback: a home voltou a ser uma composição única e estável. O Sol
permanece fixo, com superfície procedural e corona baseada nas referências SDO; os oito planetas
orbitam com velocidades relativas distintas. Os materiais planetários derivam do mosaico NASA/JPL
PIA01341 (Mariner 10, Magellan, Galileo, Viking e Voyager), e Saturno usa PIA01364; originais,
derivados e créditos estão em `public/assets/nasa`. Ordem, inclinações relevantes e sentidos são
preservados, mas tamanhos e distâncias são visualmente comprimidos para manter os planetas visíveis.
Não há anéis orbitais decorativos. O sistema ocupa o wallpaper da experiência, enquanto copy e
formulário possuem superfícies legíveis próprias. Three.js 0.185.1 e seus tipos foram fixados após
consulta à documentação e licença MIT.

Ainda em 24 de agosto, a Sinastria deixou de encaminhar “Adicionar mapa” para o onboarding da home.
O segundo nascimento agora é criado dentro da conta autenticada, recarregado no arquivo e
selecionado automaticamente para comparação. A engine editorial
`major-cross-aspects-editorial-2.0.0` passou de cinco para treze corpos e pontos natais, com 36
aspectos maiores, nove capítulos e textos determinísticos que variam por par, aspecto, signos e
orbe. A leitura cobre também expansão, compromisso, transformação, Quíron, Lilith e Nodo Norte; o
cálculo natal persistido não foi alterado.

1. Medir frame time e resposta do input em dispositivo físico antes de elevar a densidade visual da
   mandala; a validação automatizada não substitui teste em GPU/touch real.
2. Tratar o aviso `vm.overcommit_memory` e definir backup externo criptografado, alertas externos e
   SLOs antes de produção.
3. Prosseguir com Tríade/regências somente pelo protocolo cultural e de pesquisa documentado, sem
   transformar hipóteses em resultado público.

Sinastria e Biorritmo agora possuem abas independentes na área autenticada; Ciclos permanece
dedicado a trânsitos e diário. O Biorritmo ganhou leitura por fase para os ciclos físico, emocional
e intelectual. Quíron, Lilith média, Nodo Norte e Nodo Sul passaram de cartões de coordenadas para
capítulos breves com significado próprio e interpretação variável pelo signo calculado.

O antigo destino Ciclos foi ampliado e renomeado para Horóscopo. Ele reúne resumo natal por áreas,
trânsitos atuais, sombras e navegação de previsões por até 90 dias, com fallback editorial
pré-escrito e versionado quando não há template publicado. A conta também recebeu destinos próprios
para Nodos Lunares, Mapa do Amor, Guia Astrológico do ano vigente e Ciclo Lunar. O Biorritmo agora
mostra curvas de 31 dias, capítulos dos ciclos primários e os secundários Domínio, Paixão e
Sabedoria.

Ainda em 24 de agosto, “Ciclo lunar” foi substituído por uma Área Lua calculada e versionada. A
engine `lunar-dashboard-1.0.0` oferece fase natal exata, mansão tropical árabe explicitamente
identificada, Lua progredida por progressão secundária, fase progredida, casa natal quando há hora
conhecida e Lua fora de curso segundo uma definição operacional documentada. A cidade atual ergue
um Retorno Lunar exato com Ascendente, Meio do Céu e capítulos mensais; a interface também reúne
aspectos lunares atuais, comparação Lua–Lua e a casa que cada Lua ocupa no mapa do outro quando os
dois mapas possuem casas. Referenciais védicos e árabes não são misturados. Calendário eletivo é
descrito como tradição simbólica e não fornece indicação médica, cirúrgica ou financeira.

O checkpoint desta ampliação registrou 292 testes, 86,11% de statements e 88,26% de linhas, build
Next 16 aprovado e Quality Gate SonarQube aprovado após eliminar uma atribuição redundante apontada
pelo analisador. O fluxo autenticado completo passou em desktop Chrome e Pixel 7. As APIs de
Revolução Solar e Área Lua responderam `200`; o E2E passou a sincronizar com essas respostas em vez
de depender do timeout visual padrão durante a primeira compilação Turbopack.

Na revisão visual seguinte da home, foram removidos os últimos círculos decorativos herdados de
CSS no fundo do planetário e no painel do formulário. A cena WebGL não desenha trilhas orbitais: o
único sistema de anéis visível pertence a Saturno e vem da imagem NASA. Capturas desktop e Pixel 7
sem os círculos estão em as capturas de `.planning/` (diretório removido em 28 de agosto de 2026).

## Borda pública configurada antes da VPS

Em 2026-08-26 a zona `astroaxe.net` deixou de estar no default de fábrica. O estado anterior aceitava
TLS 1.0, não redirecionava HTTP, não validava o certificado da origem e mantinha o WAF gerenciado
desligado, sem nenhum registro DNS publicado.

A borda passou a ter TLS estrito com mínimo 1.2, redirecionamento HTTPS, Managed Free Ruleset ativo,
quatro regras WAF custom, rate limiting nas rotas de autenticação, regras de cache que excluem toda
superfície autenticada, Bot Fight Mode com bloqueio de crawlers de treino de IA, e Zero Trust Access
por One-time PIN no staging. Tudo foi verificado contra a borda real, não apenas contra a API: TLS
1.1 recusado, WAF respondendo `403` nas rotas cobertas, rate limiting cortando na 16ª requisição e
Access redirecionando para login antes da origem.

Duas correções vieram dessa verificação. A regra WAF de `TRACE`/`TRACK` era inerte, porque a
Cloudflare já recusa esses métodos com `405` antes do WAF; o slot foi realocado para proteger
`/api/geocoding`, cujo abuso queima a reputação do projeto no Nominatim em vez de gerar custo
interno. E o CAA publicado é menos restritivo do que aparenta: a Cloudflare sintetiza registros
para as CAs parceiras dela, inclusive `issuewild`, e isso não é configurável no plano Free. O acesso à aplicação existe apenas por Cloudflare Tunnel: a zona não
tem registro `A`, então nenhum IP de origem é descobrível.

O domínio está declarado como não-remetente no DNS até existir relay e endereço de contato. HSTS
permanece desligado de propósito e só deve ser ativado, de forma faseada, depois do primeiro deploy
com HTTPS confirmado — ligá-lo antes grava nos navegadores uma instrução que não se revoga
remotamente.

Enquanto a VPS não existe, o apex não devolve erro: um Worker (`astroaxe-holding`) publica uma
página de espera na borda, respondendo `503` com `noindex` para não ser indexada como se fosse o
site real. O fonte está em `infra/cloudflare/holding-page/worker.js` e sai do ar apagando a rota,
sem tocar em DNS.

O runbook autoritativo é `docs/OPERATIONS.md`; o desenho aprovado está em
`docs/superpowers/specs/2026-08-26-cloudflare-edge-design.md`.

## Integrações Codex, Citadel e Cloudflare

Em 2026-08-26 a integração local do Citadel foi corrigida para executar os delegates CommonJS do
projeto e a instalação global passou a usar o commit sanitizado `a3df1b9` do PR upstream #271. A
correção cobre resolução portátil dos dois MCPs, aceitação do campo MCP `_meta`, envelopes nativos
de `SessionStart` e `PostToolUse` e limite de três segundos para `SessionEnd`. Os testes de integração
nativa e os 21 casos JSON-RPC do `citadel-state` passaram tanto no cache global ativo quanto pelo
delegate do projeto. A instalação anterior foi preservada como rollback; uma nova sessão do Codex é
necessária para recarregar hooks e definições já capturados pelo processo atual.

Na configuração Cloudflare, a entrada duplicada foi removida e ficaram 17 endpoints únicos: dois
públicos e quinze protegidos por OAuth. Não há credenciais, URLs de autorização nem estado OAuth
versionados no projeto.

## Checklist curto de retomada

```bash
git status --short
docker compose -f compose.yml -f compose.dev.yml config
docker compose -f compose.yml -f compose.dev.yml ps
curl --fail http://127.0.0.1/api/health/live
curl --fail http://127.0.0.1/api/health/ready
npm run typecheck
npm run lint
```

Consulte os documentos temáticos antes de modificar domínio, banco, conteúdo cultural ou motion.
Não repita a migração PostgreSQL já concluída e não descarte o volume legado durante a janela de
retorno.
