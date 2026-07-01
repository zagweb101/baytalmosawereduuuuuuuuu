import Link from "next/link";
import { getMyCertificates } from "@/lib/actions/certificates";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Award } from "lucide-react";

export default async function CertificatesPage() {
  const certificates = await getMyCertificates();

  if (certificates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<Award className="h-12 w-12" />}
          title="لا توجد شهادات"
          description="أكمل دورة واجتز الاختبار للحصول على شهادة"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">شهاداتي</h1>
      <div className="grid gap-4">
        {certificates.map((cert) => (
          <Card key={cert.id}>
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{cert.course.title}</h3>
                <p className="text-sm text-muted mt-1">
                  {cert.certificateNumber}
                </p>
                <p className="text-xs text-muted mt-1">
                  {formatDate(cert.issuedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <a href={`/api/certificates/${cert.id}/pdf`} download>
                  <Button size="sm">تحميل PDF</Button>
                </a>
                <Link href="/verify-certificate">
                  <Button variant="outline" size="sm">
                    التحقق
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
