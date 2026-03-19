import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savta's Recipes",
  description:
    "A collection of grandmother's handwritten recipes, digitized and translated",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
