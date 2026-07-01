import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
          <p className="text-center text-sm text-muted mt-6">
            <Link href="/" className="hover:text-foreground">
              ← العودة للرئيسية
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
