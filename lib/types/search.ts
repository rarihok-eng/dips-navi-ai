export type SearchSource = {
  manualName: string;
  manualSlug?: string;
  page: number;
  sourceUrl?: string;
  excerpt?: string;
  sectionTitle?: string;
};

export type SearchMaterial = {
  index: number;
  manualName: string;
  page: number;
  sourceUrl?: string;
  manualSlug?: string;
  sectionTitle?: string;
};

export type SearchLogItem = {
  logId: string;
  query: string;
  answer: string;
  sources: SearchSource[];
  createdAt: string;
};

import type { QuestionType } from "@/lib/types/question-type";

export type ParsedAnswer = {
  manual?: string;
  page?: string;
  questionType?: QuestionType;
  nextAction?: string;
  summary?: string;
  hint: string;
  dipsSupplement?: string;
};
