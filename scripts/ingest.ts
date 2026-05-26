import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";
import { MANUAL_SOURCES, BULK_MANUAL_SLUGS, type ManualSource } from "../lib/ingest/manifest";
import { resolveManualDisplayName } from "../lib/ingest/manual-names";
import { ingestManualSources } from "../lib/ingest/pipeline";
import { clearCompletedSlugs, removeCompletedSlugs } from "../lib/ingest/progress";

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
  const reingestBulkNames = process.argv.includes("--reingest-bulk-names");
  if (reingestBulkNames) {
    await removeCompletedSlugs([...BULK_MANUAL_SLUGS]);
    console.log(
      `Queued re-ingest for ${BULK_MANUAL_SLUGS.length} bulk PDF manuals with updated names.`,
    );
  }

  const reingest = process.argv.includes("--reingest");
  if (reingest) {
    await clearCompletedSlugs();
    console.log("Cleared ingest progress — re-embedding all manuals.");
  }

  const sources = await loadSources();

  const { totalChunks, errors } = await ingestManualSources(sources, (event) => {
    switch (event.type) {
      case "start":
        console.log(`Starting ingest for ${event.total} manuals...`);
        break;
      case "manual_start":
        console.log(`[${event.index}/${event.total}] ${event.manualName}`);
        break;
      case "manual_done":
        console.log(
          `  ✓ ${event.manualName}: ${event.chunks} chunks upserted`,
        );
        break;
      case "manual_error":
        console.error(`  ✗ ${event.manualName}: ${event.error}`);
        break;
      case "complete":
        console.log(`Done. Total chunks: ${event.totalChunks}`);
        break;
      default:
        break;
    }
  });

  if (errors.length > 0) {
    console.error("\nErrors:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Successfully ingested ${totalChunks} chunks.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
