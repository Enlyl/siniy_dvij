"use client";

import { useState } from "react";

export function NeonSign({
  enabled = true,
  title = "Список фильмов под синьку",
}: {
  enabled?: boolean;
  title?: string;
}) {
  const [clickGlitch, setClickGlitch] = useState(false);

  const handleClick = () => {
    if (!enabled) return;
    setClickGlitch(true);
    setTimeout(() => setClickGlitch(false), 600);
  };

  if (!enabled) {
    return (
      <h1 className="font-display text-lg leading-tight font-extrabold sm:text-2xl">
        {title}
      </h1>
    );
  }

  const letters = title.split("");

  // Выбираем 2 заметные буквы для выделения другим цветом и отдельным рассинхроном:
  // 1) "ф" в слове "фильмов" -> ярко-розовый неоновый (Pink Neon)
  // 2) "к" в слове "синьку"  -> ярко-янтарный неоновый (Amber Gold Neon)
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
    <h1
      onClick={handleClick}
      title="Нажми, чтобы ударить по вывеске"
      className={`font-display text-lg leading-tight font-extrabold cursor-pointer select-none transition-all sm:text-2xl ${
        clickGlitch ? "neon-click-glitch" : ""
      }`}
    >
      {letters.map((char, idx) => {
        if (char === " ") {
          return <span key={idx}> </span>;
        }

        if (idx === pinkIndex) {
          return (
            <span key={idx} className="neon-char-pink">
              {char}
            </span>
          );
        }

        if (idx === amberIndex) {
          return (
            <span key={idx} className="neon-char-amber">
              {char}
            </span>
          );
        }

        // Основные буквы чередуются для живого непрерывного рассинхрона
        const mainClass = idx % 2 === 0 ? "neon-char-cyan-1" : "neon-char-cyan-2";

        return (
          <span key={idx} className={mainClass}>
            {char}
          </span>
        );
      })}
      <span className="ml-2 inline-block text-xs font-normal opacity-90 sm:text-sm">
        🍻
      </span>
    </h1>
  );
}
