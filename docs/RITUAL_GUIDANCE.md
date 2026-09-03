# Caminho guiado de magia cerimonial — plano vivo

Documento de trabalho. É atualizado a cada entrega, e serve para saber, a qualquer
momento, o que já funciona, o que está em construção e o que ainda não começou.

**Última atualização:** 3 de setembro de 2026 — Fase 1 em andamento, acervo já dentro do banco.

## O que o dono decidiu

- O produto **orienta**. Calcular e catalogar sem dizer o que fazer é produto
  desligado; a versão anterior das ferramentas errava nisso.
- **Tudo aqui é religioso e para adultos.** O público sabe o que faz.
- Trabalho dirigido a terceiro **não exige declaração de consentimento**. Exibe
  advertência forte sobre como aquilo atua, o que costuma vir junto e o que se
  assume — e a decisão de prosseguir é de quem opera, perante a lei divina.
- A liturgia sai do **acervo do projeto**, e não da cabeça de quem programa.
  Liturgia inventada para Orixá real é pior que ausência de conteúdo.

### O limite declarado

Não entra passo a passo operacional de trabalho dirigido a **ferir pessoa
específica que não consentiu** — impotência dirigida a um homem nomeado, trabalho
de morte contra alguém nomeado. Isso não é juízo sobre Quimbanda nem sobre a
religião: é instrução detalhada para causar dano a alguém, e vale em qualquer
contexto.

O que **entra**: a descrição etnográfica e histórica dessas práticas, incluindo
por que existiram e o que se dizia sobre elas. Descrever não é instruir, e o
contrato `archival_source` já separa as duas coisas no domínio.

## Os quatro passos

| Passo | O quê                                                                                          | Estado                          |
| ----- | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| I     | Finalidade — 16 categorias religiosas                                                          | política pronta, tela por fazer |
| II    | Entidade — Orixá, Exu, Pomba Gira, falange, anjo, olímpico, inteligência                       | catálogo parcial, sem tela      |
| III   | Advertência por entidade e por tipo de trabalho                                                | não começou                     |
| IV    | Preparo detalhado — dia, hora, ponto, oferenda, erva, banho, defumação, procedimento, descarte | não começou                     |

## Fases

### Fase 1 — Ponte para o acervo (em andamento)

O acervo tem 29.296 trechos, 538 pontos cantados e livros de Umbanda,
fitoterapia, ervas, magia angelical e orações. **A aplicação não lê nada disso
hoje** — existe só a pipeline Python. Sem esta ponte, todo o resto seria invenção.

- [x] Migração: `corpus_chunks` e `corpus_topics` com `vector(1024)` e índice HNSW
- [x] Ingestão: **29.296 trechos carregados**, 434 documentos, 17 categorias
- [x] Vizinhança verificada no banco: 1,000 consigo mesmo, ~0,68 com vizinhos temáticos
- [x] Decisão que dispensa Python em produção — ver abaixo
- [ ] Vetores de assunto: calcular fora do ar e gravar em `corpus_topics`
- [ ] Recuperação a partir da aplicação, com projeção que nunca devolve trecho cru
- [ ] Gate: nenhum texto do acervo chega ao navegador — insumo, não obra

**Sem modelo de embedding em produção.** O fluxo guiado não faz busca de texto
livre: as perguntas são combinações finitas de finalidade e entidade, conhecidas
de antemão. Os vetores dessas perguntas são calculados uma vez, fora do ar, e
gravados em `corpus_topics`. Em produção a aplicação faz só uma consulta de
vizinhança em SQL — sem Python, sem variação entre execuções, sem serviço extra
para manter de pé.

**O README do acervo estava errado.** Ele documenta `source_path`, `doc_id` e
`char_count`; os arquivos têm `id`, `title`, `category`, `subcategory`,
`metadata` e `text`. A tabela foi alinhada ao que existe: `doc_id` e
`chunk_index` são derivados do próprio `id`, que tem a forma
`<documento>_<índice>`, e `char_count` é o tamanho do texto. Coluna que a origem
não preenche seria proveniência inventada.

### Fase 2 — Catálogo de entidades

- [ ] Orixás: domínio, dia, saudação, cor, ponto, oferenda, erva, temperamento
- [ ] Exus e Pombas Giras: falange, domínio, dia, ponto, oferenda, advertência
- [ ] Anjos, espíritos olímpicos e inteligências planetárias (já parcialmente no grafo)
- [ ] Como cada um atua, e o que costuma cobrar

### Fase 3 — Advertências

- [ ] Por entidade
- [ ] Por tipo de trabalho
- [ ] Tela de prosseguir, com o que se assume declarado antes do procedimento

### Fase 4 — Preparo detalhado

- [ ] Dia e hora planetária, ligados ao buscador de janelas que já existe
- [ ] Ponto e assentamento
- [ ] Oferenda, item a item, com o significado de cada item
- [ ] Ervas, banho e defumação
- [ ] Ponto cantado, do catálogo de 538
- [ ] Firmeza, tempo de permanência e descarte

### Fase 5 — Integração

- [ ] Fluxo ponta a ponta: finalidade → entidade → advertência → preparo
- [ ] Gravar o trabalho preparado no caderno, que já existe e já cifra
- [ ] Revisão do dono antes de publicar

## O que já está de pé

- **Buscador de janelas** — varredura por hora planetária, 2,83 ms por hora
- **Diretório de correspondências** — índice invertido do grafo de funções
- **Tábua operacional** — correspondências simbólicas, rotuladas como hipótese autoral
- **Caderno de trabalhos** — planos e sessões cifrados, exclusão com rastro
- **Política de finalidade** — 16 categorias religiosas, 3 recusas de dano a terceiro

## Perguntas em aberto para o dono

1. O catálogo de Exus e Pombas Giras deve seguir alguma casa ou linhagem
   específica? As falanges variam entre terreiros, e escolher por conta própria
   seria inventar fundamento.
2. Há material do seu terreiro, fora do acervo digital, que deva entrar?
3. Ponto cantado entra como letra, como áudio, ou os dois?
