import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { DEFAULT_SPIN_MODE, DEFAULT_THEME, STORAGE_KEYS } from "@/lib/settings";

const display = Unbounded({
  variable: "--font-display-src",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const basePath = process.env.GITHUB_PAGES === "true" ? "/siniy_dvij" : "";
const iconUrl = `${basePath}/icon.svg`;
const faviconUrl = `${basePath}/favicon.svg`;

export const metadata: Metadata = {
  title: "Список фильмов под синьку",
  description:
    "Личный список фильмов и рулетка, которая выбирает, что смотреть сегодня вечером.",
  icons: {
    icon: [
      { url: iconUrl, type: "image/svg+xml" },
      { url: faviconUrl, type: "image/svg+xml" },
    ],
    shortcut: iconUrl,
    apple: iconUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#12100e",
  width: "device-width",
  initialScale: 1,
};

const themeBootstrap = `(() => {
  try {
    const root = document.documentElement;
    const theme = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)});
    const spin = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.spin)});
    const themes = ["bar", "neon", "cinema", "noir"];
    const modes = ["horizontal", "vertical", "slot", "wheel"];
    root.dataset.theme = themes.includes(theme) ? theme : ${JSON.stringify(DEFAULT_THEME)};
    root.dataset.spin = modes.includes(spin) ? spin : ${JSON.stringify(DEFAULT_SPIN_MODE)};
  } catch {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.dataset.spin = ${JSON.stringify(DEFAULT_SPIN_MODE)};
  }
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-theme={DEFAULT_THEME}
      data-spin={DEFAULT_SPIN_MODE}
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/svg+xml" href={iconUrl} />
        <link rel="shortcut icon" href={iconUrl} />
        <link rel="apple-touch-icon" href={iconUrl} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
