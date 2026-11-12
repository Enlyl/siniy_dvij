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

/** Тихий бархатный звук получения достижения (мягкий саб-бас + нежный перелив) */
export function playAchievementSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Мягкий саб-бас (110Hz -> 55Hz), тихий и обволакивающий
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(70, now + 0.4);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 1.0);

    subFilter.type = "lowpass";
    subFilter.frequency.setValueAtTime(180, now);
    subFilter.frequency.exponentialRampToValueAtTime(60, now + 0.8);
    subFilter.Q.setValueAtTime(1.2, now);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.06);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 1.15);

    // 2. Тёплое тело (треугольная волна, тихо)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();

    bodyOsc.type = "triangle";
    bodyOsc.frequency.setValueAtTime(88, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(55, now + 0.7);

    bodyGain.gain.setValueAtTime(0.001, now);
    bodyGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.95);

    // 3. Нежный деликатный перелив (До4 - Ми4 - Соль4), очень тихо
    const chimes = [
      { freq: 261.63, delay: 0.06, dur: 0.7, vol: 0.04 },
      { freq: 329.63, delay: 0.14, dur: 0.8, vol: 0.035 },
      { freq: 392.0, delay: 0.23, dur: 0.9, vol: 0.03 },
    ];

    chimes.forEach(({ freq, delay, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + delay;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.04);
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
