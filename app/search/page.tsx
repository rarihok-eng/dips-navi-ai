"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AnswerPanel } from "@/components/search/answer-panel";
import { HistorySidebar } from "@/components/search/history-sidebar";
import { SearchBox } from "@/components/search/search-box";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SearchLogItem, SearchMaterial, SearchSource } from "@/lib/types/search";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [materials, setMaterials] = useState<SearchMaterial[]>([]);
  const [pageTitleIndex, setPageTitleIndex] = useState<Record<string, string>>(
    {},
  );
  const [logs, setLogs] = useState<SearchLogItem[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>();
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/logs");
      if (!response.ok) return;
      const data = (await response.json()) as { logs: SearchLogItem[] };
      setLogs(data.logs);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  async function handleSearch(searchQuery?: string) {
    const trimmed = (searchQuery ?? query).trim();
    if (!trimmed || searching) return;

    if (searchQuery) {
      setQuery(searchQuery);
    }

    setSearching(true);
    setHasSearched(true);
    setActiveQuery(trimmed);
    setAnswer("");
    setSources([]);
    setMaterials([]);
    setPageTitleIndex({});
    setSelectedLogId(undefined);

    try {
      const response = await fetch("/api/search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Search request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          const eventLine = lines.find((line) => line.startsWith("event: "));
          const dataLine = lines.find((line) => line.startsWith("data: "));
          if (!eventLine || !dataLine) continue;

          const event = eventLine.replace("event: ", "");
          const data = JSON.parse(dataLine.replace("data: ", ""));

          if (event === "sources") {
            setSources(data.sources ?? []);
            setMaterials(data.materials ?? []);
          } else if (event === "token") {
            setAnswer((prev) => prev + (data.text ?? ""));
          } else if (event === "done") {
            setSelectedLogId(data.logId);
            setPageTitleIndex(data.pageTitleIndex ?? {});
            await loadLogs();
          } else if (event === "error") {
            setAnswer((prev) =>
              prev || `エラー: ${data.message ?? "検索に失敗しました"}`,
            );
          }
        }
      }
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? `エラー: ${error.message}`
          : "検索中にエラーが発生しました",
      );
    } finally {
      setSearching(false);
    }
  }

  function handleSelectLog(log: SearchLogItem) {
    setSelectedLogId(log.logId);
    setQuery(log.query);
    setActiveQuery(log.query);
    setAnswer(log.answer);
    setSources(log.sources);
    setMaterials([]);
    setPageTitleIndex({});
    setHasSearched(true);
  }

  const sidebar = (
    <HistorySidebar
      logs={logs}
      selectedLogId={selectedLogId}
      onSelect={handleSelectLog}
      loading={loadingLogs}
    />
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-80 shrink-0 md:block">{sidebar}</div>

        <div className="flex flex-1 flex-col">
          <div className="border-b px-4 py-3 md:hidden">
            <Sheet>
              <SheetTrigger
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Menu className="mr-2 size-4" />
                検索履歴
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>検索履歴</SheetTitle>
                </SheetHeader>
                {sidebar}
              </SheetContent>
            </Sheet>
          </div>

          <div
            className={`flex flex-1 flex-col px-4 py-8 sm:px-8 ${
              hasSearched ? "justify-start gap-8" : "items-center justify-center"
            }`}
          >
            <div
              className={`w-full ${hasSearched ? "max-w-3xl" : "flex flex-col items-center gap-6"}`}
            >
              {!hasSearched ? (
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    DIPSマニュアル検索
                  </h1>
                  <p className="text-muted-foreground">
                    質問を入力すると、参照マニュアルとページ、回答ヒントを表示します。
                  </p>
                </div>
              ) : null}

              <SearchBox
                value={query}
                onChange={setQuery}
                onSubmit={() => void handleSearch()}
                loading={searching}
                large={!hasSearched}
                showSuggestions={!hasSearched}
                onSelectSuggestion={(suggestion) =>
                  void handleSearch(suggestion)
                }
              />
            </div>

            {hasSearched ? (
              <AnswerPanel
                query={activeQuery}
                answer={answer}
                sources={sources}
                materials={materials}
                pageTitleIndex={pageTitleIndex}
                streaming={searching}
              />
            ) : null}
          </div>
        </div>
      </div>

      <footer className="border-t bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
        本ツールはマニュアルの検索補助です。最終確認は必ず公式マニュアルで行ってください。
      </footer>
    </div>
  );
}
