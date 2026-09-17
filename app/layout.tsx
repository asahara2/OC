import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "おっぱい共同体公式サイト", template: "%s | おっぱい共同体公式サイト" },
  description: "おっぱいの起源を探り自由に進行する次世代宗教",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
