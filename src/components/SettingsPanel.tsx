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
  sound,
  onSound,
  noRepeat,
  onNoRepeat,
}: {
  open: boolean;
  onClose: () => void;
  theme: ThemeId;
  onTheme: (id: ThemeId) => void;
  spin: SpinMode;
  onSpin: (id: SpinMode) => void;
  sound: boolean;
  onSound: (enabled: boolean) => void;
  noRepeat: boolean;
  onNoRepeat: (enabled: boolean) => void;
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

        <section className="mt-6">
          <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
            Выбор фильмов
          </h3>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onNoRepeat(!noRepeat)}
              aria-pressed={noRepeat}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <span className="block text-sm font-semibold">
                    {noRepeat ? "Без повторов: включено" : "Без повторов: выключено"}
                  </span>
                  <span className="block text-xs text-muted">
                    Не крутить фильмы, которые уже выпадали
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  noRepeat ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    noRepeat ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
            Звуки
          </h3>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onSound(!sound)}
              aria-pressed={sound}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{sound ? "🔊" : "🔇"}</span>
                <div>
                  <span className="block text-sm font-semibold">
                    {sound ? "Звуки включены" : "Звуки выключены"}
                  </span>
                  <span className="block text-xs text-muted">
                    Трещотка барабана и звук победы
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  sound ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sound ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
