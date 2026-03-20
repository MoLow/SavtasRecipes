"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { optimizedImage } from "@/lib/image-utils";

interface ScanViewerProps {
  scanFiles: string[];
  recipeName: string;
}

const rotations = [-1.5, 1, -0.5, 1.5];

export default function ScanViewer({ scanFiles, recipeName }: ScanViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex: openIndex ?? 0 });

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpenIndex(null), []);

  // Sync embla index → currentIndex for dots
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Jump to the tapped thumbnail when lightbox opens
  useEffect(() => {
    if (emblaApi && openIndex !== null) {
      emblaApi.scrollTo(openIndex, true);
      setCurrentIndex(openIndex);
    }
  }, [emblaApi, openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
      if (e.key === "ArrowRight") emblaApi?.scrollNext();
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", handleKey); };
  }, [openIndex, close, emblaApi]);

  const lightbox = openIndex !== null && mounted ? createPortal(
    <div
      className="fixed inset-0 animate-fade-in"
      style={{ backgroundColor: "var(--color-scan-bg)", zIndex: 99999 }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/40 to-transparent">
        <h3 className="text-sm text-white/80">
          {recipeName}
          {scanFiles.length > 1 && ` \u2014 ${currentIndex + 1} / ${scanFiles.length}`}
        </h3>
        <div className="flex items-center gap-2">
          {scanFiles.length > 1 && (
            <>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors text-white"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={currentIndex === scanFiles.length - 1}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors text-white"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={close}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white ml-2"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Embla carousel */}
      <div
        className="absolute inset-0 pt-14 pb-10"
        onClick={close}
      >
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {scanFiles.map((scanFile, i) => (
              <div
                key={scanFile}
                className="flex-none w-full h-full flex items-center justify-center px-4 overflow-hidden"
              >
                <div onClick={(e) => e.stopPropagation()} style={{ display: "contents" }}>
                  <Image
                    src={`/${optimizedImage(scanFile, 1200)}`}
                    alt={`Scan of ${recipeName} page ${i + 1}`}
                    width={800}
                    height={1100}
                    className="rounded-lg w-auto"
                    style={{ maxHeight: "100%", maxWidth: "100%", height: "auto" }}
                    priority={i === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      {scanFiles.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {scanFiles.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300" style={{
              width: i === currentIndex ? 18 : 6, height: 6,
              backgroundColor: i === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
            }} />
          ))}
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div className="flex gap-4 flex-wrap justify-center">
        {scanFiles.map((scanFile, i) => (
          <button
            key={scanFile}
            onClick={() => setOpenIndex(i)}
            className="relative group cursor-pointer transition-transform duration-300 hover:scale-105"
            style={{
              transform: `rotate(${rotations[i % rotations.length]}deg)`,
              filter: "drop-shadow(0 4px 12px rgba(44, 24, 16, 0.15))",
            }}
          >
            <div className="bg-white p-2 pb-3 rounded-sm">
              <div className="relative w-28 h-36 sm:w-32 sm:h-40 overflow-hidden">
                <Image
                  src={`/${optimizedImage(scanFile, 400)}`}
                  alt={`Scan page ${i + 1} of ${recipeName}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              {scanFiles.length > 1 && (
                <p className="text-center text-[10px] text-[var(--color-ink-tertiary)] mt-1.5">
                  {i + 1} / {scanFiles.length}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
      {lightbox}
    </>
  );
}
