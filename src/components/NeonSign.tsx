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

  // Редкий общий сбой питания всей вывески (раз в 9–15 сек)
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: NodeJS.Timeout;
    let cancel = false;

    const scheduleNextSurge = () => {
      const nextDelay = 8000 + Math.random() * 7000;
      timeoutId = setTimeout(() => {
        if (cancel) return;
        setSurge(true);
        timeoutId = setTimeout(() => {
          if (cancel) return;
          setSurge(false);
          scheduleNextSurge();
        }, 750);
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
    setTimeout(() => setSurge(false), 800);
  };

  if (!enabled) {
    return (
      <h1 className="font-display truncate text-lg leading-tight font-extrabold sm:text-2xl">
        {title}
      </h1>
    );
  }

  // Индексы для несинхронно мигающих букв другим цветом:
  // "Список фильмов под синьку" -> "ф" (индекс 7 - розовый), "к" (индекс 23 - оранжево-янтарный)
  const letters = title.split("");
  const pinkIndex = letters.findIndex((ch) => ch.toLowerCase() === "ф");
  const amberIndex = letters.findLastIndex((ch) => ch.toLowerCase() === "к");

  return (
    <h1
      onClick={handleClick}
      title="Нажми, чтобы ударить по вывеске"
      className={`font-display truncate text-lg leading-tight font-extrabold cursor-pointer select-none transition-all sm:text-2xl ${
        surge ? "neon-sign-surge" : ""
      }`}
    >
      {letters.map((char, idx) => {
        if (char === " ") {
          return <span key={idx}> </span>;
        }

        let letterClass = "neon-letter neon-letter-pulse";
        if (idx === pinkIndex) {
          letterClass = "neon-broken-pink";
        } else if (idx === amberIndex) {
          letterClass = "neon-broken-amber";
        }

        return (
          <span key={idx} className={letterClass}>
            {char}
          </span>
        );
      })}
      <span className="ml-2 inline-block text-xs font-normal opacity-85 sm:text-sm">
        🍻
      </span>
    </h1>
  );
}
