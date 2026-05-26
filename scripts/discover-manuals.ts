import fs from "fs/promises";
import path from "path";
import {
  MANUAL_SOURCES,
  PORTAL_PAGES,
  normalizeManualSource,
  type ManualSource,
} from "../lib/ingest/manifest";

function extractPdfLinks(
  html: string,
  portalPage: string,
): Array<{ title: string; pdfUrl: string; portalPage: string }> {
  const links: Array<{ title: string; pdfUrl: string; portalPage: string }> =
    [];
  const anchorRegex =
    /<a[^>]+href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null = anchorRegex.exec(html);
  while (match) {
    const href = match[1];
    const title = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    links.push({
      title: title || href,
      pdfUrl: new URL(href, portalPage).toString(),
      portalPage,
    });
    match = anchorRegex.exec(html);
  }

  return links;
}

async function discoverFromPortals(): Promise<ManualSource[]> {
  const discovered: ManualSource[] = [];

  for (const portalPage of PORTAL_PAGES) {
    const response = await fetch(portalPage, {
      headers: { "User-Agent": "DIPS-NaviAI/1.0 (+manual-ingest)" },
    });

    if (!response.ok) {
      console.warn(`Skip ${portalPage}: HTTP ${response.status}`);
      continue;
    }

    const html = await response.text();
    const links = extractPdfLinks(html, portalPage);

    for (const link of links) {
      const source = normalizeManualSource(link);
      if (source) {
        discovered.push(source);
      }
    }
  }

  const unique = new Map<string, ManualSource>();
  for (const item of discovered) {
    unique.set(item.pdfUrl, item);
  }

  return Array.from(unique.values());
}

async function main() {
  let sources: ManualSource[] = [];

  try {
    sources = await discoverFromPortals();
    console.log(`Discovered ${sources.length} ingestible PDF links.`);
  } catch (error) {
    console.warn("Discovery failed, falling back to static manifest.", error);
    sources = MANUAL_SOURCES;
  }

  if (sources.length === 0) {
    sources = MANUAL_SOURCES;
  }

  const outputPath = path.resolve(process.cwd(), "manifest.generated.json");
  await fs.writeFile(outputPath, JSON.stringify(sources, null, 2), "utf-8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
