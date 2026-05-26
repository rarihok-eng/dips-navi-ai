import fs from "fs/promises";
import path from "path";
import type { ManualSource } from "@/lib/ingest/manifest";
import { resolveManualDisplayName } from "@/lib/ingest/manual-names";
import {
  getLocalPdfFilename,
  matchesLocalPdfSlug,
} from "@/lib/ingest/pdf-filename";

const DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "manuals");
const TMP_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "tmp");

export type CleanupResult = {
  removed: string[];
  kept: string[];
};

function isLegacyPdfFilename(filename: string): boolean {
  return filename.endsWith(".pdf") && !filename.includes("__");
}

function isUrlDerivedLegacyName(filename: string): boolean {
  return filename.startsWith("https-www-");
}

export async function cleanupLegacyDuplicatePdfs(
  sources: ManualSource[],
): Promise<CleanupResult> {
  const files = await fs.readdir(DATA_DIR);
  const pdfFiles = files.filter((file) => file.endsWith(".pdf"));
  const namedFiles = pdfFiles.filter((file) => file.includes("__"));
  const legacyFiles = pdfFiles.filter(isLegacyPdfFilename);

  const namedBySlug = new Set(
    namedFiles.map((file) => file.replace(/^.*__/, "").replace(/\.pdf$/i, "")),
  );

  const namedSizes = new Map<number, string[]>();
  for (const file of namedFiles) {
    const stat = await fs.stat(path.join(DATA_DIR, file));
    const list = namedSizes.get(stat.size) ?? [];
    list.push(file);
    namedSizes.set(stat.size, list);
  }

  const protectedLegacy = new Set<string>();
  for (const source of sources) {
    const displayName = resolveManualDisplayName(
      source.pdfUrl,
      source.manualName,
    );
    const named = getLocalPdfFilename(source.manualSlug, displayName);
    if (pdfFiles.includes(named)) continue;

    const legacyCandidates = legacyFiles.filter((file) =>
      matchesLocalPdfSlug(file, source.manualSlug),
    );
    if (legacyCandidates.length === 1) {
      protectedLegacy.add(legacyCandidates[0]);
    }
  }

  const removed: string[] = [];
  const kept: string[] = [];

  for (const file of legacyFiles) {
    if (protectedLegacy.has(file)) {
      kept.push(file);
      continue;
    }

    const slug = file.slice(0, -".pdf".length);
    let shouldRemove = false;

    if (namedBySlug.has(slug)) {
      shouldRemove = true;
    }

    if (!shouldRemove && isUrlDerivedLegacyName(file)) {
      const stat = await fs.stat(path.join(DATA_DIR, file));
      const matches = namedSizes.get(stat.size) ?? [];
      if (matches.length >= 1) {
        shouldRemove = true;
      }
    }

    if (!shouldRemove && !isUrlDerivedLegacyName(file)) {
      const stat = await fs.stat(path.join(DATA_DIR, file));
      const matches = namedSizes.get(stat.size) ?? [];
      if (matches.length === 1) {
        shouldRemove = true;
      }
    }

    if (shouldRemove) {
      await fs.unlink(path.join(DATA_DIR, file));
      removed.push(file);
    } else {
      kept.push(file);
    }
  }

  return { removed, kept };
}

export async function cleanupTmpDir(): Promise<number> {
  let removed = 0;

  try {
    const entries = await fs.readdir(TMP_DIR);
    for (const entry of entries) {
      await fs.unlink(path.join(TMP_DIR, entry));
      removed += 1;
    }
  } catch {
    // tmp dir may not exist
  }

  return removed;
}

export async function downloadPdf(
  pdfUrl: string,
  manualSlug: string,
  displayName: string,
): Promise<string> {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${pdfUrl}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(DATA_DIR, { recursive: true });

  const filePath = path.join(
    DATA_DIR,
    getLocalPdfFilename(manualSlug, displayName),
  );
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function readLocalPdf(
  manualSlug: string,
  displayName?: string,
): Promise<string | null> {
  if (displayName) {
    const namedPath = path.join(
      DATA_DIR,
      getLocalPdfFilename(manualSlug, displayName),
    );
    try {
      await fs.access(namedPath);
      return namedPath;
    } catch {
      // fall through to legacy lookup
    }
  }

  const legacyPath = path.join(DATA_DIR, `${manualSlug}.pdf`);
  try {
    await fs.access(legacyPath);
    return legacyPath;
  } catch {
    // fall through
  }

  try {
    const files = await fs.readdir(DATA_DIR);
    const match = files.find(
      (file) => file.endsWith(".pdf") && matchesLocalPdfSlug(file, manualSlug),
    );
    if (match) {
      return path.join(DATA_DIR, match);
    }
  } catch {
    return null;
  }

  return null;
}

export async function renameLocalPdf(
  manualSlug: string,
  displayName: string,
): Promise<"renamed" | "skipped" | "missing"> {
  const targetPath = path.join(
    DATA_DIR,
    getLocalPdfFilename(manualSlug, displayName),
  );

  try {
    await fs.access(targetPath);
    return "skipped";
  } catch {
    // target does not exist yet
  }

  const currentPath = await readLocalPdf(manualSlug, displayName);
  if (!currentPath) return "missing";
  if (currentPath === targetPath) return "skipped";

  await fs.rename(currentPath, targetPath);
  return "renamed";
}

export { DATA_DIR, TMP_DIR };
