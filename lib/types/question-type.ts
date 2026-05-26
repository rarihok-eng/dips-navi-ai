export const QUESTION_TYPES = [
  "error",
  "how_to",
  "term",
  "eligibility",
  "general",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  error: "エラー対処",
  how_to: "操作手順",
  term: "用語説明",
  eligibility: "可否・条件",
  general: "一般",
};

export function normalizeQuestionType(value: string | undefined): QuestionType {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized &&
    QUESTION_TYPES.includes(normalized as QuestionType)
  ) {
    return normalized as QuestionType;
  }
  return "general";
}
