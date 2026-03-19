"use client";

import { useState } from "react";
import Image from "next/image";

interface ScanViewerProps {
  scanFiles: string[];
  recipeName: string;
}

const rotations = [-1.5, 1, -0.5, 1.5];

export default function ScanViewer({ scanFiles, recipeName }: ScanViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {/* Photo-styled thumbnails */}
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
            {/* White photo border */}
            <div className="bg-white p-2 pb-3 rounded-sm">
              <div className="relative w-28 h-36 sm:w-32 sm:h-40 overflow-hidden">
                <Image
                  src={`/${scanFile}`}
                  alt={`Scan page ${i + 1} of ${recipeName}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              {scanFiles.length > 1 && (
                <p className="text-center text-[10px] font-mono text-[var(--color-ink-tertiary)] mt-1.5">
                  {i + 1} / {scanFiles.length}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Dark warm lightbox */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ backgroundColor: "var(--color-scan-overlay)" }}
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] rounded-xl overflow-hidden"
            style={{ boxShadow: "0 24px 48px rgba(0, 0, 0, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-scan-bg)] border-b border-white/10">
              <h3 className="text-sm font-mono text-white/70">
                {recipeName}
                {scanFiles.length > 1 && ` \u2014 ${openIndex + 1} / ${scanFiles.length}`}
              </h3>
              <div className="flex items-center gap-1">
                {scanFiles.length > 1 && (
                  <>
                    <button
                      onClick={() => setOpenIndex(Math.max(0, openIndex - 1))}
                      disabled={openIndex === 0}
                      className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors text-white/70"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setOpenIndex(Math.min(scanFiles.length - 1, openIndex + 1))}
                      disabled={openIndex === scanFiles.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors text-white/70"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOpenIndex(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 ms-2"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scan image */}
            <div className="overflow-auto max-h-[calc(90vh-3.5rem)] bg-[var(--color-scan-bg)]">
              <Image
                src={`/${scanFiles[openIndex]}`}
                alt={`Scan of ${recipeName}`}
                width={800}
                height={1100}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
