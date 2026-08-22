# Analytics e consentimento

## Estado atual

Não existe coletor, SDK, endpoint ou envio de analytics ativo. O módulo
`src/lib/analytics/contracts.ts` é somente uma fronteira fail-closed para uma integração futura:
mesmo um consentimento válido não autoriza coleta enquanto a integração não estiver explicitamente
habilitada.

O consentimento é versionado, exige decisão explícita e instante ISO fornecido pelo chamador. Dados
ausentes, corrompidos, de versão antiga ou negados resultam em coleta desabilitada.

## Vocabulário mínimo permitido

Somente três eventos estruturais estão reservados: conclusão do onboarding, abertura da explicação
do mapa e conclusão do claim da conta. O payload aceita apenas superfície e classe de viewport. O
schema estrito rejeita IDs, texto livre, email, data/hora natal, localização e quaisquer campos
extras.

Antes de ativar coleta é obrigatório definir e revisar:

- finalidade, base legal, texto e mecanismo de retirada do consentimento;
- fornecedor, região, subprocessadores, retenção, acesso e exclusão;
- agregação, limites de cardinalidade e teste de redaction;
- responsável por incidentes e procedimento de revogação;
- UI acessível que não use dark patterns nem bloqueie funções essenciais.

Até esse contrato externo e a política LGPD final existirem, a implementação deve permanecer sem
chamadores e sem variável que habilite eventos.
