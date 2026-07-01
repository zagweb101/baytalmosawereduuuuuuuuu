import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/certificates/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { certificateId } = await params;

  const certificate = await db.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  if (!certificate) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const isOwner = certificate.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const settings = await db.platformSettings.findUnique({
    where: { id: "default" },
  });

  const pdf = await generateCertificatePdf({
    studentName: certificate.user.name,
    courseTitle: certificate.course.title,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    siteName: settings?.siteName,
  });

  const filename = `certificate-${certificate.certificateNumber}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
