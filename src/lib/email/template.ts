export const WELCOME_EMAIL_KIND = "ACCOUNT_WELCOME";
export const WELCOME_TEMPLATE_VERSION = "v1";
export const VERIFICATION_EMAIL_KIND = "EMAIL_VERIFICATION";
export const VERIFICATION_TEMPLATE_VERSION = "v1";
export const RECOVERY_EMAIL_KIND = "ACCOUNT_RECOVERY";
export const PASSWORD_RESET_TEMPLATE_VERSION = "v1";

export interface TransactionalEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderWelcomeEmail(siteUrl: string, verificationUrl?: string): TransactionalEmail {
  const safeSiteUrl = escapeHtml(siteUrl);
  const verificationText =
    verificationUrl === undefined ? "" : `\n\nConfirme seu email: ${verificationUrl}`;
  const verificationHtml =
    verificationUrl === undefined
      ? ""
      : `<p><a href="${escapeHtml(verificationUrl)}">Confirmar meu email</a></p>`;
  return {
    subject: "Sua jornada no AstroAxe começou",
    text: `Sua conta AstroAxe foi criada. Acesse ${siteUrl}${verificationText}\n\nAstroAxe — astrologia calculada e contexto cultural com responsabilidade.`,
    html: `<p>Sua conta AstroAxe foi criada.</p>${verificationHtml}<p><a href="${safeSiteUrl}">Acessar o AstroAxe</a></p><p>Astrologia calculada e contexto cultural com responsabilidade.</p>`,
  };
}

export function renderVerificationEmail(verificationUrl: string): TransactionalEmail {
  return {
    subject: "Confirme seu email no AstroAxe",
    text: `Confirme seu email: ${verificationUrl}\n\nEste link expira em 24 horas.`,
    html: `<p>Confirme que este email pertence a você.</p><p><a href="${escapeHtml(verificationUrl)}">Confirmar meu email</a></p><p>Este link expira em 24 horas.</p>`,
  };
}

export function renderPasswordResetEmail(resetUrl: string): TransactionalEmail {
  return {
    subject: "Redefina sua senha do AstroAxe",
    text: `Redefina sua senha: ${resetUrl}\n\nEste link expira em 30 minutos. Se você não fez o pedido, ignore esta mensagem.`,
    html: `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${escapeHtml(resetUrl)}">Criar uma nova senha</a></p><p>Este link expira em 30 minutos. Se você não fez o pedido, ignore esta mensagem.</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
