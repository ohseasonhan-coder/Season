import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const report = body.report || {};
  const income = Number(report.income || 0);
  const expense = Number(report.expense || 0);
  const net = income - expense;

  return json({
    title: `${report.month || "월간"} CFO 리포트`,
    conclusion: net >= 0 ? "순현금흐름이 양수입니다." : "순현금흐름이 음수입니다. 지출 점검이 필요합니다.",
    evidence: [`수입 ${income}`, `지출 ${expense}`, `순현금흐름 ${net}`],
    cautions: ["입력 데이터 기준의 참고용 리포트입니다.", "투자·세금 판단은 최신 제도와 개인 상황에 따라 달라질 수 있습니다."],
    nextActions: ["누락 거래 확인", "비상금 목표 점검", "ISA 한도 확인"],
    confidence: "medium",
    generatedAt: new Date().toISOString(),
  });
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
