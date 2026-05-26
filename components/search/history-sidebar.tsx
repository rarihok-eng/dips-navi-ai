"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { SearchLogItem } from "@/lib/types/search";

type HistorySidebarProps = {
  logs: SearchLogItem[];
  selectedLogId?: string;
  onSelect: (log: SearchLogItem) => void;
  loading?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HistorySidebar({
  logs,
  selectedLogId,
  onSelect,
  loading = false,
}: HistorySidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r bg-muted/20">
      <div className="flex items-center gap-2 px-4 py-4">
        <History className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">検索履歴</h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-2">
        {loading ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">読み込み中...</p>
        ) : logs.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            履歴はまだありません。
          </p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <Button
                key={log.logId}
                variant={selectedLogId === log.logId ? "secondary" : "ghost"}
                className="h-auto w-full justify-start px-3 py-3 text-left whitespace-normal"
                onClick={() => onSelect(log)}
              >
                <div className="space-y-1">
                  <p className="line-clamp-2 text-sm font-medium">{log.query}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
