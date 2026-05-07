/**
 * Vercel API Route: /api/fx
 * 환율 조회 (서버사이드) - USD·JPY·EUR·CNY → KRW 지원
 *
 * Query params:
 *   base  - 기준통화 (USD|JPY|EUR|CNY, 기본값: USD)
 *   quote - 대상통화 (기본값: KRW)
 *
 * Response: { ok: true, rate, asOf, source, base, quote }
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

// 통화별 유효 범위 검증
function isValidRate(rate, base) {
  if (!Number.isFinite(rate) || rate <= 0) return false;
  const ranges = {
    USD: [900, 2000],
    JPY: [6, 15],      // 100엔 기준 아님, 1엔 기준
    EUR: [1200, 2000],
    CNY: [150, 280],
  };
  const [min, max] = ranges[base] || [0, Infinity];
  return rate >= min && rate <= max;
}

// Yahoo Finance 심볼 맵
const YAHOO_SYMBOLS = {
  USD: "USDKRW=X",
  JPY: "JPYKRW=X",
  EUR: "EURKRW=X",
  CNY: "CNYKRW=X",
};

async function fromYahoo(base) {
  const symbol = YAHOO_SYMBOLS[base];
  if (!symbol) throw new Error(`지원하지 않는 통화: ${base}`);
  const res = await fetchWithTimeout(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const j = await res.json();
  const rate = n(j?.chart?.result?.[0]?.meta?.regularMarketPrice);
  if (!isValidRate(rate, base)) throw new Error(`Yahoo: ${base} 유효 환율 없음 (${rate})`);
  return { rate, asOf: new Date().toISOString(), source: "yahoo" };
}

async function fromExchangeRateAPI(base) {
  const res = await fetchWithTimeout(
    `https://open.er-api.com/v6/latest/${base}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`ExchangeRate-API HTTP ${res.status}`);
  const j = await res.json();
  const rate = n(j?.rates?.KRW);
  if (!isValidRate(rate, base)) throw new Error(`ExchangeRate-API: ${base} 유효 환율 없음`);
  return {
    rate,
    asOf: j?.time_last_update_utc || new Date().toISOString(),
    source: "exchangerate-api",
  };
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") || "USD").toUpperCase();
  const quote = (searchParams.get("quote") || "KRW").toUpperCase();

  if (quote !== "KRW") {
    return new Response(
      JSON.stringify({ ok: false, error: "현재 KRW 환산만 지원합니다" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!YAHOO_SYMBOLS[base]) {
    return new Response(
      JSON.stringify({ ok: false, error: `지원 통화: USD, JPY, EUR, CNY` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const errors = [];

  for (const [label, fn] of [
    ["Yahoo", () => fromYahoo(base)],
    ["ExchangeRate-API", () => fromExchangeRateAPI(base)],
  ]) {
    try {
      const result = await fn();
      return new Response(
        JSON.stringify({ ok: true, base, quote, ...result }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    } catch (e) {
      errors.push(`${label}: ${e.message}`);
    }
  }

  return new Response(
    JSON.stringify({ ok: false, error: "환율 조회 실패", details: errors }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
