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

### Fase 2 — Catálogo de entidades (em andamento)

- [x] **Os sete Reinos**, com Exu Rei, Pombagira Rainha e domínio, em
      `src/domain/quimbanda/reinos.ts`
- [x] **62 legiões** com seus casais de chefes nomeados
- [x] Regência planetária onde o acervo a declara — Almas em Marte e Geburah,
      Cruzeiros em Júpiter e Chesed
- [x] **Regência planetária dos sete**, com sephirah e cor litúrgica
- [ ] Advertência e forma de atuação por entidade
- [ ] Oferenda, ponto e dia por entidade

### As sete correspondências, todas sustentadas

| Reino                  | Sephirah  | Planeta  | Cor                       |
| ---------------------- | --------- | -------- | ------------------------- |
| Lira                   | Tiphereth | Sol      | amarelo e dourado         |
| Encruzilhadas          | Hod       | Mercúrio | laranja e cores múltiplas |
| Kalunga Grande (Praia) | Netzach   | Vênus    | verde                     |
| Matas                  | Yesod     | Lua      | violeta e prata           |
| Almas                  | Geburah   | Marte    | vermelho                  |
| Cruzeiros              | Chesed    | Júpiter  | azul                      |
| Kalunga Pequena        | Binah     | Saturno  | preto e índigo            |

A tabela veio da apostila hermética do terreiro. Kalunga eu quase deduzi por
posição no desenho da árvore; a fonte declara em texto corrido — "conectando
esses princípios à Sephirah Binah (Saturno)" —, e é a declaração que vale.

**Com os sete mapeados, todo Reino consulta o buscador de janelas.** A ponte
entre Quimbanda e astrologia deixou de valer para dois Reinos e passou a valer
para o sistema inteiro: perguntar quando trabalhar num Reino virou perguntar
quando o planeta dele rege.

**Duas correções que a leitura da fonte impôs.** Eu tinha "Reino da Praia" e
"Reino da Kalunga" como coisas separadas; a fonte é mais precisa — **Kalunga
Pequena é o cemitério e Kalunga Grande é a praia**. E o sétimo Reino, que eu
havia declarado pendente, é o **Reino da Lira**. Se eu tivesse chutado pelo que
"parecia faltar", teria escrito "Reino do Lixo" — que existe, mas é legião dentro
da Lira, não Reino. Foi ler a listagem em sequência no documento, em vez de
montar por busca solta, que evitou o erro.

- [ ] Orixás: domínio, dia, saudação, cor, ponto, oferenda, erva, temperamento
- [ ] Anjos, olímpicos e inteligências (já parcialmente no grafo de funções)

**A ponte que apareceu.** O material do terreiro liga cada Reino a um planeta e
a uma sephirah. Isso conecta a Quimbanda ao motor de horas planetárias que já
existe: perguntar "quando trabalhar no Reino das Almas" vira perguntar ao
buscador de janelas quando Marte rege. Não foi planejado, e é a peça que faz os
dois lados do produto se encontrarem.

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

## Respostas do dono

1. **Exus e Pombas Giras seguem a Quimbanda/Kimbanda.** O acervo sustenta:
   1.026 trechos falam do assunto, com livros dedicados e as apostilas de
   formação sacerdotal do Templo da Pena. Reinos aparecem em 544 trechos,
   falanges e legiões em 452, Pomba Gira em 845, assentamento e firmeza em 712,
   oferenda e despacho em 896.
2. **Ponto cantado entra como letra.** Feito: 538 pontos carregados, 216 com
   letra validada. O áudio não entra, e o `file_path` do catálogo — que aponta
   para o disco de origem — não é gravado.

3. **Material do terreiro pode entrar.** Ele já está no acervo: `templo_pena`
   são 1.221 trechos, com as formações sacerdotais de Umbanda e de Kimbanda e a
   apostila autodidata de Quimbanda hermética. **A autoria é do próprio dono** —
   as apostilas são assinadas por ele. Isso muda o que pode ser publicado: obra
   de terceiro continua sendo insumo, mas o material da casa é dele.

### Ainda em aberto

- Há material do terreiro **fora** do acervo digital? Se houver, precisa dos
  arquivos.
- O sétimo Reino. Seis estão sustentados pelo acervo; o sétimo aparece com nomes
  que variam entre casas, e ficou declarado como pendente em vez de preenchido
  por suposição.

## Cobertura do acervo, por assunto

Levantado no banco, e não estimado. Serve para saber onde há base para escrever
e onde escrever seria inventar.

| Assunto                | Trechos |
| ---------------------- | ------- |
| Quimbanda/Kimbanda     | 1.026   |
| Oferenda e despacho    | 896     |
| Pomba Gira             | 845     |
| Assentamento e firmeza | 712     |
| Reinos                 | 544     |
| Falanges e legiões     | 452     |

Pontos cantados, por tipo de entidade: Orixá 164 (58 com letra), geral 124 (89),
Exu e Pomba Gira 65 (16), caboclo 62 (30), preto-velho 44 (4), erê 24 (4),
boiadeiro 18 (8), marinheiro 15 (4).

**A letra falta em 322 dos 538.** Eles ficam no catálogo com o status dizendo
que falta, porque sumir esconderia o tamanho real do acervo e preencher seria
inventar letra de ponto.
