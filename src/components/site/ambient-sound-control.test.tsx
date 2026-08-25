// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AmbientSoundControl } from "./ambient-sound-control";

describe("AmbientSoundControl", () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("plays only short opt-in interaction tones", async () => {
    const start = vi.fn();
    const stop = vi.fn();
    const setFrequency = vi.fn();
    const connectGain = vi.fn();
    const connectOscillator = vi.fn(() => ({ connect: connectGain }));
    class AudioContextMock {
      readonly currentTime = 1;
      readonly destination = {};
      readonly state = "running";

      async resume(): Promise<void> {}

      createOscillator(): object {
        return {
          type: "sine",
          frequency: { setValueAtTime: setFrequency },
          connect: connectOscillator,
          start,
          stop,
        };
      }

      createGain(): object {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
        };
      }
    }
    vi.stubGlobal("AudioContext", AudioContextMock);

    render(
      <>
        <AmbientSoundControl />
        <button type="button">Abrir leitura</button>
      </>,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir leitura" }));
    expect(start).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ativar sons de interface" }));
    expect(setFrequency).toHaveBeenLastCalledWith(480, 1);
    expect(stop).toHaveBeenLastCalledWith(1.07);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir leitura" }));
    expect(setFrequency).toHaveBeenLastCalledWith(240, 1);
    expect(stop).toHaveBeenLastCalledWith(1.04);

    fireEvent.click(screen.getByRole("button", { name: "Desativar sons de interface" }));
    await screen.findByRole("button", { name: "Ativar sons de interface" });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir leitura" }));
    expect(start).toHaveBeenCalledTimes(3);
  });
});
