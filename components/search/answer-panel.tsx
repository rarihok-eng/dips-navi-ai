"use client";

import { useMemo } from "react";
import { BeginnerGuideCard } from "@/components/search/beginner-guide-card";
import { EmphasisText } from "@/components/search/emphasis-text";
import { HintStepList } from "@/components/search/hint-step-list";
import { QuestionTypeBadge } from "@/components/search/question-type-badge";
import { ReferencePdfPanel } from "@/components/search/reference-pdf-panel";
import { ResultHeader } from "@/components/search/result-header";
import { SupportFooter } from "@/components/search/support-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  extractLegacyHintSummary,
  parseAnswer,
} from "@/lib/search/parse-answer";
import { parseBeginnerGuide } from "@/lib/search/parse-beginner-guide";
import { stripSummaryCitations } from "@/lib/search/resolve-summary-links";
import type { QuestionType } from "@/lib/types/question-type";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

type AnswerPanelProps = {
  query: string;
  answer: string;
  sources: SearchSource[];
  materials?: SearchMaterial[];
  pageTitleIndex?: Record<string, string>;
  streaming?: boolean;
};

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-16 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function AnswerPanel({
  query,
  answer,
  sources,
  materials,
  pageTitleIndex,
  streaming = false,
}: AnswerPanelProps) {
  const parsed = useMemo(() => parseAnswer(answer), [answer]);

  const { summary, hintText } = useMemo(() => {
    if (parsed.summary) {
      return { summary: parsed.summary, hintText: parsed.hint };
    }

    const legacy = extractLegacyHintSummary(parsed.hint);
    return {
      summary: legacy.summary,
      hintText: legacy.hintBody,
    };
  }, [parsed.summary, parsed.hint]);

  const beginnerGuide = useMemo(
    () => (summary ? parseBeginnerGuide(summary, materials, sources) : {}),
    [summary, materials, sources],
  );

  const displayNextAction = useMemo(
    () =>
      parsed.nextAction ? stripSummaryCitations(parsed.nextAction) : undefined,
    [parsed.nextAction],
  );

  const citationText = useMemo(
    () => [summary, hintText].filter(Boolean).join("\n"),
    [summary, hintText],
  );

  const dipsText = parsed.dipsSupplement;
  const displayHint = hintText || (streaming ? "" : answer);
  const questionType: QuestionType = parsed.questionType ?? "general";
  const showResults = Boolean(query || answer || sources.length > 0);
  const showBeginnerGuide =
    summary ||
    displayNextAction ||
    beginnerGuide.fallbackSummary ||
    streaming;

  if (!showResults) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {query ? <ResultHeader query={query} /> : null}

      <section className="space-y-4">
        {(parsed.questionType || streaming) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">質問タイプ</span>
            {streaming && !parsed.questionType ? (
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <QuestionTypeBadge questionType={questionType} />
            )}
          </div>
        )}

        {showBeginnerGuide ? (
          <BeginnerGuideCard
            guide={beginnerGuide}
            nextAction={displayNextAction}
            streaming={streaming}
          />
        ) : null}

        {!streaming && citationText ? (
          <ReferencePdfPanel
            citationText={citationText}
            materials={materials}
            sources={sources}
            pageTitleIndex={pageTitleIndex}
          />
        ) : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              回答ヒント（マニュアル手順）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {streaming && !displayHint ? (
              <div className="space-y-2">
                <SectionSkeleton />
                <span className="inline-block h-4 w-2 animate-pulse bg-primary align-middle" />
              </div>
            ) : (
              <HintStepList
                hintText={displayHint || "回答を生成中..."}
                sources={sources}
                materials={materials}
                streaming={streaming}
              />
            )}
          </CardContent>
        </Card>

        {(dipsText || streaming) && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                DIPS補足（制度・用語・顧客説明の背景）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {streaming && !dipsText ? (
                <SectionSkeleton />
              ) : (
                <EmphasisText
                  text={dipsText ?? "補足情報を生成中..."}
                  className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground"
                />
              )}
            </CardContent>
          </Card>
        )}

        {!streaming && answer ? <SupportFooter /> : null}
      </section>
    </div>
  );
}
