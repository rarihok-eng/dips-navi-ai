import fs from "fs/promises";
import path from "path";

const TMP_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "tmp");

const LINE_Y_TOLERANCE = 4;

export type PageText = {
  page: number;
  text: string;
};

export type ExtractionStats = {
  totalPages: number;
  pagesWithText: number;
  emptyPages: number;
  totalChars: number;
};

export type PdfExtractResult = {
  pages: PageText[];
  sectionByPage: Map<number, string>;
  stats: ExtractionStats;
};

type TextItemLike = {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
};

type OutlineItemLike = {
  title?: string;
  dest?: string | unknown[] | null;
  items?: OutlineItemLike[];
};

function sortTextItems(items: TextItemLike[]): TextItemLike[] {
  return items
    .filter((item) => item.str?.trim())
    .sort((a, b) => {
      const ay = a.transform?.[5] ?? 0;
      const by = b.transform?.[5] ?? 0;
      const yDiff = by - ay;
      if (Math.abs(yDiff) > LINE_Y_TOLERANCE) return yDiff;
      const ax = a.transform?.[4] ?? 0;
      const bx = b.transform?.[4] ?? 0;
      return ax - bx;
    });
}

function itemsToPageText(items: TextItemLike[]): string {
  const sorted = sortTextItems(items);
  if (sorted.length === 0) return "";

  let text = "";
  let lastY: number | undefined;

  for (const item of sorted) {
    const y = item.transform?.[5];
    if (
      lastY !== undefined &&
      y !== undefined &&
      Math.abs(y - lastY) > LINE_Y_TOLERANCE
    ) {
      text += "\n";
    } else if (text && !text.endsWith("\n") && !text.endsWith(" ")) {
      text += " ";
    }

    text += item.str ?? "";
    if (item.hasEOL) text += "\n";
    lastY = y;
  }

  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function resolveDestPage(
  pdf: {
    getDestination: (dest: string) => Promise<unknown>;
    getPageIndex: (ref: { num: number; gen: number }) => Promise<number>;
  },
  dest: string | unknown[] | null | undefined,
): Promise<number | null> {
  try {
    let explicitDest: unknown = dest;
    if (typeof dest === "string") {
      explicitDest = await pdf.getDestination(dest);
    }
    if (!explicitDest || !Array.isArray(explicitDest)) return null;
    const ref = explicitDest[0];
    if (ref && typeof ref === "object" && "num" in ref && "gen" in ref) {
      return (await pdf.getPageIndex(ref as { num: number; gen: number })) + 1;
    }
  } catch {
    // Some PDFs expose outline entries without resolvable destinations.
  }
  return null;
}

async function extractSectionByPage(pdf: {
  getOutline: () => Promise<OutlineItemLike[] | null>;
  getDestination: (dest: string) => Promise<unknown>;
  getPageIndex: (ref: { num: number; gen: number }) => Promise<number>;
  numPages: number;
}): Promise<Map<number, string>> {
  const sectionStarts = new Map<number, string>();

  try {
    const outline = await pdf.getOutline();
    if (!outline?.length) return new Map();

    async function walk(items: OutlineItemLike[], path: string[]): Promise<void> {
      for (const item of items) {
        const title = item.title?.trim();
        if (!title) continue;

        const sectionPath = [...path, title];
        const sectionLabel =
          sectionPath.length >= 2
            ? sectionPath.slice(-2).join(" > ")
            : title;

        const page = await resolveDestPage(pdf, item.dest);
        if (page !== null) {
          sectionStarts.set(page, sectionLabel);
        }

        if (item.items?.length) {
          await walk(item.items, sectionPath);
        }
      }
    }

    await walk(outline, []);
  } catch {
    return new Map();
  }

  const filled = new Map<number, string>();
  let current = "";
  for (let page = 1; page <= pdf.numPages; page += 1) {
    if (sectionStarts.has(page)) {
      current = sectionStarts.get(page)!;
    }
    if (current) {
      filled.set(page, current);
    }
  }

  return filled;
}

export async function extractPdfContent(filePath: string): Promise<PdfExtractResult> {
  const data = new Uint8Array(await fs.readFile(filePath));

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const sectionByPage = await extractSectionByPage(pdf);
  const pages: PageText[] = [];
  let totalChars = 0;
  let pagesWithText = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = itemsToPageText(content.items as TextItemLike[]);

    if (text) {
      pagesWithText += 1;
      totalChars += text.length;
      pages.push({ page: pageNumber, text });
    }
  }

  return {
    pages,
    sectionByPage,
    stats: {
      totalPages: pdf.numPages,
      pagesWithText,
      emptyPages: pdf.numPages - pagesWithText,
      totalChars,
    },
  };
}

/** @deprecated Prefer extractPdfContent for section metadata and stats. */
export async function extractPagesFromPdf(filePath: string): Promise<PageText[]> {
  const { pages } = await extractPdfContent(filePath);
  return pages;
}

export async function extractPagesFromBuffer(buffer: Buffer): Promise<PageText[]> {
  await fs.mkdir(TMP_DIR, { recursive: true });
  const tmpPath = path.join(TMP_DIR, `tmp-${Date.now()}.pdf`);
  await fs.writeFile(tmpPath, buffer);

  try {
    return await extractPagesFromPdf(tmpPath);
  } finally {
    await fs.unlink(tmpPath).catch(() => undefined);
  }
}
