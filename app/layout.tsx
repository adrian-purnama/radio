import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalAudioHost } from "@/components/player/GlobalAudioHost";
import { PersistentPlayerBar } from "@/components/player/PersistentPlayerBar";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "2AM Signal",
    template: "%s | 2AM Signal",
  },
  description:
    "2AM Signal is a calm late-night radio web app with curated albums, playlists, ambient audio, and direct music platform links.",
  keywords: [
    "2AM Signal",
    "radio",
    "lofi radio",
    "music streaming",
    "playlist loop",
    "ambient music",
    "late night radio",
  ],
  category: "music",
  applicationName: "2AM Signal",
  creator: "2AM Signal",
  publisher: "2AM Signal",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "2AM Signal",
    description:
      "Calm late-night radio with curated albums, playlists, and direct links to your favorite platforms.",
    siteName: "2AM Signal",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "2AM Signal logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2AM Signal",
    description:
      "Calm late-night radio with curated albums, playlists, and direct platform links.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "2AM Signal",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.png", type: "image/png", sizes: "192x192" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/logo.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <GlobalAudioHost />
        {children}
        <PersistentPlayerBar />
      </body>
    </html>
  );
}
