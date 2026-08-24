"use client";

import { useEffect, useRef, useState } from "react";

export function AmbientSoundControl(): React.JSX.Element {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) return;
    function interact(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a[href]");
      if (control === null || control.classList.contains("ambient-sound-control")) return;
      void playTone(contextRef, control.matches("button") ? 240 : 360, 0.04);
    }
    document.addEventListener("pointerdown", interact, { capture: true });
    return () => document.removeEventListener("pointerdown", interact, { capture: true });
  }, [enabled]);

  async function toggle(): Promise<void> {
    if (enabled) {
      await playTone(contextRef, 300, 0.045);
      setEnabled(false);
      return;
    }
    setEnabled(true);
    await playTone(contextRef, 480, 0.07);
  }

  return (
    <button
      className="ambient-sound-control"
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? "Desativar sons de interface" : "Ativar sons de interface"}
      onClick={() => void toggle()}
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

async function playTone(
  contextRef: React.RefObject<AudioContext | null>,
  frequency: number,
  duration: number,
): Promise<void> {
  const context = contextRef.current ?? new AudioContext();
  contextRef.current = context;
  if (context.state === "suspended") await context.resume();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.022, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
