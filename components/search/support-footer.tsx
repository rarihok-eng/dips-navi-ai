import { ExternalLink, LifeBuoy } from "lucide-react";
import {
  SUPPORT_FOOTER_NOTE,
  SUPPORT_RESOURCES,
} from "@/lib/search/support-resources";

export function SupportFooter() {
  return (
    <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <LifeBuoy className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">
          解決しない場合
        </p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {SUPPORT_FOOTER_NOTE}
      </p>
      <ul className="space-y-2">
        {SUPPORT_RESOURCES.map((resource) => (
          <li key={resource.href}>
            <a
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-0.5 text-sm hover:underline"
            >
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                {resource.label}
                <ExternalLink className="size-3 opacity-70" />
              </span>
              <span className="text-xs text-muted-foreground">
                {resource.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
