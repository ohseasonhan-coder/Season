/**
 * /api/debug
 * 배포 환경 자가진단 - 환경변수, 런타임 상태 확인
 */
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || "";

  const result = {
    ok: true,
    ts: new Date().toISOString(),
    env: {
      VITE_SUPABASE_URL: url
        ? `✅ 설정됨 (${url.slice(0, 30)}...)`
        : "❌ 누락 — Vercel 환경변수 미설정",
      VITE_SUPABASE_ANON_KEY: key
        ? `✅ 설정됨 (길이 ${key.length}자)`
        : "❌ 누락 — Vercel 환경변수 미설정",
    },
    runtime: "Vercel Edge",
    node_env: process.env.NODE_ENV || "unknown",
  };

  return new Response(JSON.stringify(result, null, 2), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
