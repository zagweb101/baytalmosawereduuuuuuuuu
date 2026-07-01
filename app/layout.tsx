import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "بيت المصور | منصة تعليمية للمصورين",
    template: "%s | بيت المصور",
  },
  description:
    "منصة بيت المصور التعليمية - تعلّم التصوير الفوتوغرافي، المونتاج، والإضاءة مع أفضل المدربين العرب",
  keywords: [
    "تصوير",
    "تعليم",
    "مصور",
    "دورات",
    "فوتوغرافي",
    "مونتاج",
    "بيت المصور",
  ],
  authors: [{ name: "بيت المصور" }],
  openGraph: {
    title: "بيت المصور | منصة تعليمية للمصورين",
    description:
      "منصة تعليمية متخصصة في التصوير الفوتوغرافي والفيديو للمصورين العرب",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
