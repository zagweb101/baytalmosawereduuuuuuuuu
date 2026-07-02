import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { isStorageEnabled, uploadFile } from "@/lib/storage";
import { sanitizeUploadFolder, validateUploadFile } from "@/lib/upload-policy";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.INSTRUCTOR)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (!isStorageEnabled()) {
    return NextResponse.json(
      { error: "التخزين السحابي غير مضبوط" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = sanitizeUploadFolder(String(formData.get("folder") ?? "uploads"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ملف مطلوب" }, { status: 400 });
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = await uploadFile(file, folder);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ url: result.url });
}
