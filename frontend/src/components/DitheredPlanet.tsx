"use client";
import { useEffect, useRef } from "react";

export default function DitheredPlanet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId: number;
    const SW = 640;
    const SH = 360;

    const buffer = document.createElement("canvas");
    buffer.width = SW;
    buffer.height = SH;
    const g = buffer.getContext("2d", { alpha: false });
    if (!g) return;

    g.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    const BAYER = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];

    function hash(x: number, y: number) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return n - Math.floor(n);
    }

    function smooth(t: number) {
      return t * t * (3 - 2 * t);
    }

    function noise(x: number, y: number) {
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = smooth(x - x0);
      const fy = smooth(y - y0);
      const a = hash(x0, y0);
      const b = hash(x0 + 1, y0);
      const c = hash(x0, y0 + 1);
      const d = hash(x0 + 1, y0 + 1);
      const ab = a + (b - a) * fx;
      const cd = c + (d - c) * fx;
      return ab + (cd - ab) * fy;
    }

    function ridgedNoise(x: number, y: number) {
      return 1 - Math.abs(noise(x, y) * 2 - 1);
    }

    const stars = Array.from({ length: 620 }, () => ({
      x: Math.random() * SW,
      y: Math.random() * SH,
      size: Math.random() < 0.96 ? 1 : 2,
      brightness: 0.18 + Math.random() * 0.62,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 1.8,
      cross: Math.random() < 0.018
    }));

    function drawStars(t: number) {
      for (const s of stars) {
        const pulse = Math.sin(t * 0.0012 * s.speed + s.phase) * 0.10;
        const a = Math.max(0.08, Math.min(1, s.brightness + pulse));
        const c = Math.floor(80 + a * 140);
        g!.fillStyle = `rgb(${c},${c},${c})`;
        g!.fillRect(s.x | 0, s.y | 0, s.size, s.size);
        if (s.cross) {
          g!.fillRect((s.x - 1) | 0, s.y | 0, 3, 1);
          g!.fillRect(s.x | 0, (s.y - 1) | 0, 1, 3);
        }
      }
    }

    const planet = {
      x: SW * 0.5,
      y: SH * 0.515,
      radius: 96
    };

    const orbits = [
      { rx: 84, ry: 27, rot: -0.14 },
      { rx: 102, ry: 36, rot:  0.05 },
      { rx: 122, ry: 45, rot:  0.12 },
      { rx: 142, ry: 56, rot: -0.04 },
      { rx: 165, ry: 68, rot:  0.025 }
    ];

    const moons = Array.from({ length: 9 }, (_, i) => ({
      orbit: i % orbits.length,
      angle: Math.random() * Math.PI * 2,
      speed: (0.00020 + Math.random() * 0.00034) * (Math.random() < 0.5 ? -1 : 1),
      size: 1.5 + Math.random() * 2.5,
      seed: Math.random() * 5000
    }));

    function drawOrbits() {
      for (const o of orbits) {
        g!.save();
        g!.translate(planet.x, planet.y);
        g!.rotate(o.rot);
        for (let a = 0; a < Math.PI * 2; a += 0.016) {
          const segment = Math.floor(a * 48);
          if (segment % 7 < 2) continue;
          const x = Math.cos(a) * o.rx;
          const y = Math.sin(a) * o.ry;
          g!.fillStyle = "rgb(52,52,52)";
          g!.fillRect(x | 0, y | 0, 1, 1);
        }
        g!.restore();
      }
    }

    function moonPosition(m: any, t: number) {
      const o = orbits[m.orbit];
      const a = m.angle + t * m.speed;
      const lx = Math.cos(a) * o.rx;
      const ly = Math.sin(a) * o.ry;
      const c = Math.cos(o.rot);
      const s = Math.sin(o.rot);
      return {
        x: planet.x + lx * c - ly * s,
        y: planet.y + lx * s + ly * c,
        z: Math.sin(a),
        scale: 0.70 + (Math.sin(a) + 1) * 0.15
      };
    }

    function drawMoon(m: any, p: any) {
      const radius = Math.max(1, m.size * p.scale);
      for (let iy = -Math.ceil(radius); iy <= Math.ceil(radius); iy++) {
        for (let ix = -Math.ceil(radius); ix <= Math.ceil(radius); ix++) {
          const nx = ix / radius;
          const ny = iy / radius;
          if (nx * nx + ny * ny > 1) continue;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          let light = nx * -0.55 + ny * -0.45 + nz * 0.92;
          light = (light + 1) * 0.5;
          const crater = noise((ix + m.seed) * 0.85, (iy + m.seed) * 0.85);
          const value = light * 0.72 + crater * 0.28;
          const bx = Math.floor(Math.abs(ix)) % 4;
          const by = Math.floor(Math.abs(iy)) % 4;
          const threshold = BAYER[by][bx] / 16;
          if (value <= threshold + 0.10) continue;

          const c = value > 0.72 ? {r: 220, g: 200, b: 250} :
                    value > 0.50 ? {r: 168, g: 148, b: 200} : {r: 108, g: 88, b: 150};
          g!.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
          g!.fillRect((p.x + ix) | 0, (p.y + iy) | 0, 1, 1);
        }
      }
    }

    const meteors = Array.from({ length: 6 }, () => ({
      x: Math.random() * SW,
      y: Math.random() * SH,
      vx: -0.028 - Math.random() * 0.030,
      vy:  0.008 + Math.random() * 0.016,
      length: 9 + Math.random() * 14
    }));

    function drawMeteors() {
      for (const m of meteors) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < -35 || m.y > SH + 25) {
          m.x = SW + Math.random() * 35;
          m.y = Math.random() * SH * 0.72;
        }
        for (let i = 0; i < m.length; i++) {
          if (i % 2 && Math.random() > 0.42) continue;
          const x = m.x - m.vx * i * 24;
          const y = m.y - m.vy * i * 24;
          const a = 1 - i / m.length;
          const c = Math.floor(75 + a * 180);
          g!.fillStyle = `rgb(${c},${c},${Math.min(255, c+50)})`;
          g!.fillRect(x | 0, y | 0, 1, 1);
        }
        g!.fillStyle = "#eeeeee";
        g!.fillRect(m.x | 0, m.y | 0, 2, 2);
      }
    }

    function globeField(ix: number, iy: number, t: number) {
      const r = planet.radius;
      const nx = ix / r;
      const ny = iy / r;
      const d = nx * nx + ny * ny;
      if (d > 1) return null;
      const nz = Math.sqrt(Math.max(0, 1 - d));
      const longitude = Math.atan2(nx, nz);
      const latitude = Math.asin(Math.max(-1, Math.min(1, ny)));
      const driftX = t * 0.000045;
      const driftY = t * 0.000012;
      const largeA = noise(longitude * 2.15 + driftX, latitude * 2.65 + driftY);
      const largeB = noise(longitude * 3.8 - driftX * 0.55, latitude * 3.15 + driftY * 0.7);
      const large = largeA * 0.68 + largeB * 0.32;
      const medium = noise(longitude * 7.5 - t * 0.00013, latitude * 8.0 + t * 0.00007);
      const ridges = ridgedNoise(longitude * 5.0 + t * 0.00008, latitude * 6.0 - t * 0.00005);
      const fine = noise(longitude * 19.0 + t * 0.00030, latitude * 20.0 - t * 0.00021);
      const fine2 = noise(longitude * 31.0 - t * 0.00017, latitude * 27.0 + t * 0.00026);
      let light = nx * -0.42 + ny * -0.32 + nz * 0.82;
      light = (light + 1) * 0.5;
      let field = large * 0.50 + medium * 0.23 + ridges * 0.12 + fine * 0.09 + fine2 * 0.06;
      const breathing = Math.sin(longitude * 4.0 + latitude * 3.0 + t * 0.00018) * 0.035;
      field += breathing;
      let brightness = light * 0.42 + field * 0.58;
      const edge = Math.pow(nz, 0.18);
      brightness *= 0.82 + edge * 0.18;
      return Math.max(0, Math.min(1, brightness));
    }

    function drawGlobe(t: number) {
      const r = planet.radius;
      const thresholdMotion = Math.sin(t * 0.0018) * 0.025;
      for (let iy = -r; iy <= r; iy++) {
        for (let ix = -r; ix <= r; ix++) {
          const brightness = globeField(ix, iy, t);
          if (brightness === null) continue;
          const bx = Math.abs(ix) % 4;
          const by = Math.abs(iy) % 4;
          let threshold = BAYER[by][bx] / 16;
          const micro = noise(ix * 0.48 + t * 0.00045, iy * 0.48 - t * 0.00032);
          threshold += (micro - 0.5) * 0.14 + thresholdMotion;

          let level;
          if (brightness > 0.74) level = 232;
          else if (brightness > 0.56) level = 190;
          else if (brightness > 0.39) level = 142;
          else level = 91;

          const normalized = (brightness * 1.18) - 0.08;
          if (normalized <= threshold) continue;

          g!.fillStyle = `rgb(${level-20},${level-40},${Math.min(255, level+30)})`;
          g!.fillRect((planet.x + ix) | 0, (planet.y + iy) | 0, 1, 1);
        }
      }
      g!.beginPath();
      g!.arc(planet.x, planet.y, r + 0.5, 0, Math.PI * 2);
      g!.strokeStyle = "rgba(180,180,180,0.12)";
      g!.stroke();
    }

    function renderLoop(t: number) {
      g!.fillStyle = "#050505";
      g!.fillRect(0, 0, SW, SH);
      drawStars(t);
      drawMeteors();
      drawOrbits();

      const moonObjects = moons
        .map(m => ({ moon: m, position: moonPosition(m, t) }))
        .sort((a, b) => a.position.z - b.position.z);

      for (const item of moonObjects) {
        if (item.position.z < 0) drawMoon(item.moon, item.position);
      }
      drawGlobe(t);
      for (const item of moonObjects) {
        if (item.position.z >= 0) drawMoon(item.moon, item.position);
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.imageSmoothingEnabled = false;
      ctx!.drawImage(buffer, 0, 0, canvas!.width, canvas!.height);
      animId = requestAnimationFrame(renderLoop);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas) {
        canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
        ctx!.imageSmoothingEnabled = false;
      }
    }

    window.addEventListener("resize", resize);
    resize();
    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
