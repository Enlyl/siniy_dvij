"use client";

import { useEffect } from "react";
import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementId,
} from "@/lib/achievements";

function getAssetPath(path: string): string {
  if (typeof window === "undefined") return path;
  const prefix = window.location.pathname.startsWith("/siniy_dvij")
    ? "/siniy_dvij"
    : "";
  return prefix + (path.startsWith("/") ? path : `/${path}`);
}

export function AchievementsModal({
  open,
  onClose,
  unlocked,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  unlocked: Set<AchievementId>;
  onReset: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const total = ACHIEVEMENTS.length;
  const count = unlocked.size;
  const percent = Math.round((count / total) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Достижения"
        className="pop flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-line bg-surface p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="font-display text-lg font-extrabold sm:text-xl">
                Достижения
              </h2>
              <p className="text-xs text-muted">
                Открыто: {count} из {total} ({percent}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="btn btn-ghost h-9 w-9 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Прогресс-бар */}
        <div className="my-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2 border border-line">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-3 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ACHIEVEMENTS.map((item) => {
              const isUnlocked = unlocked.has(item.id);
              const isPlatinum = item.id === "absolute-cinema";

              let cardStyle = "border-line bg-surface-2/60 opacity-60";
              if (isUnlocked) {
                if (isPlatinum) {
                  cardStyle =
                    "border-amber-400/80 bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-accent/15 shadow-[0_0_15px_rgba(234,179,8,0.25)]";
                } else {
                  cardStyle = "border-accent/50 bg-accent/10";
                }
              }

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3 transition-all ${cardStyle}`}
                >
                  {item.image && isUnlocked ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getAssetPath(item.image)}
                      alt={item.title}
                      className="h-11 w-11 shrink-0 rounded-xl object-cover border border-amber-400/80 shadow-md"
                    />
                  ) : (
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${
                        isUnlocked
                          ? "bg-accent/20 border border-accent/40 shadow-sm"
                          : "bg-surface border border-line grayscale"
                      }`}
                    >
                      {item.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`truncate text-sm font-bold ${
                          isPlatinum && isUnlocked
                            ? "text-amber-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                            : "text-fg"
                        }`}
                      >
                        {!isUnlocked && item.secret ? "???" : item.title}
                      </span>
                      {isUnlocked ? (
                        <span
                          className={`text-xs font-semibold ${
                            isPlatinum ? "text-amber-400" : "text-accent"
                          }`}
                        >
                          {isPlatinum ? "★" : "✓"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">🔒</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted leading-snug">
                      {!isUnlocked && item.secret
                        ? "Секретное достижение. Собери все остальные награды!"
                        : item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-muted underline decoration-dotted transition-colors hover:text-red-400"
          >
            Сбросить достижения
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary h-9 px-5 text-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export function AchievementToast({
  achievement,
  onClose,
}: {
  achievement: Achievement | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  if (!achievement) return null;

  const isPlatinum = achievement.id === "absolute-cinema";

  return (
    <div
      onClick={onClose}
      className={`pop fixed bottom-6 right-6 z-[100] flex max-w-sm cursor-pointer items-center gap-3 rounded-2xl border p-4 shadow-2xl transition-all ${
        isPlatinum
          ? "border-amber-400 bg-surface shadow-[0_0_25px_rgba(234,179,8,0.4)]"
          : "border-accent bg-surface glow-ring"
      }`}
    >
      {achievement.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getAssetPath(achievement.image)}
          alt={achievement.title}
          className="h-12 w-12 shrink-0 rounded-xl object-cover border border-amber-400/80 shadow-md"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-3xl">
          {achievement.icon}
        </span>
      )}
      <div className="min-w-0">
        <span
          className={`block text-[0.6875rem] font-bold tracking-wider uppercase ${
            isPlatinum ? "text-amber-400" : "text-accent"
          }`}
        >
          {isPlatinum ? "🏆 ПЛАТИНА РАЗБЛОКИРОВАНА!" : "🏆 Новое достижение!"}
        </span>
        <span
          className={`block truncate text-sm font-bold ${
            isPlatinum ? "text-amber-300" : "text-fg"
          }`}
        >
          {achievement.title}
        </span>
        <span className="block text-xs text-muted line-clamp-1">
          {achievement.description}
        </span>
      </div>
    </div>
  );
}
