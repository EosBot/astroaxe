import { useState } from "react";

import {
  REGENCY_QUESTIONNAIRE_VERSION,
  regencyQuestionnaire,
} from "@/domain/orixas/regency/questionnaire";
import {
  publicRegencyResponseSchema,
  type PublicRegencyResponse,
} from "@/lib/orixas/public-regency";

import { QuestionnaireStep } from "./orisa/questionnaire-step";
import { RegencyFeedbackForm } from "./orisa/feedback-form";
import { OrisaResultView } from "./orisa/result-view";

export function OrisaResearchLab({
  profileId,
}: Readonly<{ profileId: string }>): React.JSX.Element {
  return <OrisaResearchLabContent key={profileId} profileId={profileId} />;
}

function OrisaResearchLabContent({
  profileId,
}: Readonly<{ profileId: string }>): React.JSX.Element {
  const [result, setResult] = useState<PublicRegencyResponse>();
  const [status, setStatus] = useState<"questionnaire" | "loading" | "ready" | "error">(
    "questionnaire",
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});

  async function submitQuestionnaire() {
    setStatus("loading");
    try {
      const response = await loadRegency(
        profileId,
        regencyQuestionnaire.map(({ id }) => ({ questionId: id, value: answers[id] })),
        new AbortController().signal,
      );
      setResult(response);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  if (status === "questionnaire")
    return (
      <QuestionnaireStep answers={answers} onAnswer={setAnswers} onSubmit={submitQuestionnaire} />
    );

  if (status === "loading")
    return (
      <LabState
        title="Cruzando as camadas do método…"
        detail="Calculando sua Tríade com a versão atual."
      />
    );
  if (status === "error" || result === undefined)
    return (
      <LabState
        title="A leitura não abriu."
        detail="Seu mapa continua preservado. Você pode repetir somente este cálculo."
        actionLabel="Tentar novamente"
        onAction={() => {
          setStatus("questionnaire");
        }}
      />
    );

  return (
    <>
      <OrisaResultView result={result} />
      <RegencyFeedbackForm
        profileId={profileId}
        result={result}
        questionnaireAnswers={regencyQuestionnaire.map(({ id }) => ({
          questionId: id,
          value: answers[id],
        }))}
      />
    </>
  );
}

async function loadRegency(
  profileId: string,
  answers: { questionId: string; value: string | undefined }[],
  signal: AbortSignal,
): Promise<PublicRegencyResponse> {
  const response = await fetch(`/api/profiles/${profileId}/regency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: REGENCY_QUESTIONNAIRE_VERSION, answers }),
    signal,
  });
  const parsed = publicRegencyResponseSchema.safeParse(await response.json());
  if (!response.ok || !parsed.success) throw new Error("regency_load_failed");
  return parsed.data;
}

function LabState({
  title,
  detail,
  actionLabel,
  onAction,
}: Readonly<{
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}>) {
  return (
    <section className="orisa-research-lab" aria-live="polite">
      <header>
        <div>
          <p className="eyebrow">Tríade de Regências</p>
          <h1>{title}</h1>
        </div>
        <p>{detail}</p>
        {actionLabel && onAction ? (
          <button type="button" className="quiet-button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </header>
    </section>
  );
}
