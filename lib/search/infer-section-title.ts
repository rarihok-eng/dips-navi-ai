const HEADING_LINE_PATTERNS = [
  /^\d{1,2}\.Step\d+/i,
  /^\d{1,2}\.?\s*Step\s*\d+/i,
  /^第\d+[章節]/,
  /^Chapter\s+\d+/i,
  /^\d+\.\d+\s+\S/,
];

/** Greedy match — non-greedy + optional suffix caused "06.Step2：無" only. */
const STEP_SECTION_PATTERN =
  /\d{1,2}\.Step\d+\s*[：:]\s*[^\n。]+(?:\s*[（(]\d+\s*\/\s*\d+[）)])?/gi;

/** Normalize PDF-extracted text so Step headings match reliably. */
export function normalizePdfText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/(\d{1,2})\s*\.\s*Step\s*(\d+)/gi, "$1.Step$2")
    .replace(/Step(\d+)\s+([：:])/gi, "Step$1$2")
    .replace(/([：:])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyBodyLine(line: string): boolean {
  if (line.length > 120) return true;
  if (line.endsWith("。") && line.length > 36) return true;
  if (/^[・●○■]/.test(line)) return true;
  if (/^P\.\d+/i.test(line)) return true;
  return false;
}

function pickBestStepMatch(text: string): string | undefined {
  const normalized = normalizePdfText(text);
  const matches = [...normalized.matchAll(STEP_SECTION_PATTERN)];
  if (matches.length === 0) return undefined;

  return matches
    .map((match) => match[0].replace(/\s+/g, " ").trim())
    .sort((a, b) => b.length - a.length)[0];
}

/** Infer a page/section heading from PDF page or chunk text (DIPS manuals). */
export function inferSectionTitleFromPageText(text: string): string | undefined {
  const stepTitle = pickBestStepMatch(text);
  if (stepTitle) return stepTitle;

  const normalized = normalizePdfText(text);
  const lines = normalized.includes("\n")
    ? normalized.split("\n").map((line) => line.trim()).filter(Boolean)
    : [normalized];

  for (const line of lines.slice(0, 10)) {
    if (isLikelyBodyLine(line)) continue;

    for (const pattern of HEADING_LINE_PATTERNS) {
      if (pattern.test(line)) return line;
    }

    if (/Step\s*\d/i.test(line) && /[：:]/.test(line)) return line;

    if (
      line.length <= 80 &&
      !line.endsWith("。") &&
      !line.endsWith("、") &&
      (/^[\d０-９]/.test(line) || /Step/i.test(line))
    ) {
      return line;
    }
  }

  return undefined;
}

export function resolveSectionTitle(
  storedTitle: string | undefined,
  text?: string,
): string | undefined {
  if (text?.trim()) {
    const inferred = inferSectionTitleFromPageText(text);
    if (inferred) return inferred;
  }
  const trimmed = storedTitle?.trim();
  if (trimmed && !/^P\.\d+/i.test(trimmed)) return trimmed;
  return undefined;
}
