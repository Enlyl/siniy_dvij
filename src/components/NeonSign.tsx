"use client";

import { useState } from "react";

export function NeonSign({
  enabled = true,
  title = "Список фильмов под синьку",
}: {
  enabled?: boolean;
  title?: string;
}) {
  const [flicker, setFlicker] = useState(false);

  const handleClick = () => {
    if (!enabled) return;
    setFlicker(true);
    setTimeout(() => setFlicker(false), 800);
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
      <span className="ml-2 inline-block text-xs font-normal opacity-75 sm:text-sm">
        🍻
      </span>
    </h1>
  );
}
