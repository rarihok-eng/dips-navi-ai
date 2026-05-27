import { readPageTitle } from "@/lib/ingest/page-title-store";
import { buildCitedPdfReferences } from "@/lib/search/build-cited-pdf-references";
import { pageTitleCacheKey } from "@/lib/search/page-title-cache-key";
import {
  extractMaterialsFromChunks,
  extractSourcesFromChunks,
} from "@/lib/rag/prompt";
import type { RetrievedChunk } from "@/lib/rag/pinecone";
import { resolveSectionTitle } from "@/lib/search/infer-section-title";
import { parseAnswer, extractLegacyHintSummary } from "@/lib/search/parse-answer";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

export async function buildPageTitleCacheFromChunks(
  chunks: RetrievedChunk[],
): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const key = pageTitleCacheKey(chunk.sourceUrl, chunk.page);
    if (seen.has(key)) continue;
    seen.add(key);

    const stored = await readPageTitle(chunk.manualSlug, chunk.page);
    if (stored) cache.set(key, stored);
  }

  return cache;
}

function buildCitationText(answer: string): string {
  const parsed = parseAnswer(answer);
  if (parsed.summary) {
    return [parsed.summary, parsed.hint].filter(Boolean).join("\n");
  }

  const legacy = extractLegacyHintSummary(parsed.hint);
  return [legacy.summary, legacy.hintBody].filter(Boolean).join("\n");
}

function resolveManualSlug(
  sourceUrl: string,
  sources: SearchSource[],
  chunks: RetrievedChunk[],
): string | undefined {
  return (
    sources.find((source) => source.sourceUrl === sourceUrl)?.manualSlug ??
    chunks.find((chunk) => chunk.sourceUrl === sourceUrl)?.manualSlug
  );
}

export async function resolveCitedPageTitleIndex(
  answer: string,
  chunks: RetrievedChunk[],
  materials: SearchMaterial[],
  sources: SearchSource[],
  pageTitleCache?: Map<string, string>,
): Promise<Record<string, string>> {
  const index: Record<string, string> = {};

  if (pageTitleCache) {
    for (const [key, title] of pageTitleCache) {
      index[key] = title;
    }
  }

  for (const chunk of chunks) {
    const key = pageTitleCacheKey(chunk.sourceUrl, chunk.page);
    if (index[key]) continue;

    const title = resolveSectionTitle(chunk.sectionTitle, chunk.text);
    if (title) index[key] = title;
  }

  const citationText = buildCitationText(answer);
  if (!citationText.trim()) return index;

  const references = buildCitedPdfReferences(
    citationText,
    materials,
    sources,
    index,
  );

  for (const reference of references) {
    const key = pageTitleCacheKey(reference.sourceUrl, reference.page);
    if (reference.sectionTitle) {
      index[key] = reference.sectionTitle;
      continue;
    }
    if (index[key]) continue;

    const slug = resolveManualSlug(reference.sourceUrl, sources, chunks);
    if (slug) {
      const stored = await readPageTitle(slug, reference.page);
      if (stored) index[key] = stored;
    }
  }

  return index;
}

export async function enrichSearchResults(
  chunks: RetrievedChunk[],
): Promise<{
  sources: SearchSource[];
  materials: SearchMaterial[];
  pageTitleCache: Map<string, string>;
}> {
  const pageTitleCache = await buildPageTitleCacheFromChunks(chunks);
  const sources = extractSourcesFromChunks(chunks, pageTitleCache);
  const materials = extractMaterialsFromChunks(chunks, pageTitleCache);

  return { sources, materials, pageTitleCache };
}
