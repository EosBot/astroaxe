import { useEffect, useRef, useState } from "react";

import { REGENCY_QUESTIONNAIRE_VERSION } from "@/domain/orixas/regency/questionnaire";
import { publicRegencyOrisaCatalog } from "@/domain/orixas/regency/public-orisa-catalog";
import { REGENCY_FEEDBACK_CONSENT_VERSION } from "@/lib/orixas/regency-feedback";
import type { PublicRegencyResponse } from "@/lib/orixas/public-regency";

import { roles } from "./shared";

export function RegencyFeedbackForm({
  profileId,
  result,
  questionnaireAnswers,
}: Readonly<{
  profileId: string;
  result: PublicRegencyResponse;
  questionnaireAnswers: { questionId: string; value: string | undefined }[];
}>): React.JSX.Element {
  const [verdict, setVerdict] = useState("");
  const [knowsOrisas, setKnowsOrisas] = useState<boolean>();
  const [corrected, setCorrected] = useState<Record<string, string>>({});
  const [basis, setBasis] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedRegionRef = useRef<HTMLElement>(null);
  const errorRegionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status === "saved") savedRegionRef.current?.focus();
    if (status === "error") errorRegionRef.current?.focus();
  }, [status]);

  async function submit() {
    if (status === "saving" || !consent) return;
    setStatus("saving");
    const response = await fetch(`/api/profiles/${profileId}/regency`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        methodVersion: result.methodVersion,
        questionnaire: { version: REGENCY_QUESTIONNAIRE_VERSION, answers: questionnaireAnswers },
        verdict,
        knowsOrisas: knowsOrisas ?? false,
        ...(knowsOrisas
          ? {
              correctedTriad: {
                front: corrected.front || null,
                head: corrected.head || null,
                back: corrected.back || null,
              },
            }
          : {}),
        confirmationBasis: basis,
        ...(comment.trim() === "" ? {} : { comment: comment.trim() }),
        consent,
        consentVersion: REGENCY_FEEDBACK_CONSENT_VERSION,
      }),
    });
    setStatus(response.ok ? "saved" : "error");
  }

  if (status === "saved")
    return (
      <aside
        className="regency-feedback"
        aria-labelledby="regency-feedback-saved-title"
        tabIndex={-1}
        ref={savedRegionRef}
      >
        <h2 id="regency-feedback-saved-title">Obrigado por fortalecer a pesquisa.</h2>
        <p>Seu relato foi guardado como exemplo de calibração desta versão.</p>
      </aside>
    );

  return (
    <aside className="regency-feedback" aria-labelledby="regency-feedback-title">
      <h2 id="regency-feedback-title">Este resultado se aproxima do que você conhece?</h2>
      <p>Seu retorno ajuda a identificar acertos, aproximações e inversões de polaridade.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label>
          Como você avalia a tríade?{" "}
          <select required value={verdict} onChange={(event) => setVerdict(event.target.value)}>
            <option value="">Selecione</option>
            <option value="matched">Corresponde</option>
            <option value="close">Chegou perto</option>
            <option value="polarity_inverted">Polaridade invertida</option>
            <option value="not_aligned">Não corresponde</option>
            <option value="unsure">Ainda não sei avaliar</option>
          </select>
        </label>
        <fieldset>
          <legend>Você já sabe quais são seus Orixás de frente, cabeça e costas?</legend>
          <label>
            <input
              required
              type="radio"
              name="knows-orisas"
              checked={knowsOrisas === true}
              onChange={() => setKnowsOrisas(true)}
            />{" "}
            Sim, posso informar
          </label>
          <label>
            <input
              required
              type="radio"
              name="knows-orisas"
              checked={knowsOrisas === false}
              onChange={() => setKnowsOrisas(false)}
            />{" "}
            Não ou não tenho certeza
          </label>
        </fieldset>
        {knowsOrisas ? (
          <div className="regency-feedback-triad">
            {roles.map(([role, label]) => (
              <label key={role}>
                {label}
                <select
                  value={corrected[role] ?? ""}
                  onChange={(event) =>
                    setCorrected((current) => ({ ...current, [role]: event.target.value }))
                  }
                >
                  <option value="">Não sei este papel</option>
                  {publicRegencyOrisaCatalog.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
        <label>
          Como você conhece essa informação?{" "}
          <select required value={basis} onChange={(event) => setBasis(event.target.value)}>
            <option value="">Selecione</option>
            <option value="personal_recognition">Reconhecimento pessoal</option>
            <option value="practitioner_consultation">Consulta com praticante ou liderança</option>
            <option value="buzios_or_oracle">Jogo de búzios ou oráculo tradicional</option>
            <option value="other">Outra origem</option>
          </select>
        </label>
        <label>
          Comentário opcional{" "}
          <textarea
            maxLength={1000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        <label className="regency-feedback-consent">
          <input
            required
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />{" "}
          Autorizo o uso destas respostas, que podem revelar informação religiosa sensível,
          exclusivamente para pesquisa e calibração do método AstroAxe.
        </label>
        <button className="quiet-button" type="submit" disabled={status === "saving" || !consent}>
          {status === "saving" ? "Guardando…" : "Enviar avaliação"}
        </button>
        {status === "error" ? (
          <p role="alert" tabIndex={-1} ref={errorRegionRef}>
            Não foi possível guardar agora. Tente novamente.
          </p>
        ) : null}
      </form>
    </aside>
  );
}
