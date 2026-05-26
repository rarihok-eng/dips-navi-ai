"use client";

import { EmphasisText } from "@/components/search/emphasis-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildDisplaySummary,
  type BeginnerGuideContent,
} from "@/lib/search/parse-beginner-guide";

type BeginnerGuideCardProps = {
  guide: BeginnerGuideContent;
  nextAction?: string;
  streaming?: boolean;
};

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-16 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function BeginnerGuideCard({
  guide,
  nextAction,
  streaming = false,
}: BeginnerGuideCardProps) {
  const displaySummary = buildDisplaySummary(guide);
  const hasContent = Boolean(displaySummary || nextAction);

  if (!hasContent && !streaming) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          かんたん要約（初心者向け）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {streaming && !displaySummary ? (
          <SectionSkeleton />
        ) : displaySummary ? (
          <EmphasisText
            text={displaySummary}
            className="whitespace-pre-wrap text-sm leading-7 text-foreground"
          />
        ) : null}

        {nextAction ? (
          <div className="border-t border-amber-200/80 pt-3 dark:border-amber-900/40">
            <p className="mb-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              今すぐやること
            </p>
            <EmphasisText
              text={nextAction}
              className="text-sm leading-7 text-foreground"
            />
          </div>
        ) : streaming ? (
          <div className="border-t border-amber-200/80 pt-3 dark:border-amber-900/40">
            <SectionSkeleton />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
