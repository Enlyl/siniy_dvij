"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatRating } from "@/lib/format";
import { MOVIES, type Movie } from "@/lib/movies";
import {
  DEFAULT_SPIN_MODE,
  DEFAULT_THEME,
  isSpinMode,
  isThemeId,
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
  const sound = useStoredJson<boolean>(
    STORAGE_KEYS.sound,
    true,
    (v): v is boolean => typeof v === "boolean",
  );
  const soundEnabled = sound.value ?? true;
  const noRepeat = useStoredJson<boolean>(
    STORAGE_KEYS.noRepeat,
    false,
    (v): v is boolean => typeof v === "boolean",
  );
  const noRepeatEnabled = noRepeat.value ?? false;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openMovie, setOpenMovie] = useState<Movie | null>(null);
  const [spin, setSpin] = useState<SpinState | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const nonceRef = useRef(0);

  /* тема живёт на <html>, чтобы не мигало при загрузке */
  useEffect(() => {
    document.documentElement.dataset.theme = theme.value;
  }, [theme.value]);

  useEffect(() => {
    document.documentElement.dataset.spin = spinMode.value;
  }, [spinMode.value]);

  /* Чтение ?movie=id или #movie=id из URL при открытии страницы */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const slug =
        params.get("movie") ||
        (window.location.hash.startsWith("#movie=")
          ? window.location.hash.slice(7)
          : null);
      if (slug) {
        const found = MOVIES.find((m) => m.id === slug);
        if (found) {
          setOpenMovie(found);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const changeOpenMovie = useCallback((movie: Movie | null) => {
    setOpenMovie(movie);
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (movie) {
        url.searchParams.set("movie", movie.id);
      } else {
        url.searchParams.delete("movie");
        if (url.hash.startsWith("#movie=")) {
          url.hash = "";
        }
      }
      const nextPath =
        url.pathname +
        (url.search ? url.search : "") +
        (url.hash ? url.hash : "");
      window.history.replaceState(null, "", nextPath);
    } catch {
      // ignore
    }
  }, []);

  /* Данные уже prebaked в movies.ts — дополнительный fetch не нужен */
  const movies = useMemo<Movie[]>(() => MOVIES, []);

  const historyList = history.value ?? [];
  const droppedIds = useMemo(
    () => new Set(historyList.map((item) => item.id)),
    [historyList],
  );

  const rawPool = useMemo(
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

  const pool = useMemo(() => {
    if (!noRepeatEnabled) return rawPool;
    const available = rawPool.filter((movie) => !droppedIds.has(movie.id));
    return available;
  }, [rawPool, noRepeatEnabled, droppedIds]);

  const displayedCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawPool;
    return rawPool.filter((movie) => {
      const matchTitle = movie.title.toLowerCase().includes(q);
      const matchOriginal = movie.originalTitle?.toLowerCase().includes(q);
      const matchDirector = movie.director?.toLowerCase().includes(q);
      return matchTitle || matchOriginal || matchDirector;
    });
  }, [rawPool, searchQuery]);

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
    changeOpenMovie(null);
    setSpinning(true);
    setSpin({ winner, pool: [...pool], nonce: nonceRef.current });
  }, [pool, spinning, changeOpenMovie]);

  const handleSettled = useCallback(() => {
    setSpinning(false);
    if (!spin) return;
    const winner = spin.winner;
    changeOpenMovie(winner);
    const at = new Date().toISOString();
    lastDropped.setValue({ id: winner.id, at });
    const currentList = history.value ?? [];
    history.setValue([{ id: winner.id, at }, ...currentList].slice(0, 100));
  }, [spin, lastDropped, history, changeOpenMovie]);

  const activeSpin = spin ?? {
    winner: pool[0] ?? movies[0],
    pool,
    nonce: 0,
  };

  // Предыдущий выпавший фильм: history[1] (history[0] - текущий)
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => sound.setValue(!soundEnabled)}
            aria-label={soundEnabled ? "Выключить звук" : "Включить звук"}
            title={
              soundEnabled
                ? "Звук включен (нажми, чтобы выключить)"
                : "Звук выключен (нажми, чтобы включить)"
            }
            className="btn btn-ghost h-11 w-11 shrink-0 p-0 text-base"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="btn btn-ghost h-11 shrink-0 px-4 text-sm"
          >
            <span aria-hidden>⚙️</span>
            <span className="hidden sm:inline">Настройки</span>
            <span className="sm:hidden">Настройки</span>
          </button>
        </div>
      </header>

      <section className="panel relative overflow-hidden p-4 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "rgb(var(--glow) / 0.2)" }}
        />
        <div className="relative">
          <div>
            {pool.length > 0 ? (
              <SpinTrack
                mode={spinMode.value}
                pool={activeSpin.pool}
                winner={activeSpin.winner}
                nonce={activeSpin.nonce}
                soundEnabled={soundEnabled}
                onSettled={handleSettled}
                onSelectMovie={changeOpenMovie}
              />
            ) : noRepeatEnabled && rawPool.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-4 py-8 text-center text-sm">
                <p className="font-semibold text-fg">
                  🎉 Все фильмы этой категории ({rawPool.length}) уже выпадали!
                </p>
                <p className="mt-1 text-xs text-muted">
                  Сбрось историю просмотров или выключи режим «Без повторов».
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => history.setValue([])}
                    className="btn btn-primary h-9 px-4 text-xs font-semibold"
                  >
                    Сбросить историю
                  </button>
                  <button
                    type="button"
                    onClick={() => noRepeat.setValue(false)}
                    className="btn btn-ghost h-9 px-4 text-xs"
                  >
                    Выключить «Без повторов»
                  </button>
                </div>
              </div>
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

            {/* Быстрый тумблер «Без повторов» */}
            <button
              type="button"
              onClick={() => noRepeat.setValue(!noRepeatEnabled)}
              aria-pressed={noRepeatEnabled}
              title={
                noRepeatEnabled
                  ? "Режим «Без повторов» включён: уже выпавшие фильмы исключены из рулетки"
                  : "Нажми, чтобы не повторять фильмы из истории"
              }
              className={`chip text-xs transition-colors ${
                noRepeatEnabled
                  ? "border-accent bg-accent/15 text-accent font-semibold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <span aria-hidden>{noRepeatEnabled ? "🔄" : "🔁"}</span>
              <span>Без повторов</span>
              <span className="opacity-80">
                · {noRepeatEnabled ? `${pool.length} ост.` : "выкл"}
              </span>
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

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm font-bold">
            Список целиком ({displayedCatalog.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или режиссёру…"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 pl-9 text-sm text-fg placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted"
            >
              🔍
            </span>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Очистить поиск"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-xs text-muted transition-colors hover:text-fg"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {displayedCatalog.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayedCatalog.map((movie) => {
              const rating = formatRating(movie.rating);
              return (
                <li key={movie.id} className="rise">
                  <button
                    type="button"
                    onClick={() => changeOpenMovie(movie)}
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
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            Ничего не найдено по запросу «{searchQuery}».
          </div>
        )}
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
        sound={soundEnabled}
        onSound={sound.setValue}
        noRepeat={noRepeatEnabled}
        onNoRepeat={noRepeat.setValue}
      />

      <MovieModal movie={openMovie} onClose={() => changeOpenMovie(null)} />

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={historyList}
        movies={movies}
        onSelectMovie={changeOpenMovie}
        onClearHistory={() => history.setValue([])}
      />
    </div>
  );
}
