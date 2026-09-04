// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AmbientSoundControl } from "./ambient-sound-control";

const started: number[] = [];
const stopped: number[] = [];

/**
 * Dublê do grafo de áudio.
 *
 * Registra as frequências que chegaram a soar, que é o que os testes precisam
 * afirmar: som nenhum antes do consentimento, som depois dele, silêncio de novo
 * ao desligar.
 */
function installAudioMock(): void {
  started.length = 0;
  stopped.length = 0;

  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  });

  class AudioContextMock {
    readonly currentTime = 1;
    readonly destination = {};
    readonly state = "running";

    async resume(): Promise<void> {}

    createOscillator(): object {
      let frequency = 0;
      return {
        type: "sine",
        frequency: {
          ...param(),
          setValueAtTime: (value: number) => {
            frequency = value;
          },
        },
        detune: param(),
        connect: (node: unknown) => node,
        start: () => started.push(frequency),
        stop: () => stopped.push(frequency),
      };
    }

    createGain(): object {
      return { gain: param(), connect: (node: unknown) => node };
    }

    createBiquadFilter(): object {
      return {
        type: "lowpass",
        frequency: param(),
        Q: param(),
        connect: (node: unknown) => node,
      };
    }
  }

  vi.stubGlobal("AudioContext", AudioContextMock);
}

describe("AmbientSoundControl", () => {
  beforeEach(() => {
    localStorage.clear();
    installAudioMock();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function renderComTela() {
    return render(
      <>
        <AmbientSoundControl />
        <button type="button">Abrir leitura</button>
      </>,
    );
  }

  it("não emite som nenhum antes do consentimento", () => {
    renderComTela();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir leitura" }));

    expect(started).toEqual([]);
  });

  it("sobe o bordão e o toque de interação depois do consentimento", () => {
    renderComTela();

    fireEvent.click(screen.getByRole("button", { name: "Ativar sons de interface" }));

    // As três vozes do bordão, o oscilador lento que move o filtro, e o toque
    // do próprio clique. Sem o bordão o site fica mudo entre um clique e outro,
    // que era a queixa.
    for (const voz of [110, 164.81, 220, 0.05, 528]) expect(started).toContain(voz);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir leitura" }));
    expect(started).toContain(528);
  });

  it("silencia tudo ao desligar", async () => {
    renderComTela();

    fireEvent.click(screen.getByRole("button", { name: "Ativar sons de interface" }));
    fireEvent.click(screen.getByRole("button", { name: "Desativar sons de interface" }));
    await screen.findByRole("button", { name: "Ativar sons de interface" });

    // O bordão precisa receber ordem de parada, senão continua tocando para
    // sempre — um som contínuo que ignora o botão é pior que som nenhum.
    for (const voz of [110, 164.81, 220, 0.05]) expect(stopped).toContain(voz);

    const antes = started.length;
    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir leitura" }));
    expect(started).toHaveLength(antes);
  });

  it("guarda a escolha e volta ligado na visita seguinte", () => {
    const { unmount } = renderComTela();
    fireEvent.click(screen.getByRole("button", { name: "Ativar sons de interface" }));
    unmount();
    cleanup();

    renderComTela();

    // Sem isto a pessoa liga o som, navega, e ele volta desligado — que é
    // exatamente como um recurso ligado parece estar quebrado.
    expect(screen.getByRole("button", { name: "Desativar sons de interface" })).toBeTruthy();
  });

  it("não toca sozinho ao restaurar a preferência, e espera um gesto", () => {
    localStorage.setItem("astroaxe:sons-ambiente", "true");

    renderComTela();

    // Áudio automático em quem acabou de chegar é bloqueado pelo navegador, e
    // detestado por quem não é.
    expect(started).toEqual([]);
    expect(screen.getByRole("button", { name: "Desativar sons de interface" })).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(started).toContain(110);
  });
});
