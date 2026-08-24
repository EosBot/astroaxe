// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CelestialObservatory3D } from "./celestial-observatory-3d";

const rendererState = vi.hoisted(() => ({ fail: false, dispose: vi.fn(), render: vi.fn() }));

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    outputColorSpace = "";
    toneMapping = 0;
    toneMappingExposure = 0;
    constructor() {
      if (rendererState.fail) throw new Error("WebGL unavailable");
    }
    setClearColor = vi.fn();
    setPixelRatio = vi.fn();
    setSize = vi.fn();
    render = rendererState.render;
    dispose = rendererState.dispose;
  }
  return { ...actual, WebGLRenderer };
});

describe("CelestialObservatory3D", () => {
  beforeEach(() => {
    rendererState.fail = false;
    rendererState.dispose.mockClear();
    rendererState.render.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      createRadialGradient: () => ({ addColorStop: vi.fn() }),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 900,
      height: 700,
      top: 0,
      right: 900,
      bottom: 700,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 9),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds and disposes the volumetric scene", () => {
    const { container, unmount } = render(<CelestialObservatory3D />);
    expect(container.querySelector("canvas")).toBeTruthy();
    expect(rendererState.render).toHaveBeenCalled();

    act(() => window.dispatchEvent(new MouseEvent("pointermove", { clientX: 400, clientY: 300 })));
    unmount();
    expect(rendererState.dispose).toHaveBeenCalledOnce();
  });

  it("shows the static fallback when WebGL cannot initialize", () => {
    rendererState.fail = true;
    const { container } = render(<CelestialObservatory3D />);
    expect(container.querySelector("[data-webgl-failed='true']")).toBeTruthy();
  });
});
