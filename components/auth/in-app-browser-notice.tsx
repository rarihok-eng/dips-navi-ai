"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  detectInAppBrowser,
  getInAppBrowserLabel,
  isAndroid,
  isIos,
  type InAppBrowserKind,
} from "@/lib/auth/in-app-browser";

type InAppBrowserNoticeProps = {
  targetUrl?: string;
  compact?: boolean;
};

function buildOpenInstructions(kind: InAppBrowserKind, userAgent: string): string[] {
  if (kind === "line" && isIos(userAgent)) {
    return [
      "画面右上の「⋯」メニューをタップ",
      "「Safariで開く」を選択",
      "Safariで再度「ログイン」を実行",
    ];
  }

  if (kind === "line" && isAndroid(userAgent)) {
    return [
      "画面右上のメニュー（⋯）をタップ",
      "「他のブラウザで開く」または Chrome を選択",
      "Chrome で再度「ログイン」を実行",
    ];
  }

  return [
    "URLをコピーして Safari または Chrome に貼り付け",
    "通常のブラウザで再度「ログイン」を実行",
  ];
}

export function useInAppBrowser(): {
  ready: boolean;
  kind: InAppBrowserKind | null;
} {
  const [state, setState] = useState<{
    ready: boolean;
    kind: InAppBrowserKind | null;
  }>({ ready: false, kind: null });

  useEffect(() => {
    setState({
      ready: true,
      kind: detectInAppBrowser(navigator.userAgent),
    });
  }, []);

  return state;
}

export function InAppBrowserNotice({
  targetUrl,
  compact = false,
}: InAppBrowserNoticeProps) {
  const { kind } = useInAppBrowser();
  const [copied, setCopied] = useState(false);
  const [userAgent, setUserAgent] = useState("");

  useEffect(() => {
    setUserAgent(navigator.userAgent);
  }, []);

  const pageUrl = useMemo(() => {
    if (targetUrl) return targetUrl;
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [targetUrl]);

  if (!kind) return null;

  const browserLabel = getInAppBrowserLabel(kind);
  const instructions = buildOpenInstructions(kind, userAgent);

  async function copyUrl() {
    if (!pageUrl) return;

    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("以下のURLをコピーして Safari / Chrome で開いてください", pageUrl);
    }
  }

  function openInExternalBrowser() {
    if (!pageUrl || !isAndroid(userAgent)) return;

    const withoutScheme = pageUrl.replace(/^https?:\/\//, "");
    window.location.href = `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">
          {browserLabel} 内では Google ログインが利用できません
        </p>
        <p className="mt-1 text-amber-900">
          Safari または Chrome で開いてからログインしてください。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copyUrl}>
            <Copy className="mr-1 size-3.5" />
            {copied ? "コピーしました" : "URLをコピー"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-amber-300 bg-amber-50/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-amber-950">
          <AlertTriangle className="size-5 shrink-0" />
          {browserLabel} からは Google ログインできません
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-amber-950">
        <p>
          {browserLabel}
          のアプリ内ブラウザでは、Google の安全ポリシーによりログインがブロックされます（エラー
          403: disallowed_useragent）。
        </p>
        <p>
          <strong>Safari</strong> または <strong>Chrome</strong>{" "}
          でこのページを開き直してから、ログインしてください。
        </p>

        <ol className="list-decimal space-y-1 pl-5">
          {instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copyUrl}>
            <Copy className="mr-1 size-4" />
            {copied ? "URLをコピーしました" : "URLをコピー"}
          </Button>
          {isAndroid(userAgent) ? (
            <Button type="button" onClick={openInExternalBrowser}>
              <ExternalLink className="mr-1 size-4" />
              Chrome で開く
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
