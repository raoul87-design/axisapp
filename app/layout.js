import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "../lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "stayd. — Accountability app voor personal trainers",
  description: "stayd. helpt personal trainers hun klanten dagelijks accountable houden via WhatsApp en AI. Automatische check-ins, metrics tracking en coaching tussen sessies door.",
  keywords: ["accountability app personal trainer", "client opvolging personal trainer", "WhatsApp check-in coach", "fitness accountability app", "personal trainer software Nederland"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "stayd.",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "stayd. — Accountability app voor personal trainers",
    description: "Dagelijkse accountability voor jouw klanten via WhatsApp en AI. Geen extra app nodig.",
    url: SITE_URL,
    siteName: "stayd.",
    locale: "nl_NL",
    type: "website",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
