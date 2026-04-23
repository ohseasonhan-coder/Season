import { json, optionsHandler, resolveLocalItem, yahooQuote } from "./_lib/quotes.js";

export function OPTIONS() {
  return optionsHandler();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];
    const results = [];

    for (const item of items) {
      try {
        let symbol = String(item.symbol || "").trim();
        if (!symbol) {
          const local = resolveLocalItem(item);
          if (local) symbol = local.symbol;
        }
        if (!symbol && /^\d{6}$/.test(String(item.code || ""))) symbol = `${item.code}.KS`;
        if (!symbol) {
          results.push({ ok: false, name: item.name || "", symbol: "", message: "No symbol" });
          continue;
        }

        const quote = await yahooQuote(symbol);
        results.push({
          ok: true,
          name: item.name || symbol,
          code: item.code || symbol,
          symbol,
          currentPrice: quote.price,
          currency: item.currency || quote.currency || "",
          asOf: quote.regularMarketTime,
        });
      } catch (error) {
        results.push({
          ok: false,
          name: item.name || "",
          symbol: item.symbol || "",
          message: error.message || "failed",
        });
      }
    }

    const success = results.filter((r) => r.ok).length;
    const failed = results.length - success;
    return json({ ok: true, success, failed, results });
  } catch (error) {
    return json({ ok: false, message: error.message || "Bulk quote failed" }, { status: 500 });
  }
}
