// Auto-split facade: grouped exports from the stable legacy core.
export {
  normalizeStockQuery,
  buildServerSymbolFromRow,
  normalizeCurrency,
  getFxUsdKrw,
  getFxRate,
  priceToKRW,
  investedToKRW,
  loadMarketCache,
  saveMarketCache,
  isFreshMarketAsOf,
  cacheQuoteKey,
  getCachedQuote,
  rememberQuote
} from "../seasonCore.jsx";
