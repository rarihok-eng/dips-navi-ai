import fs from "fs/promises";
import path from "path";
import { pageTitleCacheKey } from "@/lib/search/page-title-cache-key";

export { pageTitleCacheKey };

const PAGE_TITLE_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
  "page-titles",
);

function titleFilePath(manualSlug: string): string {
  return path.join(PAGE_TITLE_DIR, `${manualSlug}.json`);
}

export async function writePageTitles(
  manualSlug: string,
  sectionByPage: Map<number, string>,
): Promise<void> {
  await fs.mkdir(PAGE_TITLE_DIR, { recursive: true });

  const titles: Record<string, string> = {};
  for (const [page, title] of sectionByPage) {
    const trimmed = title.trim();
    if (trimmed) titles[String(page)] = trimmed;
  }

  await fs.writeFile(titleFilePath(manualSlug), JSON.stringify(titles), "utf-8");
}

export async function readPageTitle(
  manualSlug: string,
  page: number,
): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(titleFilePath(manualSlug), "utf-8");
    const titles = JSON.parse(raw) as Record<string, string>;
    return titles[String(page)]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function buildPageTitleCache(
  entries: Array<{ manualSlug: string; sourceUrl: string; page: number }>,
): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = `${entry.sourceUrl}#${entry.page}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const stored = await readPageTitle(entry.manualSlug, entry.page);
    if (stored) cache.set(key, stored);
  }

  return cache;
}

