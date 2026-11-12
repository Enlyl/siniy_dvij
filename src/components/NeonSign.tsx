"use client";

import { useState } from "react";

type Spark = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
};

export function NeonSign({
  enabled = true,
  title = "Список фильмов под синьку",
}: {
  enabled?: boolean;
  title?: string;
}) {
  const [glitch, setGlitch] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!enabled) return;
    setGlitch(true);
    setTimeout(() => setGlitch(false), 450);

    // Координаты клика для вылета искр
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    const originY = e.clientY - rect.top;

    const sparkColors = ["#38bdf8", "#ff1493", "#ffb700", "#ffffff", "#67e8f9"];
    const newSparks: Spark[] = Array.from({ length: 22 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 75;
      return {
        id: Date.now() + i + Math.random(),
        x: originX,
        y: originY,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance + 14, // легкая гравитация
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        size: 2.5 + Math.random() * 3,
      };
    });

    setSparks(newSparks);
    setTimeout(() => setSparks([]), 550);
  };

  if (!enabled) {
    return (
      <h1 className="font-display text-lg leading-tight font-extrabold sm:text-2xl">
        {title}
      </h1>
    );
  }

  const letters = title.split("");

  // Буква 1: 'ф' в "фильмов" -> ярко-розовый неон (Magenta Pink, рассинхрон)
  // Буква 2: 'к' в "синьку"  -> ярко-янтарный неон (Amber Gold, рассинхрон)
  let pinkIndex = -1;
  let amberIndex = -1;

  for (let i = 0; i < letters.length; i++) {
    const lower = letters[i].toLowerCase();
    if (lower === "ф" && pinkIndex === -1) {
      pinkIndex = i;
    }
    if (lower === "к") {
      amberIndex = i;
    }
  }

  if (pinkIndex === -1) pinkIndex = 7;
  if (amberIndex === -1) amberIndex = letters.length - 2;

  return (
    <div className="relative inline-block max-w-full">
      <style>{`
        /* Все голубые буквы мигают строго одновременно и с одинаковой интенсивностью */
        .neon-letter-cyan {
          display: inline-block;
          color: #38bdf8;
          text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9, 0 0 25px #0284c7;
          animation: neon-blink-cyan 2.4s infinite;
        }

        @keyframes neon-blink-cyan {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9, 0 0 25px #0284c7;
          }
          24% { opacity: 1; }
          25% {
            opacity: 0.15;
            text-shadow: none;
          }
          28% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9;
          }
          68% { opacity: 1; }
          69% {
            opacity: 0.18;
            text-shadow: none;
          }
          72% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9;
          }
        }

        /* Выделенная буква 1: Ярко-розовый / Маджента неон (в рассинхрон) */
        .neon-letter-pink {
          display: inline-block;
          color: #ff1493 !important;
          text-shadow: 0 0 6px #ff1493, 0 0 16px #ff007f, 0 0 32px #ff007f !important;
          font-weight: 900;
          animation: neon-blink-pink 1.5s infinite;
        }

        @keyframes neon-blink-pink {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 6px #ff1493, 0 0 16px #ff007f, 0 0 32px #ff007f;
          }
          12% { opacity: 1; }
          14% {
            opacity: 0.1;
            text-shadow: none;
          }
          17% {
            opacity: 1;
            text-shadow: 0 0 8px #ff1493;
          }
          48% { opacity: 1; }
          50% {
            opacity: 0.15;
            text-shadow: none;
          }
          52% {
            opacity: 0.9;
            text-shadow: 0 0 12px #ff007f;
          }
          54% {
            opacity: 0.1;
            text-shadow: none;
          }
          57% {
            opacity: 1;
            text-shadow: 0 0 6px #ff1493, 0 0 16px #ff007f;
          }
        }

        /* Выделенная буква 2: Ярко-янтарный неон (в рассинхрон) */
        .neon-letter-amber {
          display: inline-block;
          color: #ffb700 !important;
          text-shadow: 0 0 6px #ffb700, 0 0 16px #ff8800, 0 0 32px #ff8800 !important;
          font-weight: 900;
          animation: neon-blink-amber 1.9s infinite;
        }

        @keyframes neon-blink-amber {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 6px #ffb700, 0 0 16px #ff8800, 0 0 32px #ff8800;
          }
          28% { opacity: 1; }
          30% {
            opacity: 0.12;
            text-shadow: none;
          }
          33% {
            opacity: 1;
            text-shadow: 0 0 8px #ff8800;
          }
          72% { opacity: 1; }
          74% {
            opacity: 0.15;
            text-shadow: none;
          }
          76% {
            opacity: 0.85;
            text-shadow: 0 0 6px #ffb700;
          }
          78% {
            opacity: 0.1;
            text-shadow: none;
          }
          81% {
            opacity: 1;
            text-shadow: 0 0 6px #ffb700, 0 0 16px #ff8800;
          }
        }

        /* При клике вся вывеска на мгновение тухнет от удара */
        .neon-glitch-hit {
          opacity: 0.15 !important;
          filter: drop-shadow(0 0 25px #38bdf8);
        }

        /* Анимация разлета электрических искр */
        @keyframes neon-spark-fly {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(0.1);
          }
        }

        .neon-spark {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 40;
          animation: neon-spark-fly 0.52s cubic-bezier(0.12, 0.8, 0.32, 1) forwards;
        }
      `}</style>

      {/* Искры от удара */}
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="neon-spark"
          style={
            {
              left: spark.x,
              top: spark.y,
              width: spark.size,
              height: spark.size,
              backgroundColor: spark.color,
              boxShadow: `0 0 6px ${spark.color}, 0 0 12px ${spark.color}`,
              "--dx": `${spark.dx}px`,
              "--dy": `${spark.dy}px`,
            } as React.CSSProperties
          }
        />
      ))}

      <h1
        onClick={handleClick}
        title="Нажми, чтобы ударить по вывеске"
        className={`font-display text-lg leading-tight font-extrabold cursor-pointer select-none transition-all sm:text-2xl ${
          glitch ? "neon-glitch-hit" : ""
        }`}
      >
        {letters.map((char, idx) => {
          if (char === " ") {
            return <span key={idx}> </span>;
          }

          if (idx === pinkIndex) {
            return (
              <span key={idx} className="neon-letter-pink">
                {char}
              </span>
            );
          }

          if (idx === amberIndex) {
            return (
              <span key={idx} className="neon-letter-amber">
                {char}
              </span>
            );
          }

          return (
            <span key={idx} className="neon-letter-cyan">
              {char}
            </span>
          );
        })}
      </h1>
    </div>
  );
}
