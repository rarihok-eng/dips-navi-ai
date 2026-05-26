import type { SearchSource } from "@/lib/types/search";

function normalizeExcerpt(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 100);
}

function sourceIdentity(source: SearchSource): string {
  return source.manualSlug ?? source.sourceUrl ?? source.manualName;
}

export function dedupeSearchSources(sources: SearchSource[]): SearchSource[] {
  const seenPageKeys = new Set<string>();
  const seenExcerpts = new Set<string>();
  const result: SearchSource[] = [];

  for (const source of sources) {
    const pageKey = `${sourceIdentity(source)}:${source.page}`;
    if (seenPageKeys.has(pageKey)) continue;

    const excerptNorm = source.excerpt ? normalizeExcerpt(source.excerpt) : "";
    if (excerptNorm && seenExcerpts.has(excerptNorm)) continue;

    seenPageKeys.add(pageKey);
    if (excerptNorm) seenExcerpts.add(excerptNorm);
    result.push(source);
  }

  return result;
}

export type GroupedSearchSource = {
  manualName: string;
  sourceUrl?: string;
  manualSlug?: string;
  pages: number[];
  excerpt?: string;
};

export function groupSearchSources(sources: SearchSource[]): GroupedSearchSource[] {
  const groups = new Map<string, GroupedSearchSource>();

  for (const source of dedupeSearchSources(sources)) {
    const groupKey = sourceIdentity(source);
    const existing = groups.get(groupKey);

    if (existing) {
      if (!existing.pages.includes(source.page)) {
        existing.pages.push(source.page);
        existing.pages.sort((a, b) => a - b);
      }
      if (
        source.excerpt &&
        (!existing.excerpt || source.excerpt.length > existing.excerpt.length)
      ) {
        existing.excerpt = source.excerpt;
      }
      continue;
    }

    groups.set(groupKey, {
      manualName: source.manualName,
      sourceUrl: source.sourceUrl,
      manualSlug: source.manualSlug,
      pages: [source.page],
      excerpt: source.excerpt,
    });
  }

  return Array.from(groups.values());
}
