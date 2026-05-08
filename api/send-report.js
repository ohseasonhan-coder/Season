/**
 * Vercel API Route: /api/send-report
 * 월간 리포트 이메일 발송
 *
 * Resend(https://resend.com) 무료 플랜 사용
 * 환경변수: RESEND_API_KEY
 *
 * POST body: { to, subject, html, month }
 */

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: "RESEND_API_KEY 환경변수가 설정되지 않았습니다. Vercel → Settings → Environment Variables에서 추가하세요." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "JSON 파싱 오류" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const { to, subject, html, month } = body;
  if (!to || !subject || !html) {
    return new Response(JSON.stringify({ ok: false, error: "to, subject, html 필수" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // 이메일 유효성 검사
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return new Response(JSON.stringify({ ok: false, error: "유효하지 않은 이메일 주소" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Season CFO <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: data?.message || "Resend API 오류" }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: data.id, to, month }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
