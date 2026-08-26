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
          Estas sete perguntas ajudam a distinguir movimentos simbólicos que podem parecer próximos
          no mapa. Não há resposta certa; você pode marcar ambos ou não responder.
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
          As respostas são usadas nesta solicitação como sinal auxiliar do método e não substituem
          confirmação religiosa.
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
      {question.options.map((option) => (
        <label key={option.value}>
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
    </fieldset>
  );
}
