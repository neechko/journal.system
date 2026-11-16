import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scholarly Publishing Platform",
  description:
    "A multi-tenant scholarly publishing platform for organizations and journals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
