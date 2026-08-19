# Qualidade e assistência de código

Esta fase mantém o SonarQube separado da aplicação. O arquivo
`compose.quality.yml` sobe somente o SonarQube Community Build e seu PostgreSQL
dedicado, sob o profile `quality`.

## Pré-requisitos do host Linux

O Elasticsearch embutido no SonarQube exige estes limites no host:

```bash
sysctl vm.max_map_count
sysctl fs.file-max
ulimit -n
ulimit -u
```

Os valores mínimos são, respectivamente, `524288`, `131072`, `131072` e
`8192`. Ajustes de `sysctl` são administrativos e não são feitos pelo Compose.
Reserve pelo menos 4 GB de RAM, 2 CPUs e 30 GB de armazenamento livre para a
stack de qualidade.

## Primeiro bootstrap

Crie uma senha local sem registrá-la no histórico e suba o profile:

```bash
read -rsp 'Senha do PostgreSQL do Sonar: ' SONAR_DB_PASSWORD
export SONAR_DB_PASSWORD
docker compose -f compose.quality.yml --profile quality up -d --wait
```

Abra `http://127.0.0.1:9000`, entre inicialmente com `admin` / `admin` e troque
a senha imediatamente. Em seguida:

1. crie um projeto privado com a chave `astroaxe`;
2. mantenha o Quality Gate `Sonar way` — novos issues zero, hotspots revisados,
   cobertura de novo código maior ou igual a 80% e duplicação menor ou igual a
   3%;
3. crie um **Project Analysis Token** para o scanner;
4. crie um **User Token** separado para Connected Mode e para o MCP.

Tokens nunca devem entrar em arquivos versionados. O scanner recebe o token
por `SONAR_TOKEN`, e o endereço por `SONAR_HOST_URL`. A ordem obrigatória é: gerar
`coverage/lcov.info`, executar o scanner e aguardar o Quality Gate conforme
`sonar-project.properties`.

Para parar sem apagar os dados:

```bash
docker compose -f compose.quality.yml --profile quality down
```

Não use `down -v` salvo quando a intenção for apagar definitivamente banco,
histórico, configuração e índices do SonarQube.

O volume do PostgreSQL 18 é montado em `/var/lib/postgresql`, conforme o layout
versionado atual da imagem oficial; não altere esse destino para o caminho
legado `/var/lib/postgresql/data`.

## VS Code, LSPs e Connected Mode

`extensions.json` recomenda apenas uma implementação por responsabilidade:

- TypeScript, JavaScript, JSON, CSS e HTML usam os language services nativos do
  VS Code e o TypeScript instalado no workspace;
- ESLint diagnostica e corrige código; Prettier apenas formata;
- Tailwind CSS IntelliSense, Prisma e YAML fornecem seus próprios language
  servers;
- Docker DX cobre Dockerfile e Compose;
- SonarQube for IDE complementa os LSPs com as regras do servidor;
- Vitest e Playwright integram os testes ao painel nativo;
- CSpell usa os dicionários inglês e português brasileiro localmente.

No SonarQube for IDE, crie uma conexão para `http://127.0.0.1:9000` usando o
**User Token**, associe o workspace ao projeto `astroaxe` e mantenha o token no
secret storage do editor. O Connected Mode analisa arquivos abertos/salvos; ele
não substitui o scan completo nem o Quality Gate.

As telemetrias do SonarQube, SonarQube for IDE e YAML estão desativadas. Docker
DX exige acesso ao Docker Engine; conceder esse acesso equivale a uma permissão
administrativa no host e deve ocorrer apenas em uma máquina confiável. O schema
store do YAML pode acessar a rede para baixar schemas públicos.

## MCP SonarQube opcional

O MCP oficial é útil para consultar issues e o Quality Gate por agentes, mas
não é necessário para compilar ou analisar o projeto. Ele exige um **User
Token**, não aceita o Project Analysis Token para essa integração e possui
telemetria própria, desativada abaixo.

Exporte o token no ambiente que inicia o cliente MCP e configure um servidor
stdio equivalente a:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": [
        "run",
        "--init",
        "--rm",
        "-i",
        "--network=host",
        "-e",
        "SONARQUBE_TOKEN",
        "-e",
        "SONARQUBE_URL=http://127.0.0.1:9000",
        "-e",
        "SONARQUBE_PROJECT_KEY=astroaxe",
        "-e",
        "TELEMETRY_DISABLED=true",
        "sonarsource/sonarqube-mcp:1.22.0.3040"
      ]
    }
  }
}
```

`--network=host` é específico para Docker em Linux e permite que o container
acesse o SonarQube publicado apenas no loopback. Não grave
`SONARQUBE_TOKEN` no JSON: o argumento `-e SONARQUBE_TOKEN` apenas encaminha a
variável já presente no ambiente do cliente.

## Limites conhecidos

O Community Build não oferece a experiência completa de análise de múltiplas
branches das edições pagas. O contrato desta fase é a análise da branch
principal. Também não substitui testes, TypeScript, ESLint, revisão de
acessibilidade ou análise de dependências.

## Atualização do `.gitignore`

O script `scripts/gitignore-preview.sh` implementa o fluxo de linha de comando documentado pelo
gitignore.io usando a API pública da Toptal. A lista padrão cobre Node, VS Code, macOS, Windows e
Linux:

```bash
npm run gitignore:preview > /tmp/astroaxe.gitignore
diff -u .gitignore /tmp/astroaxe.gitignore
```

É possível fornecer outra lista de templates como primeiro argumento. O script aceita apenas
letras, números, vírgula, hífen e sublinhado, imprime a resposta em stdout e nunca sobrescreve o
arquivo do projeto. Revise cada diferença: regras específicas do AstroAxe, exceções de exemplo e
artefatos de ferramentas têm precedência sobre uma base gerada.
