export type ThemeId = "bar" | "neon" | "cinema" | "noir";

export type SpinMode = "horizontal" | "vertical" | "slot" | "wheel";

export type ThemeOption = {
  id: ThemeId;
  name: string;
  hint: string;
  swatch: string[];
};

export type SpinModeOption = {
  id: SpinMode;
  name: string;
  hint: string;
  emoji: string;
};

export const THEMES: ThemeOption[] = [
  {
    id: "bar",
    name: "Бар",
    hint: "Ирландский паб, темный дуб и изумрудный хмель",
    swatch: ["#0c140e", "#10b981", "#34d399"],
  },
  {
    id: "neon",
    name: "Неон",
    hint: "Фиолет, циан и лёгкое свечение из-под стойки",
    swatch: ["#0a0713", "#b14bff", "#22d3ee"],
  },
  {
    id: "cinema",
    name: "Кинотеатр",
    hint: "Красный бархат, золото, запах попкорна",
    swatch: ["#0d0708", "#e0b04a", "#c1272d"],
  },
  {
    id: "noir",
    name: "Нуар",
    hint: "Холодный синий, дождь по стеклу, всё серьёзно",
    swatch: ["#0b0e12", "#8ab4f8", "#d5dde8"],
  },
];

export const SPIN_MODES: SpinModeOption[] = [
  {
    id: "horizontal",
    name: "Горизонтальная рулетка",
    hint: "Лента постеров едет боком и плавно встаёт",
    emoji: "🎞️",
  },
  {
    id: "vertical",
    name: "Вертикальная рулетка",
    hint: "Лента постеров падает сверху и тормозит",
    emoji: "🎰",
  },
  {
    id: "slot",
    name: "Однорукий бандит",
    hint: "Три барабана, три постера, джекпот",
    emoji: "🍒",
  },
  {
    id: "wheel",
    name: "Казино рулетка",
    hint: "Классическое колесо казино со стрелкой-указателем",
    emoji: "🎡",
  },
];

export const DEFAULT_THEME: ThemeId = "bar";
export const DEFAULT_SPIN_MODE: SpinMode = "horizontal";

export const STORAGE_KEYS = {
  theme: "dm.theme",
  spin: "dm.spin",
  last: "dm.last",
  history: "dm.history",
} as const;

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function isSpinMode(value: unknown): value is SpinMode {
  return SPIN_MODES.some((mode) => mode.id === value);
}
