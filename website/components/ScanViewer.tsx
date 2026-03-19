"use client";

import { useState } from "react";
import Image from "next/image";

interface ScanViewerProps {
  scanFiles: string[];
  recipeName: string;
}

export default function ScanViewer({ scanFiles, recipeName }: ScanViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white shadow-sm text-sm text-[var(--color-warm-brown)] transition-colors"
      >
        View original scan{scanFiles.length > 1 ? `s (${scanFiles.length} pages)` : ""}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-[var(--color-warm-brown)]">
                {recipeName} — Original Scan{scanFiles.length > 1 ? "s" : ""}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-warm-tan)] hover:text-[var(--color-warm-brown)] text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-4rem)]">
              {scanFiles.map((scanFile, i) => (
                <div key={scanFile} className={i > 0 ? "border-t border-gray-200" : ""}>
                  {scanFiles.length > 1 && (
                    <p className="text-xs text-center text-[var(--color-warm-tan)] py-1">
                      Page {i + 1} of {scanFiles.length}
                    </p>
                  )}
                  <Image
                    src={`/${scanFile}`}
                    alt={`Original scan of ${recipeName}${scanFiles.length > 1 ? ` (page ${i + 1})` : ""}`}
                    width={800}
                    height={1100}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
