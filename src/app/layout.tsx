import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew", "arabic", "cyrillic"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "עברתם דירה? עדכנו כתובת לבחירות",
  description:
    "בישראל מצביעים רק לפי הכתובת שבתעודת הזהות. עדכון הכתובת חינם, אונליין, וכחמש דקות — אבל רק עד סגירת הפנקס.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
