"use client";

import { useThemeOrDefault, type Theme } from "@/design-system/hooks/useTheme";

const nextTheme: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const labels: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>
    );
  }

  if (theme === "dark") {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="13" rx="1.5" width="18" x="3" y="4" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  );
}

export function ThemeSwitcher({ variant = "public" }: { variant?: "public" | "workspace" }) {
  const { theme, setTheme } = useThemeOrDefault();
  const upcoming = nextTheme[theme];

  const className =
    variant === "workspace"
      ? "inline-flex size-11 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      : "inline-flex size-11 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-forest hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

  return (
    <button
      aria-label={`Theme: ${labels[theme]}. Switch to ${labels[upcoming]}.`}
      className={className}
      onClick={() => setTheme(upcoming)}
      title={`Theme: ${labels[theme]}. Switch to ${labels[upcoming]}`}
      type="button"
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
