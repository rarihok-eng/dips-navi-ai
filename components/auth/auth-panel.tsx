"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import {
  InAppBrowserNotice,
  useInAppBrowser,
} from "@/components/auth/in-app-browser-notice";

type AuthPanelProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const { ready, kind } = useInAppBrowser();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <InAppBrowserNotice />
      {kind ? (
        <p className="text-center text-sm text-muted-foreground">
          外部ブラウザで開いたあと、このページで{mode === "sign-in" ? "ログイン" : "新規登録"}
          できます。
        </p>
      ) : ready ? (
        mode === "sign-in" ? (
          <SignIn />
        ) : (
          <SignUp />
        )
      ) : null}
    </div>
  );
}
