"use client";

import { useEffect, useState } from "react";

export function NeonSign({
  enabled = true,
  title = "Список фильмов под синьку",
}: {
  enabled?: boolean;
  title?: string;
}) {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: NodeJS.Timeout;
    let cancel = false;

    const scheduleNextFlicker = () => {
      // Рандомный интервал между мерцаниями (от 2.5 до 6 секунд)
      const nextDelay = 2500 + Math.random() * 3500;
      timeoutId = setTimeout(() => {
        if (cancel) return;
        setFlicker(true);
        const flickerDuration = 500 + Math.random() * 400;
        timeoutId = setTimeout(() => {
          if (cancel) return;
          setFlicker(false);
          scheduleNextFlicker();
        }, flickerDuration);
      }, nextDelay);
    };

    scheduleNextFlicker();

    return () => {
      cancel = true;
      clearTimeout(timeoutId);
    };
  }, [enabled]);

  const handleClick = () => {
    if (!enabled) return;
    setFlicker(true);
    setTimeout(() => setFlicker(false), 900);
  };

  if (!enabled) {
    return (
      <h1 className="font-display truncate text-lg leading-tight font-extrabold sm:text-2xl">
        {title}
      </h1>
    );
  }

  return (
    <h1
      onClick={handleClick}
      title="Нажми, чтобы помигать вывеской"
      className={`font-display truncate text-lg leading-tight font-extrabold cursor-pointer select-none transition-all sm:text-2xl ${
        flicker ? "neon-sign-flicker" : "neon-sign"
      }`}
    >
      <span className="neon-text">{title}</span>
      <span className="ml-2 inline-block text-xs font-normal opacity-85 sm:text-sm">
        🍻
      </span>
    </h1>
  );
}
