import { regencyQuestionnaire } from "@/domain/orixas/regency/questionnaire";

export function QuestionnaireStep({
  answers,
  onAnswer,
  onSubmit,
}: Readonly<{
  answers: Record<string, string>;
  onAnswer: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: () => Promise<void>;
}>): React.JSX.Element {
  return (
    <section className="orisa-research-lab" aria-labelledby="orisa-lab-title">
      <header>
        <div>
          <p className="eyebrow orisa-method-label">
            <span>V3</span> Calibração da tríade
          </p>
          <h1 id="orisa-lab-title">Antes da sua Tríade</h1>
        </div>
        <p>
          O que vem agora são {regencyQuestionnaire.length} frases sobre o dia a dia. Leia cada uma
          e diga o quanto ela combina com você — sem pensar demais, a primeira impressão costuma ser
          a mais honesta. Não existe resposta certa, nem resposta que deixe o resultado mais bonito:
          o que muda o resultado é você responder como de fato é. Se alguma frase não fizer sentido,
          pode pular. Leva uns quatro minutos.
        </p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        {regencyQuestionnaire.map((question, index) => (
          <QuestionField
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id]}
            onAnswer={(value) => onAnswer((current) => ({ ...current, [question.id]: value }))}
          />
        ))}
        <p>
          Suas respostas entram como um sinal entre outros, ao lado do que o céu do seu nascimento
          mostra. Elas ajudam a desempatar, não decidem sozinhas — e nada aqui substitui confirmação
          dentro do contexto religioso.
        </p>
        <button className="quiet-button" type="submit">
          Cruzar respostas e revelar tríade
        </button>
      </form>
    </section>
  );
}

function QuestionField({
  question,
  index,
  answer,
  onAnswer,
}: Readonly<{
  question: (typeof regencyQuestionnaire)[number];
  index: number;
  answer: string | undefined;
  onAnswer: (value: string) => void;
}>): React.JSX.Element {
  return (
    <fieldset>
      <legend>
        {index + 1}. {question.prompt}
      </legend>
      <div className="likert-scale">
        {question.options.map((option) => (
          <label key={option.value} data-skip={option.value === "prefer_not_to_answer"}>
            <input
              required
              type="radio"
              name={question.id}
              value={option.value}
              checked={answer === option.value}
              onChange={() => onAnswer(option.value)}
            />{" "}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
