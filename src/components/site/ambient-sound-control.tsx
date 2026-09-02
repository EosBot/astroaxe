"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const STORAGE_KEY = "astroaxe:sons-ambiente";

/**
 * Notas do bordão, em hertz.
 *
 * Uma fundamental grave, a quinta e a oitava. É o intervalo mais estável que
 * existe: soa como sustentação, e não como acorde querendo resolver em algum
 * lugar. A leitura precisa de chão, não de melodia puxando atenção para si.
 */
const DRONE_VOICES = [110, 164.81, 220] as const;

/** Volume do bordão. Baixo o bastante para conviver com leitura. */
const DRONE_GAIN = 0.035;

/** Segundos de entrada e de saída. Corte seco em áudio estala. */
const FADE_IN = 2.5;
const FADE_OUT = 1.2;

interface Ambience {
  stop: () => void;
}

export function AmbientSoundControl(): React.JSX.Element {
  /**
   * A preferência mora no `localStorage`, e não em estado local.
   *
   * Assim ela sobrevive à navegação, vale para todas as abas abertas, e o
   * componente deixa de precisar de um espelho síncrono para o listener global:
   * a escrita acontece no mesmo tique do clique, então qualquer leitura logo
   * depois já enxerga o valor novo. Era isso que o `ref` anterior remendava.
   */
  const enabled = useSyncExternalStore(subscribeToPreference, readPreference, () => false);
  const contextRef = useRef<AudioContext | null>(null);
  const ambienceRef = useRef<Ambience | null>(null);

  const start = useCallback((): void => {
    if (ambienceRef.current !== null) return;
    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    void context.resume();
    ambienceRef.current = startAmbience(context);
  }, []);

  useEffect(() => {
    function interact(event: PointerEvent): void {
      if (!readPreference()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a[href]");
      if (control === null || control.classList.contains("ambient-sound-control")) return;
      void playChime(contextRef, control.matches("button") ? 528 : 660);
    }
    document.addEventListener("pointerdown", interact, { capture: true });
    return () => document.removeEventListener("pointerdown", interact, { capture: true });
  }, []);

  /**
   * Retoma a preferência guardada, sem tocar nada por conta própria.
   *
   * O navegador só libera áudio depois de um gesto, e forçar som em quem acabou
   * de chegar seria justamente o comportamento que ninguém perdoa. Então o botão
   * já volta ligado e o bordão espera o primeiro toque na página.
   */
  useEffect(() => {
    if (!readPreference()) return;
    const resume = (): void => {
      if (readPreference()) start();
    };
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
    return () => {
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
    };
  }, [start]);

  useEffect(() => () => ambienceRef.current?.stop(), []);

  function toggle(): void {
    if (readPreference()) {
      writePreference(false);
      ambienceRef.current?.stop();
      ambienceRef.current = null;
      return;
    }
    writePreference(true);
    start();
    void playChime(contextRef, 528);
  }

  return (
    <button
      className="ambient-sound-control"
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Desativar sons de interface" : "Ativar sons de interface"}
      onClick={toggle}
    >
      <span className="sound-wave" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="sound-label-wide">{enabled ? "Sons ativos" : "Ativar sons"}</span>
      <span className="sound-label-compact">Som</span>
    </button>
  );
}

/**
 * Monta o bordão contínuo.
 *
 * Três senoides afinadas em oitava e quinta, atravessando um filtro que corta o
 * agudo, com um oscilador lentíssimo abrindo e fechando esse filtro. É o que
 * separa um zumbido de algo que parece respirar: sem esse movimento o ouvido
 * localiza a fonte em segundos, e aí ela vira incômodo.
 */
function startAmbience(context: AudioContext): Ambience {
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.linearRampToValueAtTime(DRONE_GAIN, now + FADE_IN);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(480, now);
  filter.Q.setValueAtTime(0.7, now);

  const sweep = context.createOscillator();
  sweep.frequency.setValueAtTime(0.05, now);
  const sweepDepth = context.createGain();
  sweepDepth.gain.setValueAtTime(220, now);
  sweep.connect(sweepDepth).connect(filter.frequency);
  sweep.start(now);

  const voices = DRONE_VOICES.map((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    // Desafinação mínima por voz: o batimento lento entre elas é o que dá
    // largura sem precisar de reverb.
    oscillator.detune.setValueAtTime(index * 4 - 4, now);
    const voiceGain = context.createGain();
    voiceGain.gain.setValueAtTime(index === 0 ? 1 : 0.45, now);
    oscillator.connect(voiceGain).connect(filter);
    oscillator.start(now);
    return oscillator;
  });

  filter.connect(master).connect(context.destination);

  return {
    stop: () => {
      const at = context.currentTime;
      master.gain.cancelScheduledValues(at);
      master.gain.setValueAtTime(master.gain.value, at);
      master.gain.linearRampToValueAtTime(0.0001, at + FADE_OUT);
      for (const oscillator of [...voices, sweep]) oscillator.stop(at + FADE_OUT + 0.05);
    },
  };
}

/**
 * Toque curto de interação.
 *
 * A versão anterior usava 40 ms a ganho 0,022 em 240 Hz — inaudível em
 * alto-falante de notebook, que praticamente não reproduz grave. Daí a queixa de
 * que o site não tinha som: ele tinha, e ninguém conseguia ouvir. Agora é agudo,
 * tem cauda, e some sozinho.
 */
async function playChime(
  contextRef: React.RefObject<AudioContext | null>,
  frequency: number,
): Promise<void> {
  const context = contextRef.current ?? new AudioContext();
  contextRef.current = context;
  if (context.state === "suspended") await context.resume();
  const now = context.currentTime;

  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.36);
}

const listeners = new Set<() => void>();

function subscribeToPreference(onChange: () => void): () => void {
  listeners.add(onChange);
  // O evento `storage` cobre a mesma preferência mudada em outra aba.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Aba anônima ou armazenamento bloqueado: desligado é o padrão de quem
    // chega pela primeira vez, e é o padrão seguro.
    return false;
  }
}

function writePreference(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Não poder lembrar a escolha não é motivo para não atender a escolha.
  }
  for (const listener of listeners) listener();
}
