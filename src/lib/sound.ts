"use client";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Звук механической трещотки рулетки / барабана (короткий щелчок) */
export function playRatchet(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Быстрый спад частоты создает реалистичный сухой щелчок флажка
    osc.type = "triangle";
    osc.frequency.setValueAtTime(850 + Math.random() * 120, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.016);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.018);
  } catch {
    // Игнорируем ограничения автоплея браузера
  }
}

/** Звук финального выбора (торжественный перезвон колокольчиков / фанфары) */
export function playWinSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Аккорд победы: До5 - Ми5 - Соль5 - До6 - Ми6
    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const now = ctx.currentTime;

    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const start = now + idx * 0.065;
      const duration = 0.55;

      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    });
  } catch {
    // Игнорируем
  }
}
