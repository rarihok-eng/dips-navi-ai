import { normalizeQuestionType } from "@/lib/types/question-type";
import type { ParsedAnswer } from "@/lib/types/search";

const SECTION_PATTERNS = {
  manual: /###\s*参照マニュアル\s*\n([\s\S]*?)(?=###\s*該当ページ|$)/,
  page: /###\s*該当ページ\s*\n([\s\S]*?)(?=###\s*質問タイプ|###\s*次にやること|###\s*かんたん要約|###\s*回答ヒント|$)/,
  questionType:
    /###\s*質問タイプ\s*\n([\s\S]*?)(?=###\s*次にやること|###\s*かんたん要約|###\s*回答ヒント|$)/,
  nextAction:
    /###\s*次にやること\s*\n([\s\S]*?)(?=###\s*かんたん要約|###\s*回答ヒント|###\s*DIPS補足|$)/,
  summary:
    /###\s*かんたん要約\s*\n([\s\S]*?)(?=###\s*回答ヒント|###\s*DIPS補足|$)/,
  hint: /###\s*回答ヒント\s*\n([\s\S]*?)(?=###\s*DIPS補足|$)/,
  dipsSupplement: /###\s*DIPS補足\s*\n([\s\S]*?)$/,
};

function cleanSection(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

export function parseAnswer(answer: string): ParsedAnswer {
  const trimmed = answer.trim();
  if (!trimmed) {
    return { hint: "" };
  }

  const manual = cleanSection(SECTION_PATTERNS.manual.exec(trimmed)?.[1]);
  const page = cleanSection(SECTION_PATTERNS.page.exec(trimmed)?.[1]);
  const questionTypeRaw = cleanSection(
    SECTION_PATTERNS.questionType.exec(trimmed)?.[1],
  );
  const nextAction = cleanSection(
    SECTION_PATTERNS.nextAction.exec(trimmed)?.[1],
  );
  const summary = cleanSection(SECTION_PATTERNS.summary.exec(trimmed)?.[1]);
  const hint = cleanSection(SECTION_PATTERNS.hint.exec(trimmed)?.[1]);
  const dipsSupplement = cleanSection(
    SECTION_PATTERNS.dipsSupplement.exec(trimmed)?.[1],
  );

  const questionType = questionTypeRaw
    ? normalizeQuestionType(questionTypeRaw.split("\n")[0])
    : undefined;

  if (
    manual ||
    page ||
    questionTypeRaw ||
    nextAction ||
    summary ||
    hint ||
    dipsSupplement
  ) {
    return {
      manual,
      page,
      questionType,
      nextAction,
      summary,
      hint: hint ?? trimmed,
      dipsSupplement,
    };
  }

  return { hint: trimmed };
}

/** Fallback for answers generated before the かんたん要約 section existed. */
export function extractLegacyHintSummary(hint: string): {
  summary?: string;
  hintBody: string;
} {
  const lines = hint.split("\n");
  const firstLineIndex = lines.findIndex((line) => line.trim());

  if (firstLineIndex === -1) {
    return { hintBody: hint };
  }

  const firstLine = lines[firstLineIndex].trim();
  if (/^\d+\./.test(firstLine)) {
    return { hintBody: hint };
  }

  const hintBody = lines
    .slice(firstLineIndex + 1)
    .join("\n")
    .trim();

  return {
    summary: firstLine,
    hintBody: hintBody || hint,
  };
}

export function formatPagesFromSources(pages: number[]): string {
  const unique = [...new Set(pages)].sort((a, b) => a - b);
  return unique.map((page) => `P.${page}`).join("、");
}

export function formatManualsFromSources(manualNames: string[]): string {
  const unique = [...new Set(manualNames)];
  return unique.map((name) => `『${name}』`).join("、");
}
