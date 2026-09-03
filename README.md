# AstroAxe

Astrologia calculada, regencias culturais contextualizadas e ritual diario.

Para continuar o desenvolvimento em outra sessão, comece por
[`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md). Ela registra o estado local observado, decisões
vigentes, validações, riscos e a próxima fronteira do produto.

## Branches

- `develop` é a linha permanente de integração e validação do MVP.
- `main` é reservada exclusivamente a versões promovidas para produção. Enquanto não houver uma
  release aprovada, seu snapshot contém apenas um aviso de desenvolvimento.

## Requisitos

- Docker Engine com Compose v2
- Para comandos fora do Docker: Node.js 24 e npm 11

## Desenvolvimento local

1. Copie `.env.example` para `.env` e gere senhas URL-safe diferentes.
2. Atualize `DATABASE_URL` e `REDIS_URL` com as mesmas senhas.
3. Execute `docker compose -f compose.yml -f compose.dev.yml up --build`.
4. Abra `http://localhost`.

PostgreSQL e Redis nao publicam portas no host. `/api/health/live` verifica o processo;
`/api/health/ready` verifica PostgreSQL e Redis sem expor mensagens internas.

O PostgreSQL 18 monta o volume em `/var/lib/postgresql`. Volumes criados por PostgreSQL 16 ou
17 exigem backup/restore ou `pg_upgrade`; nunca aponte a imagem 18 diretamente para o layout
antigo em `/var/lib/postgresql/data`.

No ambiente local atual, o volume ativo é `astroaxe_postgres18_data`. O legado
`astroaxe_postgres_data` contém PostgreSQL 16 e permanece preservado para retorno; nunca use
`down -v` nem o monte na imagem 18. Consulte `docs/OPERATIONS.md`.

## Qualidade

Os checks rapidos sao `npm run typecheck`, `npm run lint` e `npm test`. O gate completo roda
`npm run quality` e envia a cobertura LCOV ao SonarQube local. Consulte a documentacao em
`docs/` para inicializar o perfil de qualidade.

Para comparar o `.gitignore` do projeto com a base mantida pelo gitignore.io/Toptal, execute
`npm run gitignore:preview` e revise a saída. O comando nunca altera arquivos; redirecione para
um arquivo temporário quando quiser comparar mudanças.

O build usa o compilador Webpack suportado pelo Next.js. O Turbopack permanece no modo de
desenvolvimento; neste ambiente ele nao consegue abrir o processo interno usado pelo PostCSS.

## Motor astrológico

O domínio ocidental usa Caelus fixado e dados efemérides embarcados. Horários civis são
convertidos por timezone IANA antes do cálculo em UTC. Quando a hora é desconhecida, o contrato
retorna posições de referência e a faixa diária da Lua, mas omite casas, Ascendente e Meio do
Céu. Resultados incluem versões de engine/config e fingerprint SHA-256 dos inputs normalizados.

## Fronteira do freemium

O produto é freemium, e a fronteira vive num só lugar: `src/lib/access/features.ts`. Cada recurso
declara o nível mínimo de acesso, e `authorizeFeature` recebe o recurso — nunca a regra. Trocar o
preço de algo é editar uma linha do catálogo.

| Nível       | O que alcança                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `anonymous` | `/tempo-cerimonial` e `/acervo-cultural`: mostram o método sem guardar dado de ninguém                  |
| `free`      | mapa natal, horóscopo, horóscopo sombrio, arquivo da conta e exportação                                 |
| `paid`      | trânsitos, lunar, retornos, sinastria, calendário, mapas temáticos, tríade e as ferramentas cerimoniais |

Gratuito não quer dizer anônimo. Os três recursos gratuitos dependem de data, hora e lugar de
nascimento, e guardar isso sem titular criaria dado pessoal que ninguém pode pedir para apagar
ou exportar.

**O paywall ainda não existe** — o produto está em fase de teste, e `hasPaidPlan` trata qualquer
conta autenticada como paga. Ligar a cobrança é mudar aquela função, e nada mais.

Exportar os próprios dados nunca sobe para `paid`: acesso e portabilidade são direito do titular
na LGPD, e há teste travando isso.

## Onboarding

A página inicial entrega nome/apelido, data, hora opcional e cidade em quatro etapas. A busca de
cidades usa Nominatim somente com o texto da cidade, deriva o timezone pelas coordenadas e mantém
cache por 30 dias. Criar o mapa exige conta: dados natais nunca devem ir para logs, analytics,
URLs ou serviços de geocoding.

## Ferramentas cerimoniais

Quatro ferramentas pagas, reunidas em `/ferramentas`. Elas calculam, cruzam e guardam — e nenhuma
sugere o que fazer, por decisão de produto.

- **Buscador de janelas** varre um período hora planetária por hora planetária e devolve as que
  atendem a cada critério de eleição.
- **Diretório de correspondências** inverte o grafo de funções: dado um nome, que posição ele
  ocupa e quem mais a ocupa, vindo de outra linhagem.
- **Planejador** guarda planos e sessões cifrados, com exclusão em cascata e rastro auditável.
- **Tábua operacional** lista planeta, signo, elemento, modalidade e casa por Orixá, sempre
  rotulados como hipótese autoral e não como afirmação das tradições.

## Producao

O Compose principal serve HTTP localmente para desenvolvimento. TLS/ACME, backup externo,
segredos de producao e restauracao testada devem ser configurados pelo runbook de deploy antes
de publicar o servico.
