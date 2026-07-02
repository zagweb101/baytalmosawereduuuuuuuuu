import { NextResponse } from "next/server";
import {
  getInfrastructureStatus,
  isProductionReady,
} from "@/lib/config/infrastructure";
import { db } from "@/lib/db";
import { getStorageEnvCheck } from "@/lib/storage";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }

  const infrastructure = getInfrastructureStatus();
  const productionReady = isProductionReady(infrastructure);

  return NextResponse.json({
    status: "ok",
    database: "connected",
    productionReady,
    payments: infrastructure.payments.status,
    email: infrastructure.email.status,
    storage: infrastructure.storage.status,
    auth: infrastructure.auth.ready,
    site: infrastructure.site.issues.length === 0,
    ...(process.env.HEALTH_DETAILED === "true"
      ? {
          storageEnv: getStorageEnvCheck(),
          authIssues: infrastructure.auth.issues,
          siteIssues: infrastructure.site.issues,
        }
      : {}),
  });
}
