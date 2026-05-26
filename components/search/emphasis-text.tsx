"use client";

import { useMemo } from "react";
import { parseMarkdownEmphasis } from "@/lib/search/render-markdown-emphasis";
import { cn } from "@/lib/utils";

type EmphasisTextProps = {
  text: string;
  className?: string;
  emphasisClassName?: string;
};

export function EmphasisText({
  text,
  className,
  emphasisClassName = "font-semibold text-red-600 dark:text-red-400",
}: EmphasisTextProps) {
  const segments = useMemo(() => parseMarkdownEmphasis(text), [text]);

  if (segments.length === 0) return null;

  return (
    <span className={cn(className)}>
      {segments.map((segment, index) =>
        segment.emphasis ? (
          <span key={index} className={emphasisClassName}>
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
