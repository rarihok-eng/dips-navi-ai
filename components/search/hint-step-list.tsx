import { ExternalLink } from "lucide-react";
import { EmphasisText } from "@/components/search/emphasis-text";
import { Badge } from "@/components/ui/badge";
import {
  parseHintSteps,
  resolveHintStepLinks,
} from "@/lib/search/parse-hint-steps";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

type HintStepListProps = {
  hintText: string;
  sources: SearchSource[];
  materials?: SearchMaterial[];
  streaming?: boolean;
};

export function HintStepList({
  hintText,
  sources,
  materials,
  streaming = false,
}: HintStepListProps) {
  const { intro, steps } = parseHintSteps(hintText);
  const linkedSteps = resolveHintStepLinks(steps, sources, materials);

  if (linkedSteps.length === 0 && !intro) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-7">
        <EmphasisText text={hintText || "回答を生成中..."} />
        {streaming ? (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {intro ? (
        <p className="text-sm leading-7 text-muted-foreground">
          <EmphasisText text={intro} />
        </p>
      ) : null}

      <ol className="space-y-3">
        {linkedSteps.map((step) => (
          <li key={step.number} className="flex gap-3 text-sm leading-7">
            <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
              {step.number}.
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <span className="min-w-0 flex-1">
                <EmphasisText text={step.text} />
              </span>
              {step.pdfUrl && step.page ? (
                <a
                  href={step.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 hover:underline"
                  title={`${step.sourceUrl ?? "PDF"} P.${step.page} を開く`}
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    P.{step.page}
                  </Badge>
                  <ExternalLink className="size-3 text-primary" />
                </a>
              ) : step.page ? (
                <Badge
                  variant="outline"
                  className="shrink-0 px-2 py-0.5 text-xs tabular-nums"
                >
                  P.{step.page}
                </Badge>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {streaming ? (
        <span className="inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
      ) : null}
    </div>
  );
}
