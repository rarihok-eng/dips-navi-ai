import { buildPdfPageUrl } from "@/lib/search/pdf-link";
import { inferSectionTitleFromPageText } from "@/lib/search/infer-section-title";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

export type MaterialLegendItem = {
  index: number;
  materialIndices: number[];
  manualName: string;
  shortName: string;
  page: number;
  sectionTitle?: string;
  displayTitle: string;
  displaySubtitle?: string;
  sourceUrl?: string;
  pdfUrl?: string;
};

function materialLegendKey(item: {
  sourceUrl?: string;
  manualName: string;
  page: number;
}): string {
  return `${item.sourceUrl ?? item.manualName}#${item.page}`;
}

export type PdfPageLabel = {
  primary: string;
  secondary?: string;
};

export function findSectionTitleForPage(
  page: number,
  sourceUrl: string | undefined,
  sources: Array<{
    page: number;
    sourceUrl?: string;
    sectionTitle?: string;
    excerpt?: string;
  }>,
): string | undefined {
  const matches = sourceUrl
    ? sources.filter(
        (source) => source.sourceUrl === sourceUrl && source.page === page,
      )
    : sources.filter((source) => source.page === page);

  for (const source of matches) {
    const title = source.sectionTitle?.trim();
    if (title) return title;
  }

  for (const source of matches) {
    const inferred = inferSectionTitleFromPageText(source.excerpt ?? "");
    if (inferred) return inferred;
  }

  return undefined;
}

export function formatPdfPageLabel(options: {
  sectionTitle?: string;
  manualName?: string;
  page: number;
  maxLength?: number;
}): PdfPageLabel {
  const { sectionTitle, manualName, page, maxLength = 52 } = options;
  const trimmedSection = sectionTitle?.trim();

  if (trimmedSection) {
    const primary =
      trimmedSection.length > maxLength
        ? `${trimmedSection.slice(0, maxLength - 1)}…`
        : trimmedSection;
    return {
      primary,
      secondary: manualName ? shortenManualName(manualName, 34) : undefined,
    };
  }

  return {
    primary: `P.${page} — （章名未取得）`,
    secondary: manualName ? shortenManualName(manualName, 34) : undefined,
  };
}

const SINGLE_MATERIAL_CITATION = /資料(\d+)\s+P\.(\d+)/g;
const HAS_MATERIAL_CITATION = /資料\d+\s+P\.\d+/;

export function shortenManualName(name: string, maxLength = 28): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function getMaterialByIndex(
  materials: SearchMaterial[] | undefined,
  index: number,
): SearchMaterial | undefined {
  return materials?.find((material) => material.index === index);
}

export function formatMaterialCitationLabel(
  materialIndex: number,
  page: number,
  materials?: SearchMaterial[],
  sources?: SearchSource[],
): string {
  const material = getMaterialByIndex(materials, materialIndex);
  const sourceUrl = material?.sourceUrl;
  const sectionTitle = findSectionTitleForPage(page, sourceUrl, [
    ...(material ? [material] : []),
    ...(sources ?? []),
  ]);

  if (sectionTitle) {
    return `『${shortenManualName(sectionTitle, 24)}』P.${page}`;
  }

  const name = material
    ? shortenManualName(material.manualName)
    : `PDF${materialIndex}`;
  return `『${name}』P.${page}`;
}

/** Replace internal 資料N citations with readable PDF manual names. */
export function humanizeMaterialCitations(
  text: string,
  materials?: SearchMaterial[],
  sources?: SearchSource[],
): string {
  if (!materials?.length) return text;

  let result = text.replace(/`[（(][^`）)]*[）)]`/g, (wrapped) =>
    wrapped.slice(1, -1),
  );

  result = result.replace(/[（(]([^）)]+)[）)]/g, (full, inner: string) => {
    if (!HAS_MATERIAL_CITATION.test(inner)) {
      return full;
    }

    const parts = inner.split(/[,、]/).map((part) => part.trim());
    const replaced = parts.map((part) => {
      const match = part.match(/資料(\d+)\s+P\.(\d+)/);
      if (!match) return part;
      return formatMaterialCitationLabel(
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        materials,
        sources,
      );
    });

    return `（${replaced.join("、")}）`;
  });

  return result;
}

export function buildMaterialLegend(
  materials?: SearchMaterial[],
  sources?: SearchSource[],
): MaterialLegendItem[] {
  if (!materials?.length) return [];

  const sourceList = sources ?? [];
  const deduped = new Map<string, MaterialLegendItem>();

  for (const material of materials) {
    const sectionTitle =
      material.sectionTitle?.trim() ||
      findSectionTitleForPage(material.page, material.sourceUrl, sourceList);

    const label = formatPdfPageLabel({
      sectionTitle,
      manualName: material.manualName,
      page: material.page,
    });

    const key = materialLegendKey(material);
    const existing = deduped.get(key);

    if (existing) {
      existing.materialIndices.push(material.index);
      if (!existing.sectionTitle && sectionTitle) {
        existing.sectionTitle = sectionTitle;
        existing.displayTitle = label.primary;
        existing.displaySubtitle = label.secondary;
      }
      continue;
    }

    deduped.set(key, {
      index: material.index,
      materialIndices: [material.index],
      manualName: material.manualName,
      shortName: shortenManualName(material.manualName, 36),
      page: material.page,
      sectionTitle,
      displayTitle: label.primary,
      displaySubtitle: label.secondary,
      sourceUrl: material.sourceUrl,
      pdfUrl: material.sourceUrl
        ? buildPdfPageUrl(material.sourceUrl, material.page)
        : undefined,
    });
  }

  return Array.from(deduped.values()).sort(
    (a, b) => Math.min(...a.materialIndices) - Math.min(...b.materialIndices),
  );
}

export function formatMaterialIndices(indices: number[]): string {
  return indices.map((index) => `資料${index}`).join("・");
}

export function parseMaterialCitationMatches(text: string): Array<{
  materialIndex: number;
  page: number;
}> {
  const matches: Array<{ materialIndex: number; page: number }> = [];

  for (const match of text.matchAll(SINGLE_MATERIAL_CITATION)) {
    matches.push({
      materialIndex: Number.parseInt(match[1], 10),
      page: Number.parseInt(match[2], 10),
    });
  }

  return matches;
}
