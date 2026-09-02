import { zodiacPlacement } from "@/domain/astrology/western/zodiac";
import type { CreateMapResponse } from "@/lib/maps/contracts";

const points = [
  {
    id: "chiron",
    glyph: "⚷",
    label: "Quíron",
    theme: "Ferida que se torna sabedoria",
    meaning:
      "Todo mundo carrega um ponto que não sara por esforço. Quíron marca o seu. A tradição chama de ferida, mas talvez seja melhor chamar de lugar sensível — aquele assunto em que você sente mais fundo que os outros, e que já tentou resolver na força de vontade sem sucesso. A virada não vem de curar: vem de acolher. É por isso que quem atravessa esse território costuma acabar cuidando de gente que passa pelo mesmo. Você entende de dentro. Isso não se aprende em lugar nenhum.",
  },
  {
    id: "mean_lilith",
    glyph: "⚸",
    label: "Lilith média",
    theme: "Desejo soberano e sombra",
    meaning:
      "Existe uma parte de você que nunca aceitou ser domesticada para caber na expectativa dos outros. Lilith aponta onde ela mora. Fala de autonomia, de desejo sem pedido de licença, de raiva que tem razão de existir. Costuma ter sido exilada cedo — porque incomodava, porque era demais, porque alguém não soube o que fazer com ela. A potência volta quando você para de mandar essa parte para longe e começa a negociar com ela como quem negocia com alguém de casa.",
  },
  {
    id: "true_node",
    glyph: "☊",
    label: "Nodo Norte",
    theme: "Direção de desenvolvimento",
    meaning:
      "O Nodo Norte aponta para onde a vida insiste em te convidar — e o convite costuma ser desconfortável, porque ainda não é automático. Não é destino pronto nem missão escrita: é a direção em que você cresce quando aceita fazer o que ainda não domina. Repare nas situações que se repetem e que sempre pedem de você exatamente aquilo que você acha que não sabe fazer. Não é coincidência, e não é castigo. É o caminho.",
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
      "O Nodo Sul guarda o que você já sabe fazer — talvez desde sempre, sem lembrar de ter aprendido. É repertório de verdade, e não se deve jogar fora. O risco é outro: é confortável demais. Quando aperta, é para cá que a gente corre, e correr para o conhecido pode virar uma vida inteira andando em círculo. O equilíbrio aparece quando esses recursos sustentam a travessia em vez de substituí-la.",
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
    south_node: "Seu repertório conhecido e já praticado se expressa",
  };
  const subject = subjects[pointId] ?? subjects.south_node;
  return `${subject} ${expression}.`;
}
