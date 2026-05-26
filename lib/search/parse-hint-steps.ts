import { buildPdfPageUrl } from "@/lib/search/pdf-link";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

export type HintStep = {
  number: number;
  text: string;
  materialIndex?: number;
  page?: number;
  sourceUrl?: string;
  pdfUrl?: string;
};

const STEP_LINE = /^(\d+)\.\s*(.*)$/;
const CITATION_SUFFIX = /[（(](?:資料(\d+)\s+)?P\.(\d+)[）)]\s*$/;

export function parseHintSteps(hintText: string): {
  intro?: string;
  steps: HintStep[];
} {
  const introLines: string[] = [];
  const steps: HintStep[] = [];

  for (const line of hintText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const stepMatch = trimmed.match(STEP_LINE);
    if (!stepMatch) {
      introLines.push(trimmed);
      continue;
    }

    const [, numStr, rest] = stepMatch;
    const citationMatch = rest.match(CITATION_SUFFIX);

    let text = rest;
    let materialIndex: number | undefined;
    let page: number | undefined;

    if (citationMatch) {
      materialIndex = citationMatch[1]
        ? Number.parseInt(citationMatch[1], 10)
        : undefined;
      page = Number.parseInt(citationMatch[2], 10);
      text = rest.slice(0, rest.length - citationMatch[0].length).trim();
    }

    steps.push({
      number: Number.parseInt(numStr, 10),
      text,
      materialIndex,
      page,
    });
  }

  return {
    intro: introLines.length > 0 ? introLines.join("\n") : undefined,
    steps,
  };
}

export function resolveHintStepLinks(
  steps: HintStep[],
  sources: SearchSource[],
  materials?: SearchMaterial[],
): HintStep[] {
  return steps.map((step) => {
    if (!step.page) return step;

    let sourceUrl: string | undefined;

    if (step.materialIndex && materials?.length) {
      const material = materials.find((m) => m.index === step.materialIndex);
      sourceUrl = material?.sourceUrl;
    }

    if (!sourceUrl) {
      sourceUrl = sources.find((s) => s.page === step.page)?.sourceUrl;
    }

    if (!sourceUrl) return step;

    return {
      ...step,
      sourceUrl,
      pdfUrl: buildPdfPageUrl(sourceUrl, step.page),
    };
  });
}
