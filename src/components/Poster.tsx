"use client";

import { useState } from "react";
import { posterUrl, type Movie } from "@/lib/movies";

function hashHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export function PosterArt({ movie }: { movie: Movie }) {
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
