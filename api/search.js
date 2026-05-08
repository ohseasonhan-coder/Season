/**
 * Vercel API Route: /api/search
 * 종목명/코드로 종목 검색
 *
 * Query params:
 *   q - 검색어 (종목명, 코드, 티커)
 *
 * Response: { ok: true, items: [{ name, code, ticker, symbol, market, currency }] }
 */

export const config = { runtime: "edge" };

const TIMEOUT_MS = 6000;

async function fetchWithTimeout(url, options = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

// Yahoo Finance 자동완성 검색
async function searchYahoo(q) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`;
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo search HTTP ${res.status}`);
  const j = await res.json();
  const quotes = j?.quotes || [];
  return quotes
    .filter((q) => q.quoteType !== "FUTURE" && q.symbol)
    .slice(0, 8)
    .map((q) => {
      const isKrx = q.exchange === "KSC" || q.exchange === "KOE" || /\.KS$/.test(q.symbol);
      const code = isKrx ? q.symbol.replace(/\.KS$/, "").padStart(6, "0") : q.symbol;
      return {
        name: q.shortname || q.longname || q.symbol,
        code,
        ticker: isKrx ? code : q.symbol,
        symbol: q.symbol,
        market: isKrx ? (q.quoteType === "ETF" ? "KRX ETF" : "KRX") : (q.exchange || "NASDAQ"),
        currency: isKrx ? "KRW" : "USD",
        assetClass: q.quoteType === "ETF" ? "기타" : "개별주식",
      };
    });
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 1) {
    return new Response(JSON.stringify({ ok: true, items: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const items = await searchYahoo(q);
    return new Response(JSON.stringify({ ok: true, items }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message, items: [] }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
