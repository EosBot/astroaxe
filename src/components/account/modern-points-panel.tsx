import { zodiacPlacement } from "@/domain/astrology/western/zodiac";
import type { CreateMapResponse } from "@/lib/maps/contracts";

const points = [
  {
    id: "chiron",
    glyph: "⚷",
    label: "Quíron",
    theme: "Ferida que se torna sabedoria",
    meaning:
      "Quíron revela uma vulnerabilidade que não desaparece por força de vontade, mas amadurece quando é acolhida. Nesse território, sua experiência pode se transformar em compreensão, cuidado e capacidade de orientar outras pessoas.",
  },
  {
    id: "mean_lilith",
    glyph: "⚸",
    label: "Lilith média",
    theme: "Desejo soberano e sombra",
    meaning:
      "Lilith média mostra onde sua natureza se recusa a ser domesticada para caber na expectativa alheia. Ela fala de autonomia, desejo, raiva legítima e da potência recuperada quando você deixa de exilar partes intensas de si.",
  },
  {
    id: "true_node",
    glyph: "☊",
    label: "Nodo Norte",
    theme: "Direção de desenvolvimento",
    meaning:
      "O Nodo Norte aponta experiências que expandem sua trajetória justamente porque ainda não são automáticas. Ele não promete um destino pronto: indica qualidades que a vida insiste em convidar você a praticar e incorporar.",
  },
] as const;

export function ModernPointsPanel({
  chart,
  onOpenSettings,
}: Readonly<{
  chart: CreateMapResponse["chart"];
  onOpenSettings?: () => void;
}>): React.JSX.Element {
  const visiblePoints: Array<{
    id: string;
    glyph: string;
    label: string;
    theme: string;
    placement?: ReturnType<typeof zodiacPlacement>;
    meaning: string;
  }> = points.map(({ id, glyph, label, theme, meaning }) => {
    const planet = chart.planets.find((item) => item.id === id);
    return {
      id,
      glyph,
      label,
      theme,
      meaning,
      ...(planet === undefined ? {} : { placement: zodiacPlacement(planet.longitude) }),
    };
  });
  const node = chart.planets.find((item) => item.id === "true_node");
  visiblePoints.push({
    id: "south_node",
    glyph: "☋",
    label: "Nodo Sul",
    theme: "Memória, recursos e padrões conhecidos",
    meaning:
      "O Nodo Sul reúne habilidades, hábitos e estratégias que parecem familiares desde cedo. É uma fonte real de repertório, mas pode virar repetição confortável; seu equilíbrio nasce quando esses recursos sustentam, sem substituir, o caminho do Nodo Norte.",
    ...(node === undefined ? {} : { placement: zodiacPlacement((node.longitude + 180) % 360) }),
  });
  const missingCount = visiblePoints.filter((point) => point.placement === undefined).length;

  return (
    <section className="modern-points-panel" aria-labelledby="modern-points-title">
      <header>
        <p className="eyebrow">Pontos modernos calculados</p>
        <h2 id="modern-points-title">Além dos dez planetas.</h2>
        <p>Coordenadas reais do snapshot natal, sem posições inventadas ou calculadas por texto.</p>
      </header>
      <div>
        {visiblePoints.map((point) => (
          <article key={point.id} data-available={point.placement !== undefined}>
            <span aria-hidden="true">{point.glyph}</span>
            <p className="eyebrow">{point.theme}</p>
            <h3>{point.label}</h3>
            <strong>
              {point.placement === undefined
                ? "Aguardando recálculo"
                : `${point.placement.sign} · ${point.placement.signDegree.toFixed(2)}°`}
            </strong>
            {point.placement === undefined ? null : (
              <div className="modern-point-reading">
                <p>{point.meaning}</p>
                <p>{signMeaning(point.id, point.placement.sign)}</p>
              </div>
            )}
          </article>
        ))}
      </div>
      {missingCount > 0 ? (
        <aside className="modern-points-upgrade" aria-label="Atualizar pontos modernos">
          <div>
            <p className="eyebrow">Mapa criado em uma versão anterior</p>
            <strong>
              Atualize o cálculo para revelar {missingCount === 1 ? "este ponto" : "estes pontos"}.
            </strong>
            <p>Seus dados anteriores continuam no histórico de revisões.</p>
          </div>
          {onOpenSettings === undefined ? null : (
            <button className="primary-button" type="button" onClick={onOpenSettings}>
              Atualizar este mapa
            </button>
          )}
        </aside>
      ) : null}
    </section>
  );
}

const signExpressions: Readonly<Record<string, string>> = {
  Áries: "pela coragem de iniciar, afirmar vontade e ocupar espaço",
  Touro: "através do corpo, dos valores, da segurança e da relação com permanência",
  Gêmeos: "pela palavra, pela curiosidade e pela capacidade de sustentar mais de uma perspectiva",
  Câncer: "no campo do pertencimento, da memória, do cuidado e da proteção emocional",
  Leão: "pela criatividade, pelo reconhecimento e pelo direito de expressar o próprio brilho",
  Virgem:
    "através do discernimento, do trabalho cotidiano, do aperfeiçoamento e do cuidado prático",
  Libra: "nos encontros, nas escolhas compartilhadas e na busca por reciprocidade sem autoabandono",
  Escorpião: "por meio da intimidade, do poder, das perdas e da capacidade de regeneração",
  Sagitário: "pela busca de sentido, verdade, liberdade e ampliação dos horizontes",
  Capricórnio: "através da responsabilidade, da ambição, dos limites e da construção no tempo",
  Aquário:
    "na liberdade de ser diferente, pertencer a coletivos e romper padrões que perderam sentido",
  Peixes: "pela sensibilidade, imaginação, entrega e necessidade de criar fronteiras compassivas",
};

function signMeaning(pointId: string, sign: string): string {
  const expression = signExpressions[sign] ?? "através das qualidades desse signo";
  const subjects: Readonly<Record<string, string>> = {
    chiron: "Sua jornada de elaboração acontece",
    mean_lilith: "Sua força indomada se manifesta",
    true_node: "Seu caminho de crescimento se abre",
    south_node: "Seu repertório ancestral e conhecido se expressa",
  };
  const subject = subjects[pointId] ?? subjects.south_node;
  return `${subject} ${expression}.`;
}
