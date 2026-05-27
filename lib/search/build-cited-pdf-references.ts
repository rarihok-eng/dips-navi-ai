import { buildPdfPageUrl } from "@/lib/search/pdf-link";
import { pageTitleCacheKey } from "@/lib/search/page-title-cache-key";
import {
  findSectionTitleForPage,
  formatPdfPageLabel,
  getMaterialByIndex,
  parseMaterialCitationMatches,
} from "@/lib/search/material-labels";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

export type CitedPdfReference = {
  materialIndices: number[];
  page: number;
  manualName: string;
  sectionTitle?: string;
  displayTitle: string;
  displaySubtitle?: string;
  sourceUrl: string;
  pdfUrl: string;
};

const citationGroupRegex = () =>
  /[（(][^）)]*資料\d+\s+P\.\d+[^）)]*[）)]/g;

function citationKey(sourceUrl: string, page: number): string {
  return `${sourceUrl}#${page}`;
}

function extractAllCitations(text: string): Array<{
  materialIndex: number;
  page: number;
}> {
  const citations: Array<{ materialIndex: number; page: number }> = [];

  for (const group of text.matchAll(citationGroupRegex())) {
    citations.push(...parseMaterialCitationMatches(group[0]));
  }

  if (citations.length === 0) {
    citations.push(...parseMaterialCitationMatches(text));
  }

  return citations;
}

function resolveCitationLink(
  materialIndex: number,
  page: number,
  materials: SearchMaterial[] | undefined,
  sources: SearchSource[],
): {
  sourceUrl: string;
  manualName: string;
} | null {
  const material = getMaterialByIndex(materials, materialIndex);
  const sourceUrl =
    material?.sourceUrl ??
    sources.find((source) => source.page === page && source.sourceUrl)
      ?.sourceUrl;

  if (!sourceUrl) return null;

  const manualName =
    material?.manualName ??
    sources.find((source) => source.sourceUrl === sourceUrl)?.manualName ??
    "マニュアル";

  return { sourceUrl, manualName };
}

export function buildCitedPdfReferences(
  citationText: string,
  materials?: SearchMaterial[],
  sources?: SearchSource[],
  pageTitleIndex?: Record<string, string>,
): CitedPdfReference[] {
  if (!citationText.trim()) return [];

  const sourceList = sources ?? [];
  const grouped = new Map<
    string,
    CitedPdfReference & { materialIndexSet: Set<number> }
  >();

  for (const citation of extractAllCitations(citationText)) {
    const resolved = resolveCitationLink(
      citation.materialIndex,
      citation.page,
      materials,
      sourceList,
    );
    if (!resolved) continue;

    const key = citationKey(resolved.sourceUrl, citation.page);
    const cacheKey = pageTitleCacheKey(resolved.sourceUrl, citation.page);
    const sectionTitle =
      pageTitleIndex?.[cacheKey] ||
      findSectionTitleForPage(citation.page, resolved.sourceUrl, [
        ...(getMaterialByIndex(materials, citation.materialIndex)
          ? [getMaterialByIndex(materials, citation.materialIndex)!]
          : []),
        ...sourceList,
      ]) ||
      undefined;

    const label = formatPdfPageLabel({
      sectionTitle,
      manualName: resolved.manualName,
      page: citation.page,
    });

    const existing = grouped.get(key);
    if (existing) {
      existing.materialIndexSet.add(citation.materialIndex);
      if (!existing.sectionTitle && sectionTitle) {
        existing.sectionTitle = sectionTitle;
        existing.displayTitle = label.primary;
        existing.displaySubtitle = label.secondary;
      }
      continue;
    }

    grouped.set(key, {
      materialIndices: [],
      materialIndexSet: new Set([citation.materialIndex]),
      page: citation.page,
      manualName: resolved.manualName,
      sectionTitle,
      displayTitle: label.primary,
      displaySubtitle: label.secondary,
      sourceUrl: resolved.sourceUrl,
      pdfUrl: buildPdfPageUrl(resolved.sourceUrl, citation.page),
    });
  }

  return Array.from(grouped.values())
    .map(({ materialIndexSet, ...reference }) => ({
      ...reference,
      materialIndices: Array.from(materialIndexSet).sort((a, b) => a - b),
    }))
    .sort(
      (a, b) =>
        Math.min(...a.materialIndices) - Math.min(...b.materialIndices),
    );
}
