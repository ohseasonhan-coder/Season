/**
 * Vercel API Route: /api/bulk-quotes
 * 복수 종목 시세 일괄 조회
 *
 * POST body: { items: [{ id, symbol, name, market, currency, code, ticker }] }
 * Response:  { ok: true, results: [{ id, ok, currentPrice, asOf, symbol, currency, source, stale }] }
 */

export const config = { runtime: "edge" };

const TIMEOUT_MS = 8000;
const MAX_CONCURRENT = 5; // 동시 요청 제한

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

async function fetchSingle(item) {
  const code6 = String(item.code || item.ticker || item.symbol || "")
    .replace(/\.KS$/i, "")
    .padStart(6, "0");
  const isKrx =
    /^\d{6}\.KS$/.test(item.symbol || "") ||
    /^\d{6}$/.test(item.code || item.ticker || "");
  const yahooSymbol = isKrx ? code6 + ".KS" : (item.symbol || item.ticker || "");

  // KRX: 네이버 먼저
  if (isKrx && code6) {
    try {
      const res = await fetchWithTimeout(
        `https://finance.naver.com/item/main.naver?code=${code6}`,
        { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR" } }
      );
      if (res.ok) {
        const text = await res.text();
        const m =
          text.match(/em class="no_up[^"]*"[^>]*>([\d,]+)/) ||
          text.match(/em class="no_dn[^"]*"[^>]*>([\d,]+)/) ||
          text.match(/em class="no_change[^"]*"[^>]*>([\d,]+)/);
        if (m) {
          const price = n(m[1].replace(/,/g, ""));
          if (price > 0) {
            return {
              id: item.id,
              ok: true,
              currentPrice: price,
              asOf: new Date().toISOString(),
              symbol: code6 + ".KS",
              currency: "KRW",
              source: "naver",
              stale: false,
            };
          }
        }
      }
    } catch (_) { /* fallthrough */ }
  }

  // Yahoo Finance v8
  if (yahooSymbol) {
    try {
      const res = await fetchWithTimeout(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
        { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }
      );
      if (res.ok) {
        const j = await res.json();
        const meta = j?.chart?.result?.[0]?.meta;
        if (meta && n(meta.regularMarketPrice) > 0) {
          return {
            id: item.id,
            ok: true,
            currentPrice: n(meta.regularMarketPrice),
            asOf: new Date(n(meta.regularMarketTime) * 1000).toISOString(),
            symbol: meta.symbol || yahooSymbol,
            currency: meta.currency || item.currency || "KRW",
            source: "yahoo",
            stale: false,
          };
        }
      }
    } catch (_) { /* fallthrough */ }
  }

  return { id: item.id, ok: false, stale: true };
}

// 동시성 제한 병렬 처리
async function batchFetch(items, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fetchSingle));
    results.push(...chunkResults);
  }
  return results;
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST만 허용" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "JSON 파싱 오류" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return new Response(JSON.stringify({ ok: true, results: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 최대 30개 제한 (Edge 실행시간 제한 대응)
  const limited = items.slice(0, 30);

  try {
    const results = await batchFetch(limited, MAX_CONCURRENT);
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
