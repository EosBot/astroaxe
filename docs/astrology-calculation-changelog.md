# Registro de mudanças do cálculo astrológico

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
