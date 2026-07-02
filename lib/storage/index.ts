import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export function isStorageEnabled(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_ENDPOINT,
  );
}

/** للتشخيص فقط — يوضح أي متغيرات S3 موجودة بدون كشف القيم */
export function getStorageEnvCheck() {
  const keys = [
    "S3_ENDPOINT",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_PUBLIC_URL",
    "S3_REGION",
  ] as const;

  return Object.fromEntries(
    keys.map((key) => [key, Boolean(process.env[key]?.trim())]),
  );
}

function getClient(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function uploadFile(
  file: File,
  folder: string,
): Promise<{ url: string } | { error: string }> {
  if (!isStorageEnabled()) {
    return { error: "التخزين السحابي غير مضبوط. أدخل رابط الملف يدوياً." };
  }

  const bucket = process.env.S3_BUCKET!;
  const key = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const body = Buffer.from(await file.arrayBuffer());

  try {
    const client = getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      }),
    );
  } catch {
    return { error: "فشل رفع الملف." };
  }

  const publicBase =
    process.env.S3_PUBLIC_URL ??
    `${process.env.S3_ENDPOINT!.replace(/\/$/, "")}/${bucket}`;
  return { url: `${publicBase}/${key}` };
}
