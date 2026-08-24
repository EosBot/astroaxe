import { describe, expect, it } from "vitest";

import { renderPasswordResetEmail, renderVerificationEmail, renderWelcomeEmail } from "./template";

describe("renderWelcomeEmail", () => {
  it("renders matching text and escaped HTML destinations", () => {
    const email = renderWelcomeEmail('https://example.test/?next="account"&source=email');
    expect(email.text).toContain('https://example.test/?next="account"&source=email');
    expect(email.html).toContain("&quot;account&quot;&amp;source=email");
    expect(email.subject).toContain("AstroAxe");
  });

  it("adds an escaped verification action when a token is available", () => {
    const email = renderWelcomeEmail(
      "https://example.test",
      "https://example.test/verificar-email?token=one&next=two",
    );
    expect(email.text).toContain("verificar-email?token=one&next=two");
    expect(email.html).toContain("token=one&amp;next=two");
  });

  it("renders purpose-specific expiry and safety guidance", () => {
    expect(renderVerificationEmail("https://example.test/verify").text).toContain("24 horas");
    const reset = renderPasswordResetEmail("https://example.test/reset");
    expect(reset.subject).toContain("senha");
    expect(reset.text).toContain("30 minutos");
    expect(reset.text).toContain("ignore esta mensagem");
  });
});
