/**
 * Vercel API Route: /api/fx
 * 환율 조회 (서버사이드)
 *
 * Query params:
 *   base  - 기준통화 (기본값: USD)
 *   quote - 대상통화 (기본값: KRW)
 *
 * Response: { ok: true, rate, asOf, source }
 */

export const config = { runtime: "edge" };

const TIMEOUT_MS = 7000;

async function fetchWithTimeout(url, options = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

function n(v) {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
}

function isValidRate(r) {
  return Number.isFinite(r) && r > 900 && r < 2000;
}

// ── 1. Yahoo Finance (USDKRW=X)
async function fromYahoo() {
  const res = await fetchWithTimeout(
    "https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d",
    { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const j = await res.json();
  const rate = n(j?.chart?.result?.[0]?.meta?.regularMarketPrice);
  if (!isValidRate(rate)) throw new Error("Yahoo: 유효 환율 없음");
  return { rate, asOf: new Date().toISOString(), source: "yahoo" };
}

// ── 2. ExchangeRate-API (무료, 제한 있음)
async function fromExchangeRateAPI() {
  const res = await fetchWithTimeout(
    "https://open.er-api.com/v6/latest/USD",
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`ExchangeRate-API HTTP ${res.status}`);
  const j = await res.json();
  const rate = n(j?.rates?.KRW);
  if (!isValidRate(rate)) throw new Error("ExchangeRate-API: 유효 환율 없음");
  return {
    rate,
    asOf: j?.time_last_update_utc || new Date().toISOString(),
    source: "exchangerate-api",
  };
}

// ── 3. Frankfurter (ECB 기반, USD→KRW 지원 제한적)
async function fromFrankfurter() {
  const res = await fetchWithTimeout(
    "https://api.frankfurter.app/latest?from=USD&to=KRW",
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const j = await res.json();
  const rate = n(j?.rates?.KRW);
  if (!isValidRate(rate)) throw new Error("Frankfurter: 유효 환율 없음");
  return { rate, asOf: j?.date || new Date().toISOString(), source: "frankfurter" };
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") || "USD").toUpperCase();
  const quote = (searchParams.get("quote") || "KRW").toUpperCase();

  if (base !== "USD" || quote !== "KRW") {
    return new Response(
      JSON.stringify({ ok: false, error: "현재 USD→KRW 환율만 지원합니다" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const errors = [];

  for (const [label, fn] of [
    ["Yahoo", fromYahoo],
    ["ExchangeRate-API", fromExchangeRateAPI],
    ["Frankfurter", fromFrankfurter],
  ]) {
    try {
      const result = await fn();
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      });
    } catch (e) {
      errors.push(`${label}: ${e.message}`);
    }
  }

  return new Response(
    JSON.stringify({ ok: false, error: "모든 환율 소스 실패", details: errors }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
