"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDateTime, formatRating } from "@/lib/format";
import { MOVIES, type Movie } from "@/lib/movies";
import {
  DEFAULT_SPIN_MODE,
  DEFAULT_THEME,
  isSpinMode,
  isThemeId,
  SPIN_MODES,
  STORAGE_KEYS,
  type SpinMode,
} from "@/lib/settings";
import { useStoredJson, useStoredString } from "@/lib/useStorage";
import { Filters, type FilterState } from "./Filters";
import { HistoryModal, type HistoryItem } from "./HistoryModal";
import { MovieModal } from "./MovieModal";
import { Poster } from "./Poster";
import { SettingsPanel } from "./SettingsPanel";
import { SpinTrack } from "./SpinTrack";

type LastDropped = { id: string; at: string };

function isLastDropped(value: unknown): value is LastDropped {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LastDropped).id === "string" &&
    typeof (value as LastDropped).at === "string"
  );
}

function isHistoryList(value: unknown): value is HistoryItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as HistoryItem).id === "string" &&
        typeof (item as HistoryItem).at === "string",
    )
  );
}

type SpinState = { winner: Movie; pool: Movie[]; nonce: number };

export function SinApp() {
  const theme = useStoredString(STORAGE_KEYS.theme, DEFAULT_THEME, isThemeId);
  const spinMode = useStoredString(STORAGE_KEYS.spin, DEFAULT_SPIN_MODE, isSpinMode);
  const lastDropped = useStoredJson<LastDropped>(STORAGE_KEYS.last, null, isLastDropped);
  const history = useStoredJson<HistoryItem[]>(STORAGE_KEYS.history, [], isHistoryList);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openMovie, setOpenMovie] = useState<Movie | null>(null);
  const [spin, setSpin] = useState<SpinState | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
  });

  const nonceRef = useRef(0);

  /* тема живёт на <html>, чтобы не мигало при загрузке */
  useEffect(() => {
    document.documentElement.dataset.theme = theme.value;
  }, [theme.value]);

  useEffect(() => {
    document.documentElement.dataset.spin = spinMode.value;
  }, [spinMode.value]);

  /* Данные уже prebaked в movies.ts — дополнительный fetch не нужен */
  const movies = useMemo<Movie[]>(() => MOVIES, []);

  const pool = useMemo(
    () =>
      movies.filter((movie) => {
        if (filters.genres.length > 0) {
          const hit = movie.genres.some((genre) => filters.genres.includes(genre));
          if (!hit) return false;
        }
        return true;
      }),
    [movies, filters],
  );

  const lastMovie = useMemo(
    () => (lastDropped.value ? movies.find((m) => m.id === lastDropped.value?.id) ?? null : null),
    [movies, lastDropped.value],
  );

  const changeSpinMode = useCallback(
    (id: SpinMode) => {
      spinMode.setValue(id);
      setSpin(null);
      setSpinning(false);
    },
    [spinMode],
  );

  const startSpin = useCallback(() => {
    if (pool.length === 0 || spinning) return;
    const winner = pool[Math.floor(Math.random() * pool.length)];
    nonceRef.current += 1;
    setOpenMovie(null);
    setSpinning(true);
    setSpin({ winner, pool: [...pool], nonce: nonceRef.current });
  }, [pool, spinning]);

  const handleSettled = useCallback(() => {
    setSpinning(false);
    if (!spin) return;
    const winner = spin.winner;
    setOpenMovie(winner);
    const at = new Date().toISOString();
    lastDropped.setValue({ id: winner.id, at });
    const currentList = history.value ?? [];
    history.setValue([{ id: winner.id, at }, ...currentList].slice(0, 100));
  }, [spin, lastDropped, history]);

  const activeSpin = spin ?? {
    winner: pool[0] ?? movies[0],
    pool,
    nonce: 0,
  };

  // Предыдущий выпавший фильм: history[1] (history[0] - текущий)
  const historyList = history.value ?? [];
  const previousEntry = historyList.length >= 2 ? historyList[1] : null;
  const previousMovie = previousEntry ? movies.find((m) => m.id === previousEntry.id) : null;
  const currentOrLastMovie = historyList.length > 0 ? movies.find((m) => m.id === historyList[0].id) : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 px-4 pt-5 pb-16 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display truncate text-lg leading-tight font-extrabold sm:text-2xl">
            Список фильмов под синьку
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="btn btn-ghost h-11 shrink-0 px-4 text-sm"
        >
          <span aria-hidden>⚙️</span>
          <span className="hidden sm:inline">Настройки</span>
          <span className="sm:hidden">Настройки</span>
        </button>
      </header>

      <section className="panel relative overflow-hidden p-4 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "rgb(var(--glow) / 0.2)" }}
        />
        <div className="relative">
          <p className="text-sm text-muted">
            Не можешь выбрать? Нажми и не спорь с судьбой.
          </p>
          <p className="mt-1 text-xs text-muted">
            Режим:{" "}
            <span className="text-fg">
              {SPIN_MODES.find((mode) => mode.id === spinMode.value)?.name}
            </span>
          </p>

          <div className="mt-4">
            {pool.length > 0 ? (
              <SpinTrack
                mode={spinMode.value}
                pool={activeSpin.pool}
                winner={activeSpin.winner}
                nonce={activeSpin.nonce}
                onSettled={handleSettled}
                onSelectMovie={setOpenMovie}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
                Под такие фильтры ничего не подходит. Сбрось фильтры — и снова в бой.
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={startSpin}
              disabled={pool.length === 0 || spinning}
              className="btn btn-primary h-14 w-full max-w-xs text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {spinning ? "Крутится…" : "Крутить"}
            </button>
            {previousMovie && previousEntry ? (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                title="Нажми, чтобы открыть полную историю"
                className="group flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-fg"
              >
                <span>
                  Предыдущий выпавший:{" "}
                  <strong className="font-semibold text-fg/90">
                    {previousMovie.title}
                  </strong>
                </span>
                <span>· {formatDateTime(previousEntry.at)}</span>
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                  История ({historyList.length})
                </span>
              </button>
            ) : currentOrLastMovie && historyList[0] ? (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                title="Нажми, чтобы открыть полную историю"
                className="group flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-fg"
              >
                <span>
                  Выпал фильм:{" "}
                  <strong className="font-semibold text-fg/90">
                    {currentOrLastMovie.title}
                  </strong>
                </span>
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                  История ({historyList.length})
                </span>
              </button>
            ) : (
              <p className="text-xs text-muted">Пока ничего не выпадало.</p>
            )}
          </div>
        </div>
      </section>

      <Filters
        value={filters}
        onChange={setFilters}
        resultCount={pool.length}
      />

      <section>
        <h2 className="font-display mb-3 text-sm font-bold">
          Список целиком
          <span className="ml-2 text-xs font-normal text-muted">
            нажми на постер — откроется карточка
          </span>
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pool.map((movie) => {
            const rating = formatRating(movie.rating);
            return (
              <li key={movie.id} className="rise">
                <button
                  type="button"
                  onClick={() => setOpenMovie(movie)}
                  className="group block w-full text-left"
                >
                  <Poster
                    movie={movie}
                    className="aspect-[2/3] rounded-2xl border border-line transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-accent/50"
                  />
                  <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-snug font-semibold">
                    {movie.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {movie.year}
                    {rating ? ` · ★ ${rating.split(" / ")[0]}` : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="mt-6 text-center text-xs text-muted">
        Данные о фильмах — из открытых источников (TMDB), постеры и описания принадлежат
        правообладателям. Пейте ответственно.
      </footer>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme.value}
        onTheme={theme.setValue}
        spin={spinMode.value}
        onSpin={changeSpinMode}
      />

      <MovieModal movie={openMovie} onClose={() => setOpenMovie(null)} />

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={historyList}
        movies={movies}
        onSelectMovie={setOpenMovie}
        onClearHistory={() => history.setValue([])}
      />
    </div>
  );
}
