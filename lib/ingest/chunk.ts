import {
  CHUNK_MAX_SIZE,
  CHUNK_MIN_LENGTH,
  CHUNK_MIN_SIZE,
  CHUNK_OVERLAP,
} from "@/lib/config/models";
import type { PageText } from "@/lib/ingest/pdf-extract";

export type TextChunk = {
  page: number;
  chunkIndex: number;
  text: string;
  sectionTitle?: string;
};

type Paragraph = { page: number; text: string };

function splitLongParagraph(text: string, maxSize: number): string[] {
  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > maxSize) {
    let splitAt = remaining.lastIndexOf("。", maxSize);
    if (splitAt < CHUNK_MIN_SIZE / 2) {
      splitAt = remaining.lastIndexOf("\n", maxSize);
    }
    if (splitAt < CHUNK_MIN_SIZE / 2) {
      splitAt = remaining.lastIndexOf("、", maxSize);
    }
    if (splitAt < 20) {
      splitAt = maxSize;
    }

    const slice = remaining.slice(0, splitAt + 1).trim();
    if (slice) parts.push(slice);
    remaining = remaining.slice(splitAt + 1).trim();
  }

  if (remaining) {
    parts.push(remaining);
  }

  return parts;
}

function collectParagraphs(pages: PageText[]): Paragraph[] {
  const result: Paragraph[] = [];

  for (const page of pages) {
    const trimmed = page.text.trim();
    if (!trimmed) continue;

    const parts = trimmed
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      result.push({ page: page.page, text: trimmed });
      continue;
    }

    for (const part of parts) {
      result.push({ page: page.page, text: part });
    }
  }

  return result;
}

function takeOverlapTail(text: string): string {
  if (CHUNK_OVERLAP <= 0 || text.length <= CHUNK_OVERLAP) return "";
  return text.slice(-CHUNK_OVERLAP).trimStart();
}

function mergeSmallChunks(chunks: TextChunk[], minLength: number): TextChunk[] {
  if (chunks.length === 0) return chunks;

  const merged: TextChunk[] = [{ ...chunks[0] }];

  for (let i = 1; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const prev = merged[merged.length - 1];

    if (chunk.text.length < minLength || prev.text.length < minLength) {
      prev.text = `${prev.text}\n${chunk.text}`;
    } else {
      merged.push({ ...chunk });
    }
  }

  return merged.filter((chunk) => chunk.text.length >= minLength);
}

export function chunkPages(
  pages: PageText[],
  sectionByPage?: Map<number, string>,
): TextChunk[] {
  const paragraphs = collectParagraphs(pages);
  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let buffer = "";
  let chunkStartPage = paragraphs[0].page;
  let chunkIndex = 0;

  const pushChunk = (text: string, page: number) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    chunks.push({
      page,
      chunkIndex,
      text: trimmed,
      sectionTitle: sectionByPage?.get(page),
    });
    chunkIndex += 1;
  };

  const flush = () => {
    if (!buffer.trim()) return;
    pushChunk(buffer, chunkStartPage);
    buffer = takeOverlapTail(buffer.trim());
  };

  for (const { page, text: paragraph } of paragraphs) {
    if (!buffer) {
      chunkStartPage = page;
    }

    const separator = buffer && !buffer.endsWith("\n") ? "\n" : "";
    const candidate = buffer ? `${buffer}${separator}${paragraph}` : paragraph;

    if (candidate.length <= CHUNK_MAX_SIZE) {
      buffer = candidate;
      continue;
    }

    if (buffer.trim()) {
      flush();
      if (!buffer) {
        chunkStartPage = page;
      }
    }

    if (paragraph.length > CHUNK_MAX_SIZE) {
      for (const part of splitLongParagraph(paragraph, CHUNK_MAX_SIZE)) {
        if (buffer.trim()) {
          const combined = `${buffer}\n${part}`.trim();
          if (combined.length <= CHUNK_MAX_SIZE) {
            buffer = combined;
            continue;
          }
          flush();
          chunkStartPage = page;
        }

        pushChunk(part, page);
        buffer = takeOverlapTail(part);
        if (buffer) {
          chunkStartPage = page;
        }
      }
      continue;
    }

    buffer = buffer ? `${buffer}\n${paragraph}` : paragraph;
    if (!takeOverlapTail(buffer)) {
      chunkStartPage = page;
    }
  }

  if (buffer.trim()) {
    pushChunk(buffer, chunkStartPage);
  }

  return mergeSmallChunks(chunks, CHUNK_MIN_LENGTH);
}
