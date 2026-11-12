"use client";

import { useEffect, useRef } from "react";

export function SmokeEffect({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    type Particle = {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      maxAlpha: number;
      growing: boolean;
      driftAngle: number;
      driftSpeed: number;
    };

    const particleCount = 28;
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const radius = 130 + Math.random() * 160;
      return {
        x: Math.random() * width,
        // Сразу распределяем по всей высоте экрана, чтобы дым был виден сразу
        y: Math.random() * (height + 200),
        radius,
        vx: (Math.random() - 0.5) * 0.5,
        // Поднимается заметно быстрее и уверенно вверх через весь экран
        vy: -(0.6 + Math.random() * 0.9),
        alpha: Math.random() * 0.08,
        maxAlpha: 0.12 + Math.random() * 0.1,
        growing: Math.random() > 0.4,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.008 + Math.random() * 0.012,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.driftAngle += p.driftSpeed;
        p.x += p.vx + Math.sin(p.driftAngle) * 0.35;
        p.y += p.vy;

        // Плавное появление и затухание
        if (p.growing) {
          p.alpha += 0.0012;
          if (p.alpha >= p.maxAlpha) p.growing = false;
        } else {
          // Затухает медленнее, пока поднимается к самому верху
          p.alpha -= 0.0006;
        }

        // Перезапуск частицы снизу
        if (p.y < -p.radius * 2 || p.alpha <= 0) {
          p.x = Math.random() * width;
          p.y = height + p.radius * 0.5;
          p.radius = 130 + Math.random() * 160;
          p.alpha = 0.01;
          p.growing = true;
          p.maxAlpha = 0.12 + Math.random() * 0.1;
          p.vy = -(0.6 + Math.random() * 0.9);
        }

        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius,
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 1.1})`);
        gradient.addColorStop(0.45, `rgba(215, 235, 225, ${p.alpha * 0.7})`);
        gradient.addColorStop(0.8, `rgba(180, 205, 195, ${p.alpha * 0.25})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90"
    />
  );
}
