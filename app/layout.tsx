import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-meta";
import { getLanguage } from "@/lib/language";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = await getLanguage();
  return (
    <html lang={language}>
      <body>{children}</body>
    </html>
  );
}
