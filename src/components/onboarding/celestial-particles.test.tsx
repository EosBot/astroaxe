// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CelestialParticles } from "./celestial-particles";

describe("CelestialParticles", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a static fallback when observer APIs are unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<CelestialParticles />);
    expect(container.querySelector("canvas")?.parentElement?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("draws a capped particle field and releases browser observers", () => {
    let animationCallback: FrameRequestCallback = () => undefined;
    let intersectionCallback: IntersectionObserverCallback = () => undefined;
    let motionCallback: (() => void) | undefined;
    const disconnectResize = vi.fn();
    const disconnectIntersection = vi.fn();
    const cancelAnimationFrame = vi.fn();
    const clearRect = vi.fn();
    const arc = vi.fn();
    const fill = vi.fn();
    const setTransform = vi.fn();
    const context = {
      clearRect,
      beginPath: vi.fn(),
      arc,
      fill,
      setTransform,
      fillStyle: "",
    };

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 600,
      height: 600,
      top: 0,
      right: 600,
      bottom: 600,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "clientWidth", "get").mockReturnValue(600);
    vi.spyOn(HTMLCanvasElement.prototype, "clientHeight", "get").mockReturnValue(600);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = disconnectResize;
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback;
        }
        observe = vi.fn();
        disconnect = disconnectIntersection;
      },
    );
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationCallback = callback;
      return 7;
    });
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
    vi.stubGlobal("devicePixelRatio", 2);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: (_type: string, callback: () => void) => {
        motionCallback = callback;
      },
      removeEventListener: vi.fn(),
    }));

    const { unmount } = render(<CelestialParticles />);
    expect(setTransform).toHaveBeenCalledWith(1.5, 0, 0, 1.5, 0, 0);
    expect(arc.mock.calls.length).toBeGreaterThan(140);
    expect(arc.mock.calls.length).toBeLessThanOrEqual(180);

    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      animationCallback(100);
      motionCallback?.();
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(clearRect).toHaveBeenCalled();
    expect(fill).toHaveBeenCalled();

    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(disconnectResize).toHaveBeenCalled();
    expect(disconnectIntersection).toHaveBeenCalled();
  });
});
