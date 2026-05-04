import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase();
  const admins = String(Deno.env.get("ADMIN_EMAILS") || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return json({ allowed: Boolean(email && admins.includes(email)), email, checkedAt: new Date().toISOString() });
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
