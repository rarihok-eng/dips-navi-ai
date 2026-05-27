import { AuthPanel } from "@/components/auth/auth-panel";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <AuthPanel mode="sign-up" />
    </div>
  );
}
