import Navbar from "@/components/Navbar";
import WebMCPProvider from "@/components/WebMCPProvider";
import { type Locale } from "@/lib/recipes";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "he" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const isHebrew = locale === "he";

  return (
    <div dir={isHebrew ? "rtl" : "ltr"} lang={locale}>
      <Navbar locale={locale} />
      <WebMCPProvider locale={locale} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
