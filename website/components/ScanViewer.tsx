"use client";

import { useState } from "react";
import Image from "next/image";

interface ScanViewerProps {
  scanFile: string;
  recipeName: string;
}

export default function ScanViewer({ scanFile, recipeName }: ScanViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white shadow-sm text-sm text-[var(--color-warm-brown)] transition-colors"
      >
        View original scan
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
                {recipeName} — Original Scan
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-warm-tan)] hover:text-[var(--color-warm-brown)] text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-4rem)]">
              <Image
                src={`/${scanFile}`}
                alt={`Original scan of ${recipeName}`}
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
