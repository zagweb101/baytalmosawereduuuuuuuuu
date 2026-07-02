type ErrorContext = Record<string, unknown>;

export function captureError(error: unknown, context?: ErrorContext): void {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    at: new Date().toISOString(),
  };

  console.error("[monitoring]", JSON.stringify(payload));

  const webhook = process.env.MONITORING_WEBHOOK_URL;
  if (webhook) {
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}

export function captureMessage(message: string, context?: ErrorContext): void {
  console.log("[monitoring]", message, context ?? "");
}
