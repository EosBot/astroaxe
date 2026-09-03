"use client";

import { useEffect, useState } from "react";

interface PlanView {
  id: string;
  title: string;
  intention: string;
  selection: string[];
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionView {
  id: string;
  planId: string;
  occurredAt: string;
  notes: string | null;
  observation: string | null;
  outcome: string | null;
}

/**
 * Finalidades oferecidas na tela.
 *
 * São as razões pelas quais alguém procura um terreiro, e não uma lista de
 * temas acadêmicos. A versão anterior oferecia quatro — estudo, reflexão,
 * memória e rotina — o que tratava quem pratica como quem visita.
 *
 * O contrato aceita também coerção, violência e autolesão, porque a política
 * precisa poder recusá-las quando chegam. Elas não aparecem aqui: oferecê-las
 * num menu seria o produto convidando ao que se nega a servir.
 */
const GOALS = [
  { value: "devotion", label: "Devoção" },
  { value: "offering", label: "Oferenda" },
  { value: "sacrifice", label: "Sacrifício ritual" },
  { value: "protection", label: "Proteção" },
  { value: "cleansing", label: "Limpeza e descarrego" },
  { value: "health", label: "Saúde" },
  { value: "prosperity", label: "Prosperidade" },
  { value: "love", label: "Amor e vínculos" },
  { value: "justice", label: "Justiça" },
  { value: "ancestors", label: "Ancestralidade" },
  { value: "initiation", label: "Iniciação e obrigação" },
  { value: "divination", label: "Consulta e adivinhação" },
  { value: "remembrance", label: "Rememoração" },
  { value: "personal_routine", label: "Rotina pessoal" },
  { value: "reflection", label: "Reflexão" },
  { value: "study", label: "Estudo" },
] as const;

const TARGETS = [
  { value: "none", label: "Ninguém em específico" },
  { value: "self", label: "Eu mesmo" },
  { value: "consenting_adult", label: "Outra pessoa adulta, que consentiu" },
] as const;

/**
 * Planejador cerimonial.
 *
 * Guarda o que a pessoa registra, e não diz o que fazer: o produto calcula e
 * cataloga, e a prática é de quem opera. Por isso não há sugestão, etapa nem
 * roteiro em lugar nenhum desta tela.
 *
 * Tudo que é texto vai cifrado no servidor, com a cifra amarrada ao titular, ao
 * registro e ao campo. Apagar um plano leva as sessões dele junto.
 */
export function CeremonialPlanner(): React.JSX.Element {
  const [plans, setPlans] = useState<PlanView[]>();
  const [message, setMessage] = useState("");
  const [openPlan, setOpenPlan] = useState<string>();
  const [sessions, setSessions] = useState<Record<string, SessionView[]>>({});

  async function load(): Promise<void> {
    try {
      const response = await fetch("/api/ceremonial/plans");
      if (response.status === 401) return setMessage("Entre na sua conta para usar o planejador.");
      if (response.status === 402) return setMessage("O planejador faz parte do plano pago.");
      if (response.status === 403)
        return setMessage("O planejador é restrito a maiores de 18 anos que declararam a idade.");
      if (response.status === 503)
        return setMessage(
          "Os registros privados não estão configurados no servidor. Nada é gravado em claro.",
        );
      if (!response.ok) throw new Error("load_failed");
      setPlans(((await response.json()) as { plans: PlanView[] }).plans);
    } catch {
      setMessage("Não foi possível carregar seus planos agora.");
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
    // A lista é carregada uma vez, na montagem; recarregar depois é
    // consequência de gravar ou apagar, e essas ações chamam `load` direto.
  }, []);

  async function createPlan(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const scheduled = String(data.get("scheduledFor") ?? "");
    const response = await fetch("/api/ceremonial/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        intention: data.get("intention"),
        goalCategory: data.get("goalCategory"),
        target: data.get("target"),
        ...(scheduled === "" ? {} : { scheduledFor: new Date(scheduled).toISOString() }),
      }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(body.error ?? "Não foi possível guardar este plano agora.");
      return;
    }
    form.reset();
    setMessage("");
    await load();
  }

  async function loadSessions(planId: string): Promise<void> {
    const response = await fetch(`/api/ceremonial/plans/${planId}/sessions`);
    if (!response.ok) return;
    const body = (await response.json()) as { sessions: SessionView[] };
    setSessions((current) => ({ ...current, [planId]: body.sessions }));
  }

  async function addSession(planId: string, form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const occurred = String(data.get("occurredAt") ?? "");
    const text = (field: string): string | undefined => String(data.get(field) ?? "") || undefined;
    const response = await fetch(`/api/ceremonial/plans/${planId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occurredAt: new Date(occurred).toISOString(),
        notes: text("notes"),
        observation: text("observation"),
        outcome: text("outcome"),
      }),
    });
    if (!response.ok) {
      setMessage("Não foi possível guardar este registro agora.");
      return;
    }
    form.reset();
    await loadSessions(planId);
  }

  async function removePlan(planId: string): Promise<void> {
    const response = await fetch(`/api/ceremonial/plans/${planId}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Não foi possível apagar este plano agora.");
      return;
    }
    await load();
  }

  if (message !== "" && plans === undefined)
    return <p className="timing-form-message">{message}</p>;

  return (
    <>
      <form
        className="timing-form"
        onSubmit={(event) => {
          event.preventDefault();
          void createPlan(event.currentTarget);
        }}
      >
        <p className="eyebrow">Guardar um plano</p>

        <label htmlFor="plan-title">Como você chama isso?</label>
        <input id="plan-title" name="title" maxLength={160} required />

        <label htmlFor="plan-intention">O que você pretende registrar</label>
        <textarea id="plan-intention" name="intention" rows={4} maxLength={4000} required />

        <label htmlFor="plan-goal">De que natureza</label>
        <select id="plan-goal" name="goalCategory" defaultValue="devotion">
          {GOALS.map((goal) => (
            <option key={goal.value} value={goal.value}>
              {goal.label}
            </option>
          ))}
        </select>

        <label htmlFor="plan-target">Diz respeito a</label>
        <select id="plan-target" name="target" defaultValue="self">
          {TARGETS.map((target) => (
            <option key={target.value} value={target.value}>
              {target.label}
            </option>
          ))}
        </select>

        <label htmlFor="plan-scheduled">Para quando (opcional)</label>
        <input id="plan-scheduled" name="scheduledFor" type="datetime-local" />

        {message === "" ? null : <p className="timing-form-message">{message}</p>}
        <button type="submit">Guardar plano</button>
      </form>

      <section className="methodology-section" aria-labelledby="plans-title">
        <h2 id="plans-title">
          {plans === undefined
            ? "Carregando…"
            : plans.length === 0
              ? "Você ainda não guardou nenhum plano."
              : `${plans.length} plano(s) guardado(s).`}
        </h2>

        {(plans ?? []).map((plan) => (
          <article key={plan.id} className="window-group">
            <h3>{plan.title}</h3>
            <p>{plan.intention}</p>
            {plan.scheduledFor === null ? null : (
              <p className="method-function-support">
                Marcado para {new Date(plan.scheduledFor).toLocaleString("pt-BR")}
              </p>
            )}

            <div className="plan-actions">
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setOpenPlan(openPlan === plan.id ? undefined : plan.id);
                  if (sessions[plan.id] === undefined) void loadSessions(plan.id);
                }}
              >
                {openPlan === plan.id ? "Fechar registros" : "Ver registros"}
              </button>
              <button
                type="button"
                className="quiet-button"
                onClick={() => void removePlan(plan.id)}
              >
                Apagar plano e registros
              </button>
            </div>

            {openPlan !== plan.id ? null : (
              <>
                <ol className="window-list">
                  {(sessions[plan.id] ?? []).length === 0 ? (
                    <li>
                      <span>Nenhum registro ainda.</span>
                    </li>
                  ) : (
                    (sessions[plan.id] ?? []).map((session) => (
                      <li key={session.id}>
                        <strong>{new Date(session.occurredAt).toLocaleString("pt-BR")}</strong>
                        <span>
                          {session.outcome ?? session.observation ?? session.notes ?? "—"}
                        </span>
                      </li>
                    ))
                  )}
                </ol>

                <form
                  className="timing-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addSession(plan.id, event.currentTarget);
                  }}
                >
                  <p className="eyebrow">Registrar</p>
                  <label htmlFor={`when-${plan.id}`}>Quando aconteceu</label>
                  <input id={`when-${plan.id}`} name="occurredAt" type="datetime-local" required />
                  <label htmlFor={`notes-${plan.id}`}>Notas</label>
                  <textarea id={`notes-${plan.id}`} name="notes" rows={3} maxLength={8000} />
                  <label htmlFor={`obs-${plan.id}`}>O que você observou</label>
                  <textarea id={`obs-${plan.id}`} name="observation" rows={3} maxLength={4000} />
                  <label htmlFor={`out-${plan.id}`}>Desfecho</label>
                  <input id={`out-${plan.id}`} name="outcome" maxLength={2000} />
                  <button type="submit">Guardar registro</button>
                </form>
              </>
            )}
          </article>
        ))}

        <p className="method-emphasis method-limit">
          Tudo que você escreve aqui é cifrado no servidor, e a cifra é amarrada a você, ao registro
          e ao campo — um envelope movido de lugar não abre. Apagar um plano leva as sessões dele
          junto. O AstroAxe guarda o que você registra e não sugere o que fazer: a prática é sua.
        </p>
      </section>
    </>
  );
}
