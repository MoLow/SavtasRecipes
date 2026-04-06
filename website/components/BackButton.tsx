"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ locale }: { locale: string }) {
  const router = useRouter();
  const isHebrew = locale === "he";

  return (
    <div className="max-w-5xl mx-auto border-t border-[var(--color-border)] mt-2">
      <div className="py-8 flex justify-center">
        <button
          onClick={() => router.back()}
          className="group text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors duration-200 inline-flex items-center gap-2 py-2 px-4 cursor-pointer"
        >
          <span
            className="transition-transform duration-200 group-hover:ltr:-translate-x-1 group-hover:rtl:translate-x-1"
            aria-hidden="true"
          >
            {isHebrew ? "\u2192" : "\u2190"}
          </span>
          {isHebrew ? "חזרה למתכונים" : "Back to recipes"}
        </button>
      </div>
    </div>
  );
}
