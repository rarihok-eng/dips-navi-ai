import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SummaryPdfLink } from "@/lib/search/resolve-summary-links";

type SummaryPdfLinksProps = {
  links: SummaryPdfLink[];
};

export function SummaryPdfLinks({ links }: SummaryPdfLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <p className="text-sm font-semibold text-primary">関連マニュアル PDF</p>
      </div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${link.sourceUrl}-${link.page}`}>
            <a
              href={link.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm hover:underline"
              title={`${link.manualName} P.${link.page} を開く`}
            >
              <span className="line-clamp-1 min-w-0 flex-1 text-foreground">
                {link.manualName}
              </span>
              <Badge className="shrink-0 px-2 py-0.5 text-xs">P.{link.page}</Badge>
              <ExternalLink className="size-3 shrink-0 text-primary" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
