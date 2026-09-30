import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transition Tracker",
  description: "Маленький трекер переходів для різних джерел трафіку",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
