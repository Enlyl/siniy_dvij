"use client";

import { useState } from "react";

export function NeonSign({
  enabled = true,
  title = "Список фильмов под синьку",
}: {
  enabled?: boolean;
  title?: string;
}) {
  const [glitch, setGlitch] = useState(false);

  const handleClick = () => {
    if (!enabled) return;
    setGlitch(true);
    setTimeout(() => setGlitch(false), 500);
  };

  if (!enabled) {
    return (
      <h1 className="font-display text-lg leading-tight font-extrabold sm:text-2xl">
        {title}
      </h1>
    );
  }

  const letters = title.split("");

  // Буква 1: 'ф' в "фильмов" -> ярко-розовый неон (Magenta Pink)
  // Буква 2: 'к' в "синьку"  -> ярко-янтарный неон (Amber Gold)
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
    <>
      <style>{`
        /* Основные буквы: яркий неоновый циан */
        .neon-letter-c1 {
          display: inline-block;
          color: #38bdf8;
          text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9, 0 0 25px #0284c7;
          animation: neon-blink-c1 2.2s infinite;
        }

        .neon-letter-c2 {
          display: inline-block;
          color: #38bdf8;
          text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9, 0 0 25px #0284c7;
          animation: neon-blink-c2 2.9s infinite;
        }

        /* Выделенная буква 1: Ярко-розовый / Маджента неон (быстрый дребезг) */
        .neon-letter-pink {
          display: inline-block;
          color: #ff1493 !important;
          text-shadow: 0 0 6px #ff1493, 0 0 16px #ff007f, 0 0 32px #ff007f !important;
          font-weight: 900;
          animation: neon-blink-pink 1.5s infinite;
        }

        /* Выделенная буква 2: Ярко-янтарный неон (залипающий контакт) */
        .neon-letter-amber {
          display: inline-block;
          color: #ffb700 !important;
          text-shadow: 0 0 6px #ffb700, 0 0 16px #ff8800, 0 0 32px #ff8800 !important;
          font-weight: 900;
          animation: neon-blink-amber 1.9s infinite;
        }

        /* Анимация 1 для части циановых букв */
        @keyframes neon-blink-c1 {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9, 0 0 25px #0284c7;
          }
          18% { opacity: 1; }
          19% {
            opacity: 0.15;
            text-shadow: none;
          }
          21% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8;
          }
          64% { opacity: 1; }
          65% {
            opacity: 0.2;
            text-shadow: none;
          }
          67% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9;
          }
        }

        /* Анимация 2 для второй части циановых букв */
        @keyframes neon-blink-c2 {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9, 0 0 25px #0284c7;
          }
          41% { opacity: 1; }
          42% {
            opacity: 0.12;
            text-shadow: none;
          }
          45% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8;
          }
          88% { opacity: 1; }
          89% {
            opacity: 0.25;
            text-shadow: none;
          }
          91% {
            opacity: 1;
            text-shadow: 0 0 5px #38bdf8, 0 0 12px #0ea5e9;
          }
        }

        /* Розовая буква: частое дребезжание и четкое отключение */
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

        /* Янтарная буква: свой несинхронный ритм затухания */
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
          opacity: 0.2 !important;
          filter: drop-shadow(0 0 20px #38bdf8);
        }
      `}</style>

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

          const cls = idx % 2 === 0 ? "neon-letter-c1" : "neon-letter-c2";
          return (
            <span key={idx} className={cls}>
              {char}
            </span>
          );
        })}
      </h1>
    </>
  );
}
