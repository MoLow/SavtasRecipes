import type { Locale } from "@/lib/recipes";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const isHebrew = locale === "he";

  return (
    <article className="animate-fade-up max-w-3xl mx-auto py-4">
      <h1 className="font-semibold text-3xl text-[var(--color-ink)] mb-2">
        {isHebrew ? "איך זה עובד" : "How It Works"}
      </h1>
      <p className="text-sm text-[var(--color-ink-tertiary)] mb-8">
        {isHebrew
          ? "הפרטים הטכניים מאחורי הקלעים"
          : "The technical details behind the scenes"}
      </p>

      {/* Vibe Coded */}
      <Section
        title={isHebrew ? "100% Vibe Coded" : "100% Vibe Coded"}
        accent
      >
        <P locale={locale}>
          {{
            en: "This entire project — the processing pipeline, the website, the infrastructure, even this page — was built through conversation with Claude Code (Anthropic's AI coding agent). No code was written by hand. Every file, every component, every deployment script was generated through natural language prompts and iterative dialogue.",
            he: "כל הפרויקט הזה — צינור העיבוד, האתר, התשתית, אפילו העמוד הזה — נבנה דרך שיחה עם Claude Code (סוכן הקוד של Anthropic). אף שורת קוד לא נכתבה ידנית. כל קובץ, כל רכיב, כל סקריפט נוצר באמצעות הנחיות בשפה טבעית ודיאלוג איטרטיבי.",
          }}
        </P>
      </Section>

      {/* The Pipeline */}
      <Section title={isHebrew ? "צינור העיבוד" : "The Pipeline"}>
        <P locale={locale}>
          {{
            en: "Grandmother's handwritten recipe cards are scanned as photos. The pipeline processes each scan through multiple AI models in parallel:",
            he: "כרטיסי המתכונים בכתב ידה של סבתא נסרקים כתמונות. הצינור מעבד כל סריקה דרך מספר מודלים של AI במקביל:",
          }}
        </P>
        <Steps locale={locale} steps={[
          {
            en: "Dual OCR — Both Gemini 2.5 Flash and Claude Opus 4 read the handwriting independently, extracting the recipe text and translating it to Hebrew",
            he: "OCR כפול — גם Gemini 2.5 Flash וגם Claude Opus 4 קוראים את כתב היד באופן עצמאי, מחלצים את טקסט המתכון ומתרגמים אותו לעברית",
          },
          {
            en: "Ranking — Claude compares both results and picks the more accurate transcription",
            he: "דירוג — Claude משווה את שתי התוצאות ובוחר את התמלול המדויק יותר",
          },
          {
            en: "Orientation — Gemini analyzes each scan photo and detects the correct rotation so pages display upright",
            he: "כיוון — Gemini מנתח כל תמונת סריקה ומזהה את הסיבוב הנכון כדי שהדפים יוצגו ישר",
          },
          {
            en: "Illustration — Gemini generates a watercolor-style food illustration for each recipe",
            he: "איור — Gemini מייצר איור אוכל בסגנון צבעי מים לכל מתכון",
          },
          {
            en: "Output — Structured bilingual JSON with ingredients, instructions, tags, and metadata",
            he: "פלט — JSON דו-לשוני מובנה עם מרכיבים, הוראות, תגיות ומטא-דאטה",
          },
        ]} />
      </Section>

      {/* The Website */}
      <Section title={isHebrew ? "האתר" : "The Website"}>
        <P locale={locale}>
          {{
            en: "A static Next.js site built at deploy time from the recipe JSON files. No server, no database — just HTML, CSS, and JavaScript served from CloudFront's global CDN.",
            he: "אתר Next.js סטטי שנבנה בזמן הפריסה מקובצי ה-JSON של המתכונים. בלי שרת, בלי מסד נתונים — רק HTML, CSS ו-JavaScript שמוגשים מ-CDN הגלובלי של CloudFront.",
          }}
        </P>
        <TechList items={[
          { label: "Next.js", desc: isHebrew ? "ייצוא סטטי עם App Router" : "Static export with App Router" },
          { label: "Tailwind CSS", desc: isHebrew ? "עיצוב עם תמיכה ב-RTL" : "Styling with RTL support" },
          { label: "Fuse.js", desc: isHebrew ? "חיפוש דו-לשוני בצד הלקוח" : "Client-side bilingual search" },
          { label: "S3 + CloudFront", desc: isHebrew ? "אירוח ו-CDN" : "Hosting & CDN" },
          { label: "GitHub Actions", desc: isHebrew ? "פריסה אוטומטית" : "Automated deployment" },
        ]} />
      </Section>

      {/* The Stack */}
      <Section title={isHebrew ? "ארכיטקטורה" : "Architecture"}>
        <div
          className="rounded-xl p-5 sm:p-6 text-sm leading-relaxed overflow-x-auto"
          style={{ backgroundColor: "var(--color-bg-recessed)" }}
        >
          <pre className="text-[var(--color-ink-secondary)] whitespace-pre">
{`scans/*.heic
  │
  ▼
┌─────────────────────────────┐
│  Pipeline (TypeScript)      │
│                             │
│  Gemini OCR ──┐             │
│               ├── Ranker    │
│  Claude OCR ──┘     │       │
│                     ▼       │
│              Best result    │
│                     │       │
│  Orient scans ◄─────┤       │
│  Illustrate   ◄─────┘       │
└──────────────┬──────────────┘
               │
               ▼
     data/recipes/*.json
     data/scans/*.jpg
               │
               ▼
┌─────────────────────────────┐
│  Website (Next.js)          │
│  Static build → S3 + CDN   │
└─────────────────────────────┘`}
          </pre>
        </div>
      </Section>

      {/* Open Source */}
      <Section title={isHebrew ? "קוד פתוח" : "Open Source"}>
        <P locale={locale}>
          {{
            en: "The full source code — pipeline, website, infrastructure, and every conversation log from the vibe coding sessions — is available on GitHub.",
            he: "קוד המקור המלא — צינור העיבוד, האתר, התשתית, וכל יומני השיחות מהסשנים — זמין ב-GitHub.",
          }}
        </P>
        <a
          href="https://github.com/MoLow/SavtasRecipes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 text-sm text-[var(--color-accent)] hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          MoLow/SavtasRecipes
        </a>
      </Section>

      {/* Credits */}
      <Section title={isHebrew ? "תודות" : "Credits"} last>
        <P locale={locale}>
          {{
            en: "Recipe scans provided by Neal Atlow and Stuart Atlow. Built with Claude Code by Moshe Atlow.",
            he: "סריקות המתכונים סופקו על ידי ניל אטלו ושבתי אטלו. נבנה עם Claude Code על ידי משה אטלו.",
          }}
        </P>
      </Section>
    </article>
  );
}

/* ── Helper components ── */

function Section({
  title,
  children,
  accent,
  last,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <section className={last ? "mb-0" : "mb-10"}>
      <div className="flex items-center gap-3 mb-4">
        {accent && (
          <span className="text-[var(--color-accent)] text-xs">{"◆"}</span>
        )}
        <h2 className="font-semibold text-xl text-[var(--color-ink)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function P({
  locale,
  children,
}: {
  locale: Locale;
  children: { en: string; he: string };
}) {
  return (
    <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
      {children[locale]}
    </p>
  );
}

function Steps({
  locale,
  steps,
}: {
  locale: Locale;
  steps: Array<{ en: string; he: string }>;
}) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 font-semibold text-lg text-[var(--color-accent)] leading-none mt-0.5 w-6 text-end">
            {i + 1}
          </span>
          <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
            {step[locale]}
          </p>
        </li>
      ))}
    </ol>
  );
}

function TechList({ items }: { items: Array<{ label: string; desc: string }> }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-baseline gap-2 text-sm"
        >
          <span className="font-semibold text-[var(--color-ink)]">
            {item.label}
          </span>
          <span className="text-[var(--color-ink-tertiary)]">—</span>
          <span className="text-[var(--color-ink-secondary)]">
            {item.desc}
          </span>
        </li>
      ))}
    </ul>
  );
}
