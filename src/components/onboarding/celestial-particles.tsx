"use client";

import { useEffect, useRef } from "react";

interface Particle {
  angle: number;
  radius: number;
  size: number;
  speed: number;
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
    let visible = document.visibilityState === "visible";
    let intersecting = true;
    let animationFrame = 0;
    let previousFrame = 0;
    let particles: Particle[] = [];

    const createParticles = (count: number): Particle[] =>
      Array.from({ length: count }, (_, index) => ({
        angle: (index / count) * Math.PI * 2 + ((index * 17) % 11) * 0.07,
        radius: 0.16 + (((index * 29) % 83) / 100) * 0.76,
        size: 0.55 + ((index * 7) % 9) * 0.12,
        speed: (0.018 + ((index * 13) % 17) * 0.0015) * (index % 3 === 0 ? -1 : 1),
        phase: ((index * 31) % 100) / 100,
        warm: index % 7 === 0,
      }));

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(bounds.width < 500 ? 20 : 38);
    };

    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const extent = Math.min(width, height) / 2;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        const motionTime = reduceMotion.matches ? 0 : time / 1000;
        const angle = particle.angle + motionTime * particle.speed;
        const orbitRadius = extent * particle.radius;
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius * 0.72;
        const shimmer = reduceMotion.matches
          ? 0.46
          : 0.34 + Math.sin(motionTime * 0.8 + particle.phase * Math.PI * 2) * 0.16;

        context.beginPath();
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fillStyle = particle.warm
          ? `rgb(196 122 74 / ${shimmer})`
          : `rgb(216 211 199 / ${shimmer})`;
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
    const handleMotionPreference = () => draw(0);
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
    reduceMotion.addEventListener("change", handleMotionPreference);
    resize();
    draw(0);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reduceMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} className="celestial-particles" role="presentation" />;
}
