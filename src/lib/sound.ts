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

/** Короткий резкий звук получения достижения (панч-бас + яркий блик) */
export function playAchievementSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Резкий панч-бас (150Hz -> 40Hz, быстрая атака)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.28);

    // 2. Яркий блик (короткий синус 880Hz)
    const blipOsc = ctx.createOscillator();
    const blipGain = ctx.createGain();

    blipOsc.type = "sine";
    blipOsc.frequency.setValueAtTime(880, now);
    blipOsc.frequency.exponentialRampToValueAtTime(660, now + 0.08);

    blipGain.gain.setValueAtTime(0.15, now);
    blipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    blipOsc.connect(blipGain);
    blipGain.connect(ctx.destination);
    blipOsc.start(now);
    blipOsc.stop(now + 0.18);

    // 3. Второй блик чуть выше (подтверждение)
    const blip2 = ctx.createOscillator();
    const blip2Gain = ctx.createGain();
    const t2 = now + 0.07;

    blip2.type = "sine";
    blip2.frequency.setValueAtTime(1175, t2);
    blip2.frequency.exponentialRampToValueAtTime(880, t2 + 0.06);

    blip2Gain.gain.setValueAtTime(0.0001, t2);
    blip2Gain.gain.linearRampToValueAtTime(0.12, t2 + 0.01);
    blip2Gain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.12);

    blip2.connect(blip2Gain);
    blip2Gain.connect(ctx.destination);
    blip2.start(t2);
    blip2.stop(t2 + 0.15);
  } catch {
    // Игнорируем
  }
}
