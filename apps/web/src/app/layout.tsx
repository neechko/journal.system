import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/design-system/providers/ThemeProvider";

const fallbackUrl = "https://journalsystem-theta.vercel.app";

function resolveMetadataBase(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Fall through to the documented production origin.
    }
  }
  return new URL(fallbackUrl);
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Scholarly Publishing Platform",
    template: "%s | Scholarly Publishing Platform",
  },
  description:
    "A multi-tenant scholarly publishing platform for organizations, institutions, and journals.",
};

/**
 * Applies the persisted (or system) theme before first paint so the page never
 * flashes the wrong colour scheme. Mirrors the storage key used by ThemeProvider.
 */
const themeInitScript = `(function(){try{var key='journal-system-theme';var stored=window.localStorage.getItem(key);var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',theme);}catch(_){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
