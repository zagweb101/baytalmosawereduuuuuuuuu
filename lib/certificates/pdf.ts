import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { ensureCertificateFont } from "@/lib/certificates/font";

export type CertificatePdfData = {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: Date;
  siteName?: string;
};

function resolveFontPath(): string | null {
  const local = path.join(process.cwd(), "assets/fonts/Cairo-Regular.ttf");
  if (fs.existsSync(local)) return local;
  return null;
}

export async function generateCertificatePdf(
  data: CertificatePdfData,
): Promise<Buffer> {
  const fontPath = resolveFontPath() ?? (await ensureCertificateFont());

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      if (fontPath) {
        doc.registerFont("Cairo", fontPath);
        doc.font("Cairo");
      } else {
        doc.font("Helvetica");
      }
    } catch {
      doc.font("Helvetica");
    }

    const w = doc.page.width;
    const purple = "#6B21A8";
    const magenta = "#DB2777";

    doc
      .rect(30, 30, w - 60, doc.page.height - 60)
      .lineWidth(2)
      .strokeColor(purple)
      .stroke();

    doc
      .fontSize(32)
      .fillColor(purple)
      .text(data.siteName ?? "بيت المصور", 0, 70, { align: "center" });

    doc
      .fontSize(22)
      .fillColor("#111")
      .text("شهادة إتمام", 0, 120, { align: "center" });

    doc
      .fontSize(14)
      .fillColor("#555")
      .text("تُمنح هذه الشهادة إلى", 0, 170, { align: "center" });

    doc
      .fontSize(26)
      .fillColor(magenta)
      .text(data.studentName, 0, 200, { align: "center" });

    doc
      .fontSize(14)
      .fillColor("#555")
      .text("لإتمام دورة", 0, 250, { align: "center" });

    doc
      .fontSize(20)
      .fillColor("#111")
      .text(`«${data.courseTitle}»`, 60, 280, {
        align: "center",
        width: w - 120,
      });

    const dateStr = new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(data.issuedAt);

    doc
      .fontSize(11)
      .fillColor("#666")
      .text(`تاريخ الإصدار: ${dateStr}`, 0, 360, { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#888")
      .text(`رقم الشهادة: ${data.certificateNumber}`, 0, 390, {
        align: "center",
      });

    const verifyUrl =
      (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") +
      "/verify-certificate";

    doc
      .fontSize(9)
      .fillColor("#999")
      .text(`للتحقق: ${verifyUrl}`, 0, 420, { align: "center" });

    doc.end();
  });
}
