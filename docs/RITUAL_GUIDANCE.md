# Caminho guiado de magia cerimonial — plano vivo

Documento de trabalho. É atualizado a cada entrega, e serve para saber, a qualquer
momento, o que já funciona, o que está em construção e o que ainda não começou.

**Última atualização:** 3 de setembro de 2026.

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

- [ ] Migração: tabela de trechos com `vector(1024)` em pgvector
- [ ] Ingestão de `chunks.jsonl` + `embeddings.npy` para o Postgres
- [ ] Serviço de embedding para a pergunta (bge-m3 vive em Python; a app é Node)
- [ ] Busca por similaridade a partir da aplicação
- [ ] Gate: nenhum trecho cru chega ao navegador — o acervo é insumo, não obra

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
