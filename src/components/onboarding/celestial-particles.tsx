"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  depth: number;
  size: number;
  velocity: number;
  phase: number;
  warm: boolean;
}

export function CelestialParticles(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    if (typeof ResizeObserver === "undefined" || typeof IntersectionObserver === "undefined")
      return;
    const context = canvas.getContext("2d");
    if (context === null) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let visible = document.visibilityState === "visible";
    let intersecting = true;
    let animationFrame = 0;
    let previousFrame = 0;
    let stars: Star[] = [];
    let targetCameraX = 0;
    let targetCameraY = 0;
    let cameraX = 0;
    let cameraY = 0;

    const createStars = (count: number): Star[] =>
      Array.from({ length: count }, (_, index) => ({
        x: (((index * 73) % 211) / 210 - 0.5) * 1.8,
        y: (((index * 47 + 19) % 197) / 196 - 0.5) * 1.35,
        depth: 0.34 + (((index * 31 + 7) % 100) / 100) * 0.66,
        size: 0.45 + ((index * 11) % 13) * 0.12,
        velocity: 0.012 + ((index * 17) % 9) * 0.0015,
        phase: ((index * 29) % 100) / 100,
        warm: index % 9 === 0,
      }));

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = createStars(bounds.width < 500 ? 72 : 180);
    };

    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width * 0.5;
      const centerY = height * 0.48;
      const motionTime = reduceMotion.matches ? 0 : time / 1000;
      context.clearRect(0, 0, width, height);

      cameraX += (targetCameraX - cameraX) * 0.04;
      cameraY += (targetCameraY - cameraY) * 0.04;

      for (const star of stars) {
        if (!reduceMotion.matches) {
          star.depth -= star.velocity * 0.012;
          if (star.depth < 0.32) star.depth = 1;
        }
        const perspective = 0.58 / star.depth;
        const x = centerX + star.x * width * 0.48 * perspective + cameraX * (1 - star.depth);
        const y = centerY + star.y * height * 0.48 * perspective + cameraY * (1 - star.depth);
        if (x < -12 || x > width + 12 || y < -12 || y > height + 12) continue;

        const shimmer = reduceMotion.matches
          ? 0.5
          : 0.42 + Math.sin(motionTime * 0.75 + star.phase * Math.PI * 2) * 0.2;
        const alpha = Math.max(0.16, shimmer * (1.18 - star.depth * 0.4));
        const radius = star.size * perspective;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = star.warm
          ? `rgb(196 122 74 / ${alpha})`
          : `rgb(216 211 199 / ${alpha})`;
        context.fill();
      }
    };

    const animate = (time: number) => {
      if (visible && intersecting && !reduceMotion.matches && time - previousFrame >= 1000 / 30) {
        draw(time);
        previousFrame = time;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
    };
    const handlePointer = (event: PointerEvent) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      targetCameraX = (event.clientX / window.innerWidth - 0.5) * 18;
      targetCameraY = (event.clientY / window.innerHeight - 0.5) * 12;
    };
    const handleMotionPreference = () => {
      targetCameraX = 0;
      targetCameraY = 0;
      draw(0);
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry?.isIntersecting ?? false;
      },
      { threshold: 0.08 },
    );

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pointermove", handlePointer, { passive: true });
    reduceMotion.addEventListener("change", handleMotionPreference);
    resize();
    draw(0);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointer);
      reduceMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return (
    <span className="celestial-particles-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="celestial-particles" />
    </span>
  );
}
