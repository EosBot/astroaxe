"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const STAR_COUNT_DESKTOP = 1_100;
const STAR_COUNT_MOBILE = 620;

export function CelestialObservatory3D(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.parentElement?.setAttribute("data-webgl-failed", "true");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    camera.position.set(0, 0.2, 10.8);
    const root = new THREE.Group();
    root.rotation.set(-0.12, -0.28, 0.08);
    scene.add(root);

    const disposables: Array<{ dispose: () => void }> = [];
    const solarTexture = createSolarTexture();
    const coronaTexture = createCoronaTexture();
    disposables.push(solarTexture, coronaTexture);

    const planetGeometry = new THREE.SphereGeometry(2.05, 96, 96);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: solarTexture,
      emissiveMap: solarTexture,
      emissive: 0xff6b21,
      emissiveIntensity: 1.5,
      roughness: 0.86,
      metalness: 0,
      color: 0xffb354,
    });
    disposables.push(planetGeometry, planetMaterial);
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.rotation.z = THREE.MathUtils.degToRad(7.25);
    root.add(planet);

    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 72, 72);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0xff7b24) },
        viewVector: { value: camera.position },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float rim = pow(0.64 - dot(vNormal, -vPositionNormal), 4.0);
          gl_FragColor = vec4(glowColor, rim * 0.58);
        }
      `,
    });
    disposables.push(atmosphereGeometry, atmosphereMaterial);
    root.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    const coronaMaterial = new THREE.SpriteMaterial({
      map: coronaTexture,
      color: 0xffa357,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerCoronaMaterial = new THREE.SpriteMaterial({
      map: coronaTexture,
      color: 0xff6c2d,
      transparent: true,
      opacity: 0.3,
      rotation: 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(coronaMaterial, outerCoronaMaterial);
    const outerCorona = new THREE.Sprite(outerCoronaMaterial);
    outerCorona.scale.setScalar(7.15);
    outerCorona.position.z = -0.2;
    root.add(outerCorona);
    const corona = new THREE.Sprite(coronaMaterial);
    corona.scale.setScalar(6.25);
    corona.position.z = -0.16;
    root.add(corona);

    const planetaryOrbits = createPhotographicPlanetarySystem(disposables);
    planetaryOrbits.forEach(({ group }) => root.add(group));

    const stars = createStars(
      window.innerWidth < 700 ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP,
      disposables,
    );
    scene.add(stars);

    const keyLight = new THREE.DirectionalLight(0xffc78e, 6.8);
    keyLight.position.set(-3.8, 3.2, 6.5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x5db8bb, 13, 18, 2);
    rimLight.position.set(4.4, -1.4, 3.2);
    scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight(0x518f9a, 2.2);
    fillLight.position.set(4, -1.5, 4);
    scene.add(fillLight);
    scene.add(new THREE.AmbientLight(0x244454, 1.18));
    const solarLight = new THREE.PointLight(0xff9a45, 42, 22, 1.7);
    solarLight.position.set(0, 0, 0.7);
    root.add(solarLight);

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = document.visibilityState === "visible";
    let intersecting = true;
    let frame = 0;
    let lastTime = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 620 ? 12.4 : 10.8;
      root.scale.setScalar(width < 620 ? 0.58 : 0.78);
      root.position.x = width < 620 ? 0 : -1.25;
      root.position.y = width < 620 ? 0.45 : -1.85;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1_000, 0.05);
      lastTime = time;
      if (!reduceMotion.matches) {
        planetaryOrbits.forEach(({ group, speed }) => {
          group.rotation.z += delta * speed;
        });
      }
      renderer.render(scene, camera);
      if (visible && intersecting && !reduceMotion.matches) frame = requestAnimationFrame(render);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (visible && intersecting && !reduceMotion.matches) frame = requestAnimationFrame(render);
      else renderer.render(scene, camera);
    };
    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
      start();
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry?.isIntersecting ?? false;
        start();
      },
      { threshold: 0.04 },
    );
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    reduceMotion.addEventListener("change", start);
    resize();
    start();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reduceMotion.removeEventListener("change", start);
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <span className="celestial-observatory-3d" data-webgl-failed="false" aria-hidden="true">
      <canvas ref={canvasRef} />
      <span className="celestial-fallback-orb" />
    </span>
  );
}

function createSolarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D indisponível para textura procedural.");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#ffd36b");
  gradient.addColorStop(0.32, "#ff9b3d");
  gradient.addColorStop(0.68, "#d44d20");
  gradient.addColorStop(1, "#7e2116");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let granule = 0; granule < 1_100; granule += 1) {
    const x = (granule * 197 + (granule % 17) * 31) % canvas.width;
    const y = (granule * 89 + (granule % 29) * 13) % canvas.height;
    const radius = 1.2 + ((granule * 7) % 9) / 3;
    context.beginPath();
    context.ellipse(x, y, radius * 1.8, radius, granule * 0.37, 0, Math.PI * 2);
    context.fillStyle = granule % 5 === 0 ? "rgb(255 239 161 / 0.12)" : "rgb(123 34 19 / 0.07)";
    context.fill();
  }
  for (let spot = 0; spot < 7; spot += 1) {
    const x = 80 + ((spot * 137) % 610);
    const y = 58 + ((spot * 73) % 266);
    context.beginPath();
    context.ellipse(x, y, 5 + (spot % 3) * 2.5, 2.2 + (spot % 2), spot * 0.41, 0, Math.PI * 2);
    context.fillStyle = "rgb(83 24 16 / 0.34)";
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function createCoronaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D indisponível para corona solar.");
  const gradient = context.createRadialGradient(256, 256, 108, 256, 256, 254);
  gradient.addColorStop(0, "rgb(255 242 196 / 0.76)");
  gradient.addColorStop(0.2, "rgb(255 174 76 / 0.42)");
  gradient.addColorStop(0.52, "rgb(255 105 37 / 0.13)");
  gradient.addColorStop(0.82, "rgb(255 87 27 / 0.035)");
  gradient.addColorStop(1, "rgb(255 80 20 / 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(256, 256);
  for (let ray = 0; ray < 72; ray += 1) {
    const angle = (ray / 72) * Math.PI * 2;
    const magneticWave = Math.sin(ray * 1.71) * 24 + Math.sin(ray * 0.43) * 18;
    const length = 78 + magneticWave + (ray % 11 === 0 ? 54 : 0);
    const width = ray % 9 === 0 ? 2.2 : 0.65 + (ray % 4) * 0.18;
    context.save();
    context.rotate(angle);
    const streamer = context.createLinearGradient(116, 0, 116 + length, 0);
    streamer.addColorStop(0, ray % 9 === 0 ? "rgb(255 236 185 / 0.48)" : "rgb(255 179 89 / 0.24)");
    streamer.addColorStop(0.58, "rgb(255 111 45 / 0.1)");
    streamer.addColorStop(1, "rgb(255 82 30 / 0)");
    context.fillStyle = streamer;
    context.fillRect(116, -width / 2, length, width);
    context.restore();
  }
  context.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type PhotographicOrbit = { group: THREE.Group; speed: number };

function createPhotographicPlanetarySystem(
  disposables: Array<{ dispose: () => void }>,
): PhotographicOrbit[] {
  const loader = new THREE.TextureLoader();
  const planets = [
    { name: "mercury", radius: 2.65, size: 0.18, speed: 0.155, angle: 0.25 },
    { name: "venus", radius: 3.05, size: 0.3, speed: 0.115, angle: 2.25 },
    { name: "earth", radius: 3.48, size: 0.32, speed: 0.09, angle: 0.08 },
    { name: "mars", radius: 3.88, size: 0.23, speed: 0.073, angle: 4.15 },
    { name: "jupiter", radius: 4.45, size: 0.72, speed: 0.041, angle: 5.3 },
    { name: "saturn", radius: 5.1, size: 1.12, speed: 0.03, angle: 2.85, aspect: 0.8 },
    { name: "uranus", radius: 5.72, size: 0.5, speed: 0.021, angle: 4.8 },
    { name: "neptune", radius: 6.25, size: 0.48, speed: 0.016, angle: 1.55 },
  ] as const;

  return planets.map((planet) => {
    const texture = loader.load(`/assets/nasa/${planet.name}-pia01341.png`);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(planet.size * ("aspect" in planet ? planet.aspect : 1), planet.size, 1);
    sprite.position.set(planet.radius, 0, 0.35 + planet.radius * 0.025);
    const group = new THREE.Group();
    group.rotation.set(THREE.MathUtils.degToRad(2), 0, planet.angle);
    group.add(sprite);
    disposables.push(texture, material);
    return { group, speed: planet.speed };
  });
}

function createStars(count: number, disposables: Array<{ dispose: () => void }>): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 8 + (((index * 47) % 100) / 100) * 35;
    const theta = index * 2.399963;
    const phi = Math.acos(1 - (2 * (index + 0.5)) / count);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[index * 3 + 2] = radius * Math.cos(phi) - 8;
    const warm = index % 13 === 0;
    colors[index * 3] = warm ? 0.95 : 0.56;
    colors[index * 3 + 1] = warm ? 0.58 : 0.82;
    colors[index * 3 + 2] = warm ? 0.34 : 0.84;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.035,
    transparent: true,
    opacity: 0.82,
    vertexColors: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  disposables.push(geometry, material);
  return new THREE.Points(geometry, material);
}
