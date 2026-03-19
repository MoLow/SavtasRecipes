import type { Metadata } from "next";
import { Heebo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import MobileTapFix from "@/components/MobileTapFix";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-hebrew",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://recipes.atlow.co.il"),
  title: {
    default: "Savta's Recipes",
    template: "%s | Savta's Recipes",
  },
  description: "Grandmother's handwritten recipes, digitized and translated",
  openGraph: {
    siteName: "Savta's Recipes",
    type: "website",
    images: [{ url: "/savta.jpg", width: 400, height: 400, alt: "Savta" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Savta's Recipes",
    "apple-mobile-web-app-status-bar-style": "default",
    "theme-color": "#FAF7F2",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${heebo.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased">
        <MobileTapFix />
        {children}
      </body>
    </html>
  );
}
