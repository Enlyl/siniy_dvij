"use client";

import { useState } from "react";
import { posterUrl, type Movie } from "@/lib/movies";
import { EASTER_EGG_ID } from "@/lib/easterEgg";

export function MirrorPoster({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-between overflow-hidden bg-[#07080c] p-2 text-center select-none ${className}`}
      style={{
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.85)",
      }}
    >
      {/* Мягкое свечение и виньетка */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.18)_0%,rgba(0,0,0,0.8)_75%)]"
      />

      {/* Верхний бейдж */}
      <div className="relative z-10 w-full pt-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[0.625rem] font-extrabold tracking-wider text-amber-300 uppercase shadow-sm">
          <span aria-hidden>🪞</span>
          <span>17-я крутка подряд</span>
        </span>
      </div>

      {/* Центральное зеркало с силуэтом и трещиной */}
      <div className="relative z-10 my-auto flex w-full max-w-[85%] items-center justify-center py-1">
        <svg
          viewBox="0 0 160 210"
          className="h-full w-full max-h-[175px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
        >
          <defs>
            <linearGradient id="frameGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="75%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="mirrorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e2230" />
              <stop offset="45%" stopColor="#0f131d" />
              <stop offset="80%" stopColor="#080a10" />
              <stop offset="100%" stopColor="#030407" />
            </linearGradient>
            <linearGradient id="glassGlare" x1="0%" y1="0%" x2="100%" y2="85%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0)" />
              <stop offset="75%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Верхний декор рамы */}
          <path
            d="M 80 12 C 64 12 68 2 80 2 C 92 2 96 12 80 12 Z"
            fill="url(#frameGold)"
          />

          {/* Внешняя рама зеркала */}
          <ellipse
            cx="80"
            cy="110"
            rx="73"
            ry="92"
            fill="url(#frameGold)"
            stroke="#451a03"
            strokeWidth="2"
          />
          <ellipse cx="80" cy="110" rx="67" ry="86" fill="#141416" />
          <ellipse
            cx="80"
            cy="110"
            rx="65"
            ry="84"
            fill="url(#frameGold)"
            opacity="0.75"
          />

          {/* Стекло зеркала */}
          <ellipse cx="80" cy="110" rx="60" ry="80" fill="url(#mirrorGlass)" />

          {/* Отражение: силуэт смотрящего с бутылкой */}
          <g opacity="0.75">
            {/* Голова */}
            <circle cx="80" cy="88" r="19" fill="#2d3345" />
            {/* Волосы */}
            <path
              d="M 63 87 Q 80 62 97 87 Q 90 68 80 68 Q 70 68 63 87 Z"
              fill="#181d29"
            />
            {/* Глаза в темноте */}
            <ellipse cx="73" cy="87" rx="2.5" ry="1.5" fill="#f87171" opacity="0.9" />
            <ellipse cx="87" cy="87" rx="2.5" ry="1.5" fill="#f87171" opacity="0.9" />
            {/* Плечи / поза на диване */}
            <path
              d="M 44 155 Q 80 112 116 155 Q 112 178 48 178 Z"
              fill="#1c2233"
            />
            {/* Бутылка / бокал в руке */}
            <path
              d="M 106 126 L 111 126 L 112 136 L 115 142 L 115 160 L 106 160 Z"
              fill="#10b981"
              opacity="0.85"
            />
          </g>

          {/* Блик на стекле */}
          <ellipse
            cx="80"
            cy="110"
            rx="60"
            ry="80"
            fill="url(#glassGlare)"
            pointerEvents="none"
          />

          {/* Трещина на зеркале */}
          <path
            d="M 38 68 L 65 96 L 80 91 L 108 126 L 128 132"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 65 96 L 58 122"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Текст постера */}
      <div className="relative z-10 w-full pb-1">
        <p className="text-[0.5625rem] font-bold tracking-wider text-muted/90 uppercase">
          Не знаешь что посмотреть?
        </p>
        <p className="font-display text-[0.6875rem] font-extrabold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-xs">
          Посмотри во что ты превратился
        </p>
      </div>
    </div>
  );
}

function hashHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export function PosterArt({ movie }: { movie: Movie }) {
  if (movie.id === EASTER_EGG_ID) {
    return <MirrorPoster className="h-full w-full" />;
  }

  const hue = hashHue(movie.id);
  const hue2 = (hue + 44) % 360;
  const letter = movie.title.trim().charAt(0).toUpperCase();

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex flex-col justify-between overflow-hidden p-2.5"
      style={{
        backgroundImage: `linear-gradient(150deg, hsl(${hue} 42% 22%), hsl(${hue2} 55% 11%) 62%, hsl(${hue} 30% 7%))`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-2 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #fff 0 4px, transparent 4px 10px)",
        }}
      />
      <span
        className="font-display text-[3.25rem] leading-none font-extrabold"
        style={{ color: `hsl(${hue2} 90% 78%)`, opacity: 0.9 }}
      >
        {letter}
      </span>
      <div className="min-w-0">
        <p className="font-display line-clamp-3 text-[0.8125rem] leading-tight font-bold text-white/95">
          {movie.title}
        </p>
        <p className="mt-1 text-[0.6875rem] text-white/60">{movie.year}</p>
      </div>
    </div>
  );
}

export function Poster({
  movie,
  priority = false,
  className = "",
}: {
  movie: Movie;
  priority?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (movie.id === EASTER_EGG_ID) {
    return <MirrorPoster className={className} />;
  }

  const url = posterUrl(movie.posterPath);

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {url && !broken ? (
        <img
          src={url}
          alt={`Постер фильма «${movie.title}»`}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <PosterArt movie={movie} />
      )}
    </div>
  );
}
