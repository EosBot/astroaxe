# Email transacional

O AstroAxe usa uma outbox persistida no PostgreSQL. O cadastro do usuário e a mensagem
`ACCOUNT_WELCOME/v1` são gravados na mesma transação; o scheduler reivindica a mensagem com lease,
envia por SMTP e registra somente IDs opacos, tipo e categoria de erro. Endereço, assunto, corpo e
credenciais não entram nos logs.

Boas-vindas incluem confirmação de email. Reenvio e recuperação de senha usam tokens opacos de uso
único: a URL contém ID e verificador derivado por HMAC, enquanto o PostgreSQL guarda somente
SHA-256. Confirmação expira em 24 horas; recuperação expira em 30 minutos, revoga todas as sessões
anteriores e cria uma nova sessão após a troca. Pedidos de recuperação devolvem a mesma mensagem
para emails existentes e inexistentes.

## Contratos por ambiente

- homologação local: `mailpit` recebe SMTP em `mailpit:1025` e expõe a caixa apenas em
  `http://127.0.0.1:8025`;
- produção: o scheduler no Swarm conecta diretamente ao relay gerenciado. A configuração inicial
  recomendada é Brevo na porta 587 com STARTTLS; a senha fica no Docker Secret versionado
  `astroaxe_smtp_password_v1`;
- o app web não recebe a credencial SMTP. Só o scheduler tem acesso ao secret de envio.

SMTP não garante entrega exatamente uma vez. O sistema usa `idempotency_key` única, lease de dois
minutos e `Message-ID` derivado do ID da outbox. Isso evita concorrência entre workers e reduz
duplicações, mas uma interrupção depois do aceite do relay e antes do commit pode reenviar a mesma
mensagem. O processamento faz até seis tentativas com backoff e então move a mensagem para `DEAD`.

## Preparação do domínio na Cloudflare

> **Estado atual:** `astroaxe.net` está declarado no DNS como domínio que não envia nem recebe
> e-mail — `MX 0 .`, `v=spf1 -all` e `DMARC p=reject`. Essa é a postura mais restritiva contra
> spoofing e deve ser mantida até existir relay contratado. Os passos abaixo descrevem a transição
> a partir desse estado; a sequência exata está em `docs/cloudflare-edge.md`.

1. Cadastre e verifique um subdomínio dedicado, por exemplo `mail.seu-dominio.example`, no relay.
2. Publique exatamente os registros DKIM e de tracking fornecidos pelo painel do provedor. Registros
   de e-mail ficam como DNS only quando o painel assim exigir; o proxy HTTP da Cloudflare não é um
   proxy SMTP.
3. Mantenha um único SPF no domínio remetente e incorpore o mecanismo informado pelo relay. Não
   publique dois registros SPF concorrentes.
4. Publique DMARC inicialmente com monitoramento (`p=none`) e endereço de relatórios controlado.
   Depois de observar alinhamento SPF/DKIM, avance conscientemente para `quarantine` e `reject`.
5. Use remetente do domínio verificado, configure reply-to quando existir suporte e teste Gmail,
   Outlook e provedores brasileiros antes da promoção.

Nunca copie valores DNS de exemplo deste repositório: eles devem vir da conta real do provedor.
Cloudflare protege a superfície HTTP, enquanto reputação, bounce, complaint e suppression pertencem
ao relay. Antes de marketing ou newsletter, crie consentimento e unsubscribe separados; esta outbox
é exclusivamente transacional.

## Operação

Consulte a fila sem selecionar relações de usuário ou conteúdo sensível:

```sql
SELECT status, kind, count(*) FROM email_outbox GROUP BY status, kind;
```

Alertas mínimos: crescimento contínuo de `PENDING`/`RETRY`, qualquer `DEAD`, falha de autenticação e
taxa de bounce/complaint no painel do relay. Reprocessamento manual exige causa raiz corrigida e deve
alterar somente status, lease e próximo horário; nunca apague a outbox para silenciar falhas.

Na homologação, execute `npm run homolog:email-smoke`. O comando cria uma conta sintética única,
confirma o estado `SENT`, verifica a mensagem na API local do Mailpit e remove exatamente o usuário
de teste ao terminar. Nenhuma mensagem desse ambiente sai para a internet.
