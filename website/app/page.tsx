"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "he" || saved === "en") {
      window.location.replace(`/${saved}`);
      return;
    }

    const browserLang = navigator.language || "";
    const locale = browserLang.startsWith("he") ? "he" : "en";
    window.location.replace(`/${locale}`);
  }, []);

  return (
    <noscript>
      <meta httpEquiv="refresh" content="0;url=/en" />
    </noscript>
  );
}
