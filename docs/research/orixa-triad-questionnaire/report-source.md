# Tríade v3 — pares, polaridades e questionário dirigido

**Data de corte:** 25 de agosto de 2026  
**Status:** hipótese autoral implementada para validação

## Síntese

O método v3 cruza todas as famílias cadastradas em um ranqueamento agregado: astrologia,
temporalidade, numerologia, atributos simbólicos e autorrelato. A origem de cada aresta permanece no
grafo para detectar dependência, conflito e estabilidade; ela não cria uma barreira entre escolas.

A leitura dirigida acrescenta sete eixos da formulação das linhas de Umbanda Sagrada apresentada
por Rubens Saraceni: Oxalá–Logunan, Oxum–Oxumarê, Oxóssi–Obá, Xangô–Egunitá, Ogum–Iansã,
Obaluaiê–Nanã e Iemanjá–Omolu. Essa taxonomia é aplicada como uma lente entre outras e não como
descrição universal de Candomblés, Ifá ou de todas as Umbandas.

## Evidências e reconciliação

| Alegação usada                                             | Fonte/locator                                                                                    | Uso no sistema          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- |
| Sete linhas organizadas em catorze polos                   | Rubens Saraceni, _As Sete Linhas de Umbanda_, p. 31 do artefato extraído; edição Madras          | sete lentes binárias    |
| Ogum e Iansã operam polos distintos da linha da Lei        | Rubens Saraceni, _Orixás — Teogonia de Umbanda_, pp. 126–127 do artefato extraído; edição Madras | regressão de polaridade |
| Oxumarê atua no polo renovador/dissolvente do Amor         | Rubens Saraceni, _Fundamentos Doutrinários de Umbanda_, p. 220 do artefato extraído              | pergunta Amor           |
| Obaluaiê e Nanã distinguem passagem/evolução de decantação | _Teogonia_, p. 142 do artefato extraído                                                          | pergunta Evolução       |

As páginas oficiais da Editora Madras confirmam autoria, título e enquadramento das obras. Os
locators de conteúdo foram conferidos no corpus local autorizado em `/mnt/e/Ocultismo`; os livros
não são copiados para o repositório.

## Decisões de modelagem

- Perguntas descrevem movimentos, não exibem nomes de Orixás, reduzindo indução direta.
- `both` produz duas features com metade da força; `prefer_not_to_answer` produz nenhuma.
- O questionário é obrigatório para abrir a tríade, mas nenhuma pergunta obriga uma polaridade.
- Respostas não são persistidas, logadas ou retornadas no DTO público.
- O sinal dirigido complementa o mapa e os demais cruzamentos; não confirma filiação religiosa.
- Pesos, matriz operacional, limiares e desempate permanecem server-side.

## Validação necessária

O próximo ciclo precisa de dataset consentido e anonimizado com autodeclaração ou confirmação
sacerdotal separadas. A comparação deve medir baseline v2 versus v3, acerto por papel, inversões por
par, abstenção, calibração e desempenho por tradição declarada. Sem essa amostra, o questionário é
uma hipótese informada e versionada, não uma alegação de acurácia comprovada.
