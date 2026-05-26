import { buildPdfPageUrl } from "@/lib/search/pdf-link";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

export type SummaryPdfLink = {
  page: number;
  manualName: string;
  sourceUrl: string;
  pdfUrl: string;
};

const materialCitationRegex = () => /[（(]資料(\d+)\s+P\.(\d+)[）)]/g;
const pageOnlyRegex = () => /P\.(\d+)/g;

function linkKey(sourceUrl: string, page: number): string {
  return `${sourceUrl}#${page}`;
}

function resolveMaterialLink(
  materialIndex: number,
  page: number,
  materials: SearchMaterial[] | undefined,
  sources: SearchSource[],
): SummaryPdfLink | null {
  const material = materials?.find((m) => m.index === materialIndex);
  const sourceUrl =
    material?.sourceUrl ?? sources.find((s) => s.page === page)?.sourceUrl;

  if (!sourceUrl) return null;

  return {
    page,
    manualName:
      material?.manualName ??
      sources.find((s) => s.sourceUrl === sourceUrl)?.manualName ??
      "マニュアル",
    sourceUrl,
    pdfUrl: buildPdfPageUrl(sourceUrl, page),
  };
}

function resolvePageLink(
  page: number,
  sources: SearchSource[],
): SummaryPdfLink | null {
  const source =
    sources.find((s) => s.page === page && s.sourceUrl) ??
    sources.find((s) => s.sourceUrl);

  if (!source?.sourceUrl) return null;

  return {
    page,
    manualName: source.manualName,
    sourceUrl: source.sourceUrl,
    pdfUrl: buildPdfPageUrl(source.sourceUrl, page),
  };
}

export function stripSummaryCitations(summary: string): string {
  return summary
    .replace(materialCitationRegex(), "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function resolveSummaryPdfLinks(
  summary: string,
  sources: SearchSource[],
  materials?: SearchMaterial[],
  pageSection?: string,
): SummaryPdfLink[] {
  const links: SummaryPdfLink[] = [];
  const seen = new Set<string>();

  const addLink = (link: SummaryPdfLink | null) => {
    if (!link) return;
    const key = linkKey(link.sourceUrl, link.page);
    if (seen.has(key)) return;
    seen.add(key);
    links.push(link);
  };

  for (const match of summary.matchAll(materialCitationRegex())) {
    addLink(
      resolveMaterialLink(
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        materials,
        sources,
      ),
    );
  }

  if (links.length === 0) {
    for (const match of summary.matchAll(pageOnlyRegex())) {
      addLink(resolvePageLink(Number.parseInt(match[1], 10), sources));
    }
  }

  if (links.length === 0 && pageSection) {
    for (const match of pageSection.matchAll(pageOnlyRegex())) {
      addLink(resolvePageLink(Number.parseInt(match[1], 10), sources));
    }
  }

  if (links.length === 0) {
    for (const source of sources) {
      if (!source.sourceUrl) continue;
      addLink(resolvePageLink(source.page, sources));
      if (links.length >= 5) break;
    }
  }

  return links.sort((a, b) => a.page - b.page);
}
