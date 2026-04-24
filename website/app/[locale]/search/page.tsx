import { Suspense } from "react";
import { type Locale } from "@/lib/recipes";
import SearchResults from "@/components/SearchResults";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;

  return (
    <Suspense>
      <SearchResults locale={locale} />
    </Suspense>
  );
}
