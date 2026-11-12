/** Пьяный режим: степень опьянения зависит от количества круток */

export type DrunkLevel = 0 | 1 | 2 | 3;

export function getDrunkLevel(spins: number): DrunkLevel {
  if (spins < 4) return 0; // трезв
  if (spins < 8) return 1; // навеселе (лёгкое покачивание)
  if (spins < 14) return 2; // хорошо пошло (двоение, наклон, плывущий текст)
  return 3; // в хлам (серьёзный блюр, сильное покачивание, пьяные цитаты)
}

export const DRUNK_PHRASES: string[] = [
  "Ты ваще помнишь, зачем пришёл?",
  "Пиво само себя не выпьет, братан.",
  "Этот фильм точно шедевр... наверное.",
  "Ещё одну круточку и спать (нет).",
  "Слушай рулетку, рулетка врать не будет.",
  "Кто не крутит — тот не пьёт!",
  "Ты уже 10 минут выбираешь, включи хоть что-нибудь!",
  "Давай ещё крутани, я знаю ты хочешь.",
  "Зеркало ждёт тебя...",
];

export function getRandomDrunkPhrase(): string {
  return DRUNK_PHRASES[Math.floor(Math.random() * DRUNK_PHRASES.length)];
}
