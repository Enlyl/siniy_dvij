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

/** Басовитый приятный звук получения достижения (глубокий бархатный саб-бас + теплый аккорд) */
export function playAchievementSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Глубокий бархатный саб-бас (130Hz -> 48Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(65, now + 0.3);
    subOsc.frequency.exponentialRampToValueAtTime(48, now + 0.85);

    subFilter.type = "lowpass";
    subFilter.frequency.setValueAtTime(260, now);
    subFilter.frequency.exponentialRampToValueAtTime(80, now + 0.7);
    subFilter.Q.setValueAtTime(2.5, now);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.5, now + 0.03); // мягкий приятный панч
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.95);

    // 2. Тёплое гармоническое тело (треугольная волна 98Hz -> 65Hz)
    const bodyOsc = ctx.createOscillator();

    bodyOsc.type = "triangle";
    bodyOsc.frequency.setValueAtTime(98, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(65.4, now + 0.6);

    bodyOsc.connect(subFilter);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.85);

    // 3. Мягкий деликатный перелив (До4 - Соль4 - До5) поверх баса
    const chimes = [
      { freq: 261.63, delay: 0.04, dur: 0.55, vol: 0.12 },
      { freq: 392.0, delay: 0.11, dur: 0.65, vol: 0.1 },
      { freq: 523.25, delay: 0.19, dur: 0.75, vol: 0.08 },
    ];

    chimes.forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + delay;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch {
    // Игнорируем
  }
}
