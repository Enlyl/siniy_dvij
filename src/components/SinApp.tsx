"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatRating } from "@/lib/format";
import { MOVIES, type Movie } from "@/lib/movies";
import {
  BROKEBACK_MOUNTAIN_ID,
  BROKEBACK_MOUNTAIN_MOVIE,
  BROKEBACK_UNLOCK_THRESHOLD,
  EASTER_EGG_ID,
  EASTER_EGG_MOVIE,
  EASTER_EGG_SPIN_THRESHOLD,
} from "@/lib/easterEgg";
import {
  TRASH_MOVIES,
  pickTrashMovie,
  shouldInsertTrash,
} from "@/lib/trashMovies";
import {
  ACHIEVEMENTS,
  REGULAR_ACHIEVEMENTS_COUNT,
  getUnlocked,
  resetAchievements,
  trackMode,
  trackTheme,
  unlock,
  type Achievement,
  type AchievementId,
} from "@/lib/achievements";
import {
  getDrunkLevel,
  getRandomDrunkPhrase,
} from "@/lib/drunkMode";
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
import { NeonSign } from "./NeonSign";
import { SmokeEffect } from "./SmokeEffect";
import { AchievementsModal, AchievementToast } from "./AchievementsModal";
import { playAchievementSound } from "@/lib/sound";

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
  const autoOpenModal = useStoredJson<boolean>(
    STORAGE_KEYS.autoOpenModal,
    true,
    (v): v is boolean => typeof v === "boolean",
  );
  const autoOpenModalEnabled = autoOpenModal.value ?? true;

  const russianRoulette = useStoredJson<boolean>(
    STORAGE_KEYS.russianRoulette,
    false,
    (v): v is boolean => typeof v === "boolean",
  );
  const russianRouletteEnabled = russianRoulette.value ?? false;

  const drunkMode = useStoredJson<boolean>(
    STORAGE_KEYS.drunkMode,
    true,
    (v): v is boolean => typeof v === "boolean",
  );
  const drunkModeEnabled = drunkMode.value ?? true;

  const neonSign = useStoredJson<boolean>(
    STORAGE_KEYS.neonSign,
    true,
    (v): v is boolean => typeof v === "boolean",
  );
  const neonSignEnabled = neonSign.value ?? true;

  const smokeEffect = useStoredJson<boolean>(
    STORAGE_KEYS.smokeEffect,
    true,
    (v): v is boolean => typeof v === "boolean",
  );
  const smokeEffectEnabled = smokeEffect.value ?? true;

  const achievements = useStoredJson<boolean>(
    STORAGE_KEYS.achievements,
    true,
    (v): v is boolean => typeof v === "boolean",
  );
  const achievementsEnabled = achievements.value ?? true;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementId>>(new Set());
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);
  const [drunkQuote, setDrunkQuote] = useState("");
  const [openMovie, setOpenMovie] = useState<Movie | null>(null);
  const [spin, setSpin] = useState<SpinState | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [totalSpins, setTotalSpins] = useState(0);
  const [sessionSpins, setSessionSpins] = useState(0);

  const nonceRef = useRef(0);
  const consecutiveSpinsRef = useRef(0);
  const triggerRef = useRef<(id: AchievementId) => void>(() => {});

  const triggerAchievement = useCallback(
    (id: AchievementId) => {
      if (!achievementsEnabled) return;
      setUnlockedAchievements((prev) => {
        const { set, isNew } = unlock(id, prev);
        if (isNew) {
          const ach = ACHIEVEMENTS.find((a) => a.id === id);
          if (ach) setToastAchievement(ach);
          playAchievementSound(soundEnabled);

          // Проверка на получение платины «Абсолют синема!»
          if (id !== "absolute-cinema" && !set.has("absolute-cinema")) {
            const hasAllRegular = ACHIEVEMENTS.filter(
              (a) => a.id !== "absolute-cinema",
            ).every((a) => set.has(a.id));
            if (hasAllRegular) {
              setTimeout(() => {
                triggerRef.current("absolute-cinema");
              }, 1200);
            }
          }
        }
        return set;
      });
    },
    [achievementsEnabled, soundEnabled],
  );
  triggerRef.current = triggerAchievement;

  useEffect(() => {
    try {
      const stored =
        parseInt(sessionStorage.getItem("sin_total_spins") || "0", 10) || 0;
      setTotalSpins(stored);
    } catch {}
    const unlocked = getUnlocked();
    setUnlockedAchievements(unlocked);
    if (
      unlocked.size >= REGULAR_ACHIEVEMENTS_COUNT &&
      !unlocked.has("absolute-cinema")
    ) {
      const hasAllRegular = ACHIEVEMENTS.filter(
        (a) => a.id !== "absolute-cinema",
      ).every((a) => unlocked.has(a.id));
      if (hasAllRegular) {
        triggerRef.current("absolute-cinema");
      }
    }
  }, []);

  /* тема живёт на <html>, чтобы не мигало при загрузке */
  useEffect(() => {
    document.documentElement.dataset.theme = theme.value;
    const themes = trackTheme(theme.value);
    if (themes.length >= 4) triggerAchievement("all-themes");
  }, [theme.value, triggerAchievement]);

  useEffect(() => {
    document.documentElement.dataset.spin = spinMode.value;
    const modes = trackMode(spinMode.value);
    if (modes.length >= 4) triggerAchievement("all-modes");
  }, [spinMode.value, triggerAchievement]);

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
        if (slug === EASTER_EGG_ID) {
          setOpenMovie(EASTER_EGG_MOVIE);
        } else if (slug === BROKEBACK_MOUNTAIN_ID) {
          setOpenMovie(BROKEBACK_MOUNTAIN_MOVIE);
        } else {
          const found = MOVIES.find((m) => m.id === slug);
          if (found) {
            setOpenMovie(found);
          }
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
    let available = noRepeatEnabled
      ? rawPool.filter((movie) => !droppedIds.has(movie.id))
      : rawPool;

    // После 3х круток Горбатая гора получает возможность участвовать в крутках
    if (totalSpins >= BROKEBACK_UNLOCK_THRESHOLD) {
      if (!noRepeatEnabled || !droppedIds.has(BROKEBACK_MOUNTAIN_ID)) {
        available = [...available, BROKEBACK_MOUNTAIN_MOVIE];
      }
    }
    return available;
  }, [rawPool, noRepeatEnabled, droppedIds, totalSpins]);

  const displayedCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawPool;
    return rawPool.filter((movie) => {
      const matchTitle = movie.title.toLowerCase().includes(q);
      const matchOriginal = movie.originalTitle?.toLowerCase().includes(q);
      const matchDirector = movie.director?.toLowerCase().includes(q);
      const matchActor = movie.actors?.some((actor) =>
        actor.toLowerCase().includes(q),
      );
      return matchTitle || matchOriginal || matchDirector || matchActor;
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

    const nextTotal = totalSpins + 1;
    setTotalSpins(nextTotal);
    try {
      sessionStorage.setItem("sin_total_spins", String(nextTotal));
    } catch {}

    setSessionSpins((prev) => {
      const next = prev + 1;
      if (drunkModeEnabled && getDrunkLevel(next) > 0) {
        setDrunkQuote(getRandomDrunkPhrase());
      }
      return next;
    });

    let streak = consecutiveSpinsRef.current + 1;
    try {
      const stored = parseInt(sessionStorage.getItem("sin_spin_streak") || "0", 10) || 0;
      streak = Math.max(streak, stored + 1);
    } catch {}
    consecutiveSpinsRef.current = streak;
    try {
      sessionStorage.setItem("sin_spin_streak", String(streak));
    } catch {}

    let winner: Movie;
    let spinPool: Movie[];

    if (streak > EASTER_EGG_SPIN_THRESHOLD) {
      winner = EASTER_EGG_MOVIE;
      spinPool = [EASTER_EGG_MOVIE, ...pool];
      consecutiveSpinsRef.current = 0;
      try {
        sessionStorage.setItem("sin_spin_streak", "0");
      } catch {}
    } else if (russianRouletteEnabled && shouldInsertTrash()) {
      winner = pickTrashMovie();
      spinPool = [winner, ...pool];
    } else {
      winner = pool[Math.floor(Math.random() * pool.length)];
      spinPool = [...pool];
    }

    nonceRef.current += 1;
    changeOpenMovie(null);
    setSpinning(true);
    setSpin({ winner, pool: spinPool, nonce: nonceRef.current });
  }, [
    pool,
    spinning,
    changeOpenMovie,
    totalSpins,
    russianRouletteEnabled,
    drunkModeEnabled,
  ]);

  const handleSettled = useCallback(() => {
    setSpinning(false);
    if (!spin) return;
    const winner = spin.winner;
    if (autoOpenModalEnabled) {
      changeOpenMovie(winner);
    }
    const at = new Date().toISOString();
    lastDropped.setValue({ id: winner.id, at });
    const currentList = history.value ?? [];
    history.setValue([{ id: winner.id, at }, ...currentList].slice(0, 100));

    // Проверка ачивок
    const currentStreak = consecutiveSpinsRef.current;
    triggerAchievement("first-spin");
    if (totalSpins >= 10) triggerAchievement("spin-10");
    if (totalSpins >= 50) triggerAchievement("spin-50");
    if (totalSpins >= 100) triggerAchievement("spin-100");
    if (currentStreak >= 5) triggerAchievement("streak-5");
    if (currentStreak >= 10) triggerAchievement("streak-10");
    if (currentStreak >= 17) triggerAchievement("streak-17");
    if (winner.id === EASTER_EGG_ID) triggerAchievement("found-mirror");
    if (winner.id === BROKEBACK_MOUNTAIN_ID) triggerAchievement("found-brokeback");
    if (TRASH_MOVIES.some((t) => t.id === winner.id)) triggerAchievement("got-trash");
    if (
      winner.title.toLowerCase().includes("форсаж") ||
      (winner.originalTitle && winner.originalTitle.toLowerCase().includes("fast"))
    ) {
      triggerAchievement("fast-and-furious");
    }

    const drunkLvl = drunkModeEnabled ? getDrunkLevel(sessionSpins) : 0;
    if (drunkLvl >= 2) triggerAchievement("drunk-mode");

    const hours = new Date().getHours();
    if (hours >= 0 && hours < 5) triggerAchievement("night-owl");
  }, [
    spin,
    lastDropped,
    history,
    changeOpenMovie,
    autoOpenModalEnabled,
    totalSpins,
    sessionSpins,
    triggerAchievement,
    drunkModeEnabled,
  ]);

  const activeSpin = spin ?? {
    winner: pool[0] ?? movies[0],
    pool,
    nonce: 0,
  };

  const allMovies = useMemo(
    () => [
      EASTER_EGG_MOVIE,
      BROKEBACK_MOUNTAIN_MOVIE,
      ...TRASH_MOVIES,
      ...movies,
    ],
    [movies],
  );

  // Предыдущий выпавший фильм: history[1] (history[0] - текущий)
  const previousEntry = historyList.length >= 2 ? historyList[1] : null;
  const previousMovie = previousEntry ? allMovies.find((m) => m.id === previousEntry.id) : null;
  const currentOrLastMovie = historyList.length > 0 ? allMovies.find((m) => m.id === historyList[0].id) : null;

  const drunkLevel = drunkModeEnabled ? getDrunkLevel(sessionSpins) : 0;

  return (
    <>
      <SmokeEffect enabled={smokeEffectEnabled} />
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 px-4 pt-5 pb-16 sm:px-6 relative z-10 transition-all duration-700 ${
          drunkLevel === 1
            ? "drunk-level-1"
            : drunkLevel === 2
            ? "drunk-level-2"
            : ""
        }`}
      >
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <NeonSign enabled={neonSignEnabled} />
          </div>
          <div className="flex items-center gap-2">
            {achievementsEnabled && (
              <button
                type="button"
                onClick={() => setAchievementsOpen(true)}
                aria-label="Достижения"
                title={`Достижения (${unlockedAchievements.size} из ${ACHIEVEMENTS.length})`}
                className="btn btn-ghost h-11 w-11 shrink-0 p-0 text-base relative"
              >
                <span>🏆</span>
                {unlockedAchievements.size > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[0.625rem] font-bold text-accent-fg">
                    {unlockedAchievements.size}
                  </span>
                )}
              </button>
            )}
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

            {/* Пьяная фраза или подсказка */}
            {drunkModeEnabled && drunkLevel > 0 && drunkQuote && (
              <p className="animate-pulse text-center text-xs font-medium text-accent/90 italic">
                🥴 {drunkQuote}
              </p>
            )}

            {/* Бейджик Русской рулетки */}
            {russianRouletteEnabled && (
              <span className="text-[0.6875rem] font-medium text-rose-400/80">
                🎯 Русская рулетка включена (1 из 6 треш)
              </span>
            )}

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
                    onClick={() => {
                      consecutiveSpinsRef.current = 0;
                      try {
                        sessionStorage.setItem("sin_spin_streak", "0");
                      } catch {}
                      changeOpenMovie(movie);
                    }}
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
        autoOpenModal={autoOpenModalEnabled}
        onAutoOpenModal={autoOpenModal.setValue}
        russianRoulette={russianRouletteEnabled}
        onRussianRoulette={russianRoulette.setValue}
        drunkMode={drunkModeEnabled}
        onDrunkMode={drunkMode.setValue}
        neonSign={neonSignEnabled}
        onNeonSign={neonSign.setValue}
        smokeEffect={smokeEffectEnabled}
        onSmokeEffect={smokeEffect.setValue}
        achievementsEnabled={achievementsEnabled}
        onAchievementsEnabled={achievements.setValue}
        onOpenAchievements={() => setAchievementsOpen(true)}
      />

      <AchievementsModal
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        unlocked={unlockedAchievements}
        soundEnabled={soundEnabled}
        onReset={() => {
          resetAchievements();
          setUnlockedAchievements(new Set());
          setTotalSpins(0);
          setSessionSpins(0);
          setDrunkQuote("");
          consecutiveSpinsRef.current = 0;
          try {
            sessionStorage.removeItem("sin_total_spins");
            sessionStorage.removeItem("sin_spin_streak");
          } catch {}
        }}
      />

      <AchievementToast
        achievement={toastAchievement}
        onClose={() => setToastAchievement(null)}
      />

      <MovieModal movie={openMovie} onClose={() => changeOpenMovie(null)} />

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={historyList}
        movies={allMovies}
        onSelectMovie={changeOpenMovie}
        onClearHistory={() => history.setValue([])}
      />
    </div>
  </>
);
}
