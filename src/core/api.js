export async function postJson(url, { token, body } = {}) {
  if (!url) throw new Error("Endpoint가 설정되지 않았습니다.");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `요청 실패: ${res.status}`);
  return json;
}

export function validateAiResponse(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object") errors.push("응답이 객체가 아닙니다.");
  if (!raw?.title) errors.push("title 누락");
  if (!raw?.conclusion) errors.push("conclusion 누락");

  return {
    ok: errors.length === 0,
    errors,
    data: {
      title: raw?.title || "CFO 리포트",
      conclusion: raw?.conclusion || "AI 응답 검증에 실패하여 기본 리포트로 대체했습니다.",
      evidence: Array.isArray(raw?.evidence) ? raw.evidence : [],
      nextActions: Array.isArray(raw?.nextActions) ? raw.nextActions : [],
      cautions: Array.isArray(raw?.cautions) ? raw.cautions : ["입력 데이터 기준의 참고용입니다."],
      confidence: raw?.confidence || "low",
    },
  };
}
