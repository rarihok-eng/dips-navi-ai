import fs from "fs/promises";
import path from "path";

const PROGRESS_PATH = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "ingest-progress.json",
);

export async function loadCompletedSlugs(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(PROGRESS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as { completedSlugs?: string[] };
    return new Set(parsed.completedSlugs ?? []);
  } catch {
    return new Set();
  }
}

export async function markSlugCompleted(manualSlug: string): Promise<void> {
  const completed = await loadCompletedSlugs();
  completed.add(manualSlug);
  await fs.writeFile(
    PROGRESS_PATH,
    JSON.stringify({ completedSlugs: Array.from(completed) }, null, 2),
    "utf-8",
  );
}

export async function clearCompletedSlugs(): Promise<void> {
  try {
    await fs.unlink(PROGRESS_PATH);
  } catch {
    // no progress file yet
  }
}

export async function removeCompletedSlugs(slugs: string[]): Promise<void> {
  const completed = await loadCompletedSlugs();
  for (const slug of slugs) {
    completed.delete(slug);
  }
  await fs.writeFile(
    PROGRESS_PATH,
    JSON.stringify({ completedSlugs: Array.from(completed) }, null, 2),
    "utf-8",
  );
}
