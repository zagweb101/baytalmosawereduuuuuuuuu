import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import VerifyEmailForm from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
