import { json, optionsHandler, resolveLocalItem, yahooQuote } from "./_lib/quotes.js";

export function OPTIONS() {
  return optionsHandler();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "";
    const code = searchParams.get("code") || "";
    let symbol = searchParams.get("symbol") || "";

    if (!symbol) {
      const local = resolveLocalItem({ name, code, symbol });
      if (local) symbol = local.symbol;
    }
    if (!symbol && /^\d{6}$/.test(String(code || ""))) symbol = `${code}.KS`;
    if (!symbol) return json({ ok: false, message: "symbol is required" }, { status: 400 });

    const quote = await yahooQuote(symbol);
    const local = resolveLocalItem({ name, code, symbol });
    return json({
      ok: true,
      item: {
        name: local?.name || name || symbol,
        code: local?.code || code || symbol,
        symbol,
        market: local?.market || quote.exchangeName || "",
        currency: local?.currency || quote.currency || "",
        currentPrice: quote.price,
        previousClose: quote.previousClose,
        asOf: quote.regularMarketTime,
      },
    });
  } catch (error) {
    return json({ ok: false, message: error.message || "Quote failed" }, { status: 500 });
  }
}
