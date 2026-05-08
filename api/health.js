/**
 * Vercel API Route: /api/health
 * 서버 상태 확인 (포트폴리오 탭 서버 연결 표시용)
 */

export const config = { runtime: "edge" };

export default async function handler() {
  return new Response(
    JSON.stringify({ ok: true, ts: new Date().toISOString() }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
