# Analytics e consentimento

## Estado atual

Não existe coletor, SDK, endpoint, variável de ativação ou envio de analytics. O contrato Zod que
não possuía chamador foi removido na auditoria de código morto de 25 de agosto de 2026: manter uma
API especulativa não criava proteção real e poderia parecer uma integração pronta.

Uma implementação futura deverá nascer junto do fluxo de consentimento, fornecedor e finalidade
aprovados. Até lá, ausência de código de coleta é o comportamento fail-closed.

## Vocabulário mínimo permitido

O vocabulário candidato permanece limitado a três eventos estruturais: conclusão do onboarding,
abertura da explicação do mapa e conclusão do claim da conta. Uma futura boundary deverá aceitar
apenas superfície e classe de viewport e rejeitar IDs, texto livre, email, data/hora natal,
localização e quaisquer campos extras.

Antes de ativar coleta é obrigatório definir e revisar:

- finalidade, base legal, texto e mecanismo de retirada do consentimento;
- fornecedor, região, subprocessadores, retenção, acesso e exclusão;
- agregação, limites de cardinalidade e teste de redaction;
- responsável por incidentes e procedimento de revogação;
- UI acessível que não use dark patterns nem bloqueie funções essenciais.

Até esse contrato externo e a política LGPD final existirem, nenhum módulo de analytics deve ser
reintroduzido.
