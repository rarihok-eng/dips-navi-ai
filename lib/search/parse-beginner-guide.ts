import { humanizeMaterialCitations } from "@/lib/search/material-labels";
import { stripSummaryCitations } from "@/lib/search/resolve-summary-links";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

export type BeginnerGuideContent = {
  cause?: string;
  fixLocation?: string;
  /** Used when 【原因】/【修正場所】 tags are absent (legacy answers). */
  fallbackSummary?: string;
};

function extractTaggedSection(
  text: string,
  tag: string,
  nextTags: string[],
): string | undefined {
  const nextPattern = nextTags.map((t) => `(?=【${t}】|$)`).join("");
  const regex = new RegExp(
    `【${tag}】\\s*([\\s\\S]*?)${nextTags.length > 0 ? nextPattern : "$"}`,
  );
  const match = text.match(regex);
  return match?.[1]?.trim() || undefined;
}

export function parseBeginnerGuide(
  summary: string,
  materials?: SearchMaterial[],
  sources?: SearchSource[],
): BeginnerGuideContent {
  const humanized = humanizeMaterialCitations(summary, materials, sources);
  const cleaned = stripSummaryCitations(humanized);

  const cause = extractTaggedSection(cleaned, "原因", ["修正場所"]);
  const fixLocation = extractTaggedSection(cleaned, "修正場所", []);

  if (cause || fixLocation) {
    return { cause, fixLocation };
  }

  return { fallbackSummary: cleaned };
}

/** Main readable paragraph: cause + fix location combined (previous summary style). */
export function buildDisplaySummary(guide: BeginnerGuideContent): string | undefined {
  if (guide.fallbackSummary) {
    return guide.fallbackSummary;
  }

  const parts = [guide.cause, guide.fixLocation].filter(Boolean);
  if (parts.length === 0) return undefined;

  return parts.join("\n\n");
}
