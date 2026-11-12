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
  autoOpenModal = true,
  onAutoOpenModal,
  russianRoulette = false,
  onRussianRoulette,
  drunkMode = true,
  onDrunkMode,
  neonSign = true,
  onNeonSign,
  smokeEffect = true,
  onSmokeEffect,
  achievementsEnabled = true,
  onAchievementsEnabled,
  onOpenAchievements,
}: {
  open: boolean;
  onClose: () => void;
  theme: ThemeId;
  onTheme: (id: ThemeId) => void;
  spin: SpinMode;
  onSpin: (id: SpinMode) => void;
  autoOpenModal?: boolean;
  onAutoOpenModal?: (enabled: boolean) => void;
  russianRoulette?: boolean;
  onRussianRoulette?: (enabled: boolean) => void;
  drunkMode?: boolean;
  onDrunkMode?: (enabled: boolean) => void;
  neonSign?: boolean;
  onNeonSign?: (enabled: boolean) => void;
  smokeEffect?: boolean;
  onSmokeEffect?: (enabled: boolean) => void;
  achievementsEnabled?: boolean;
  onAchievementsEnabled?: (enabled: boolean) => void;
  onOpenAchievements?: () => void;
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
            Модальное окно
          </h3>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onAutoOpenModal?.(!autoOpenModal)}
              aria-pressed={autoOpenModal}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🪟</span>
                <div>
                  <span className="block text-sm font-semibold">
                    {autoOpenModal
                      ? "Автооткрытие карточки"
                      : "Без автооткрытия"}
                  </span>
                  <span className="block text-xs text-muted">
                    {autoOpenModal
                      ? "Сразу открывать информацию о выпавшем фильме"
                      : "Оставаться на рулетке (карточку можно открыть кликом)"}
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  autoOpenModal ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoOpenModal ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </section>

        {/* Спецэффекты и приколы */}
        <section className="mt-6">
          <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
            Веселье и атмосфера
          </h3>
          <div className="mt-3 grid gap-2">
            {/* Русская рулетка */}
            <button
              type="button"
              onClick={() => onRussianRoulette?.(!russianRoulette)}
              aria-pressed={russianRoulette}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <span className="block text-sm font-semibold">
                    Режим «Русская рулетка»
                  </span>
                  <span className="block text-xs text-muted">
                    Шанс 1 из 6 выбить треш-фильм (Кошки, Эмоджи фильм…)
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  russianRoulette ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    russianRoulette ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            {/* Пьяный режим */}
            <button
              type="button"
              onClick={() => onDrunkMode?.(!drunkMode)}
              aria-pressed={drunkMode}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🥴</span>
                <div>
                  <span className="block text-sm font-semibold">
                    Пьяный режим
                  </span>
                  <span className="block text-xs text-muted">
                    Интерфейс слегка пьянеет и покачивается от круток
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  drunkMode ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    drunkMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            {/* Неоновая вывеска */}
            <button
              type="button"
              onClick={() => onNeonSign?.(!neonSign)}
              aria-pressed={neonSign}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <span className="block text-sm font-semibold">
                    Неоновая вывеска
                  </span>
                  <span className="block text-xs text-muted">
                    Мерцающий барный неон в заголовке
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  neonSign ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    neonSign ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            {/* Дым / туман */}
            <button
              type="button"
              onClick={() => onSmokeEffect?.(!smokeEffect)}
              aria-pressed={smokeEffect}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💨</span>
                <div>
                  <span className="block text-sm font-semibold">
                    Дым и туман
                  </span>
                  <span className="block text-xs text-muted">
                    Атмосферный дым на фоне страницы
                  </span>
                </div>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  smokeEffect ? "bg-accent" : "bg-line"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    smokeEffect ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>

            {/* Достижения */}
            <div className="rounded-2xl border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏆</span>
                  <div>
                    <span className="block text-sm font-semibold">
                      Система достижений
                    </span>
                    <span className="block text-xs text-muted">
                      Уведомления и ачивки за крутки
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAchievementsEnabled?.(!achievementsEnabled)}
                  aria-pressed={achievementsEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    achievementsEnabled ? "bg-accent" : "bg-line"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      achievementsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {onOpenAchievements && achievementsEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAchievements();
                  }}
                  className="btn btn-ghost mt-2 w-full h-8 text-xs font-semibold text-accent"
                >
                  Открыть список достижений →
                </button>
              )}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
