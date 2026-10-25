"use client";

import { useEffect } from "react";
import { SPIN_MODES, THEMES, type SpinMode, type ThemeId } from "@/lib/settings";

export function SettingsPanel({
  open,
  onClose,
  theme,
  onTheme,
  spin,
  onSpin,
  tmdbConfigured,
  enrichedCount,
  totalCount,
}: {
  open: boolean;
  onClose: () => void;
  theme: ThemeId;
  onTheme: (id: ThemeId) => void;
  spin: SpinMode;
  onSpin: (id: SpinMode) => void;
  tmdbConfigured: boolean;
  enrichedCount: number;
  totalCount: number;
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

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Настройки"
        className="pop h-full w-full max-w-sm overflow-y-auto border-l border-line bg-surface p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">Настройки</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки"
            className="btn btn-ghost h-9 w-9 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <section className="mt-6">
          <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
            Тема
          </h3>
          <div className="mt-3 grid gap-2">
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onTheme(option.id)}
                aria-pressed={theme === option.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60 aria-pressed:border-accent"
              >
                <span className="flex gap-1">
                  {option.swatch.map((color) => (
                    <span
                      key={color}
                      className="h-7 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{option.name}</span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </span>
                {theme === option.id ? (
                  <span className="ml-auto text-accent">✓</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
            Как крутить
          </h3>
          <div className="mt-3 grid gap-2">
            {SPIN_MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSpin(option.id)}
                aria-pressed={spin === option.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60 aria-pressed:border-accent"
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{option.name}</span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </span>
                {spin === option.id ? (
                  <span className="ml-auto text-accent">✓</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-line bg-surface-2 p-3 text-xs text-muted">
          <p className="font-semibold text-fg">Данные о фильмах</p>
          <p className="mt-1">
            {tmdbConfigured ? (
              <>
                TMDB подключён: {enrichedCount} из {totalCount} карточек обогащены
                описанием, сюжетом, бюджетом и трейлером.
              </>
            ) : (
              <>
                Ключ TMDB не задан, поэтому показываем только то, что есть в списке, а
                пустые поля честно прячем за заглушкой. Добавьте{" "}
                <code className="rounded bg-bg-soft px-1">TMDB_API_KEY</code> в{" "}
                <code className="rounded bg-bg-soft px-1">.env.local</code> — и карточки
                наполнятся.
              </>
            )}
          </p>
        </section>
      </aside>
    </div>
  );
}
