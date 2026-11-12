"use client";

import { useEffect, useState } from "react";

export function NeonSign({
  enabled = true,
  title = "Список фильмов под синьку",
}: {
  enabled?: boolean;
  title?: string;
}) {
  const [surge, setSurge] = useState(false);

  // Редкий общий сбой питания всей вывески при перегрузке
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: NodeJS.Timeout;
    let cancel = false;

    const scheduleNextSurge = () => {
      const nextDelay = 7000 + Math.random() * 6000;
      timeoutId = setTimeout(() => {
        if (cancel) return;
        setSurge(true);
        timeoutId = setTimeout(() => {
          if (cancel) return;
          setSurge(false);
          scheduleNextSurge();
        }, 600);
      }, nextDelay);
    };

    scheduleNextSurge();

    return () => {
      cancel = true;
      clearTimeout(timeoutId);
    };
  }, [enabled]);

  const handleClick = () => {
    if (!enabled) return;
    setSurge(true);
    setTimeout(() => setSurge(false), 700);
  };

  if (!enabled) {
    return (
      <h1 className="font-display text-lg leading-tight font-extrabold sm:text-2xl">
        {title}
      </h1>
    );
  }

  const letters = title.split("");

  // Находим две буквы для выделения другим цветом и рассинхроном:
  // Буква 1: 'ф' (в "фильмов") -> розовый неон
  // Буква 2: 'к' (в "синьку") -> янтарно-оранжевый неон
  let pinkIndex = -1;
  let amberIndex = -1;

  for (let i = 0; i < letters.length; i++) {
    if (letters[i].toLowerCase() === "ф" && pinkIndex === -1) {
      pinkIndex = i;
    }
    if (letters[i].toLowerCase() === "к") {
      amberIndex = i;
    }
  }

  // Запасные индексы, если таких букв нет в переданной строке
  if (pinkIndex === -1) pinkIndex = Math.min(3, letters.length - 1);
  if (amberIndex === -1) amberIndex = Math.max(0, letters.length - 2);

  return (
    <h1
      onClick={handleClick}
      title="Нажми, чтобы ударить по вывеске"
      className={`font-display text-lg leading-tight font-extrabold cursor-pointer select-none transition-all sm:text-2xl ${
        surge ? "neon-sign-surge" : ""
      }`}
    >
      {letters.map((char, idx) => {
        if (char === " ") {
          return <span key={idx}> </span>;
        }

        let cls = "neon-main-1";
        if (idx === pinkIndex) {
          cls = "neon-special-pink";
        } else if (idx === amberIndex) {
          cls = "neon-special-amber";
        } else if (idx % 2 === 0) {
          cls = "neon-main-2";
        }

        return (
          <span key={idx} className={cls}>
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
