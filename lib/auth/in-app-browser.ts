export type InAppBrowserKind =
  | "line"
  | "facebook"
  | "instagram"
  | "twitter"
  | "wechat"
  | "generic";

const BROWSER_LABELS: Record<InAppBrowserKind, string> = {
  line: "LINE",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X（Twitter）",
  wechat: "WeChat",
  generic: "アプリ内ブラウザ",
};

/** Detect embedded browsers where Google OAuth is blocked (403 disallowed_useragent). */
export function detectInAppBrowser(userAgent: string): InAppBrowserKind | null {
  if (/Line\//i.test(userAgent)) return "line";
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return "facebook";
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/Twitter/i.test(userAgent)) return "twitter";
  if (/MicroMessenger/i.test(userAgent)) return "wechat";

  if (/Android/i.test(userAgent) && /;\s*wv\)/.test(userAgent)) {
    return "generic";
  }

  if (
    /iPhone|iPad|iPod/i.test(userAgent) &&
    /AppleWebKit/i.test(userAgent) &&
    !/Safari/i.test(userAgent)
  ) {
    return "generic";
  }

  return null;
}

export function getInAppBrowserLabel(kind: InAppBrowserKind): string {
  return BROWSER_LABELS[kind];
}

export function blocksGoogleOAuth(userAgent: string): boolean {
  return detectInAppBrowser(userAgent) !== null;
}

export function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

export function isIos(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}
