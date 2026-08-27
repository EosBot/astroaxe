# Ingest cerimonial — extração isolada do acervo privado

Runbook da Task 13 do roteiro `.omo/plans/astroaxe-roadmap-ceremonial-laboratory.md`. A T12
respondeu **o que existe** no acervo; esta task responde **o que dele vira texto**, sob quais
limites e com qual prova de integridade.

O acervo é material privado do responsável. Nada aqui o copia, move ou altera, e nenhum
caminho do acervo entra em documento versionado.

## O que o pipeline faz

1. Lê o manifesto da T12 e percorre uma linha por vez, em ordem estável.
2. Escolhe o adaptador pelo tipo detectado. **Só abre o arquivo quando existe adaptador** —
   os 538 MP3 do acervo nunca são lidos.
3. Reverifica a fonte antes de extrair: abre com `O_NOFOLLOW`, confirma arquivo regular,
   compara tamanho e SHA-256 com o censo. Divergência vira quarentena, não ingestão.
4. Roda o adaptador com o **descritor já verificado** como stdin. O binário nunca recebe um
   caminho, então não há janela para troca de nome entre a verificação e a leitura.
5. Reconfere `fstat` depois da extração (inode, device, tamanho, mtime). Se mudou durante a
   leitura, o derivado é descartado.
6. Normaliza o texto de forma determinística, grava em quarentena, relê, reconfere o hash e
   só então promove por rename atômico para o volume reconstruível.

Cada linha do censo termina em exatamente um estado. Não existe omissão silenciosa.

## Cobertura de extração: o que entra e o que não entra

| Tipo                 | Adaptador               | Ferramenta                    |
| -------------------- | ----------------------- | ----------------------------- |
| PDF                  | `pdf-text`              | `pdftotext` (poppler)         |
| JPEG, PNG, GIF, WebP | `ocr-image`             | `tesseract` (por+eng)         |
| Texto simples        | `plain-text`            | código puro                   |
| RTF                  | `rtf`                   | código puro                   |
| DOCX / ODT           | `ooxml`, `opendocument` | `bsdtar` + transformação pura |

**Áudio e vídeo não são transcritos.** Os registros recebem `NO_ADAPTER` com motivo
`AUDIO_NOT_TRANSCRIBED` ou `VIDEO_NOT_TRANSCRIBED`. Três razões, nesta ordem:

- não existe transcritor local determinístico aceitável — ASR neural não reproduz saída byte
  a byte, e o hash do derivado deixaria de valer como prova de integridade;
- o plano proíbe modelo externo na camada de busca local (T16);
- transcrever ponto cantado é decisão cultural sobre material sagrado, e essa decisão não foi
  tomada por ninguém com autoridade para tomá-la. A ausência é declarada, não suprida.

`.doc` legado (OLE2) também fica `UNSUPPORTED_FORMAT`: as ferramentas disponíveis são
abandonadas e não vale ampliar a superfície do container por um arquivo.

A cobertura reportada é sobre **todas** as linhas do censo, não sobre as tentadas. Um número
baixo aqui é a verdade sobre um acervo majoritariamente sonoro, não uma falha.

## Isolamento do container

`compose.ingest.yml` é um projeto Compose separado — sem banco, sem Redis, sem segredo, sem
rede:

- `network_mode: "none"` — não existe interface dentro do container. Um bug de parser não tem
  para onde mandar o que leu.
- `read_only: true`, `user: "1000:1000"`, `cap_drop: [ALL]`, `no-new-privileges:true`.
- `cpus`, `mem_limit`, `memswap_limit` e `pids_limit` limitados; `/tmp` é tmpfs com
  `noexec,nosuid,nodev`.
- O acervo é montado `:ro`. Os únicos destinos graváveis são o volume de derivados e `/work`.

**Desvio declarado — seccomp.** O plano pede um allowlist seccomp próprio. O container roda
sob o **perfil padrão do Docker**, que já é um allowlist (nega ~44 syscalls por
`SCMP_ACT_ERRNO`) e que não foi desabilitado. Um perfil escrito à mão com ~350 entradas
quebraria o Node de formas silenciosas e específicas de versão, e um allowlist errado é pior
que o padrão testado. Combinado com `network_mode: none` e `cap_drop: ALL`, a superfície
efetiva já exclui rede, mount, ptrace e escalonamento de privilégio. Se um perfil próprio for
exigido, ele deve ser derivado do perfil upstream do moby e validado rodando o acervo inteiro,
não escrito de memória.

## Limites do pipeline

Definidos em `src/domain/ceremonial/extraction.ts` e cobertos por teste:

- fonte acima de 512 MiB não chega a nenhum adaptador;
- saída acima de 32 MiB é **recusada** (`OUTPUT_TOO_LARGE`), nunca truncada — é assim que uma
  bomba de descompressão termina;
- 180 s de relógio por execução de adaptador; estourar é `ADAPTER_TIMEOUT`, sem resultado parcial;
- no `pdf-ocr`, onde há uma execução por página, vale também um teto de 1 h por documento e de
  400 páginas. São os dois necessários: sem o teto por documento, um livro longo ocuparia o
  container por um dia sem que nenhuma execução isolada estourasse.

Os limites do container ficam por fora dos limites do pipeline, então o processo bate no
limite lógico antes de bater no limite físico.

## Comandos

```bash
# 1. Gate de suprimentos: SBOM + Trivy fixado + política. Precisa de rede no host.
npm run ceremonial:scan

# 2. Censo (T12), se ainda não existir um manifesto atual.
CEREMONIAL_MODE=local CEREMONIAL_ARCHIVE_ROOT=<acervo> \
CEREMONIAL_KEYRING_FILE=<keyring> \
  npm run ceremonial:inventory -- <dir-local>/inventory.json --baseline 801/737/64

# 3. Extração, dentro do container sem rede.
CEREMONIAL_ARCHIVE_HOST_PATH=<acervo> CEREMONIAL_WORK_HOST_PATH=<dir-local> \
  docker compose -f compose.ingest.yml run --rm ceremonial-ingest \
    /work/inventory.json /work/extraction.json \
    --sanitized /work/extraction-sanitized.json
```

Uma execução interrompida retoma pelo checkpoint `extraction.json.checkpoint.jsonl`. Apague o
checkpoint para forçar extração completa.

### Custo de tempo — leia antes de disparar

Sem OCR de PDF, o acervo inteiro (801 arquivos) roda em poucos minutos: os 539 MP3 não são
abertos e a extração de camada de texto é rápida.

**Com o fallback `pdf-ocr`, a mesma execução leva horas.** Um livro escaneado de 58 MiB e ~220
páginas ocupa dezenas de minutos sozinho, porque cada página é renderizada a 300 dpi e
reconhecida individualmente. Medido no acervo real: 20 PDFs sem camada de texto, somando 1.044
páginas.

Duas consequências práticas:

- o checkpoint por linha não é conforto, é requisito — sem ele, qualquer interrupção custaria
  a corrida inteira;
- os 300 dpi são fixos de propósito. Baixar para 200 quase dobra a velocidade e muda o texto
  reconhecido, e o texto reconhecido é o que o hash do derivado promete. Mudar a resolução é
  mudar a identidade do adaptador, não afinar um parâmetro.

## Dois manifestos, um privado e um compartilhável

O manifesto completo tem uma linha por arquivo, e neste acervo **um caminho é o título de um
livro que alguém possui**. Ele é local-only e não vai para o repositório.

`--sanitized` grava a visão compartilhável: versão do pipeline, fingerprint, contagens por
estado/adaptador/motivo, versões das ferramentas e total de páginas. Nenhum caminho, nenhum
hash. É essa visão que vai para `.omo/evidence/.../T13/` e é essa que o comando imprime no
stdout.

## Classificação dos derivados

Todo derivado nasce `UNKNOWN` / `LOCAL_ONLY` / `CULTURALLY_SENSITIVE`, e o schema **recusa**
gravar um derivado que declare outra coisa. Extração não concede direito de publicação: essa
determinação é a Task 15, com revisão de direitos separada da revisão editorial.

## Política de vulnerabilidades

`ops/ceremonial/vulnerability-exceptions.json` declara as exceções vigentes. As regras estão
em código (`src/domain/ceremonial/vulnerability-policy.ts`), não em convenção:

- **Critical e High bloqueiam.** Não existe forma de exceção para elas.
- **Medium** só passa com exceção que nomeia responsável, descreve a remediação real e vence
  em no máximo 30 dias. Vencida, volta a bloquear.
- Exceção que não corresponde a nenhum achado é reportada como ruído a remover.

O relógio é injetado, então "a exceção venceu ontem" é fato testável e não depende de quando o
scan rodou.
