import type { ManualSource } from "@/lib/ingest/manifest";
import { resolveManualDisplayName } from "@/lib/ingest/manual-names";
import { downloadPdf, readLocalPdf } from "@/lib/ingest/download";
import { buildEmbeddingText } from "@/lib/ingest/embed-text";
import { extractPdfContent } from "@/lib/ingest/pdf-extract";
import { chunkPages } from "@/lib/ingest/chunk";
import { METADATA_TEXT_MAX } from "@/lib/config/models";
import { DailyQuotaExceededError, embedTexts } from "@/lib/rag/embed";
import { upsertChunks } from "@/lib/rag/pinecone";
import { writePageTitles } from "@/lib/ingest/page-title-store";
import { loadCompletedSlugs, markSlugCompleted } from "@/lib/ingest/progress";

export type IngestProgressEvent =
  | { type: "start"; total: number }
  | { type: "manual_start"; manualName: string; index: number; total: number }
  | {
      type: "manual_done";
      manualName: string;
      chunks: number;
      index: number;
      total: number;
    }
  | { type: "manual_error"; manualName: string; error: string }
  | { type: "complete"; totalChunks: number };

export async function ingestManualSources(
  sources: ManualSource[],
  onProgress?: (event: IngestProgressEvent) => void,
): Promise<{ totalChunks: number; errors: string[] }> {
  onProgress?.({ type: "start", total: sources.length });

  let totalChunks = 0;
  const errors: string[] = [];
  const completedSlugs = await loadCompletedSlugs();

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];

    if (completedSlugs.has(source.manualSlug)) {
      console.log(`[skip] ${source.manualName} (already ingested)`);
      continue;
    }

    onProgress?.({
      type: "manual_start",
      manualName: source.manualName,
      index: index + 1,
      total: sources.length,
    });

    try {
      const displayName = resolveManualDisplayName(
        source.pdfUrl,
        source.manualName,
      );
      const ingestSource: ManualSource = { ...source, manualName: displayName };

      let filePath = await readLocalPdf(source.manualSlug, displayName);
      if (!filePath) {
        filePath = await downloadPdf(source.pdfUrl, source.manualSlug, displayName);
      }

      const { pages, sectionByPage, stats } = await extractPdfContent(filePath);
      await writePageTitles(source.manualSlug, sectionByPage);
      console.log(
        `  extract: ${stats.pagesWithText}/${stats.totalPages} pages, ${stats.totalChars.toLocaleString()} chars` +
          (stats.emptyPages > 0 ? `, ${stats.emptyPages} empty (image-only)` : ""),
      );

      const chunks = chunkPages(pages, sectionByPage);

      if (chunks.length === 0) {
        throw new Error("No text chunks extracted from PDF");
      }

      const batchSize = 8;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const vectors = await embedTexts(
          batch.map((chunk) =>
            buildEmbeddingText(
              ingestSource,
              chunk.page,
              chunk.text,
              chunk.sectionTitle,
            ),
          ),
        );

        await upsertChunks(
          batch.map((chunk, batchIndex) => {
            const pageSectionTitle =
              sectionByPage.get(chunk.page) ?? chunk.sectionTitle;

            return {
              id: `${source.manualSlug}-p${chunk.page}-c${chunk.chunkIndex}`,
              values: vectors[batchIndex],
              metadata: {
                manualName: displayName,
                category: source.category,
                page: chunk.page,
                text: chunk.text.slice(0, METADATA_TEXT_MAX),
                sourceUrl: source.pdfUrl,
                chunkIndex: chunk.chunkIndex,
                manualSlug: source.manualSlug,
                ...(pageSectionTitle
                  ? { sectionTitle: pageSectionTitle.slice(0, 200) }
                  : {}),
              },
            };
          }),
        );

        console.log(
          `  embedded ${Math.min(i + batch.length, chunks.length)}/${chunks.length} chunks`,
        );
      }

      totalChunks += chunks.length;
      await markSlugCompleted(source.manualSlug);
      onProgress?.({
        type: "manual_done",
        manualName: displayName,
        chunks: chunks.length,
        index: index + 1,
        total: sources.length,
      });
    } catch (error) {
      if (error instanceof DailyQuotaExceededError) {
        errors.push(error.message);
        onProgress?.({
          type: "manual_error",
          manualName: source.manualName,
          error: error.message,
        });
        break;
      }

      const message =
        error instanceof Error ? error.message : "Unknown ingest error";
      errors.push(`${source.manualName}: ${message}`);
      onProgress?.({
        type: "manual_error",
        manualName: source.manualName,
        error: message,
      });
    }
  }

  onProgress?.({ type: "complete", totalChunks });
  return { totalChunks, errors };
}
