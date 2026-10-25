"use client";

import { useEffect, useRef } from "react";
import { formatDateTime } from "@/lib/format";
import type { Movie } from "@/lib/movies";
import { Poster } from "./Poster";

export type HistoryItem = {
  id: string;
  at: string;
};

export function HistoryModal({
  open,
  onClose,
  history,
  movies,
  onSelectMovie,
  onClearHistory,
}: {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onClearHistory: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="История выпавших фильмов"
        className="pop panel relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl outline-none sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-base font-bold sm:text-lg">
              История выпадений
            </h2>
            <span className="chip py-0.5 text-xs">
              {history.length} шт.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="chip text-xs hover:border-accent hover:text-fg"
              >
                Очистить
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="btn btn-ghost h-9 w-9 text-base leading-none"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6">
          {history.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              История пуста. Нажми «Крутить», чтобы испытать судьбу!
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {history.map((entry, index) => {
                const movie = movies.find((m) => m.id === entry.id);
                if (!movie) return null;

                return (
                  <li key={`${entry.id}-${entry.at}-${index}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectMovie(movie);
                      }}
                      className="group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-surface-2 p-2.5 text-left transition-colors hover:border-accent/60 hover:bg-surface-2/80"
                    >
                      <span className="w-5 text-center text-xs font-bold text-muted">
                        #{history.length - index}
                      </span>
                      <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg">
                        <Poster movie={movie} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display truncate text-sm font-bold transition-colors group-hover:text-accent">
                          {movie.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {movie.year}
                          {movie.director ? ` · ${movie.director}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[0.6875rem] text-muted">
                          {formatDateTime(entry.at)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
