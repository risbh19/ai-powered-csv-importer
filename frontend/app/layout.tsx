import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GrowEasy — CSV Lead Importer",
  description: "Upload any lead CSV. AI maps it into the GrowEasy CRM schema automatically.",
};

// Runs before React hydrates so the correct theme class is on <html> for the
// very first paint — otherwise a dark-mode user would see a flash of the
// light theme while JS loads.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("groweasy-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body bg-surface text-ink dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
