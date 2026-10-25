"use client";

import { useState } from "react";
import { ALL_GENRES } from "@/lib/movies";

export type FilterState = {
  genres: string[];
};

export function Filters({
  value,
  onChange,
  resultCount,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);

  const toggleGenre = (genre: string) => {
    const next = value.genres.includes(genre)
      ? value.genres.filter((item) => item !== genre)
      : [...value.genres, genre];
    onChange({ ...value, genres: next });
  };

  const isDefault = value.genres.length === 0;

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-bold">Фильтры</h2>
          <span className="chip py-1 text-[0.6875rem]">
            подходит: {resultCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isDefault ? (
            <button
              type="button"
              className="chip hover:text-fg"
              onClick={() => onChange({ genres: [] })}
            >
              Сбросить
            </button>
          ) : null}
          <button
            type="button"
            className="chip sm:hidden"
            data-active={open}
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
          >
            {open ? "Свернуть" : "Развернуть"}
          </button>
        </div>
      </div>

      <div className={`${open ? "block" : "hidden"} sm:block`}>
        <div className="mt-4">
          <p className="mb-2 text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
            Жанр
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className="chip"
                data-active={value.genres.includes(genre)}
                aria-pressed={value.genres.includes(genre)}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
