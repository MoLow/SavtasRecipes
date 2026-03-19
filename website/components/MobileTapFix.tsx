"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * iOS Chrome doesn't synthesize a click event when the touch target is a
 * non-interactive child element (div/img) inside an <a> tag, even with
 * cursor:pointer set. This component intercepts touchend at the document
 * level and drives navigation via the Next.js router directly, bypassing
 * the broken click synthesis.
 */
export default function MobileTapFix() {
  const router = useRouter();

  useEffect(() => {
    let moved = false;
    let didNavigate = false;

    const onTouchStart = () => { moved = false; };
    const onTouchMove = () => { moved = true; };

    const onTouchEnd = (e: TouchEvent) => {
      if (moved) return;
      const link = (e.target as Element).closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      // Skip external links
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
      } catch { return; }

      didNavigate = true;
      setTimeout(() => { didNavigate = false; }, 600);
      router.push(href);
    };

    // Prevent the delayed click from double-navigating on devices that DO fire click
    const onClick = (e: MouseEvent) => {
      if (didNavigate) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    document.addEventListener("touchmove", onTouchMove, { capture: true, passive: true });
    document.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    document.addEventListener("click", onClick, { capture: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("touchmove", onTouchMove, { capture: true });
      document.removeEventListener("touchend", onTouchEnd, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, [router]);

  return null;
}
