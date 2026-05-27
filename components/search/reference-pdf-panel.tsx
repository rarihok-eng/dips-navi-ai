import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  buildCitedPdfReferences,
} from "@/lib/search/build-cited-pdf-references";
import { formatMaterialIndices } from "@/lib/search/material-labels";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

type ReferencePdfPanelProps = {
  citationText: string;
  materials?: SearchMaterial[];
  sources?: SearchSource[];
  pageTitleIndex?: Record<string, string>;
};

export function ReferencePdfPanel({
  citationText,
  materials,
  sources,
  pageTitleIndex,
}: ReferencePdfPanelProps) {
  const references = buildCitedPdfReferences(
    citationText,
    materials,
    sources,
    pageTitleIndex,
  );
  if (references.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <p className="text-sm font-semibold text-primary">
          公式PDFで確認
        </p>
        <span className="text-xs text-muted-foreground">
          {references.length}件
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        回答で引用したページです。章・手順名をクリックするとPDFを開けます。
      </p>
      <ul className="space-y-2">
        {references.map((reference) => (
          <li
            key={`${reference.sourceUrl}-${reference.page}`}
            className="flex flex-wrap items-start gap-x-2 gap-y-1 text-sm"
          >
            <Badge
              variant="outline"
              className="max-w-full shrink-0 whitespace-normal px-2 py-0.5 text-xs leading-snug"
            >
              {formatMaterialIndices(reference.materialIndices)}
            </Badge>
            <a
              href={reference.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 flex-1 items-start gap-2 hover:underline"
              title={`${reference.sectionTitle ?? reference.displayTitle} P.${reference.page} を開く`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug text-foreground">
                  {reference.displayTitle}
                </span>
                {reference.displaySubtitle ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {reference.displaySubtitle}
                  </span>
                ) : null}
              </span>
              <Badge className="shrink-0 px-2 py-0.5 text-xs tabular-nums">
                P.{reference.page}
              </Badge>
              <ExternalLink className="mt-0.5 size-3 shrink-0 text-primary" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
