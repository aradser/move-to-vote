import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew", "arabic", "cyrillic"],
  weight: ["400", "500", "700", "900"],
});

const TITLE = "עברתם דירה? עדכנו כתובת לבחירות";
const DESCRIPTION =
  "בישראל מצביעים רק לפי הכתובת שבתעודת הזהות. עדכון הכתובת חינם, אונליין, וכחמש דקות — אבל רק עד סגירת הפנקס.";

export const metadata: Metadata = {
  metadataBase: new URL("https://move-to-vote.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "עברתם דירה? עדכנו כתובת לבחירות",
    locale: "he_IL",
    type: "website",
    images: [{ url: "/images/move-to-vote.png", width: 2172, height: 724, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/move-to-vote.png"],
  },
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
