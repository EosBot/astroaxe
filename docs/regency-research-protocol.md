# Protocolo de pesquisa e validação das regências

## Objetivo

Construir e comparar versões determinísticas do método AstroAxe para Orixá de frente, cabeça e
costas. A matriz combina astrologia, ocultismo, narrativas, símbolos naturais e sistemas
afro-brasileiros, preservando a origem de cada correspondência para análise e ajuste.

## Trilhas de evidência

Cada correspondência recebe uma ou mais trilhas independentes:

1. fonte primária publicada por sacerdote, casa, comunidade ou autor da escola estudada;
2. fonte institucional, etnográfica ou acadêmica com locator;
3. sistema ocultista publicado, incluindo sua tradição, edição e justificativa;
4. convergência simbólica editorial AstroAxe, descrita como hipótese calculável;
5. evidência empírica de calibração, sem alterar o significado histórico da fonte.

Discordâncias não são apagadas. A matriz pode testar sínteses entre escolas, mas cada peso conserva
o caminho que o originou.

## Regência dinâmica e facetas

A entidade não é reduzida a um arquétipo invariável. Uma correspondência pode declarar uma faceta
específica ativada ou reforçada por planeta, signo, casa, ângulo, decanato, dignidade, aspecto, dia
planetário ou hora planetária. A identidade da entidade permanece estável; o contexto altera a
manifestação e o peso daquela faceta.

O método separa o contexto natal do contexto da leitura. Dias planetários começam no nascer do sol;
as doze horas diurnas dividem o intervalo entre nascer e pôr do sol, e as doze noturnas dividem o
intervalo entre o pôr e o nascer seguinte. Portanto, “hora planetária” não significa uma hora civil
fixa. Nascer e pôr do sol são calculados por uma boundary astronômica com data, coordenadas e fuso e
entram no snapshot auditável. Sem hora conhecida ou intervalo solar válido, o fator correspondente é
omitido e a precisão declarada diminui.

Analogias com magia cerimonial, astrologia tradicional ou outras religiões podem orientar a forma do
modelo — por exemplo, uma mesma entidade expressar facetas diferentes sob regências temporais — mas
não provam equivalência entre entidades de sistemas distintos. Cada aplicação concreta a um Orixá
precisa de claim próprio, fonte e escola identificadas.

## Casos de referência

### Casos sacerdotais

- autorização explícita para pesquisa;
- data, hora, cidade e tríade conhecida;
- qualidade da hora e tradição/linhagem quando isso puder ser informado;
- nenhum nome, contato, relato íntimo, dado ritual reservado ou texto de consulta no dataset;
- direito de retirada por ID opaco.

### Casos públicos

Um caso só é elegível quando existem duas cadeias independentes:

1. autodeclaração pública inequívoca da própria pessoa sobre sua regência;
2. data, hora e local de nascimento com fonte identificável e classificação de qualidade.

Entrevista, vídeo, livro autobiográfico ou publicação da própria pessoa têm precedência. Matéria que
apenas repete rumor, página sem fonte, inferência por personalidade ou atribuição de terceiro não é
rótulo válido. A fonte pode ser arquivada por URL, título, data de acesso, trecho mínimo permitido e
hash; conteúdo integral protegido não é copiado.

Pessoas vivas recebem proteção adicional: o dataset analítico usa ID opaco e não publica tabela
nominal. A página metodológica divulga critérios e métricas agregadas.

## Separação e métricas

- divisão por pessoa entre calibração e validação, antes de ajustar pesos;
- deduplicação de variantes, republicações e mapas retificados;
- métricas por frente, cabeça, costas, top-3 por papel e tríade completa;
- matriz de confusão por Orixá e análise de cobertura do conjunto;
- cortes por hora conhecida/desconhecida, origem do caso e tradição declarada;
- intervalo de confiança e tamanho da amostra junto de toda porcentagem;
- taxa de abstenção por papel, para distinguir prudência do motor de erro de classificação;
- baseline simples publicado para demonstrar ganho real da matriz robusta.

Casos com apenas um ou dois papéis explicitamente declarados podem contribuir para a métrica desses
papéis, sem preenchimento inferido dos demais. Cada papel usa seu próprio denominador. A acurácia de
tríade completa considera exclusivamente casos com os três rótulos disponíveis; quando não houver
nenhum, o relatório retorna amostra zero e acurácia nula, nunca zero por conveniência.

Da mesma forma, a previsão pode conter somente frente e cabeça. Costas é tratado como papel ancestral
de manifestação variável: ausência de evidência suficiente gera abstenção explicada, não um terceiro
nome escolhido por desempate. Quando calculável acima dos mínimos versionados, o ancestral é exibido
e participa das métricas do papel e da tríade completa.

O conjunto de validação permanece congelado durante cada versão. Um caso corrigido gera nova versão
do dataset e registro `ANTES / DEPOIS / MOTIVO / IMPACTO`.

A versão `regency-evaluation-0.3.0` calcula intervalos de Wilson de 95% para acurácia top-1, top-3 e
tríade exata. Ela também recusa uma impressão digital de evidência presente nas duas partições e
reporta cortes por proveniência. Esses controles não substituem a deduplicação humana por pessoa,
mas detectam reutilização exata das mesmas cadeias documentais no artefato sanitizado.

A versão `regency-evaluation-0.4.0` acrescenta rótulos públicos não ordenados em `expected.anyOf`.
Ela existe para declarações como “sou de X” ou “meus Orixás são X e Y”, quando a fonte não atribui
frente, cabeça ou costas. Esses rótulos medem cobertura na tríade selecionada e no top-3 de qualquer
papel, sem alimentar acurácia por papel ou tríade exata. Uma declaração sem papel nunca é convertida
silenciosamente em cabeça.

Registro da mudança:

- **ANTES:** todo caso precisava atribuir ao menos um Orixá a frente, cabeça ou costas;
- **DEPOIS:** casos podem preservar um conjunto `anyOf`, com métricas agregadas próprias;
- **MOTIVO:** autodeclarações públicas e relatos consentidos frequentemente nomeiam Orixás sem papel;
- **IMPACTO:** mais casos podem ser auditados sem fabricar rótulos, mas não passam a satisfazer a
  amostra mínima por papel nem autorizam promoção do motor.

O método `regency-robustness-0.1.0-beta` adiciona uma análise de sensibilidade
`leave-one-school-out`. O scorer é repetido removendo, uma por vez, cada escola pública de
correspondência; por papel, o relatório mede quantas vezes o primeiro candidato original permanece
no topo e, quando houve seleção, quantas vezes o selecionado permanece no topo. Uma única escola é
amostra insuficiente. A medida não é probabilidade religiosa nem acurácia observada: ela detecta
dependência excessiva de uma família de fontes e orienta abstenção e revisão.

Registro da mudança:

- **ANTES:** a avaliação media acerto em casos rotulados, mas não expunha a sensibilidade do
  resultado à retirada de uma escola de correspondência;
- **DEPOIS:** a interface Beta mostra estabilidade experimental e a versão do teste de robustez;
- **MOTIVO:** uma pontuação alta pode ser frágil quando depende de uma única família documental;
- **IMPACTO:** resultados instáveis ficam visíveis e devem favorecer abstenção. O teste não promove
  pesos, não substitui validação externa e não confirma Orixás de ninguém.

Antes de qualquer comparação, `regency-comparison-0.1.0` calcula um SHA-256 canônico do dataset
sanitizado e registra apenas versão, digest e contagens agregadas. Baseline e experimental precisam
usar a mesma versão e a mesma partição de validação. A política inicial exige 30 rótulos em frente e
cabeça, não aceita perda top-1/top-3 e limita o aumento de abstenção a cinco pontos percentuais.
Passar esses critérios significa somente elegibilidade para revisão cultural; não ativa a versão no
produto.

## Execução do benchmark

O benchmark local recebe um JSON já derivado e sanitizado:

```bash
npm run regency:prepare-case -- caminho/seguro/caso-bruto.json > caso-derivado.json
npm run regency:evaluate -- caminho/seguro/dataset.json
```

O primeiro comando exige `FINGERPRINT_SECRET`, aceita no máximo 256 KiB e remove nascimento,
localização e URLs da saída. Em seu lugar, conserva apenas as features calculadas e um HMAC das duas
cadeias de evidência. O arquivo bruto e o vínculo entre pessoa, caso e fontes permanecem fora do
repositório, com acesso restrito e procedimento de retirada.

O arquivo é limitado a 10 MiB e validado integralmente antes do cálculo. Deve conter ao menos um
caso de calibração e um de validação para produzir os dois relatórios. A saída contém somente versões,
tamanho das amostras, acurácias e matrizes de confusão agregadas. Erros não imprimem conteúdo, caminho
completo, casos ou valores rejeitados. O dataset bruto não deve ser versionado no repositório.

A hora planetária natal é calculada pelo `caelus` já fixado no projeto, usando Julian Day,
latitude e longitude. O cálculo divide os intervalos reais de nascer–pôr e pôr–nascer seguinte. Em
condição polar sem intervalo solar, retorna `solar_interval_unavailable` e o fator é omitido.

Para condições polares existem duas políticas explícitas:

- `strict` (padrão): não produz dia/hora planetária e registra `method: unavailable`;
- `equinoctial_local_solar`: proxy experimental com nascer às 06:00 e pôr às 18:00 em tempo solar
  local médio, formando 24 segmentos iguais e preservando a sequência caldaica.

O proxy nunca é apresentado como nascer ou pôr do sol observado. Ele conserva
`solar_interval_unavailable`, registra `method: equinoctial_local_solar_proxy` e tem métricas
separadas no benchmark. A política só poderá se tornar padrão em latitude polar se superar a omissão
no conjunto de validação sem degradar a calibração global.

## Segurança e uso

Os datasets não entram em logs, analytics, LLM, MCP ou serviços externos. A coleta guarda somente o
necessário para auditoria e cálculo. Acesso bruto é restrito; artefatos versionados no repositório
contêm apenas dados derivados ou sintéticos até que haja uma política específica de pesquisa e
publicação.

## Precedentes iniciais

- UNESCO, sistema divinatório de Ifá: <https://ich.unesco.org/en/RL/ifa-divination-system-00146>;
- José Henrique M. Oliveira, estudo sobre W. W. da Matta e Silva e as Sete Linhas:
  <https://klineeditora.com/revistajesushistorico/arquivos22/3-JOSE-HENRIQUE-OLIVEIRA.pdf>;
- pesquisas etnográficas e fontes registradas em `docs/knowledge/sources.md`.
