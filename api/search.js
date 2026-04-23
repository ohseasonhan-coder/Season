import { MANUAL_SYMBOLS, json, normalizeQuery, optionsHandler, resolveLocalItem, yahooSearch } from "./_lib/quotes.js";

export function OPTIONS() {
  return optionsHandler();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) return json({ ok: true, items: [] });

    const localMatches = MANUAL_SYMBOLS.filter((item) => {
      const nq = normalizeQuery(q);
      return normalizeQuery(item.name).includes(nq) || item.code === q || item.symbol.toLowerCase() === q.toLowerCase();
    });

    let remoteMatches = [];
    try {
      remoteMatches = await yahooSearch(q);
    } catch {}

    const merged = [...localMatches, ...remoteMatches]
      .filter((v, idx, arr) => arr.findIndex((x) => x.symbol === v.symbol) === idx)
      .slice(0, 12);

    return json({ ok: true, items: merged });
  } catch (error) {
    return json({ ok: false, message: error.message || "Search failed" }, { status: 500 });
  }
}
