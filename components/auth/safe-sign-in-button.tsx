"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { useInAppBrowser } from "@/components/auth/in-app-browser-notice";
import { cn } from "@/lib/utils";

type SafeSignInButtonProps = {
  children: React.ReactNode;
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  className?: string;
};

export function SafeSignInButton({
  children,
  size = "default",
  className,
}: SafeSignInButtonProps) {
  const { ready, kind } = useInAppBrowser();

  if (!ready || kind) {
    return (
      <Link
        href="/sign-in"
        className={cn(buttonVariants({ size }), className)}
      >
        {children}
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <Button size={size} className={className}>
        {children}
      </Button>
    </SignInButton>
  );
}
