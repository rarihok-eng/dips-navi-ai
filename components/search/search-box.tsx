"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUGGESTED_QUERIES } from "@/lib/search/suggested-queries";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  large?: boolean;
  showSuggestions?: boolean;
  onSelectSuggestion?: (query: string) => void;
};

export function SearchBox({
  value,
  onChange,
  onSubmit,
  loading = false,
  large = false,
  showSuggestions = false,
  onSelectSuggestion,
}: SearchBoxProps) {
  return (
    <div className={`flex w-full flex-col gap-3 ${large ? "max-w-3xl" : ""}`}>
      <form
        className="flex w-full items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!loading && value.trim()) onSubmit();
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="DIPSマニュアルについて質問してください..."
            disabled={loading}
            className={
              large
                ? "h-14 rounded-full pl-12 text-base shadow-sm"
                : "h-11 rounded-full pl-11"
            }
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !value.trim()}
          className={large ? "h-14 rounded-full px-8" : "rounded-full"}
        >
          検索
        </Button>
      </form>

      {showSuggestions ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">よくある質問</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => onSelectSuggestion?.(suggestion)}
                className="rounded-full border bg-background px-3 py-1.5 text-left text-xs leading-snug transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
