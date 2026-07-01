import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import ForgotPasswordForm from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
