import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const requestId = String(body.requestId || "");
  const dryRun = body.dryRun !== false;
  if (!requestId) return json({ error: "requestId is required" }, 400);
  return json({
    ok: true,
    dryRun,
    requestId,
    targets: ["season_profiles", "season_notifications", "season_ops_audit_logs"],
    message: dryRun ? "Dry-run completed. No data deleted." : "Delete placeholder completed. Implement service-role deletion.",
    processedAt: new Date().toISOString(),
  });
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
