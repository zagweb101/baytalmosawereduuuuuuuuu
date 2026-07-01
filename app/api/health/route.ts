import { NextResponse } from "next/server";
import {
  getInfrastructureStatus,
  isProductionReady,
} from "@/lib/config/infrastructure";
import { db } from "@/lib/db";

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

  return NextResponse.json({
    status: "ok",
    database: "connected",
    productionReady: isProductionReady(infrastructure),
    payments: infrastructure.payments.provider,
    email: infrastructure.email.status,
    storage: infrastructure.storage.status,
  });
}
