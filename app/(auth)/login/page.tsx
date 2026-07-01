import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
