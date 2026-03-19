import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold text-[var(--color-warm-brown)] mb-4">
          Savta&apos;s Recipes
        </h1>
        <p className="text-lg text-[var(--color-warm-tan)] mb-2">
          A collection of grandmother&apos;s handwritten recipes,
        </p>
        <p className="text-lg text-[var(--color-warm-tan)] mb-10">
          digitized and translated with love.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/en"
            className="px-8 py-3 rounded-xl bg-[var(--color-warm-brown)] text-white font-medium hover:bg-[var(--color-warm-red)] transition-colors shadow-md"
          >
            English
          </Link>
          <Link
            href="/he"
            className="px-8 py-3 rounded-xl bg-[var(--color-warm-brown)] text-white font-medium hover:bg-[var(--color-warm-red)] transition-colors shadow-md"
            dir="rtl"
          >
            עברית
          </Link>
        </div>
      </div>
    </div>
  );
}
