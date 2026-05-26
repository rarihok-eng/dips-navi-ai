import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";
import { MANUAL_SOURCES, type ManualSource } from "../lib/ingest/manifest";
import { resolveManualDisplayName } from "../lib/ingest/manual-names";
import {
  cleanupLegacyDuplicatePdfs,
  cleanupTmpDir,
  renameLocalPdf,
  DATA_DIR,
} from "../lib/ingest/download";
import { getLocalPdfFilename } from "../lib/ingest/pdf-filename";

config({ path: ".env.local" });
config();

async function loadSources(): Promise<ManualSource[]> {
  const generatedPath = path.resolve(process.cwd(), "manifest.generated.json");
  try {
    const raw = await fs.readFile(generatedPath, "utf-8");
    const parsed = JSON.parse(raw) as ManualSource[];
    if (parsed.length > 0) {
      return parsed.map((source) => ({
        ...source,
        manualName: resolveManualDisplayName(source.pdfUrl, source.manualName),
      }));
    }
  } catch {
    // fallback
  }

  return MANUAL_SOURCES;
}

async function main() {
  const renameOnly = process.argv.includes("--rename-only");
  const cleanupOnly = process.argv.includes("--cleanup-only");
  const sources = await loadSources();

  if (!cleanupOnly) {
    let renamed = 0;
    let skipped = 0;
    let missing = 0;

    for (const source of sources) {
      const displayName = resolveManualDisplayName(
        source.pdfUrl,
        source.manualName,
      );
      const result = await renameLocalPdf(source.manualSlug, displayName);

      switch (result) {
        case "renamed":
          renamed += 1;
          console.log(`✓ ${getLocalPdfFilename(source.manualSlug, displayName)}`);
          break;
        case "skipped":
          skipped += 1;
          break;
        case "missing":
          missing += 1;
          console.log(`- missing: ${source.manualSlug}`);
          break;
        default:
          break;
      }
    }

    console.log(
      `\nRename: renamed=${renamed}, already_named=${skipped}, missing=${missing}`,
    );
  }

  if (!renameOnly) {
    const { removed, kept } = await cleanupLegacyDuplicatePdfs(sources);
    const tmpRemoved = await cleanupTmpDir();

    console.log(`\nCleanup: removed ${removed.length} duplicate legacy PDF(s).`);
    if (removed.length > 0) {
      removed.forEach((file) => console.log(`  - ${file}`));
    }

    if (kept.length > 0) {
      console.log(`\nKept ${kept.length} legacy PDF(s) without named duplicate:`);
      kept.forEach((file) => console.log(`  ? ${file}`));
    }

    if (tmpRemoved > 0) {
      console.log(`Removed ${tmpRemoved} temporary file(s) from data/tmp.`);
    }

    const remaining = (await fs.readdir(DATA_DIR)).filter((file) =>
      file.endsWith(".pdf"),
    );
    console.log(`\nRemaining PDFs in ${DATA_DIR}: ${remaining.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
