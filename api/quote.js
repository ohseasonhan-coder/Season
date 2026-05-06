/**
 * Vercel API Route: /api/quote
 * 주식·ETF 실시간 시세 조회 (서버사이드 - CORS 우회)
 *
 * Query params:
 *   symbol  - 티커 심볼 (예: 005930.KS, AAPL, 133690.KS)
 *   name    - 종목명 (검색 보조용)
 *
 * Response: { ok: true, item: { currentPrice, asOf, symbol, market, currency, source } }
 */

export const config = { runtime: "edge" };

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function n(v) {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
}

// ── 1. Yahoo Finance v8 (KRX: .KS 접미사 / 미국주식: 직접)
async function fromYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const j = await res.json();
  const meta = j?.chart?.result?.[0]?.meta;
  if (!meta || n(meta.regularMarketPrice) <= 0) throw new Error("Yahoo: 유효한 시세 없음");
  return {
    currentPrice: n(meta.regularMarketPrice),
    asOf: new Date(n(meta.regularMarketTime) * 1000).toISOString(),
    symbol: meta.symbol || symbol,
    market: meta.fullExchangeName || "",
    currency: meta.currency || "KRW",
    source: "yahoo",
  };
}

// ── 2. 네이버 금융 (KRX ETF/주식 전용)
async function fromNaver(code6) {
  const url = `https://finance.naver.com/item/main.naver?code=${code6}`;
  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}`);
  const text = await res.text();

  // 네이버 현재가 파싱: <p class="no_today"> ... <span class="blind">현재가</span> 123,456
  let price = 0;
  const m1 = text.match(/em class="no_up[^"]*"[^>]*>([\d,]+)/);
  const m2 = text.match(/em class="no_dn[^"]*"[^>]*>([\d,]+)/);
  const m3 = text.match(/em class="no_change[^"]*"[^>]*>([\d,]+)/);
  const match = m1 || m2 || m3;
  if (match) price = n(match[1].replace(/,/g, ""));

  // 대안 파싱: og:description 또는 regularMarketPrice
  if (price <= 0) {
    const m4 = text.match(/현재가[^0-9]*([\d,]+)/);
    if (m4) price = n(m4[1].replace(/,/g, ""));
  }

  if (price <= 0) throw new Error("Naver: 시세 파싱 실패");
  return {
    currentPrice: price,
    asOf: new Date().toISOString(),
    symbol: code6 + ".KS",
    market: "KRX",
    currency: "KRW",
    source: "naver",
  };
}

// ── 3. Yahoo Finance v7 (대안 엔드포인트)
async function fromYahooV7(symbol) {
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo v7 HTTP ${res.status}`);
  const j = await res.json();
  const q = j?.quoteResponse?.result?.[0];
  if (!q || n(q.regularMarketPrice) <= 0) throw new Error("Yahoo v7: 유효한 시세 없음");
  return {
    currentPrice: n(q.regularMarketPrice),
    asOf: new Date(n(q.regularMarketTime) * 1000).toISOString(),
    symbol: q.symbol || symbol,
    market: q.fullExchangeName || q.exchange || "",
    currency: q.currency || "KRW",
    source: "yahoo-v7",
  };
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").trim();
  const name = (searchParams.get("name") || "").trim();

  if (!symbol && !name) {
    return new Response(JSON.stringify({ ok: false, error: "symbol 파라미터 필요" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isKrx = /^\d{6}\.KS$/.test(symbol) || /^\d{6}$/.test(symbol);
  const code6 = symbol.replace(/\.KS$/i, "").padStart(6, "0");
  const yahooSymbol = isKrx ? (code6 + ".KS") : symbol;

  const errors = [];

  // KRX: 네이버 먼저 시도 (정확도 높음)
  if (isKrx) {
    try {
      const item = await fromNaver(code6);
      return new Response(JSON.stringify({ ok: true, item }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
      });
    } catch (e) {
      errors.push(`Naver: ${e.message}`);
    }
  }

  // Yahoo v8
  try {
    const item = await fromYahoo(yahooSymbol);
    return new Response(JSON.stringify({ ok: true, item }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    errors.push(`Yahoo v8: ${e.message}`);
  }

  // Yahoo v7 (대안)
  try {
    const item = await fromYahooV7(yahooSymbol);
    return new Response(JSON.stringify({ ok: true, item }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    errors.push(`Yahoo v7: ${e.message}`);
  }

  return new Response(
    JSON.stringify({ ok: false, error: "모든 시세 소스 실패", details: errors }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
