import { BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SearchSource } from "@/lib/types/search";

type SourceCardsProps = {
  sources: SearchSource[];
};

export function SourceCards({ sources }: SourceCardsProps) {
  if (sources.length === 0) return null;

  return (
    <details className="group rounded-lg border bg-muted/20">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-muted-foreground marker:content-none">
        <span className="inline-flex items-center gap-2">
          <BookOpen className="size-4" />
          詳細な参照ソース（{sources.length}件）
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">
            クリックで展開
          </span>
        </span>
      </summary>

      <div className="space-y-3 border-t px-4 py-4">
        {sources.map((source) => (
          <Card
            key={`${source.manualName}-${source.page}`}
            className="border-l-4 border-l-primary/40"
          >
            <CardHeader className="pb-2">
              <CardTitle
                className="text-sm leading-snug"
                title={source.manualName}
              >
                {source.manualName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">P.{source.page}</Badge>
              {source.excerpt ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
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
                  公式PDFを開く
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </details>
  );
}
