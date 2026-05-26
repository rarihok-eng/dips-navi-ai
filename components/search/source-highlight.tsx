import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { groupSearchSources } from "@/lib/search/dedupe-sources";
import { buildPdfPageUrl } from "@/lib/search/pdf-link";
import type { SearchSource } from "@/lib/types/search";

type SourceHighlightProps = {
  sources: SearchSource[];
};

export function SourceHighlight({ sources }: SourceHighlightProps) {
  const grouped = groupSearchSources(sources);

  if (grouped.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">
          根拠マニュアル
        </h2>
        <span className="text-xs text-muted-foreground">
          {grouped.length}件（重複除去済み）
        </span>
      </div>

      <div className="grid gap-3">
        {grouped.map((source) => (
          <Card
            key={source.manualSlug ?? source.sourceUrl ?? source.manualName}
            className="border-primary/20 bg-primary/5"
          >
            <CardContent className="space-y-3 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p
                  className="line-clamp-2 flex-1 text-sm font-semibold leading-snug"
                  title={source.manualName}
                >
                  {source.manualName}
                </p>
                <div className="flex max-w-[50%] flex-wrap justify-end gap-1">
                  {source.pages.map((page) =>
                    source.sourceUrl ? (
                      <a
                        key={page}
                        href={buildPdfPageUrl(source.sourceUrl, page)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`P.${page} を開く`}
                      >
                        <Badge className="shrink-0 cursor-pointer px-2 py-0.5 text-xs hover:bg-primary/90">
                          P.{page}
                        </Badge>
                      </a>
                    ) : (
                      <Badge key={page} className="shrink-0 px-2 py-0.5 text-xs">
                        P.{page}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {source.excerpt ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {source.excerpt}
                </p>
              ) : null}

              {source.sourceUrl ? (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  PDFを開く
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
