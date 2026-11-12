/** Определения достижений и хелперы */

export type AchievementId =
  | "first-spin"
  | "spin-10"
  | "spin-50"
  | "spin-100"
  | "streak-5"
  | "streak-10"
  | "streak-17"
  | "found-mirror"
  | "found-brokeback"
  | "fast-and-furious"
  | "got-trash"
  | "drunk-mode"
  | "all-themes"
  | "all-modes"
  | "night-owl"
  | "absolute-cinema";

export type Achievement = {
  id: AchievementId;
  icon: string;
  title: string;
  description: string;
  image?: string;
  secret?: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-spin",
    icon: "🎰",
    title: "Первая крутка",
    description: "Крутанул рулетку впервые. Путь начался.",
  },
  {
    id: "spin-10",
    icon: "🔟",
    title: "Десяточка",
    description: "10 круток — уже не случайность, а привычка.",
  },
  {
    id: "spin-50",
    icon: "🏅",
    title: "Полтинник",
    description: "50 круток. Ты провёл больше времени выбирая, чем смотря.",
  },
  {
    id: "spin-100",
    icon: "💯",
    title: "Сотка",
    description: "100 круток. Ты стал рулеткой.",
  },
  {
    id: "streak-5",
    icon: "🔥",
    title: "На кураже",
    description: "5 круток подряд без выбора фильма из каталога.",
  },
  {
    id: "streak-10",
    icon: "🔥🔥",
    title: "Не остановить",
    description: "10 круток подряд. Решительность — не твоё.",
  },
  {
    id: "streak-17",
    icon: "🪞",
    title: "Зеркало души",
    description: "17 круток подряд. Рулетка показала тебе тебя.",
    secret: true,
  },
  {
    id: "found-mirror",
    icon: "👻",
    title: "Нашёл пасхалку",
    description: "Выпало зеркало. Теперь ты знаешь правду.",
    secret: true,
  },
  {
    id: "found-brokeback",
    icon: "🏔️",
    title: "Горбатая гора",
    description: "Выпала ТОГО самая гора. Ахаха.",
    secret: true,
  },
  {
    id: "fast-and-furious",
    icon: "🩳",
    title: "Добро пожаловать в семью!",
    description: "Выпал один из «Форсажей». Главное — семья, Торретто одобряет.",
  },
  {
    id: "got-trash",
    icon: "🗑️",
    title: "Русская рулетка",
    description: "Впервые выпал треш-фильм. Ну бывает.",
  },
  {
    id: "drunk-mode",
    icon: "🍺",
    title: "Пьяный режим",
    description: "Интерфейс поплыл. Как и ты.",
  },
  {
    id: "all-themes",
    icon: "🎨",
    title: "Примерил всё",
    description: "Попробовал все 4 темы оформления.",
  },
  {
    id: "all-modes",
    icon: "🎲",
    title: "Все виды кайфа",
    description: "Попробовал все 4 режима крутки рулетки.",
  },
  {
    id: "night-owl",
    icon: "🦉",
    title: "Ночная сова",
    description: "Крутишь рулетку после полуночи. Спать не пробовал?",
  },
  {
    id: "absolute-cinema",
    icon: "🎬",
    title: "Абсолют синема!",
    description: "Аналог платины на PlayStation. Собраны все остальные достижения!",
    image: "/abs_cin.jpg",
    secret: true,
  },
];

const STORAGE_KEY = "dm.achievements";

export function getUnlocked(): Set<AchievementId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as AchievementId[]);
  } catch {}
  return new Set();
}

export function saveUnlocked(ids: Set<AchievementId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function resetAchievements(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USED_THEMES_KEY);
    localStorage.removeItem(USED_MODES_KEY);
  } catch {}
}

/** Количество обычных достижений без учета платины */
export const REGULAR_ACHIEVEMENTS_COUNT = ACHIEVEMENTS.length - 1;

export function unlock(
  id: AchievementId,
  current: Set<AchievementId>,
): { set: Set<AchievementId>; isNew: boolean } {
  if (current.has(id)) return { set: current, isNew: false };
  const next = new Set(current);
  next.add(id);
  saveUnlocked(next);
  return { set: next, isNew: true };
}

/** Трекер использованных тем/режимов */
const USED_THEMES_KEY = "dm.usedThemes";
const USED_MODES_KEY = "dm.usedModes";

export function trackTheme(themeId: string): string[] {
  try {
    const raw = localStorage.getItem(USED_THEMES_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(themeId)) {
      arr.push(themeId);
      localStorage.setItem(USED_THEMES_KEY, JSON.stringify(arr));
    }
    return arr;
  } catch {
    return [];
  }
}

export function trackMode(modeId: string): string[] {
  try {
    const raw = localStorage.getItem(USED_MODES_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(modeId)) {
      arr.push(modeId);
      localStorage.setItem(USED_MODES_KEY, JSON.stringify(arr));
    }
    return arr;
  } catch {
    return [];
  }
}
