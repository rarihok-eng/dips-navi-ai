"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProgressEvent = {
  type: string;
  manualName?: string;
  chunks?: number;
  error?: string;
  totalChunks?: number;
  index?: number;
  total?: number;
  errors?: string[];
  message?: string;
};

export default function AdminIngestPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  async function startIngest() {
    setRunning(true);
    setLogs([]);
    setSummary(null);

    try {
      const response = await fetch("/api/admin/ingest", { method: "POST" });
      if (!response.ok || !response.body) {
        throw new Error(`Ingest failed with status ${response.status}`);
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
          const data = JSON.parse(dataLine.replace("data: ", "")) as ProgressEvent;

          if (event === "progress") {
            if (data.type === "manual_start") {
              setLogs((prev) => [
                ...prev,
                `[${data.index}/${data.total}] 処理中: ${data.manualName}`,
              ]);
            } else if (data.type === "manual_done") {
              setLogs((prev) => [
                ...prev,
                `  完了: ${data.manualName} (${data.chunks} chunks)`,
              ]);
            } else if (data.type === "manual_error") {
              setLogs((prev) => [
                ...prev,
                `  エラー: ${data.manualName} - ${data.error}`,
              ]);
            }
          } else if (event === "complete") {
            setSummary(`投入完了: 合計 ${data.totalChunks} chunks`);
            if (data.errors?.length) {
              setLogs((prev) => [
                ...prev,
                ...data.errors!.map((item) => `エラー: ${item}`),
              ]);
            }
          } else if (event === "error") {
            setSummary(`失敗: ${data.message}`);
          }
        }
      }
    } catch (error) {
      setSummary(
        error instanceof Error ? error.message : "インジェクションに失敗しました",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>マニュアル インジェクション（管理者）</CardTitle>
          <CardDescription>
            国交省公開PDFをダウンロードし、Pineconeへベクトル化して投入します。
            初回は CLI（npm run ingest）の利用を推奨します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={startIngest} disabled={running}>
            {running ? "投入中..." : "再インデックスを開始"}
          </Button>
          {summary ? (
            <p className="text-sm font-medium text-primary">{summary}</p>
          ) : null}
          <ScrollArea className="h-80 rounded-md border p-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              {logs.length === 0 ? (
                <p>ログはここに表示されます。</p>
              ) : (
                logs.map((log, index) => <p key={`${log}-${index}`}>{log}</p>)
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
