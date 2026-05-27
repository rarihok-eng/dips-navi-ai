import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";
import { MANUAL_SOURCES, type ManualSource } from "../lib/ingest/manifest";
import { resolveManualDisplayName } from "../lib/ingest/manual-names";
import { downloadPdf, readLocalPdf } from "../lib/ingest/download";
import { extractPdfContent } from "../lib/ingest/pdf-extract";
import { writePageTitles } from "../lib/ingest/page-title-store";

config({ path: ".env.local" });
config();

async function loadSources(): Promise<ManualSource[]> {
  const generatedPath = path.resolve(process.cwd(), "manifest.generated.json");
  try {
    const raw = await fs.readFile(generatedPath, "utf-8");
    const parsed = JSON.parse(raw) as ManualSource[];
    if (parsed.length > 0) {
      console.log(`Loaded ${parsed.length} manuals from manifest.generated.json`);
      return parsed.map((source) => ({
        ...source,
        manualName: resolveManualDisplayName(source.pdfUrl, source.manualName),
      }));
    }
  } catch {
    // fallback
  }

  console.log(`Using static manifest (${MANUAL_SOURCES.length} manuals)`);
  return MANUAL_SOURCES;
}

async function main() {
  const sources = await loadSources();
  let written = 0;
  const errors: string[] = [];

  for (const [index, source] of sources.entries()) {
    const displayName = resolveManualDisplayName(source.pdfUrl, source.manualName);
    console.log(`[${index + 1}/${sources.length}] ${displayName}`);

    try {
      let filePath = await readLocalPdf(source.manualSlug, displayName);
      if (!filePath) {
        filePath = await downloadPdf(source.pdfUrl, source.manualSlug, displayName);
      }

      const { sectionByPage, stats } = await extractPdfContent(filePath);
      await writePageTitles(source.manualSlug, sectionByPage);
      written += 1;

      const titledPages = [...sectionByPage.values()].filter(Boolean).length;
      console.log(
        `  ✓ ${titledPages} titled pages (${stats.pagesWithText}/${stats.totalPages} with text)`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`${displayName}: ${message}`);
      console.error(`  ✗ ${message}`);
    }
  }

  console.log(`\nWrote page titles for ${written}/${sources.length} manuals.`);

  if (errors.length > 0) {
    console.error("\nErrors:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
