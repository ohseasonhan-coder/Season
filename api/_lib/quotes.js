const MANUAL_SYMBOLS = [
  { name: "삼성전자", code: "005930", symbol: "005930.KS", market: "KRX", currency: "KRW" },
  { name: "삼성전자우", code: "005935", symbol: "005935.KS", market: "KRX", currency: "KRW" },
  { name: "SK하이닉스", code: "000660", symbol: "000660.KS", market: "KRX", currency: "KRW" },
  { name: "NAVER", code: "035420", symbol: "035420.KS", market: "KRX", currency: "KRW" },
  { name: "카카오", code: "035720", symbol: "035720.KS", market: "KRX", currency: "KRW" },
  { name: "TIGER 나스닥100", code: "133690", symbol: "133690.KS", market: "KRX ETF", currency: "KRW" },
  { name: "TIGER 나스닥100(H)", code: "448300", symbol: "448300.KS", market: "KRX ETF", currency: "KRW" },
  { name: "TIGER 배당다우존스", code: "458730", symbol: "458730.KS", market: "KRX ETF", currency: "KRW" },
  { name: "TIGER 반도체 TOP10", code: "396500", symbol: "396500.KS", market: "KRX ETF", currency: "KRW" },
  { name: "KODEX 원자력 SMR", code: "471460", symbol: "471460.KS", market: "KRX ETF", currency: "KRW" },
  { name: "KODEX 미국AI전력핵심인프라", code: "487230", symbol: "487230.KS", market: "KRX ETF", currency: "KRW" },
  { name: "KODEX KOFR금리액티브(합성)", code: "423160", symbol: "423160.KS", market: "KRX ETF", currency: "KRW" },
  { name: "Amazon", code: "AMZN", symbol: "AMZN", market: "NASDAQ", currency: "USD" },
  { name: "Alphabet Class A", code: "GOOGL", symbol: "GOOGL", market: "NASDAQ", currency: "USD" },
  { name: "Alphabet Class C", code: "GOOG", symbol: "GOOG", market: "NASDAQ", currency: "USD" },
  { name: "Apple", code: "AAPL", symbol: "AAPL", market: "NASDAQ", currency: "USD" },
  { name: "Microsoft", code: "MSFT", symbol: "MSFT", market: "NASDAQ", currency: "USD" },
  { name: "NVIDIA", code: "NVDA", symbol: "NVDA", market: "NASDAQ", currency: "USD" },
  { name: "Tesla", code: "TSLA", symbol: "TSLA", market: "NASDAQ", currency: "USD" },
];

export function normalizeQuery(q) {
  return String(q || "").trim().toLowerCase().replace(/\s+/g, "");
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
    ...init,
  });
}

export function optionsHandler() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export function resolveLocalItem({ name, code, symbol }) {
  const nq = normalizeQuery(name);
  return MANUAL_SYMBOLS.find((item) =>
    (nq && normalizeQuery(item.name).includes(nq)) ||
    (code && item.code === code) ||
    (symbol && item.symbol === symbol)
  );
}

export async function yahooSearch(q) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=ko-KR&region=KR&quotesCount=12&newsCount=0`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json,text/plain,*/*",
    },
  });
  if (!res.ok) throw new Error(`Yahoo search failed: ${res.status}`);
  const data = await res.json();
  return (data.quotes || []).map((item) => ({
    name: item.shortname || item.longname || item.symbol,
    code: item.symbol,
    symbol: item.symbol,
    market: item.exchange || item.exchDisp || "",
    currency: item.currency || "",
  }));
}

export async function yahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json,text/plain,*/*",
    },
  });
  if (!res.ok) throw new Error(`Yahoo quote failed: ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No quote result");
  const meta = result.meta || {};
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  let price = meta.regularMarketPrice || meta.previousClose || null;
  if (!price && closes.length) {
    for (let i = closes.length - 1; i >= 0; i -= 1) {
      if (typeof closes[i] === "number") {
        price = closes[i];
        break;
      }
    }
  }
  const latestTs = timestamps.length ? timestamps[timestamps.length - 1] * 1000 : Date.now();
  return {
    symbol,
    price,
    previousClose: meta.previousClose ?? null,
    currency: meta.currency || "",
    exchangeName: meta.exchangeName || meta.fullExchangeName || "",
    regularMarketTime: new Date(latestTs).toISOString(),
  };
}

export { MANUAL_SYMBOLS, json };
