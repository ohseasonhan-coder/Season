
import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "asset-app-final-complete-v1";
const LEGACY_STORAGE_KEYS = ["asset-app-sidebar-premium-season-fixed", "asset-app-sidebar-premium-season-stock-server", "asset-app-excel-parity-v1"];

const todayISO = () => new Date().toISOString().slice(0, 10);
const thisMonthISO = () => new Date().toISOString().slice(0, 7);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const n = (v) => {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
};
const fmt = (v) => new Intl.NumberFormat("ko-KR").format(Math.round(n(v)));
const fmtPct = (v, d = 1) => `${n(v).toFixed(d)}%`;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const DEFAULT_CATEGORIES = {
  수입: {
    근로소득: ["월급", "상여금", "수당", "기타"],
    금융소득: ["이자", "배당", "매매차익", "환급"],
    기타수입: ["용돈", "중고판매", "기타"],
  },
  지출: {
    식비: ["외식", "식재료", "배달", "커피/간식"],
    주거: ["관리비", "전기/가스", "통신비", "인터넷"],
    교통: ["주유", "대중교통", "택시", "주차"],
    생활: ["생필품", "의류", "미용", "의료"],
    보험세금: ["보험료", "세금", "국민연금", "기타"],
    가족: ["육아", "부모님", "선물", "경조사"],
    취미여행: ["여행", "구독", "문화", "운동"],
    기타지출: ["기타"],
  },
  자산이동: {
    계좌이체: ["내계좌간이체"],
    투자: ["주식매수", "주식매도", "ETF매수", "ETF매도"],
    대출: ["대출실행", "대출상환"],
  },
};


function normalizeSalaryLabel(value) {
  return value === "월급(승훈)" || value === "월급(정원)" || value === "월급" ? "월급" : value;
}

function normalizeCategories(categories) {
  const merged = { ...DEFAULT_CATEGORIES, ...(categories || {}) };
  const income = { ...(merged.수입 || {}) };
  const labor = Array.isArray(income.근로소득) ? income.근로소득 : [];
  income.근로소득 = [...new Set(labor.map(normalizeSalaryLabel))];
  merged.수입 = income;
  return merged;
}

const DEFAULT_SETTINGS = {
  currentAge: 36,
  retireAge: 55,
  lifeExpectancy: 100,
  currentNetWorthOverride: "",
  monthlySalary1: 0,
  monthlySalary2: 0,
  monthlyInvestDefault: 2000000,
  annualReturnNasdaq: 0.12,
  annualReturnDividend: 0.08,
  annualRaise: 0.03,
  annualInflation: 0.025,
  isaAnnualLimit: 20000000,
  isaCycleYears: 5,
  isaPensionTransferDeduction: 3000000,
  isaPensionTransferRatio: 1,
  annualPensionContribution: 0,
  pensionAnnualTaxCreditLimit: 9000000,
  pensionTaxCreditRate: 0.165,
  isaTaxFreeLimit: 2000000,
  isaTaxRate: 0.099,
  taxableDividendTaxRate: 0.154,
  cashTaxRate: 0.154,
  targetNasdaqWeight: 0.45,
  targetNasdaqHWeight: 0.45,
  targetDividendWeight: 0.10,
  monthlyInvestStage1: 2000000,
  monthlyInvestStage2: 2500000,
  monthlyInvestStage3: 5000000,
  stage1Years: 2,
  stage2Years: 4,
  stage3Years: 10,
  includeEmergencyFundInNetWorth: true,
  spouseEnabled: true,
  childrenCount: 0,
  dependentsCount: 0,
  rebalanceBandPct: 5,
  takeProfitPct: 20,
  dipBuy3PctAmount: 1000000,
  dipBuy5PctAmount: 1000000,
  dipBuy10PctAmount: 1000000,
  retirementTargetAmount: 2000000000,
};

const DEFAULT_BUDGETS = [
  { id: uid(), cat1: "식비", budget: 800000, targetWeight: 0.15 },
  { id: uid(), cat1: "주거", budget: 400000, targetWeight: 0.10 },
  { id: uid(), cat1: "교통", budget: 250000, targetWeight: 0.05 },
  { id: uid(), cat1: "생활", budget: 300000, targetWeight: 0.06 },
  { id: uid(), cat1: "보험세금", budget: 500000, targetWeight: 0.10 },
  { id: uid(), cat1: "가족", budget: 250000, targetWeight: 0.05 },
  { id: uid(), cat1: "취미여행", budget: 400000, targetWeight: 0.08 },
  { id: uid(), cat1: "기타지출", budget: 200000, targetWeight: 0.04 },
];

const DEFAULT_EVENTS = [
  { id: uid(), name: "👶 출산", yearsFromNow: 1, amountNeeded: 5000000, currentPrepared: 1000000, priority: "높음" },
  { id: uid(), name: "🚼 육아 첫해", yearsFromNow: 1, amountNeeded: 6000000, currentPrepared: 500000, priority: "높음" },
  { id: uid(), name: "🏖️ 가족여행", yearsFromNow: 2, amountNeeded: 3000000, currentPrepared: 500000, priority: "중간" },
  { id: uid(), name: "🚗 차량 교체", yearsFromNow: 4, amountNeeded: 25000000, currentPrepared: 8000000, priority: "높음" },
];

const DEFAULT_ACCOUNTS = [
  { id: uid(), name: "우리은행(급여)", type: "은행", institution: "우리은행", currency: "KRW", owner: "본인", active: true, defaultIn: true, note: "" },
  { id: uid(), name: "카카오뱅크", type: "은행", institution: "카카오뱅크", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" },
  { id: uid(), name: "ISA", type: "증권", institution: "증권사", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" },
  { id: uid(), name: "연금저축", type: "연금", institution: "증권사", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" },
  { id: uid(), name: "IRP", type: "연금", institution: "증권사", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" },
  { id: uid(), name: "신용카드", type: "카드", institution: "카드사", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" },
];

const DEFAULT_ASSETS = [
  { id: uid(), kind: "자산", category: "현금성", name: "현금", current: 0, previous: 0, includeInEmergency: true, note: "" },
  { id: uid(), kind: "자산", category: "은행예금", name: "우리은행(급여)", current: 0, previous: 0, includeInEmergency: false, note: "" },
  { id: uid(), kind: "자산", category: "은행예금", name: "카카오뱅크", current: 0, previous: 0, includeInEmergency: true, note: "" },
  { id: uid(), kind: "부채", category: "카드", name: "신용카드", current: 0, previous: 0, includeInEmergency: false, note: "" },
];

const DEFAULT_PORTFOLIO = [
  { id: uid(), account: "ISA", name: "TIGER 나스닥100", qty: 0, avgPrice: 0, currentPrice: 0, targetAmount: 0, riskSigma: 0.22, assetClass: "나스닥", memo: "" },
  { id: uid(), account: "ISA", name: "TIGER 나스닥100(H)", qty: 0, avgPrice: 0, currentPrice: 0, targetAmount: 0, riskSigma: 0.22, assetClass: "나스닥", memo: "" },
  { id: uid(), account: "ISA", name: "TIGER 배당다우존스", qty: 0, avgPrice: 0, currentPrice: 0, targetAmount: 0, riskSigma: 0.15, assetClass: "배당", memo: "" },
];

function emptyData() {
  return {
    version: 10,
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    accounts: DEFAULT_ACCOUNTS,
    assets: DEFAULT_ASSETS,
    portfolio: DEFAULT_PORTFOLIO,
    budgets: DEFAULT_BUDGETS,
    events: DEFAULT_EVENTS,
    settings: DEFAULT_SETTINGS,
    lastSavedAt: null,
  };
}

function loadData() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      return migrateData({ ...emptyData(), ...parsed });
    }
    return emptyData();
  } catch {
    return emptyData();
  }
}

function saveData(d) {
  const payload = JSON.stringify({ ...d, lastSavedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, payload);
}

function migrateData(d) {
  const x = { ...emptyData(), ...d };
  x.categories = normalizeCategories(d.categories);
  x.transactions = Array.isArray(d.transactions)
    ? d.transactions.map((t) => ({ ...t, cat2: normalizeSalaryLabel(t.cat2) }))
    : [];
  x.accounts = Array.isArray(d.accounts) && d.accounts.length ? d.accounts : inferAccountsFromLegacy(d);
  x.assets = Array.isArray(d.assets) ? d.assets.map((r) => ({ includeInEmergency: false, category: r.kind === "부채" ? "부채" : "기타", ...r })) : DEFAULT_ASSETS;
  x.portfolio = Array.isArray(d.portfolio) ? d.portfolio.map((p) => ({ riskSigma: 0.22, assetClass: "기타", ...p })) : DEFAULT_PORTFOLIO;
  x.budgets = Array.isArray(d.budgets) && d.budgets.length ? d.budgets : DEFAULT_BUDGETS;
  x.events = Array.isArray(d.events) && d.events.length ? d.events : DEFAULT_EVENTS;
  x.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
  return x;
}

function inferAccountsFromLegacy(d) {
  const set = new Map();
  (d.assets || []).forEach((a) => {
    if (a.name) set.set(a.name, { id: uid(), name: a.name, type: a.kind === "부채" ? "대출" : "은행", institution: "", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" });
  });
  (d.portfolio || []).forEach((p) => {
    if (p.account) set.set(p.account, { id: uid(), name: p.account, type: "증권", institution: "", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" });
  });
  if (!set.size) return DEFAULT_ACCOUNTS;
  return [...set.values()];
}

function getMonthRange(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

function monthOf(dateStr) {
  return String(dateStr || "").slice(0, 7);
}

function txSignedAmount(t) {
  const v = n(t.amount);
  if (t.type === "수입") return v;
  if (t.type === "지출") return -v;
  return 0;
}


const QUOTE_SERVER_URL = "http://localhost:8787";

const STOCK_MASTER = [
  { name: "삼성전자", code: "005930", symbol: "005930.KS", ticker: "005930", market: "KRX", currency: "KRW", assetClass: "개별주식" },
  { name: "삼성전자우", code: "005935", symbol: "005935.KS", ticker: "005935", market: "KRX", currency: "KRW", assetClass: "개별주식" },
  { name: "SK하이닉스", code: "000660", symbol: "000660.KS", ticker: "000660", market: "KRX", currency: "KRW", assetClass: "개별주식" },
  { name: "NAVER", code: "035420", symbol: "035420.KS", ticker: "035420", market: "KRX", currency: "KRW", assetClass: "개별주식" },
  { name: "카카오", code: "035720", symbol: "035720.KS", ticker: "035720", market: "KRX", currency: "KRW", assetClass: "개별주식" },
  { name: "TIGER 나스닥100", code: "133690", symbol: "133690.KS", ticker: "133690", market: "KRX ETF", currency: "KRW", assetClass: "나스닥" },
  { name: "TIGER 나스닥100(H)", code: "448300", symbol: "448300.KS", ticker: "448300", market: "KRX ETF", currency: "KRW", assetClass: "나스닥" },
  { name: "TIGER 배당다우존스", code: "458730", symbol: "458730.KS", ticker: "458730", market: "KRX ETF", currency: "KRW", assetClass: "배당" },
  { name: "TIGER 반도체 TOP10", code: "396500", symbol: "396500.KS", ticker: "396500", market: "KRX ETF", currency: "KRW", assetClass: "기타" },
  { name: "KODEX 원자력 SMR", code: "471460", symbol: "471460.KS", ticker: "471460", market: "KRX ETF", currency: "KRW", assetClass: "기타" },
  { name: "KODEX 미국AI전력핵심인프라", code: "487230", symbol: "487230.KS", ticker: "487230", market: "KRX ETF", currency: "KRW", assetClass: "기타" },
  { name: "KODEX KOFR금리액티브(합성)", code: "423160", symbol: "423160.KS", ticker: "423160", market: "KRX ETF", currency: "KRW", assetClass: "현금" },
  { name: "Amazon", code: "AMZN", symbol: "AMZN", ticker: "AMZN", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
  { name: "Alphabet Class A", code: "GOOGL", symbol: "GOOGL", ticker: "GOOGL", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
  { name: "Alphabet Class C", code: "GOOG", symbol: "GOOG", ticker: "GOOG", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
  { name: "Apple", code: "AAPL", symbol: "AAPL", ticker: "AAPL", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
  { name: "Microsoft", code: "MSFT", symbol: "MSFT", ticker: "MSFT", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
  { name: "NVIDIA", code: "NVDA", symbol: "NVDA", ticker: "NVDA", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
  { name: "Tesla", code: "TSLA", symbol: "TSLA", ticker: "TSLA", market: "NASDAQ", currency: "USD", assetClass: "개별주식" },
];

function normalizeStockQuery(v) {
  return String(v || "").toLowerCase().replace(/\s+/g, "").replace(/[()\-_.]/g, "");
}

function buildServerSymbolFromRow(row) {
  if (row.symbol) return row.symbol;
  if ((row.market === "KRX" || row.market === "KRX ETF") && /^\d{6}$/.test(String(row.code || row.ticker || ""))) {
    return `${String(row.code || row.ticker).padStart(6, "0")}.KS`;
  }
  if (row.market === "KOSDAQ" && /^\d{6}$/.test(String(row.code || row.ticker || ""))) {
    return `${String(row.code || row.ticker).padStart(6, "0")}.KQ`;
  }
  return String(row.ticker || row.code || "").trim().toUpperCase();
}

async function quoteServerHealthCheck() {
  const res = await fetch(`${QUOTE_SERVER_URL}/api/health`);
  if (!res.ok) throw new Error("시세 서버 연결 실패");
  return res.json();
}

async function searchStockFromServer(query) {
  const res = await fetch(`${QUOTE_SERVER_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("종목 검색 실패");
  const json = await res.json();
  return Array.isArray(json.items) ? json.items : [];
}

async function fetchQuoteFromServer(row) {
  const symbol = buildServerSymbolFromRow(row);
  const query = new URLSearchParams();
  if (symbol) query.set("symbol", symbol);
  if (row.name) query.set("name", row.name);
  if (row.code) query.set("code", row.code);
  const res = await fetch(`${QUOTE_SERVER_URL}/api/quote?${query.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.ok || !json.item) throw new Error(json.message || "현재가 조회 실패");
  return json.item;
}

async function fetchBulkQuotesFromServer(items) {
  const res = await fetch(`${QUOTE_SERVER_URL}/api/bulk-quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.message || "전체 현재가 업데이트 실패");
  return json;
}


function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polylinePath(points) {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function areaPath(points, baseY) {
  if (!points.length) return "";
  return `${polylinePath(points)} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
}

function MonthlyTrendChart({ data }) {
  const rows = (data || []).slice(-12);
  if (!rows.length) return <div className="empty">월별 추이 데이터가 없습니다.</div>;

  const width = 760;
  const height = 280;
  const margin = { top: 18, right: 18, bottom: 34, left: 54 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const maxVal = Math.max(...rows.flatMap((r) => [n(r.income), n(r.expense), Math.abs(n(r.net))]), 1);
  const minNet = Math.min(...rows.map((r) => n(r.net)), 0);
  const maxY = Math.max(maxVal, 1);
  const minY = Math.min(minNet, 0);
  const range = maxY - minY || 1;
  const y = (v) => margin.top + ((maxY - v) / range) * innerH;
  const step = innerW / Math.max(rows.length, 1);
  const linePoints = rows.map((r, i) => ({
    x: margin.left + step * i + step / 2,
    y: y(n(r.net)),
  }));
  const incomeBars = rows.map((r, i) => {
    const bx = margin.left + step * i + step * 0.12;
    const bw = step * 0.28;
    const v = n(r.income);
    const by = y(v);
    return { x: bx, y: by, w: bw, h: margin.top + innerH - by };
  });
  const expenseBars = rows.map((r, i) => {
    const bx = margin.left + step * i + step * 0.46;
    const bw = step * 0.28;
    const v = n(r.expense);
    const by = y(v);
    return { x: bx, y: by, w: bw, h: margin.top + innerH - by };
  });
  const gridValues = Array.from({ length: 5 }).map((_, i) => minY + (range * i) / 4);

  return (
    <div>
      <div className="chart-legend">
        <span><i className="legend-dot" style={{ background: "#2563eb" }} />수입</span>
        <span><i className="legend-dot" style={{ background: "#f59e0b" }} />지출</span>
        <span><i className="legend-dot" style={{ background: "#111827" }} />순수입</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="월별 추이 차트">
        <defs>
          <linearGradient id="netAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridValues.map((gv, idx) => (
          <g key={idx}>
            <line x1={margin.left} x2={width - margin.right} y1={y(gv)} y2={y(gv)} stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={margin.left - 8} y={y(gv) + 4} textAnchor="end" fontSize="11" fill="#667085">{fmt(gv)}</text>
          </g>
        ))}
        <line x1={margin.left} x2={width - margin.right} y1={y(0)} y2={y(0)} stroke="#cbd5e1" />
        {incomeBars.map((b, i) => <rect key={`i-${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill="#2563eb" opacity="0.75" />)}
        {expenseBars.map((b, i) => <rect key={`e-${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill="#f59e0b" opacity="0.75" />)}
        <path d={areaPath(linePoints, y(0))} fill="url(#netAreaGrad)" />
        <path d={polylinePath(linePoints)} fill="none" stroke="#111827" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {linePoints.map((p, i) => <circle key={`p-${i}`} cx={p.x} cy={p.y} r="4" fill="#111827" />)}
        {rows.map((r, i) => (
          <text key={r.month} x={margin.left + step * i + step / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#667085">
            {String(r.month).slice(2)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function AssetDonutChart({ segments }) {
  const rows = (segments || []).filter((s) => n(s.value) > 0);
  if (!rows.length) return <div className="empty">자산 구성 데이터가 없습니다.</div>;
  const total = rows.reduce((sum, r) => sum + n(r.value), 0);
  const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];
  let angle = 0;
  const slices = rows.map((r, idx) => {
    const value = n(r.value);
    const sweep = (value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...r, color: colors[idx % colors.length], start, end, pct: value / total * 100 };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 280 220" className="chart-svg" role="img" aria-label="자산 구성 도넛차트">
        <g transform="translate(0,8)">
          {slices.map((s) => (
            <path
              key={s.label}
              d={arcPath(110, 102, 72, s.start, s.end)}
              fill="none"
              stroke={s.color}
              strokeWidth="30"
              strokeLinecap="butt"
            />
          ))}
          <circle cx="110" cy="102" r="48" fill="#fff" />
          <text x="110" y="96" textAnchor="middle" fontSize="12" fill="#667085">총 자산</text>
          <text x="110" y="118" textAnchor="middle" fontSize="18" fontWeight="800" fill="#111827">{fmt(total)}</text>
        </g>
      </svg>
      <div>
        {slices.map((s) => (
          <div key={s.label} className="row-between small" style={{ marginBottom: 8, gap: 16 }}>
            <span className="row" style={{ gap: 8 }}>
              <i className="legend-dot" style={{ background: s.color }} />
              <span>{s.label}</span>
            </span>
            <span className="mono">{fmt(s.value)}원 ({fmtPct(s.pct)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalGauge({ value, target, title, subtitle }) {
  const safeTarget = Math.max(n(target), 1);
  const safeValue = Math.max(n(value), 0);
  const rate = Math.min((safeValue / safeTarget) * 100, 100);
  const angle = -180 + (rate / 100) * 180;
  const end = polarToCartesian(120, 110, 78, angle);
  const statusColor = rate >= 100 ? "#16a34a" : rate >= 70 ? "#2563eb" : rate >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <svg viewBox="0 0 240 150" className="chart-svg" role="img" aria-label="목표 대비 게이지">
        <path d={arcPath(120, 110, 78, -180, 0)} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        <path d={arcPath(120, 110, 78, -180, angle)} fill="none" stroke={statusColor} strokeWidth="18" strokeLinecap="round" />
        <line x1="120" y1="110" x2={end.x} y2={end.y} stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <circle cx="120" cy="110" r="7" fill="#111827" />
        <text x="120" y="52" textAnchor="middle" fontSize="12" fill="#667085">{title}</text>
        <text x="120" y="76" textAnchor="middle" fontSize="24" fontWeight="800" fill="#111827">{fmtPct(rate)}</text>
        <text x="36" y="130" fontSize="11" fill="#667085">0%</text>
        <text x="191" y="130" fontSize="11" fill="#667085">100%</text>
      </svg>
      <div className="row-between small"><span className="muted">현재/예상값</span><strong className="mono">{fmt(safeValue)}원</strong></div>
      <div className="row-between small"><span className="muted">목표값</span><strong className="mono">{fmt(safeTarget)}원</strong></div>
      {subtitle ? <div className="small muted" style={{ marginTop: 8 }}>{subtitle}</div> : null}
    </div>
  );
}

function createStyles() {
  return `
    *{box-sizing:border-box}
    :root{
      --bg:#f5f1ea;
      --panel:#152238;
      --panel-2:#fffdf9;
      --line:#e7dfd3;
      --text:#171717;
      --muted:#6b7280;
      --brand:#1f4d8f;
      --brand-2:#8b6b45;
      --good:#117a55;
      --warn:#c0841a;
      --bad:#c2413b;
      --shadow:0 18px 40px rgba(17,24,39,.06),0 4px 14px rgba(17,24,39,.04);
    }
    body{margin:0;font-family:Inter, Pretendard, "Noto Sans KR", Arial, sans-serif;background:linear-gradient(180deg,#f8f6f2 0%,#f3efe7 52%,#f8fafc 100%);color:#1f2937}
    *{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
    .app{min-height:100vh;padding:26px}
    .wrap{max-width:1480px;margin:0 auto}
    .hero{background:linear-gradient(135deg,#132238 0%,#1e3350 42%,#725438 100%);border-radius:30px;padding:32px;box-shadow:0 24px 48px rgba(15,23,42,.16);margin-bottom:22px;color:#fff;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
    .hero:before,.hero:after{content:"";position:absolute;border-radius:999px;filter:blur(10px);opacity:.28;pointer-events:none}
    .hero:before{width:280px;height:280px;right:-70px;top:-100px;background:#8fb3d9}
    .hero:after{width:220px;height:220px;right:160px;bottom:-110px;background:#c6a678}
    .hero-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;position:relative;z-index:1}
    .title{font-size:36px;font-weight:900;letter-spacing:-.04em;margin:0 0 8px;color:#fff}
    .sub{color:rgba(255,255,255,.82);font-size:14px;margin:0;letter-spacing:-.01em}
    .hero-badges{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
    .hero-badge{padding:10px 13px;border-radius:999px;background:rgba(255,255,255,.12);backdrop-filter:blur(10px);font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
    .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;position:relative;z-index:1}
    .tab{border:none;border-radius:14px;padding:11px 14px;background:rgba(255,255,255,.08);cursor:pointer;font-weight:700;color:rgba(255,255,255,.86);backdrop-filter:blur(10px);transition:.18s ease;letter-spacing:-.01em;border:1px solid rgba(255,255,255,.10)}
    .tab:hover{transform:translateY(-1px);background:rgba(255,255,255,.16)}
    .tab.active{background:#fff;color:#122033;box-shadow:0 10px 24px rgba(15,23,42,.18)}
    .grid{display:grid;gap:16px}
    .grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
    .grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
    .grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
    .card{background:rgba(255,253,249,.94);backdrop-filter:blur(12px);border:1px solid rgba(231,223,211,.9);border-radius:24px;padding:20px;box-shadow:var(--shadow)}
    .card h3{margin:0 0 12px;font-size:18px;letter-spacing:-.02em}
    .kpi{padding:18px;border-radius:22px;border:1px solid rgba(231,223,211,.92);background:linear-gradient(180deg,#fffdf9,#f8f4ec);box-shadow:var(--shadow);position:relative;overflow:hidden}
    .kpi:after{content:"";position:absolute;inset:auto -18px -18px auto;width:88px;height:88px;border-radius:999px;background:linear-gradient(135deg,rgba(91,124,255,.14),rgba(124,58,237,.14))}
    .kpi .label{font-size:12px;color:#667085;margin-bottom:8px;font-weight:700}
    .kpi .value{font-size:28px;font-weight:900;letter-spacing:-.03em}
    .muted{color:#667085}
    .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .row-between{display:flex;justify-content:space-between;gap:12px;align-items:center}
    .field{display:flex;flex-direction:column;gap:6px}
    .field label{font-size:12px;font-weight:800;color:#475467}
    .field input,.field select,.field textarea{width:100%;padding:12px 14px;border:1px solid #d0d5dd;border-radius:14px;background:#fff;font-size:14px;transition:.18s ease;outline:none}
    .field input:focus,.field select:focus,.field textarea:focus{border-color:#7c93ff;box-shadow:0 0 0 4px rgba(91,124,255,.14)}
    .field textarea{min-height:92px;resize:vertical}
    .btn{border:none;border-radius:14px;padding:10px 14px;cursor:pointer;font-weight:800;letter-spacing:-.01em;transition:.18s ease}
    .btn:hover{transform:translateY(-1px)}
    .btn.primary{background:linear-gradient(135deg,#3b82f6,#4f46e5);color:#fff;box-shadow:0 8px 18px rgba(59,130,246,.24)}
    .btn.secondary{background:#eef2ff;color:#3146c7}
    .btn.ghost{background:#fff;border:1px solid #d0d5dd;color:#344054}
    .btn.danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
    .table-wrap{overflow:auto;border-radius:16px;border:1px solid #eef2f7}
    table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
    th,td{border-bottom:1px solid #eaecf0;padding:11px 9px;text-align:left;vertical-align:top}
    th{position:sticky;top:0;background:#f8fafc;color:#475467;font-size:12px;z-index:1}
    tr:hover td{background:#fafcff}
    .chip{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}
    .chip.good{background:#ecfdf3;color:#027a48}
    .chip.warn{background:#fffaeb;color:#b54708}
    .chip.bad{background:#fef3f2;color:#b42318}
    .chip.blue{background:#eff8ff;color:#175cd3}
    .section-note{font-size:12px;color:#667085;margin-bottom:10px}
    .hr{height:1px;background:#eaecf0;margin:14px 0}
    .small{font-size:12px}
    .right{text-align:right}
    .center{text-align:center}
    .mono{font-variant-numeric:tabular-nums}
    .progress{height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden}
    .bar{height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1)}
    .bar.warn{background:linear-gradient(90deg,#f59e0b,#f97316)}
    .bar.bad{background:linear-gradient(90deg,#ef4444,#dc2626)}
    .empty{padding:24px;text-align:center;color:#667085}
    .footer{margin-top:14px;color:#667085;font-size:12px}
    .danger-box{border:1px solid #fecaca;background:#fef2f2;border-radius:14px;padding:12px}
    .ok-box{border:1px solid #bbf7d0;background:#f0fdf4;border-radius:14px;padding:12px}
    .chart-svg{width:100%;height:auto;display:block}
    .chart-legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font-size:12px;color:#475467}
    .legend-dot{display:inline-block;width:10px;height:10px;border-radius:999px}
    .donut-wrap{display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:center}
    .sticky-actions{position:sticky;top:10px;z-index:10}
    @media (max-width:900px){.donut-wrap{grid-template-columns:1fr}.hero-top{flex-direction:column}.hero-badges{justify-content:flex-start}}
    @media (max-width:1100px){.grid-4,.grid-3,.grid-2{grid-template-columns:1fr}}
  
    .legend-inline{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .mini-badge{display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
    .mini-badge-current{background:#eff6ff;color:#1d4ed8}
    .mini-badge-future{background:#faf5ff;color:#7e22ce}
    .mini-badge-warning{background:#fff7ed;color:#c2410c}
    .insight-card{border:1px solid #e5e7eb;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-radius:16px;padding:14px}
    .insight-title{font-size:13px;font-weight:800;color:#111827;margin-bottom:6px}
    .insight-text{font-size:12px;line-height:1.65;color:#667085}
    .kpi-future{border-color:#e9d5ff;background:linear-gradient(180deg,#ffffff 0%,#faf5ff 100%)}
    .kpi-warning{border-color:#fed7aa;background:linear-gradient(180deg,#ffffff 0%,#fff7ed 100%)}
`;
}

function App() {
  const [data, setData] = useState(() => loadData());
  const [tab, setTab] = useState("dashboard");
  const [showDashboardInfo, setShowDashboardInfo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { saveData(data); }, [data]);

  const update = (fn) => setData((prev) => migrateData(fn(prev)));

  const accountOptions = useMemo(() => data.accounts.filter((a) => a.active), [data.accounts]);
  const accountNamesIn = useMemo(() => accountOptions.filter((a) => a.type !== "카드").map((a) => a.name), [accountOptions]);
  const accountNamesOut = useMemo(() => accountOptions.map((a) => a.name), [accountOptions]);

  const dashboard = useMemo(() => {
    const month = thisMonthISO();
    let income = 0, expense = 0;
    data.transactions.forEach((t) => {
      if (monthOf(t.date) !== month) return;
      if (t.type === "수입") income += n(t.amount);
      if (t.type === "지출") expense += n(t.amount);
    });
    const totalAssets = data.assets.filter((a) => a.kind === "자산").reduce((s, a) => s + n(a.current), 0);
    const totalLiabs = data.assets.filter((a) => a.kind === "부채").reduce((s, a) => s + n(a.current), 0);
    const portValue = data.portfolio.reduce((s, p) => s + n(p.qty) * n(p.currentPrice || p.avgPrice), 0);
    const netWorth = totalAssets - totalLiabs + portValue;
    return { month, income, expense, net: income - expense, totalAssets, totalLiabs, portValue, netWorth };
  }, [data]);

  const validations = useMemo(() => {
    const tx = data.transactions;
    const issues = [
      {
        item: "거래내역 필수값 누락",
        count: tx.filter((t) => t.type && (!t.cat1 || !t.cat2)).length,
        where: "거래내역",
        desc: "구분을 선택했으면 대분류/소분류까지 채워야 합니다.",
      },
      {
        item: "거래 금액 오류",
        count: tx.filter((t) => t.amount !== "" && n(t.amount) <= 0).length,
        where: "거래내역",
        desc: "금액은 0보다 커야 합니다.",
      },
      {
        item: "수입 계좌 누락",
        count: tx.filter((t) => t.type === "수입" && !t.inAccount).length,
        where: "거래내역",
        desc: "수입은 입금계좌가 필요합니다.",
      },
      {
        item: "지출 계좌 누락",
        count: tx.filter((t) => t.type === "지출" && !t.outAccount).length,
        where: "거래내역",
        desc: "지출은 출금계좌가 필요합니다.",
      },
      {
        item: "자산이동 계좌 누락",
        count: tx.filter((t) => t.type === "자산이동" && (!t.inAccount || !t.outAccount)).length,
        where: "거래내역",
        desc: "자산이동은 입출금 계좌가 모두 필요합니다.",
      },
      {
        item: "자산/부채 이름 중복",
        count: data.assets.length - new Set(data.assets.map((a) => a.name)).size,
        where: "자산·부채",
        desc: "같은 이름의 계좌/항목이 중복되었습니다.",
      },
      {
        item: "포트폴리오 현재가 미입력",
        count: data.portfolio.filter((p) => n(p.qty) > 0 && n(p.currentPrice || 0) <= 0).length,
        where: "포트폴리오",
        desc: "보유 수량이 있으면 현재가가 필요합니다.",
      },
    ];
    return issues;
  }, [data]);

  const budgetAnalysis = useMemo(() => {
    const month = thisMonthISO();
    const totalIncome = data.transactions.filter((t) => monthOf(t.date) === month && t.type === "수입").reduce((s, t) => s + n(t.amount), 0);
    return data.budgets.map((b) => {
      const spent = data.transactions
        .filter((t) => monthOf(t.date) === month && t.type === "지출" && t.cat1 === b.cat1)
        .reduce((s, t) => s + n(t.amount), 0);
      const rate = b.budget > 0 ? (spent / b.budget) * 100 : 0;
      return {
        ...b,
        spent,
        rate,
        status: rate >= 100 ? "초과" : rate >= 80 ? "주의" : "정상",
        recommendedBudget: totalIncome * n(b.targetWeight),
      };
    });
  }, [data]);

  const monthlySeries = useMemo(() => {
    const m = new Map();
    data.transactions.forEach((t) => {
      const k = monthOf(t.date);
      if (!k) return;
      if (!m.has(k)) m.set(k, { month: k, income: 0, expense: 0 });
      const row = m.get(k);
      if (t.type === "수입") row.income += n(t.amount);
      if (t.type === "지출") row.expense += n(t.amount);
    });
    return [...m.values()].sort((a, b) => a.month.localeCompare(b.month)).map((r) => ({ ...r, net: r.income - r.expense }));
  }, [data.transactions]);

  const financialAnalysis = useMemo(() => {
    const rows = data.portfolio.map((p) => {
      const value = n(p.qty) * n(p.currentPrice || p.avgPrice);
      return {
        ...p,
        value,
        invested: n(p.qty) * n(p.avgPrice),
      };
    });
    const total = rows.reduce((s, r) => s + r.value, 0);
    const mapped = rows.map((r) => {
      const weight = total > 0 ? r.value / total : 0;
      const sigma = n(r.riskSigma || 0.22);
      const loss1 = -r.value * sigma;
      const loss2 = -r.value * sigma * 2;
      const state = weight > 0.3 ? "쏠림 경고" : weight > 0.2 ? "주의" : "정상";
      return { ...r, weight, sigma, loss1, loss2, state };
    });
    const classMap = {};
    mapped.forEach((r) => { classMap[r.assetClass || "기타"] = (classMap[r.assetClass || "기타"] || 0) + r.value; });
    return { rows: mapped, total, byClass: classMap };
  }, [data.portfolio]);

  const taxAnalysis = useMemo(() => {
    const groups = [
      { name: "ISA", predicate: (p) => p.account === "ISA", taxLabel: `비과세 ${fmt(data.settings.isaTaxFreeLimit)} + 초과 ${fmtPct(data.settings.isaTaxRate * 100)}`, taxRate: data.settings.isaTaxRate, note: `${data.settings.isaCycleYears}년 주기` },
      { name: "연금저축", predicate: (p) => p.account === "연금저축", taxLabel: `세액공제 ${fmtPct(data.settings.pensionTaxCreditRate * 100)}`, taxRate: 0, note: "연금계좌" },
      { name: "IRP", predicate: (p) => p.account === "IRP", taxLabel: `세액공제 ${fmtPct(data.settings.pensionTaxCreditRate * 100)}`, taxRate: 0, note: "퇴직연금" },
      { name: "일반계좌", predicate: (p) => !["ISA", "연금저축", "IRP"].includes(p.account), taxLabel: `배당 ${fmtPct(data.settings.taxableDividendTaxRate * 100)}`, taxRate: data.settings.taxableDividendTaxRate, note: "과세계좌" },
    ];
    return groups.map((g) => {
      const selected = data.portfolio.filter(g.predicate);
      const value = selected.reduce((s, p) => s + n(p.qty) * n(p.currentPrice || p.avgPrice), 0);
      const principal = selected.reduce((s, p) => s + n(p.qty) * n(p.avgPrice), 0);
      const profit = value - principal;
      const estimatedTax = g.name === "ISA"
        ? Math.max(profit - n(data.settings.isaTaxFreeLimit), 0) * n(g.taxRate)
        : g.taxRate > 0 ? Math.max(profit, 0) * n(g.taxRate) : 0;
      return { ...g, count: selected.length, value, principal, profit, estimatedTax };
    });
  }, [data.portfolio, data.settings]);

  const eventAnalysis = useMemo(() => {
    return data.events.map((e) => {
      const shortage = Math.max(n(e.amountNeeded) - n(e.currentPrepared), 0);
      const monthlyNeed = e.yearsFromNow > 0 ? shortage / (n(e.yearsFromNow) * 12) : shortage;
      const age = n(data.settings.currentAge) + n(e.yearsFromNow);
      const progress = n(e.amountNeeded) > 0 ? n(e.currentPrepared) / n(e.amountNeeded) * 100 : 0;
      return { ...e, shortage, monthlyNeed, age, progress };
    });
  }, [data.events, data.settings.currentAge]);

  const futureSim = useMemo(() => {
    const rows = [];
    let nasdaq = 0;
    let dividend = 0;
    let isaBalance = 0;
    let isaPrincipalInCycle = 0;
    let realizedIsaTaxSavedAcc = 0;
    let pensionCreditAcc = 0;
    let pensionTransferredAcc = 0;
    let taxableOverflowAcc = 0;
    let isaRolloverCount = 0;

    const years = Math.max(n(data.settings.retireAge) - n(data.settings.currentAge), 0);
    const wN = n(data.settings.targetNasdaqWeight) + n(data.settings.targetNasdaqHWeight);
    const wD = n(data.settings.targetDividendWeight);
    const weightedReturn = ((n(data.settings.annualReturnNasdaq) * (wN || 0)) + (n(data.settings.annualReturnDividend) * (wD || 0)));
    const isaAnnualLimit = Math.max(n(data.settings.isaAnnualLimit), 0);
    const isaCycleYears = Math.max(n(data.settings.isaCycleYears), 1);
    const isaTaxFreeLimit = Math.max(n(data.settings.isaTaxFreeLimit), 0);
    const isaTaxRate = Math.max(n(data.settings.isaTaxRate), 0);
    const normalTaxRate = Math.max(n(data.settings.taxableDividendTaxRate), 0);
    const pensionTaxCreditRate = Math.max(n(data.settings.pensionTaxCreditRate), 0);
    const isaPensionTransferDeductionCap = Math.max(n(data.settings.isaPensionTransferDeduction), 0);
    const isaPensionTransferRatio = clamp(n(data.settings.isaPensionTransferRatio || 1), 0, 1);
    const annualPensionContribution = Math.max(n(data.settings.annualPensionContribution), 0);
    const pensionAnnualTaxCreditLimit = Math.max(n(data.settings.pensionAnnualTaxCreditLimit), 0);

    for (let year = 1; year <= years; year += 1) {
      let monthlyInvest = n(data.settings.monthlyInvestStage3);
      if (year <= n(data.settings.stage1Years)) monthlyInvest = n(data.settings.monthlyInvestStage1);
      else if (year <= n(data.settings.stage2Years)) monthlyInvest = n(data.settings.monthlyInvestStage2);
      else monthlyInvest = n(data.settings.monthlyInvestStage3);

      const annualInvest = monthlyInvest * 12;
      const annualIsaContribution = Math.min(annualInvest, isaAnnualLimit);
      const annualTaxableOverflowInvest = Math.max(annualInvest - annualIsaContribution, 0);
      taxableOverflowAcc += annualTaxableOverflowInvest;

      nasdaq = (nasdaq + annualInvest * wN) * (1 + n(data.settings.annualReturnNasdaq));
      dividend = (dividend + annualInvest * wD) * (1 + n(data.settings.annualReturnDividend));
      const total = nasdaq + dividend;

      const yearInCycle = ((year - 1) % isaCycleYears) + 1;
      const cycleNumber = Math.floor((year - 1) / isaCycleYears) + 1;
      if (yearInCycle === 1) {
        isaBalance = 0;
        isaPrincipalInCycle = 0;
      }

      isaPrincipalInCycle += annualIsaContribution;
      isaBalance = (isaBalance + annualIsaContribution) * (1 + weightedReturn);

      const isaProfitInCycle = Math.max(isaBalance - isaPrincipalInCycle, 0);
      const normalTaxIfTaxable = isaProfitInCycle * normalTaxRate;
      const isaTax = isaProfitInCycle <= isaTaxFreeLimit
        ? 0
        : (isaProfitInCycle - isaTaxFreeLimit) * isaTaxRate;
      const currentCycleTaxSaved = Math.max(normalTaxIfTaxable - isaTax, 0);

      const annualPensionBaseCreditEligible = Math.min(annualPensionContribution, pensionAnnualTaxCreditLimit);
      const annualPensionBaseCredit = annualPensionBaseCreditEligible * pensionTaxCreditRate;
      pensionCreditAcc += annualPensionBaseCredit;

      let cycleTransferAmount = 0;
      let cyclePensionCredit = 0;
      let newIsaSeedAmount = 0;
      let generalAccountOverflowAtMaturity = 0;
      let maturityOccurred = false;

      if (yearInCycle === isaCycleYears) {
        maturityOccurred = true;
        isaRolloverCount += 1;
        realizedIsaTaxSavedAcc += currentCycleTaxSaved;

        cycleTransferAmount = isaBalance * isaPensionTransferRatio;
        const transferExtraEligible = Math.min(cycleTransferAmount * 0.1, isaPensionTransferDeductionCap);
        const extraCreditBase = Math.min(cycleTransferAmount, transferExtraEligible);
        cyclePensionCredit = extraCreditBase * pensionTaxCreditRate;

        pensionCreditAcc += cyclePensionCredit;
        pensionTransferredAcc += cycleTransferAmount;

        newIsaSeedAmount = Math.min(isaBalance - cycleTransferAmount, isaAnnualLimit);
        generalAccountOverflowAtMaturity = Math.max(isaBalance - cycleTransferAmount - newIsaSeedAmount, 0);
        taxableOverflowAcc += generalAccountOverflowAtMaturity;
      }

      const isaTaxSaved = realizedIsaTaxSavedAcc + (yearInCycle === isaCycleYears ? 0 : currentCycleTaxSaved);

      rows.push({
        age: n(data.settings.currentAge) + year,
        year,
        yearLabel: `${new Date().getFullYear() + year - 1}`,
        monthlyInvest,
        annualInvest,
        annualIsaContribution,
        annualTaxableOverflowInvest,
        annualPensionContribution,
        annualPensionBaseCredit,
        nasdaq,
        dividend,
        isaTaxSaved,
        pensionCreditAcc,
        pensionTransferredAcc,
        cyclePensionCredit,
        cycleTransferAmount,
        newIsaSeedAmount,
        generalAccountOverflowAtMaturity,
        total,
        isaBalance,
        isaPrincipalInCycle,
        isaProfitInCycle,
        cycleNumber,
        yearInCycle,
        maturityOccurred,
        taxableOverflowAcc,
        isaRolloverCount,
      });
    }
    return rows;
  }, [data.settings]);


  const dashboardDetail = useMemo(() => {
    const emergencyFund = data.assets
      .filter((a) => a.kind === "자산" && a.includeInEmergency)
      .reduce((s, a) => s + n(a.current), 0);

    const liquidAssets = data.assets
      .filter((a) => a.kind === "자산" && ["현금성", "은행예금"].includes(a.category))
      .reduce((s, a) => s + n(a.current), 0);

    const monthlyAvg6 = monthlySeries.slice(-6);
    const avgIncome = monthlyAvg6.length ? monthlyAvg6.reduce((s, r) => s + r.income, 0) / monthlyAvg6.length : 0;
    const avgExpense = monthlyAvg6.length ? monthlyAvg6.reduce((s, r) => s + r.expense, 0) / monthlyAvg6.length : 0;
    const avgNet = monthlyAvg6.length ? monthlyAvg6.reduce((s, r) => s + r.net, 0) / monthlyAvg6.length : 0;

    const accountBalances = data.accounts.map((acc) => {
      const assetValue = data.assets.filter((a) => a.kind === "자산" && a.name === acc.name).reduce((s, a) => s + n(a.current), 0);
      const liabilityValue = data.assets.filter((a) => a.kind === "부채" && a.name === acc.name).reduce((s, a) => s + n(a.current), 0);
      const portfolioValue = data.portfolio.filter((p) => p.account === acc.name).reduce((s, p) => s + n(p.qty) * n(p.currentPrice || p.avgPrice), 0);
      return { ...acc, assetValue, liabilityValue, portfolioValue, total: assetValue + portfolioValue - liabilityValue };
    }).sort((a, b) => b.total - a.total);

    const assetCategoryBreakdown = Object.entries(
      data.assets.reduce((m, a) => {
        const key = `${a.kind}-${a.category || "기타"}`;
        m[key] = (m[key] || 0) + n(a.current);
        return m;
      }, {})
    )
      .map(([key, value]) => {
        const [kind, category] = key.split("-");
        return { kind, category, value };
      })
      .sort((a, b) => b.value - a.value);

    const budgetSummary = {
      over: budgetAnalysis.filter((b) => b.rate >= 100).length,
      warn: budgetAnalysis.filter((b) => b.rate >= 80 && b.rate < 100).length,
      normal: budgetAnalysis.filter((b) => b.rate < 80).length,
    };

    const topExpenseCats = Object.entries(
      data.transactions
        .filter((t) => monthOf(t.date) === thisMonthISO() && t.type === "지출")
        .reduce((m, t) => {
          m[t.cat1 || "기타"] = (m[t.cat1 || "기타"] || 0) + n(t.amount);
          return m;
        }, {})
    ).map(([cat1, amount]) => ({ cat1, amount })).sort((a, b) => b.amount - a.amount);

    const recentTx = [...data.transactions]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 8);

    const totalValidationIssues = validations.reduce((s, v) => s + n(v.count), 0);
    const topEvents = [...eventAnalysis].sort((a, b) => b.shortage - a.shortage).slice(0, 5);
    const retirementRow = futureSim.length ? futureSim[futureSim.length - 1] : null;

    return {
      emergencyFund,
      liquidAssets,
      avgIncome,
      avgExpense,
      avgNet,
      accountBalances,
      assetCategoryBreakdown,
      budgetSummary,
      topExpenseCats,
      recentTx,
      totalValidationIssues,
      topEvents,
      retirementRow,
    };
  }, [data, monthlySeries, budgetAnalysis, validations, eventAnalysis, futureSim]);

  const dashboardChartData = useMemo(() => {
    const assetBuckets = new Map();
    data.assets.filter((a) => a.kind === "자산").forEach((a) => {
      const label = a.category || "기타자산";
      assetBuckets.set(label, (assetBuckets.get(label) || 0) + n(a.current));
    });
    if (financialAnalysis.total > 0) {
      assetBuckets.set("투자포트폴리오", (assetBuckets.get("투자포트폴리오") || 0) + financialAnalysis.total);
    }
    const assetSegments = [...assetBuckets.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const totalEventTarget = eventAnalysis.reduce((s, e) => s + n(e.amountNeeded), 0);
    const totalEventPrepared = eventAnalysis.reduce((s, e) => s + n(e.currentPrepared), 0);

    return {
      monthlyTrend: monthlySeries,
      assetSegments,
      retirementTarget: n(data.settings.retirementTargetAmount),
      retirementProjected: dashboardDetail.retirementRow?.total || 0,
      totalEventTarget,
      totalEventPrepared,
    };
  }, [data.assets, data.settings.retirementTargetAmount, monthlySeries, financialAnalysis.total, eventAnalysis, dashboardDetail.retirementRow]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asset-backup-${todayISO()}.json`;
    a.click();
  };

  const importJSON = (file) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const parsed = JSON.parse(rd.result);
        setData(migrateData(parsed));
        alert("백업을 복원했습니다.");
      } catch (e) {
        alert("복원 실패: " + e.message);
      }
    };
    rd.readAsText(file);
  };

  const clearAll = () => {
    if (!window.confirm("정말 전체 데이터를 초기화할까요?")) return;
    setData(emptyData());
  };

  return (
    <div className="app">
      <style>{createStyles()}</style>
      <div className="wrap">
        <div className="hero">
          <div className="hero-top">
            <div>
              <h1 className="title">통합 자산관리 앱</h1>
              <div className="sub">Created by Season · 기능은 그대로, 흐름은 더 직관적으로</div>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">Dashboard</span>
              <span className="hero-badge">Portfolio</span>
              <span className="hero-badge">Tax & Simulation</span>
            </div>
          </div>

          <div className="tabs">
          {[
            ["input", "🏠 입력센터"],
            ["guide", "📖 사용가이드"],
            ["check", "✅ 입력점검"],
            ["dashboard", "★ 대시보드"],
            ["transactions", "📝 거래내역"],
            ["assets", "🏦 자산·부채"],
            ["portfolio", "📈 투자포트폴리오"],
            ["budget", "💰 가계부"],
            ["analysis", "📊 재무분석"],
            ["tax", "💸 세금·절세"],
            ["planning", "🎯 계획·의사결정"],
            ["simulation", "🔮 미래시뮬레이션"],
            ["settings", "⚙ 설정"],
            ["data", "💾 데이터"],
          ].map(([key, label]) => (
            <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
          </div>
        </div>

        {tab === "input" && (
          <div className="grid grid-3">
            {[
              ["1", "📝 거래내역 입력", "수입·지출·자산이동을 입력"],
              ["2", "🏦 자산·부채 잔고 입력", "월말 잔고와 신규 계좌를 입력"],
              ["3", "📈 투자포트폴리오 입력", "보유종목/수량/평단/현재가/목표 입력"],
              ["4", "💰 가계부 예산 설정", "카테고리별 예산을 설정"],
              ["5", "🎯 라이프 이벤트 설정", "출산·차량·여행 등 목표 자금 입력"],
              ["6", "⚙ 마스터 설정", "나이·은퇴·기대수익률·세율 설정"],
            ].map((x) => (
              <div className="card" key={x[0]}>
                <div className="row-between">
                  <div className="chip blue">{x[0]}</div>
                  <button className="btn secondary" onClick={() => {
                    const map = { "1": "transactions", "2": "assets", "3": "portfolio", "4": "budget", "5": "planning", "6": "settings" };
                    setTab(map[x[0]]);
                  }}>바로가기</button>
                </div>
                <h3 style={{ marginTop: 12 }}>{x[1]}</h3>
                <div className="muted">{x[2]}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "guide" && (
          <div className="card">
            <h3>처음 쓰는 분을 위한 사용 순서</h3>
            <ol className="small" style={{ lineHeight: 1.8, paddingLeft: 18 }}>
              <li>설정 탭에서 현재 나이, 은퇴 나이, 기대수명, 수익률, 투자 스케줄을 입력합니다.</li>
              <li>데이터 탭에서 계좌관리로 은행/증권/연금/카드 계좌를 등록합니다.</li>
              <li>자산·부채 탭에서 월말 잔고를 입력합니다.</li>
              <li>거래내역 탭에서 수입, 지출, 자산이동을 기록합니다.</li>
              <li>포트폴리오 탭에서 보유종목의 수량, 평단, 현재가를 입력합니다.</li>
              <li>가계부 탭에서 카테고리별 예산을 입력합니다.</li>
              <li>계획·의사결정 탭에서 출산, 차 교체, 여행 등 이벤트 자금을 입력합니다.</li>
              <li>대시보드, 재무분석, 세금·절세, 미래시뮬레이션 탭에서 결과를 확인합니다.</li>
            </ol>
          </div>
        )}

        {tab === "check" && (
          <div className="card">
            <h3>자동 입력점검</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>No</th><th>점검항목</th><th>상태</th><th className="right">오류건수</th><th>확인 위치</th><th>설명</th></tr></thead>
                <tbody>
                  {validations.map((v, i) => (
                    <tr key={v.item}>
                      <td>{i + 1}</td>
                      <td>{v.item}</td>
                      <td>{v.count === 0 ? <span className="chip good">정상</span> : <span className="chip bad">확인필요</span>}</td>
                      <td className="right mono">{fmt(v.count)}</td>
                      <td>{v.where}</td>
                      <td className="muted">{v.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "dashboard" && (
          <div className="grid">
            <div className="card dashboard-guide compact-guide">
              <div className="info-header">
                <div>
                  <h3 style={{ marginBottom: 4 }}>대시보드</h3>
                  <div className="section-note" style={{ marginBottom: 0 }}>현재 상태 · 최근 흐름 · 목표 전망을 한 화면에서 확인합니다.</div>
                </div>
                <button className="info-btn" type="button" onClick={() => setShowDashboardInfo((v) => !v)} aria-label="대시보드 설명 보기">ⓘ</button>
              </div>
              {showDashboardInfo && (
                <div className="info-box">
                  <div>현재 상태 → 최근 흐름 → 목표 전망 순서로 보면 가장 직관적입니다.</div>
                  <div>절세·은퇴 수치는 확정금액이 아니라 설정값 기반의 예상치입니다.</div>
                </div>
              )}
            </div>

            <div className="grid grid-4">
              <KPI label="현재 순자산" value={dashboard.netWorth} note="현재상태" />
              <KPI label="현금흐름(이번달)" value={dashboard.net} note="현재상태" />
              <KPI label="투자 포트폴리오" value={financialAnalysis.total} note="현재상태" />
              <KPI label="비상금" value={dashboardDetail.emergencyFund} note="현재상태" />
            </div>

            <div className="grid grid-4">
              <KPI label="총 자산" value={dashboard.totalAssets} note="현재상태" />
              <KPI label="총 부채" value={dashboard.totalLiabs} note="현재상태" />
              <KPI label="월 평균 순수입(6개월)" value={dashboardDetail.avgNet} note="최근흐름" />
              <KPI label="은퇴 시뮬 최종자산" value={dashboardDetail.retirementRow?.total || 0} note="목표전망" tone="future" />
            </div>

            <div className="grid grid-3">
              <div className="card">
                <h3>월별 추이 차트</h3>
                <div className="section-note">최근 최대 12개월의 수입·지출·순수입 추이를 한 번에 확인합니다.</div>
                <MonthlyTrendChart data={dashboardChartData.monthlyTrend} />
              </div>

              <div className="card">
                <h3>자산구성 도넛차트</h3>
                <div className="section-note">현금성, 예금, 투자포트폴리오 등 자산 구성을 비중으로 표시합니다.</div>
                <AssetDonutChart segments={dashboardChartData.assetSegments} />
              </div>

              <div className="card">
                <h3>목표 대비 게이지</h3>
                <div className="section-note">현재 자산이 아니라 미래 시뮬레이션 결과를 목표와 비교한 비율입니다.</div>
                <GoalGauge
                  value={dashboardChartData.retirementProjected}
                  target={dashboardChartData.retirementTarget}
                  title="은퇴 목표자산 도달률"
                  subtitle={`라이프이벤트 준비율 ${fmtPct(dashboardChartData.totalEventTarget > 0 ? dashboardChartData.totalEventPrepared / dashboardChartData.totalEventTarget * 100 : 0)}`}
                />
              </div>
            </div>

            <div className="metric-split">
              <div className="card metric-panel">
                <h3>현재 상태 & 점검 신호</h3>
                <div className="stat-row"><span className="stat-label">입력 점검 필요 항목</span><span className="mono"><strong>{fmt(dashboardDetail.totalValidationIssues)}</strong>건</span></div>
                <div className="stat-row"><span className="stat-label">예산 초과 항목</span><span className="mono"><strong>{fmt(dashboardDetail.budgetSummary.over)}</strong>개</span></div>
                <div className="stat-row"><span className="stat-label">예산 주의 항목</span><span className="mono"><strong>{fmt(dashboardDetail.budgetSummary.warn)}</strong>개</span></div>
                <div className="stat-row"><span className="stat-label">지금 바로 쓸 수 있는 돈</span><span className="mono"><strong>{fmt(dashboardDetail.liquidAssets)}</strong>원</span></div>
                <div className="stat-help">여기 숫자는 현재 입력된 계좌와 예산 기준으로 바로 해석할 수 있는 값입니다.</div>
                <div style={{ marginTop: 12 }}>
                  {dashboard.net >= 0 ? <span className="chip good">이번달 흑자</span> : <span className="chip bad">이번달 적자</span>}
                  {" "}
                  {dashboardDetail.totalValidationIssues === 0 ? <span className="chip good">입력 안정</span> : <span className="chip bad">입력 보완 필요</span>}
                </div>
              </div>

              <div className="card metric-panel future">
                <h3>절세·목표 전망</h3>
                <div className="stat-row"><span className="stat-label">ISA 절세 예상 총액</span><span className="mono"><strong>{fmt(dashboardDetail.retirementRow?.isaTaxSaved || 0)}</strong>원</span></div>
                <div className="stat-row"><span className="stat-label">ISA→연금 추가공제 예상</span><span className="mono"><strong>{fmt(dashboardDetail.retirementRow?.pensionCreditAcc || 0)}</strong>원</span></div>
                <div className="stat-row"><span className="stat-label">은퇴 시뮬 총자산</span><span className="mono"><strong>{fmt(dashboardDetail.retirementRow?.total || 0)}</strong>원</span></div>
                <div className="stat-row"><span className="stat-label">배당 버킷 예상</span><span className="mono"><strong>{fmt(dashboardDetail.retirementRow?.dividend || 0)}</strong>원</span></div>
                <div className="stat-help">여기 숫자는 현재 설정을 그대로 유지했을 때를 가정한 전망값입니다. 지금 통장에 있는 금액이 아니라 앞으로 기대하는 효과와 결과입니다.</div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <h3>이번달 자금 흐름</h3>
                <div className="row-between"><span className="muted">수입</span><strong className="mono">{fmt(dashboard.income)}원</strong></div>
                <div className="progress"><div className="bar" style={{ width: `${clamp(dashboard.income > 0 ? 100 : 0, 0, 100)}%` }} /></div>
                <div className="row-between" style={{ marginTop: 10 }}><span className="muted">지출</span><strong className="mono">{fmt(dashboard.expense)}원</strong></div>
                <div className="progress"><div className="bar warn" style={{ width: `${clamp(dashboard.income > 0 ? dashboard.expense / dashboard.income * 100 : 0, 0, 100)}%` }} /></div>
                <div className="row-between" style={{ marginTop: 10 }}><span className="muted">순수입</span><strong className="mono">{fmt(dashboard.net)}원</strong></div>
                <div className="small muted" style={{ marginTop: 8 }}>최근 6개월 평균 순수입: {fmt(dashboardDetail.avgNet)}원</div>
                <div className="small muted">최근 6개월 평균 수입/지출: {fmt(dashboardDetail.avgIncome)}원 / {fmt(dashboardDetail.avgExpense)}원</div>
              </div>

              <div className="card">
                <h3>장기 목표 진행</h3>
                <div className="row-between"><span className="muted">현재 나이</span><strong>{fmt(data.settings.currentAge)}세</strong></div>
                <div className="row-between"><span className="muted">은퇴 나이</span><strong>{fmt(data.settings.retireAge)}세</strong></div>
                <div className="row-between"><span className="muted">남은 기간</span><strong>{fmt(Math.max(n(data.settings.retireAge) - n(data.settings.currentAge), 0))}년</strong></div>
                <div className="row-between"><span className="muted">월 투자금(현재 단계)</span><strong className="mono">{fmt(data.settings.monthlyInvestStage1)}원</strong></div>
                <div className="row-between"><span className="muted">목표 대비 예상 도달 구간</span><strong>{dashboardChartData.retirementTarget > 0 ? fmtPct(dashboardChartData.retirementProjected / dashboardChartData.retirementTarget * 100) : "0.0%"}</strong></div>
                <div className="row-between"><span className="muted">라이프이벤트 준비율</span><strong>{fmtPct(dashboardChartData.totalEventTarget > 0 ? dashboardChartData.totalEventPrepared / dashboardChartData.totalEventTarget * 100 : 0)}</strong></div>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <h3>최근 6개월 월간 요약</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>월</th><th className="right">수입</th><th className="right">지출</th><th className="right">순수입</th><th className="right">저축률</th></tr></thead>
                    <tbody>
                      {monthlySeries.slice(-6).reverse().map((m) => {
                        const savingRate = m.income > 0 ? (m.net / m.income) * 100 : 0;
                        return (
                          <tr key={m.month}>
                            <td>{m.month}</td>
                            <td className="right mono">{fmt(m.income)}</td>
                            <td className="right mono">{fmt(m.expense)}</td>
                            <td className="right mono">{fmt(m.net)}</td>
                            <td className="right mono">{fmtPct(savingRate)}</td>
                          </tr>
                        );
                      })}
                      {!monthlySeries.length && <tr><td colSpan={5} className="empty">월간 거래 데이터가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3>예산 경고 / 상위 지출 카테고리</h3>
                {budgetAnalysis.length === 0 ? <div className="empty">예산이 없습니다.</div> : (
                  <>
                    {budgetAnalysis.slice().sort((a, b) => b.rate - a.rate).slice(0, 5).map((b) => (
                      <div key={b.id} style={{ marginBottom: 12 }}>
                        <div className="row-between small"><strong>{b.cat1}</strong><span>{fmtPct(b.rate)}</span></div>
                        <div className="small muted">예산 {fmt(b.budget)}원 · 사용 {fmt(b.spent)}원</div>
                        <div className="progress"><div className={`bar ${b.rate >= 100 ? "bad" : b.rate >= 80 ? "warn" : ""}`} style={{ width: `${clamp(b.rate, 0, 100)}%` }} /></div>
                      </div>
                    ))}
                    <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />
                    <div className="small muted" style={{ marginBottom: 8 }}>이번달 상위 지출 카테고리</div>
                    {dashboardDetail.topExpenseCats.slice(0, 5).map((r) => (
                      <div key={r.cat1} className="row-between small" style={{ marginBottom: 6 }}>
                        <span>{r.cat1}</span><strong className="mono">{fmt(r.amount)}원</strong>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <h3>계좌별 자산 현황</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>계좌</th><th>유형</th><th className="right">현금/예금</th><th className="right">투자</th><th className="right">부채</th><th className="right">순액</th></tr></thead>
                    <tbody>
                      {dashboardDetail.accountBalances.slice(0, 8).map((acc) => (
                        <tr key={acc.id}>
                          <td>{acc.name}</td>
                          <td>{acc.type}</td>
                          <td className="right mono">{fmt(acc.assetValue)}</td>
                          <td className="right mono">{fmt(acc.portfolioValue)}</td>
                          <td className="right mono">{fmt(acc.liabilityValue)}</td>
                          <td className="right mono">{fmt(acc.total)}</td>
                        </tr>
                      ))}
                      {!dashboardDetail.accountBalances.length && <tr><td colSpan={6} className="empty">계좌 데이터가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3>자산 구성 / 포트폴리오 요약</h3>
                <div className="small muted" style={{ marginBottom: 8 }}>자산/부채 카테고리별 합계</div>
                {dashboardDetail.assetCategoryBreakdown.slice(0, 8).map((row) => (
                  <div key={`${row.kind}-${row.category}`} style={{ marginBottom: 10 }}>
                    <div className="row-between small">
                      <span>{row.kind} · {row.category}</span>
                      <strong className="mono">{fmt(row.value)}원</strong>
                    </div>
                    <div className="progress">
                      <div className={`bar ${row.kind === "부채" ? "bad" : ""}`} style={{ width: `${clamp(dashboard.netWorth > 0 ? row.value / dashboard.netWorth * 100 : 0, 0, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />
                <div className="small muted" style={{ marginBottom: 8 }}>투자 자산군 비중</div>
                {Object.entries(financialAnalysis.byClass).map(([k, v]) => (
                  <div key={k} className="row-between small" style={{ marginBottom: 6 }}>
                    <span>{k}</span>
                    <span className="mono">{fmt(v)}원 ({fmtPct(financialAnalysis.total > 0 ? (v / financialAnalysis.total) * 100 : 0)})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-3">
              <div className="card">
                <h3>입력점검 상세</h3>
                {validations.filter((v) => v.count > 0).length === 0 ? <div className="ok-box">현재 주요 입력 오류가 없습니다.</div> :
                  <div className="danger-box">
                    {validations.filter((v) => v.count > 0).map((v) => <div key={v.item}>• {v.item}: {fmt(v.count)}건</div>)}
                  </div>}
                <div className="small muted" style={{ marginTop: 8 }}>오류가 있으면 입력점검 탭에서 상세 위치를 확인하세요.</div>
              </div>

              <div className="card">
                <h3>핵심 라이프 이벤트</h3>
                {dashboardDetail.topEvents.map((e) => (
                  <div key={e.id} style={{ marginBottom: 12 }}>
                    <div className="row-between"><strong>{e.name}</strong><span className="small">{e.age}세 예정</span></div>
                    <div className="small muted">준비 {fmt(e.currentPrepared)}원 / 목표 {fmt(e.amountNeeded)}원</div>
                    <div className="small muted">부족액 {fmt(e.shortage)}원 · 월 필요 적립액 {fmt(e.monthlyNeed)}원</div>
                    <div className="progress"><div className={`bar ${e.progress >= 100 ? "" : e.progress >= 70 ? "warn" : "bad"}`} style={{ width: `${clamp(e.progress, 0, 100)}%` }} /></div>
                  </div>
                ))}
                {!dashboardDetail.topEvents.length && <div className="empty">설정된 라이프 이벤트가 없습니다.</div>}
              </div>

              <div className="card">
                <h3>절세/계좌 효율 요약</h3>
                {taxAnalysis.map((row) => (
                  <div key={row.name} style={{ marginBottom: 12 }}>
                    <div className="row-between"><strong>{row.name}</strong><span className="small">{row.taxLabel}</span></div>
                    <div className="small muted">평가액 {fmt(row.value)}원 · 손익 {fmt(row.profit)}원</div>
                    <div className="small muted">예상세금 {fmt(row.estimatedTax)}원 · {row.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3>최근 거래 8건</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>날짜</th><th>구분</th><th>분류</th><th className="right">금액</th><th>입금</th><th>출금</th><th>내용</th></tr></thead>
                  <tbody>
                    {dashboardDetail.recentTx.map((t) => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td>{t.type}</td>
                        <td>{t.cat1} / {t.cat2}</td>
                        <td className="right mono">{fmt(t.amount)}</td>
                        <td>{t.inAccount || "-"}</td>
                        <td>{t.outAccount || "-"}</td>
                        <td>{t.content}</td>
                      </tr>
                    ))}
                    {!dashboardDetail.recentTx.length && <tr><td colSpan={7} className="empty">최근 거래가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "transactions" && <TransactionsTab data={data} update={update} accountNamesIn={accountNamesIn} accountNamesOut={accountNamesOut} />}
        {tab === "assets" && <AssetsTab data={data} update={update} />}
        {tab === "portfolio" && <PortfolioTab data={data} update={update} accountOptions={accountOptions} />}
        {tab === "budget" && <BudgetTab data={data} update={update} budgetAnalysis={budgetAnalysis} />}
        {tab === "analysis" && <AnalysisTab data={data} financialAnalysis={financialAnalysis} />}
        {tab === "tax" && <TaxTab data={data} taxAnalysis={taxAnalysis} />}
        {tab === "planning" && <PlanningTab data={data} update={update} eventAnalysis={eventAnalysis} />}
        {tab === "simulation" && <SimulationTab data={data} futureSim={futureSim} />}
        {tab === "settings" && <SettingsTab data={data} update={update} />}
        {tab === "data" && (
          <div className="grid">
            <AccountsTab data={data} update={update} />
            <div className="card">
              <h3>백업 / 복원</h3>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <button className="btn primary" onClick={exportJSON}>JSON 백업 다운로드</button>
                <button className="btn ghost" onClick={() => fileInputRef.current?.click()}>JSON 복원</button>
                <button className="btn danger" onClick={clearAll}>전체 초기화</button>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
              </div>
              <div className="footer">마지막 저장: {data.lastSavedAt ? new Date(data.lastSavedAt).toLocaleString() : "-"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, note = "", tone = "current" }) {
  return (
    <div className={`kpi ${tone === "future" ? "kpi-future" : tone === "warning" ? "kpi-warning" : ""}`}>
      <div className="row-between" style={{ gap: 8, alignItems: "flex-start" }}>
        <div className="label">{label}</div>
        {note ? <span className={`mini-badge ${tone === "future" ? "mini-badge-future" : tone === "warning" ? "mini-badge-warning" : "mini-badge-current"}`}>{note}</span> : null}
      </div>
      <div className="value mono">{fmt(value)}<span className="small muted"> 원</span></div>
    </div>
  );
}

function TransactionsTab({ data, update, accountNamesIn, accountNamesOut }) {
  const [form, setForm] = useState({ id: "", date: todayISO(), type: "지출", cat1: "", cat2: "", amount: "", inAccount: "", outAccount: "", content: "", memo: "" });
  const cat1Options = Object.keys(data.categories[form.type] || {});
  const cat2Options = (data.categories[form.type] || {})[form.cat1] || [];

  const save = () => {
    if (!form.date || !form.type || !form.cat1 || !form.cat2 || n(form.amount) <= 0 || !form.content) return alert("필수값을 확인하세요.");
    if (form.type === "수입" && !form.inAccount) return alert("수입은 입금계좌가 필요합니다.");
    if (form.type === "지출" && !form.outAccount) return alert("지출은 출금계좌가 필요합니다.");
    if (form.type === "자산이동" && (!form.inAccount || !form.outAccount)) return alert("자산이동은 입출금 계좌가 모두 필요합니다.");

    update((d) => {
      const row = { ...form, amount: n(form.amount), id: form.id || uid() };
      const list = form.id ? d.transactions.map((t) => t.id === form.id ? row : t) : [...d.transactions, row];
      return { ...d, transactions: list };
    });
    setForm({ id: "", date: todayISO(), type: "지출", cat1: "", cat2: "", amount: "", inAccount: "", outAccount: "", content: "", memo: "" });
  };

  const remove = (id) => update((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  const edit = (t) => setForm({ ...t });
  const rows = [...data.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <div className="grid">
      <div className="card">
        <h3>거래 입력</h3>
        <div className="grid grid-4">
          <Field label="날짜"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="구분">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, cat1: "", cat2: "" })}>
              <option>수입</option><option>지출</option><option>자산이동</option>
            </select>
          </Field>
          <Field label="대분류">
            <select value={form.cat1} onChange={(e) => setForm({ ...form, cat1: e.target.value, cat2: "" })}>
              <option value="">선택</option>
              {cat1Options.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="소분류">
            <select value={form.cat2} onChange={(e) => setForm({ ...form, cat2: e.target.value })}>
              <option value="">선택</option>
              {cat2Options.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="금액"><input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="입금계좌">
            <select value={form.inAccount} onChange={(e) => setForm({ ...form, inAccount: e.target.value })}>
              <option value="">선택</option>{accountNamesIn.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="출금계좌">
            <select value={form.outAccount} onChange={(e) => setForm({ ...form, outAccount: e.target.value })}>
              <option value="">선택</option>{accountNamesOut.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="내용"><input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
        </div>
        <div style={{ marginTop: 12 }}><Field label="메모"><textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} /></Field></div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={save}>{form.id ? "수정 저장" : "거래 저장"}</button>
          <button className="btn ghost" onClick={() => setForm({ id: "", date: todayISO(), type: "지출", cat1: "", cat2: "", amount: "", inAccount: "", outAccount: "", content: "", memo: "" })}>초기화</button>
        </div>
      </div>

      <div className="card">
        <h3>거래 목록</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>날짜</th><th>구분</th><th>대분류</th><th>소분류</th><th className="right">금액</th><th>입금계좌</th><th>출금계좌</th><th>내용</th><th>작업</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td><td>{t.type}</td><td>{t.cat1}</td><td>{t.cat2}</td><td className="right mono">{fmt(t.amount)}</td><td>{t.inAccount}</td><td>{t.outAccount}</td><td>{t.content}</td>
                  <td className="row">
                    <button className="btn ghost" onClick={() => edit(t)}>수정</button>
                    <button className="btn danger" onClick={() => remove(t.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={9} className="empty">거래내역이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssetsTab({ data, update }) {
  const [form, setForm] = useState({ id: "", kind: "자산", category: "은행예금", name: "", current: "", previous: "", includeInEmergency: false, note: "" });
  const save = () => {
    if (!form.name) return alert("계좌/항목명을 입력하세요.");
    update((d) => {
      const row = { ...form, current: n(form.current), previous: n(form.previous), id: form.id || uid() };
      const assets = form.id ? d.assets.map((a) => a.id === form.id ? row : a) : [...d.assets, row];
      return { ...d, assets };
    });
    setForm({ id: "", kind: "자산", category: "은행예금", name: "", current: "", previous: "", includeInEmergency: false, note: "" });
  };
  const edit = (a) => setForm({ ...a });
  const remove = (id) => update((d) => ({ ...d, assets: d.assets.filter((a) => a.id !== id) }));
  const net = data.assets.filter((a) => a.kind === "자산").reduce((s, a) => s + n(a.current), 0) - data.assets.filter((a) => a.kind === "부채").reduce((s, a) => s + n(a.current), 0);

  return (
    <div className="grid">
      <div className="card">
        <h3>자산·부채 입력</h3>
        <div className="grid grid-4">
          <Field label="구분"><select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option>자산</option><option>부채</option></select></Field>
          <Field label="카테고리"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="계좌/항목명"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="현재 잔고"><input value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></Field>
          <Field label="전월 잔고"><input value={form.previous} onChange={(e) => setForm({ ...form, previous: e.target.value })} /></Field>
          <Field label="비상금 포함"><select value={String(form.includeInEmergency)} onChange={(e) => setForm({ ...form, includeInEmergency: e.target.value === "true" })}><option value="false">아니오</option><option value="true">예</option></select></Field>
          <Field label="비고"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn ghost" onClick={() => setForm({ id: "", kind: "자산", category: "은행예금", name: "", current: "", previous: "", includeInEmergency: false, note: "" })}>초기화</button>
          <div className="muted">순자산(자산-부채): <strong className="mono">{fmt(net)}</strong> 원</div>
        </div>
      </div>

      <div className="card">
        <h3>자산·부채 목록</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>구분</th><th>카테고리</th><th>이름</th><th className="right">현재</th><th className="right">전월</th><th className="right">증감</th><th>비상금</th><th>작업</th></tr></thead>
            <tbody>
              {data.assets.map((a) => (
                <tr key={a.id}>
                  <td>{a.kind}</td><td>{a.category}</td><td>{a.name}</td><td className="right mono">{fmt(a.current)}</td><td className="right mono">{fmt(a.previous)}</td><td className="right mono">{fmt(n(a.current)-n(a.previous))}</td><td>{a.includeInEmergency ? "예" : "아니오"}</td>
                  <td className="row"><button className="btn ghost" onClick={() => edit(a)}>수정</button><button className="btn danger" onClick={() => remove(a.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function PortfolioTab({ data, update, accountOptions }) {
  const emptyForm = () => ({
    id: "",
    account: accountOptions[0]?.name || "",
    name: "",
    code: "",
    ticker: "",
    symbol: "",
    market: "",
    currency: "KRW",
    quoteAsOf: "",
    qty: "",
    avgPrice: "",
    currentPrice: "",
    targetAmount: "",
    riskSigma: "0.22",
    assetClass: "나스닥",
    memo: ""
  });

  const [form, setForm] = useState(emptyForm());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [serverSuggestions, setServerSuggestions] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    if (!form.account && accountOptions[0]) setForm((f) => ({ ...f, account: accountOptions[0].name }));
  }, [accountOptions]);

  useEffect(() => {
    let mounted = true;
    quoteServerHealthCheck()
      .then(() => mounted && setServerStatus("ok"))
      .catch(() => mounted && setServerStatus("down"));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setServerSuggestions([]);
      return;
    }
    const q = searchKeyword.trim();
    let active = true;
    const local = STOCK_MASTER.filter((item) => {
      const hay = [item.name, item.code, item.ticker, item.market, item.symbol].map(normalizeStockQuery);
      const nq = normalizeStockQuery(q);
      return hay.some((x) => x.includes(nq));
    }).slice(0, 8);

    setServerSuggestions(local);
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const remote = await searchStockFromServer(q);
        if (!active) return;
        const merged = new Map();
        [...local, ...remote.map((r) => ({
          name: r.name,
          code: r.code,
          ticker: r.code || r.symbol,
          symbol: r.symbol,
          market: r.market || "",
          currency: r.currency || "",
          assetClass: "기타"
        }))].forEach((item) => {
          const key = item.symbol || item.code || item.name;
          if (key) merged.set(key, item);
        });
        setServerSuggestions(Array.from(merged.values()).slice(0, 10));
        setServerStatus("ok");
      } catch {
        if (active) setServerStatus("down");
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [searchKeyword]);

  const applySuggestion = async (item) => {
    setIsSearchOpen(false);
    setQuoteError("");
    const next = {
      ...form,
      name: item.name,
      code: item.code || item.ticker || "",
      ticker: item.ticker || item.code || "",
      symbol: item.symbol || "",
      market: item.market || "",
      currency: item.currency || form.currency || "KRW",
      assetClass: item.assetClass || form.assetClass || "기타",
    };
    setForm(next);
    setSearchKeyword(item.name || "");
    try {
      setIsFetchingQuote(true);
      const quote = await fetchQuoteFromServer(next);
      setForm((f) => ({
        ...f,
        name: item.name,
        code: quote.code || item.code || item.ticker || "",
        ticker: item.ticker || item.code || quote.code || "",
        symbol: quote.symbol || item.symbol || "",
        market: quote.market || item.market || "",
        currency: quote.currency || item.currency || f.currency || "KRW",
        currentPrice: quote.currentPrice ? String(quote.currentPrice) : f.currentPrice,
        quoteAsOf: quote.asOf || f.quoteAsOf,
      }));
      setServerStatus("ok");
    } catch (err) {
      setQuoteError("현재가 자동 조회에 실패했습니다. 필요하면 직접 입력하세요.");
      setServerStatus("down");
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const fetchCurrentPrice = async () => {
    setQuoteError("");
    try {
      setIsFetchingQuote(true);
      const quote = await fetchQuoteFromServer(form);
      setForm((f) => ({
        ...f,
        code: quote.code || f.code,
        symbol: quote.symbol || f.symbol,
        market: quote.market || f.market,
        currency: quote.currency || f.currency || "KRW",
        currentPrice: quote.currentPrice ? String(quote.currentPrice) : f.currentPrice,
        quoteAsOf: quote.asOf || f.quoteAsOf
      }));
      setServerStatus("ok");
    } catch (err) {
      setQuoteError("현재가 자동 조회에 실패했습니다. 시세 서버를 먼저 실행해 주세요.");
      setServerStatus("down");
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const bulkUpdateQuotes = async () => {
    if (!data.portfolio.length) return;
    setQuoteError("");
    try {
      setIsBulkUpdating(true);
      const payload = data.portfolio.map((p) => ({
        name: p.name,
        code: p.code || p.ticker || "",
        symbol: p.symbol || buildServerSymbolFromRow(p),
        currency: p.currency || "",
      }));
      const result = await fetchBulkQuotesFromServer(payload);
      update((d) => {
        const bySymbol = new Map();
        (result.results || []).forEach((r) => bySymbol.set(r.symbol || r.code || r.name, r));
        return {
          ...d,
          portfolio: d.portfolio.map((p) => {
            const key = p.symbol || buildServerSymbolFromRow(p) || p.code || p.name;
            const hit = bySymbol.get(key);
            if (!hit || !hit.ok) return p;
            return {
              ...p,
              symbol: hit.symbol || p.symbol,
              currentPrice: n(hit.currentPrice || p.currentPrice),
              currency: hit.currency || p.currency,
              quoteAsOf: hit.asOf || p.quoteAsOf,
            };
          })
        };
      });
      if (result.failed > 0) {
        setQuoteError(`일부 종목만 갱신되었습니다. 성공 ${result.success}개 / 실패 ${result.failed}개`);
      }
      setServerStatus("ok");
    } catch (err) {
      setQuoteError("전체 현재가 업데이트에 실패했습니다. 시세 서버가 실행 중인지 확인해 주세요.");
      setServerStatus("down");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const save = () => {
    if (!form.account || !form.name) return alert("계좌와 종목명을 입력하세요.");
    update((d) => {
      const row = {
        ...form,
        qty: n(form.qty),
        avgPrice: n(form.avgPrice),
        currentPrice: n(form.currentPrice || form.avgPrice),
        targetAmount: n(form.targetAmount),
        riskSigma: n(form.riskSigma),
        symbol: form.symbol || buildServerSymbolFromRow(form),
        id: form.id || uid()
      };
      const portfolio = form.id ? d.portfolio.map((p) => p.id === form.id ? row : p) : [...d.portfolio, row];
      return { ...d, portfolio };
    });
    setQuoteError("");
    setIsSearchOpen(false);
    setSearchKeyword("");
    setForm(emptyForm());
  };

  const edit = (p) => {
    setForm({
      ...emptyForm(),
      ...p,
      qty: p.qty ?? "",
      avgPrice: p.avgPrice ?? "",
      currentPrice: p.currentPrice ?? "",
      targetAmount: p.targetAmount ?? "",
      riskSigma: p.riskSigma ?? "0.22",
    });
    setSearchKeyword(p.name || "");
  };

  const remove = (id) => update((d) => ({ ...d, portfolio: d.portfolio.filter((p) => p.id !== id) }));

  return (
    <div className="grid">
      <div className="card">
        <div className="row-between">
          <h3>투자 포트폴리오 입력</h3>
          <span className={`chip ${serverStatus === "ok" ? "good" : serverStatus === "checking" ? "blue" : "bad"}`}>
            {serverStatus === "ok" ? "시세 서버 연결됨" : serverStatus === "checking" ? "시세 서버 확인 중" : "시세 서버 시작 필요"}
          </span>
        </div>
        <div className="section-note">
          기존 화면은 유지하고, 포트폴리오 탭에만 종목 검색 · 현재가 조회 · 전체 종목 업데이트 기능을 추가했습니다.
        </div>

        <div className="grid grid-4">
          <Field label="계좌">
            <select value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}>
              <option value="">선택</option>
              {accountOptions.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </Field>

          <Field label="종목 검색">
            <div style={{ position: "relative" }}>
              <input
                value={searchKeyword}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchKeyword(v);
                  setForm((f) => ({ ...f, name: v }));
                  setIsSearchOpen(true);
                }}
                placeholder="예: 삼성전자, NVDA, TIGER 나스닥100"
              />
              {isSearchOpen && (serverSuggestions.length > 0 || isSearching) && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid #d0d5dd", borderRadius: 12, boxShadow: "0 12px 28px rgba(16,24,40,.12)", maxHeight: 260, overflowY: "auto" }}>
                  {isSearching && <div style={{ padding: "10px 12px", fontSize: 12, color: "#667085" }}>검색 중...</div>}
                  {serverSuggestions.map((item) => (
                    <button
                      type="button"
                      key={`${item.symbol || item.code}-${item.name}`}
                      onClick={() => applySuggestion(item)}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "10px 12px", borderBottom: "1px solid #f2f4f7", cursor: "pointer" }}
                    >
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#667085" }}>{item.code || item.ticker || "-"} · {item.market || "-"} · {item.symbol || "-"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="종목코드"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="005930 / NVDA" /></Field>
          <Field label="티커"><input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="005930 / NVDA" /></Field>

          <Field label="시장"><input value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} placeholder="KRX / NASDAQ" /></Field>
          <Field label="통화"><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="KRW / USD" /></Field>
          <Field label="수량"><input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
          <Field label="매입평균가"><input value={form.avgPrice} onChange={(e) => setForm({ ...form, avgPrice: e.target.value })} /></Field>

          <Field label="현재가">
            <div className="row">
              <input value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} placeholder="자동 조회 또는 직접 입력" />
              <button type="button" className="btn ghost" onClick={fetchCurrentPrice} disabled={isFetchingQuote}>
                {isFetchingQuote ? "조회중..." : "현재가 조회"}
              </button>
            </div>
          </Field>
          <Field label="목표금액"><input value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></Field>
          <Field label="연간 변동성 σ"><input value={form.riskSigma} onChange={(e) => setForm({ ...form, riskSigma: e.target.value })} /></Field>
          <Field label="자산분류">
            <select value={form.assetClass} onChange={(e) => setForm({ ...form, assetClass: e.target.value })}>
              <option>나스닥</option><option>배당</option><option>현금</option><option>개별주식</option><option>기타</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <Field label="시세 기준시각"><input value={form.quoteAsOf ? String(form.quoteAsOf).replace("T", " ").slice(0, 19) : ""} readOnly placeholder="자동 기입" /></Field>
          <Field label="시세 심볼"><input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="005930.KS / NVDA" /></Field>
        </div>

        <div style={{ marginTop: 12 }}>
          <Field label="메모"><input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} /></Field>
        </div>

        {quoteError && <div className="danger-box small" style={{ marginTop: 12 }}>{quoteError}</div>}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn ghost" onClick={() => { setForm(emptyForm()); setSearchKeyword(""); setIsSearchOpen(false); setQuoteError(""); }}>초기화</button>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <h3>보유 종목 현황</h3>
          <button className="btn secondary" onClick={bulkUpdateQuotes} disabled={isBulkUpdating || !data.portfolio.length}>
            {isBulkUpdating ? "업데이트 중..." : "전체 종목 현재가 업데이트"}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>계좌</th><th>종목명</th><th>코드/심볼</th><th className="right">수량</th><th className="right">평단</th><th className="right">현재가</th><th className="right">매입원금</th><th className="right">평가금액</th><th className="right">손익</th><th className="right">수익률</th><th>작업</th>
              </tr>
            </thead>
            <tbody>
              {data.portfolio.map((p) => {
                const invested = n(p.qty) * n(p.avgPrice);
                const value = n(p.qty) * n(p.currentPrice || p.avgPrice);
                const profit = value - invested;
                const rate = invested > 0 ? profit / invested * 100 : 0;
                return (
                  <tr key={p.id}>
                    <td>{p.account}</td>
                    <td>
                      <div>{p.name}</div>
                      {p.quoteAsOf ? <div className="small muted">{String(p.quoteAsOf).replace("T", " ").slice(0, 19)}</div> : null}
                    </td>
                    <td>{p.code || p.symbol || p.ticker || "-"}</td>
                    <td className="right mono">{fmt(p.qty)}</td>
                    <td className="right mono">{fmt(p.avgPrice)}</td>
                    <td className="right mono">{fmt(p.currentPrice || p.avgPrice)}</td>
                    <td className="right mono">{fmt(invested)}</td>
                    <td className="right mono">{fmt(value)}</td>
                    <td className="right mono">{fmt(profit)}</td>
                    <td className="right mono">{fmtPct(rate)}</td>
                    <td className="row">
                      <button className="btn ghost" onClick={() => edit(p)}>수정</button>
                      <button className="btn danger" onClick={() => remove(p.id)}>삭제</button>
                    </td>
                  </tr>
                );
              })}
              {!data.portfolio.length && <tr><td colSpan={11} className="empty">보유 종목이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function BudgetTab({ data, update, budgetAnalysis }) {
  const [form, setForm] = useState({ id: "", cat1: "", budget: "", targetWeight: "" });
  const save = () => {
    if (!form.cat1) return alert("대분류를 입력하세요.");
    update((d) => {
      const row = { ...form, budget: n(form.budget), targetWeight: Number(form.targetWeight || 0), id: form.id || uid() };
      const budgets = form.id ? d.budgets.map((b) => b.id === form.id ? row : b) : [...d.budgets, row];
      return { ...d, budgets };
    });
    setForm({ id: "", cat1: "", budget: "", targetWeight: "" });
  };
  const edit = (b) => setForm({ ...b });
  const remove = (id) => update((d) => ({ ...d, budgets: d.budgets.filter((b) => b.id !== id) }));

  return (
    <div className="grid">
      <div className="card">
        <h3>월 예산 관리</h3>
        <div className="grid grid-4">
          <Field label="지출 대분류"><input value={form.cat1} onChange={(e) => setForm({ ...form, cat1: e.target.value })} /></Field>
          <Field label="월 예산"><input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
          <Field label="권장 비중(예: 0.15)"><input value={form.targetWeight} onChange={(e) => setForm({ ...form, targetWeight: e.target.value })} /></Field>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn ghost" onClick={() => setForm({ id: "", cat1: "", budget: "", targetWeight: "" })}>초기화</button>
        </div>
      </div>

      <div className="card">
        <h3>이번달 예산 대비 사용 현황</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>대분류</th><th className="right">권장비중</th><th className="right">월 예산</th><th className="right">이번달 지출</th><th className="right">사용률</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              {budgetAnalysis.map((b) => (
                <tr key={b.id}>
                  <td>{b.cat1}</td><td className="right mono">{fmtPct(n(b.targetWeight) * 100)}</td><td className="right mono">{fmt(b.budget)}</td><td className="right mono">{fmt(b.spent)}</td><td className="right mono">{fmtPct(b.rate)}</td>
                  <td>{b.status === "정상" ? <span className="chip good">정상</span> : b.status === "주의" ? <span className="chip warn">주의</span> : <span className="chip bad">초과</span>}</td>
                  <td className="row"><button className="btn ghost" onClick={() => edit(b)}>수정</button><button className="btn danger" onClick={() => remove(b.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({ data, financialAnalysis }) {
  return (
    <div className="grid">
      <div className="card">
        <h3>자산별 위험도 & 최대손실 시뮬레이션</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>자산</th><th className="right">평가금액</th><th className="right">비중</th><th className="right">연간σ</th><th className="right">-1σ 손실</th><th className="right">-2σ 손실</th><th>상태</th></tr></thead>
            <tbody>
              {financialAnalysis.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td><td className="right mono">{fmt(r.value)}</td><td className="right mono">{fmtPct(r.weight * 100)}</td><td className="right mono">{fmtPct(r.sigma * 100)}</td><td className="right mono">{fmt(r.loss1)}</td><td className="right mono">{fmt(r.loss2)}</td>
                  <td>{r.state === "정상" ? <span className="chip good">정상</span> : r.state === "주의" ? <span className="chip warn">주의</span> : <span className="chip bad">쏠림 경고</span>}</td>
                </tr>
              ))}
              {!financialAnalysis.rows.length && <tr><td colSpan={7} className="empty">포트폴리오 데이터가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>자산군 비중</h3>
          {Object.entries(financialAnalysis.byClass).map(([k, v]) => {
            const rate = financialAnalysis.total > 0 ? v / financialAnalysis.total * 100 : 0;
            return (
              <div key={k} style={{ marginBottom: 12 }}>
                <div className="row-between"><strong>{k}</strong><span className="mono">{fmtPct(rate)}</span></div>
                <div className="progress"><div className="bar" style={{ width: `${clamp(rate, 0, 100)}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3>요약</h3>
          <div className="small">총 평가금액: <strong className="mono">{fmt(financialAnalysis.total)}</strong> 원</div>
          <div className="small">종목 수: <strong>{data.portfolio.length}</strong></div>
          <div className="small">최대 비중 종목: <strong>{financialAnalysis.rows.slice().sort((a,b)=>b.value-a.value)[0]?.name || "-"}</strong></div>
          <div className="small">주의/경고 종목 수: <strong>{financialAnalysis.rows.filter((r) => r.state !== "정상").length}</strong></div>
        </div>
      </div>
    </div>
  );
}

function TaxTab({ data, taxAnalysis }) {
  return (
    <div className="grid">
      <div className="card">
        <h3>계좌별 구분 & 적용 세율</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>계좌 종류</th><th className="right">보유 종목 수</th><th className="right">평가금액</th><th className="right">납입원금</th><th className="right">평가손익</th><th>적용 세율</th><th className="right">예상세액</th><th>비고</th></tr></thead>
            <tbody>
              {taxAnalysis.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td><td className="right mono">{fmt(r.count)}</td><td className="right mono">{fmt(r.value)}</td><td className="right mono">{fmt(r.principal)}</td><td className="right mono">{fmt(r.profit)}</td><td>{r.taxLabel}</td><td className="right mono">{fmt(r.estimatedTax)}</td><td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>절세 메모</h3>
        <ul className="small" style={{ lineHeight: 1.8, paddingLeft: 18 }}>
          <li>ISA는 일반계좌(배당세율) 대비 절세효과를 비교하고, 만기 시점에는 ISA→연금 이전에 따른 추가 세액공제를 반영합니다.</li>
          <li>연금저축/IRP는 세액공제 개념이므로 일반 과세계좌와 같은 방식의 예상세액 계산은 하지 않습니다.</li>
          <li>현재 계산은 앱 내부 입력값 기준 추정치이며, 실제 세법 적용 및 개인 상황은 별도 확인이 필요합니다.</li>
        </ul>
      </div>
    </div>
  );
}

function PlanningTab({ data, update, eventAnalysis }) {
  const [form, setForm] = useState({ id: "", name: "", yearsFromNow: "", amountNeeded: "", currentPrepared: "", priority: "중간" });
  const save = () => {
    if (!form.name) return alert("이벤트명을 입력하세요.");
    update((d) => {
      const row = { ...form, yearsFromNow: n(form.yearsFromNow), amountNeeded: n(form.amountNeeded), currentPrepared: n(form.currentPrepared), id: form.id || uid() };
      const events = form.id ? d.events.map((e) => e.id === form.id ? row : e) : [...d.events, row];
      return { ...d, events };
    });
    setForm({ id: "", name: "", yearsFromNow: "", amountNeeded: "", currentPrepared: "", priority: "중간" });
  };
  const edit = (e) => setForm({ ...e });
  const remove = (id) => update((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));

  return (
    <div className="grid">
      <div className="card">
        <h3>예정된 라이프 이벤트</h3>
        <div className="grid grid-4">
          <Field label="이벤트"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="몇 년 후"><input value={form.yearsFromNow} onChange={(e) => setForm({ ...form, yearsFromNow: e.target.value })} /></Field>
          <Field label="필요 금액"><input value={form.amountNeeded} onChange={(e) => setForm({ ...form, amountNeeded: e.target.value })} /></Field>
          <Field label="현재 준비액"><input value={form.currentPrepared} onChange={(e) => setForm({ ...form, currentPrepared: e.target.value })} /></Field>
          <Field label="우선순위"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>높음</option><option>중간</option><option>낮음</option></select></Field>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn ghost" onClick={() => setForm({ id: "", name: "", yearsFromNow: "", amountNeeded: "", currentPrepared: "", priority: "중간" })}>초기화</button>
        </div>
      </div>
      <div className="card">
        <h3>이벤트 자금 계획표</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>이벤트</th><th className="right">몇 년 후</th><th className="right">나이</th><th className="right">필요 금액</th><th className="right">현재 준비액</th><th className="right">부족액</th><th className="right">월 필요 적립액</th><th>우선순위</th><th>작업</th></tr></thead>
            <tbody>
              {eventAnalysis.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td><td className="right mono">{fmt(e.yearsFromNow)}</td><td className="right mono">{fmt(e.age)}</td><td className="right mono">{fmt(e.amountNeeded)}</td><td className="right mono">{fmt(e.currentPrepared)}</td><td className="right mono">{fmt(e.shortage)}</td><td className="right mono">{fmt(e.monthlyNeed)}</td><td>{e.priority}</td>
                  <td className="row"><button className="btn ghost" onClick={() => edit(e)}>수정</button><button className="btn danger" onClick={() => remove(e.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SimulationTab({ data, futureSim }) {
  const totalAtRetire = futureSim[futureSim.length - 1]?.total || 0;
  const finalRow = futureSim[futureSim.length - 1] || {};
  return (
    <div className="grid">
      <div className="card">
        <h3>미래시뮬레이션 읽는 법</h3>
        <div className="section-note">이 탭은 현재 계좌 잔고가 아니라, 설정한 투자금 · 수익률 · ISA 재가입 · 연금 이전 가정으로 계산한 미래 추정 결과를 보여줍니다.</div>
        <div className="grid grid-3">
          <div className="insight-card">
            <div className="insight-title">ISA 절세 예상 총액</div>
            <div className="insight-text">ISA를 쓰지 않고 일반계좌로 투자했을 때보다 줄어들 것으로 보는 세금 총합입니다.</div>
          </div>
          <div className="insight-card">
            <div className="insight-title">ISA→연금 추가공제 예상</div>
            <div className="insight-text">ISA 만기 후 연금계좌로 옮겼을 때 연말정산에서 추가로 돌려받을 수 있다고 보는 공제 총합입니다.</div>
          </div>
          <div className="insight-card">
            <div className="insight-title">일반계좌 누적 초과분</div>
            <div className="insight-text">ISA 한도를 초과해서 일반계좌로 들어가야 하는 투자금 누적분입니다.</div>
          </div>
        </div>
      </div>
      <div className="grid grid-4">
        <KPI label="은퇴 나이" value={data.settings.retireAge} note="계획기준" />
        <KPI label="예상 은퇴시점 총자산" value={totalAtRetire} note="목표전망" tone="future" />
        <KPI label="ISA 절세 예상 총액" value={finalRow.isaTaxSaved || 0} note="목표전망" tone="future" />
        <KPI label="ISA→연금 추가공제 예상" value={finalRow.pensionCreditAcc || 0} note="목표전망" tone="future" />
        <KPI label="일반계좌 누적 초과분" value={finalRow.taxableOverflowAcc || 0} note="흐름지표" />
        <KPI label="ISA 재가입 횟수" value={finalRow.isaRolloverCount || 0} note="사이클" />
      </div>
      <div className="card">
        <h3>ISA 만기 → 연금 이전 → 새 ISA → 일반계좌 분리 흐름</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>연도</th><th>나이</th><th className="right">연 투자금</th><th className="right">ISA 납입</th><th className="right">일반계좌 초과납입</th><th className="right">연금 기본납입</th><th className="right">기본 세액공제</th><th className="right">만기 ISA→연금</th><th className="right">만기 후 새 ISA 시드</th><th className="right">만기 일반계좌 이관</th><th>비고</th></tr></thead>
            <tbody>
              {futureSim.map((r) => (
                <tr key={`flow-${r.year}`}>
                  <td>{r.yearLabel}</td>
                  <td>{r.age}</td>
                  <td className="right mono">{fmt(r.annualInvest)}</td>
                  <td className="right mono">{fmt(r.annualIsaContribution)}</td>
                  <td className="right mono">{fmt(r.annualTaxableOverflowInvest)}</td>
                  <td className="right mono">{fmt(r.annualPensionContribution)}</td>
                  <td className="right mono">{fmt(r.annualPensionBaseCredit)}</td>
                  <td className="right mono">{fmt(r.cycleTransferAmount)}</td>
                  <td className="right mono">{fmt(r.newIsaSeedAmount)}</td>
                  <td className="right mono">{fmt(r.generalAccountOverflowAtMaturity)}</td>
                  <td>{r.maturityOccurred ? `ISA ${r.cycleNumber}차 만기` : `ISA ${r.cycleNumber}차 ${r.yearInCycle}년차`}</td>
                </tr>
              ))}
              {!futureSim.length && <tr><td colSpan={11} className="empty">설정값을 확인하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>연도별 미래 시뮬레이션</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>연도</th><th>나이</th><th>년차</th><th className="right">월투자금</th><th className="right">나스닥 평가액</th><th className="right">배당ETF 평가액</th><th className="right">ISA 사이클 평가액</th><th className="right">ISA절세 누적</th><th className="right">연금세액공제 누적</th><th className="right">일반계좌 누적초과분</th><th className="right">총자산</th></tr></thead>
            <tbody>
              {futureSim.map((r) => (
                <tr key={r.year}>
                  <td>{r.yearLabel}</td><td>{r.age}</td><td>{r.year}</td><td className="right mono">{fmt(r.monthlyInvest)}</td><td className="right mono">{fmt(r.nasdaq)}</td><td className="right mono">{fmt(r.dividend)}</td><td className="right mono">{fmt(r.isaBalance)}</td><td className="right mono">{fmt(r.isaTaxSaved)}</td><td className="right mono">{fmt(r.pensionCreditAcc)}</td><td className="right mono">{fmt(r.taxableOverflowAcc)}</td><td className="right mono">{fmt(r.total)}</td>
                </tr>
              ))}
              {!futureSim.length && <tr><td colSpan={11} className="empty">설정값을 확인하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ data, update }) {
  const s = data.settings;
  const set = (k, v) => update((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));
  return (
    <div className="grid">
      <div className="grid grid-2">
        <div className="card">
          <h3>기본 정보</h3>
          <div className="grid grid-3">
            <Field label="현재 나이"><input value={s.currentAge} onChange={(e) => set("currentAge", n(e.target.value))} /></Field>
            <Field label="은퇴 나이"><input value={s.retireAge} onChange={(e) => set("retireAge", n(e.target.value))} /></Field>
            <Field label="기대 수명"><input value={s.lifeExpectancy} onChange={(e) => set("lifeExpectancy", n(e.target.value))} /></Field>
            <Field label="월급(본인)"><input value={s.monthlySalary1} onChange={(e) => set("monthlySalary1", n(e.target.value))} /></Field>
            <Field label="월급(배우자)"><input value={s.monthlySalary2} onChange={(e) => set("monthlySalary2", n(e.target.value))} /></Field>
            <Field label="연 물가상승률"><input value={s.annualInflation} onChange={(e) => set("annualInflation", Number(e.target.value))} /></Field>
            <Field label="은퇴 목표자산"><input value={s.retirementTargetAmount} onChange={(e) => set("retirementTargetAmount", n(e.target.value))} /></Field>
          </div>
        </div>
        <div className="card">
          <h3>ISA / 절세 설정</h3>
          <div className="grid grid-3">
            <Field label="ISA 연간 납입 한도"><input value={s.isaAnnualLimit} onChange={(e) => set("isaAnnualLimit", n(e.target.value))} /></Field>
            <Field label="ISA 만기 주기(년)"><input value={s.isaCycleYears} onChange={(e) => set("isaCycleYears", n(e.target.value))} /></Field>
            <Field label="ISA 비과세 한도"><input value={s.isaTaxFreeLimit} onChange={(e) => set("isaTaxFreeLimit", n(e.target.value))} /></Field>
            <Field label="ISA 초과분 세율"><input value={s.isaTaxRate} onChange={(e) => set("isaTaxRate", Number(e.target.value))} /></Field>
            <Field label="연금 세액공제율"><input value={s.pensionTaxCreditRate} onChange={(e) => set("pensionTaxCreditRate", Number(e.target.value))} /></Field>
            <Field label="일반 배당세율"><input value={s.taxableDividendTaxRate} onChange={(e) => set("taxableDividendTaxRate", Number(e.target.value))} /></Field>
            <Field label="ISA→연금 이전 비율(0~1)"><input value={s.isaPensionTransferRatio} onChange={(e) => set("isaPensionTransferRatio", Number(e.target.value))} /></Field>
            <Field label="연금 기본 납입액(연)"><input value={s.annualPensionContribution} onChange={(e) => set("annualPensionContribution", n(e.target.value))} /></Field>
            <Field label="연금 기본 공제한도(연)"><input value={s.pensionAnnualTaxCreditLimit} onChange={(e) => set("pensionAnnualTaxCreditLimit", n(e.target.value))} /></Field>
            <Field label="ISA→연금 추가공제 한도"><input value={s.isaPensionTransferDeduction} onChange={(e) => set("isaPensionTransferDeduction", n(e.target.value))} /></Field>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>투자 수익률 / 목표 비중</h3>
          <div className="grid grid-3">
            <Field label="나스닥 기대수익률"><input value={s.annualReturnNasdaq} onChange={(e) => set("annualReturnNasdaq", Number(e.target.value))} /></Field>
            <Field label="배당 기대수익률"><input value={s.annualReturnDividend} onChange={(e) => set("annualReturnDividend", Number(e.target.value))} /></Field>
            <Field label="연 투자증가율"><input value={s.annualRaise} onChange={(e) => set("annualRaise", Number(e.target.value))} /></Field>
            <Field label="나스닥100 비중"><input value={s.targetNasdaqWeight} onChange={(e) => set("targetNasdaqWeight", Number(e.target.value))} /></Field>
            <Field label="나스닥100(H) 비중"><input value={s.targetNasdaqHWeight} onChange={(e) => set("targetNasdaqHWeight", Number(e.target.value))} /></Field>
            <Field label="배당ETF 비중"><input value={s.targetDividendWeight} onChange={(e) => set("targetDividendWeight", Number(e.target.value))} /></Field>
          </div>
        </div>
        <div className="card">
          <h3>투자 스케줄 / 규칙</h3>
          <div className="grid grid-3">
            <Field label="1단계 월 투자금"><input value={s.monthlyInvestStage1} onChange={(e) => set("monthlyInvestStage1", n(e.target.value))} /></Field>
            <Field label="2단계 월 투자금"><input value={s.monthlyInvestStage2} onChange={(e) => set("monthlyInvestStage2", n(e.target.value))} /></Field>
            <Field label="3단계 월 투자금"><input value={s.monthlyInvestStage3} onChange={(e) => set("monthlyInvestStage3", n(e.target.value))} /></Field>
            <Field label="1단계 기간(년)"><input value={s.stage1Years} onChange={(e) => set("stage1Years", n(e.target.value))} /></Field>
            <Field label="2단계 기간(년)"><input value={s.stage2Years} onChange={(e) => set("stage2Years", n(e.target.value))} /></Field>
            <Field label="리밸런싱 허용편차(%)"><input value={s.rebalanceBandPct} onChange={(e) => set("rebalanceBandPct", n(e.target.value))} /></Field>
            <Field label="익절 기준(%)"><input value={s.takeProfitPct} onChange={(e) => set("takeProfitPct", n(e.target.value))} /></Field>
            <Field label="-3% 추가매수"><input value={s.dipBuy3PctAmount} onChange={(e) => set("dipBuy3PctAmount", n(e.target.value))} /></Field>
            <Field label="-5% 추가매수"><input value={s.dipBuy5PctAmount} onChange={(e) => set("dipBuy5PctAmount", n(e.target.value))} /></Field>
            <Field label="-10% 추가매수"><input value={s.dipBuy10PctAmount} onChange={(e) => set("dipBuy10PctAmount", n(e.target.value))} /></Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsTab({ data, update }) {
  const [form, setForm] = useState({ id: "", name: "", type: "은행", institution: "", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" });
  const save = () => {
    if (!form.name) return alert("계좌명을 입력하세요.");
    update((d) => {
      const row = { ...form, id: form.id || uid() };
      const accounts = form.id ? d.accounts.map((a) => a.id === form.id ? row : a) : [...d.accounts, row];
      return { ...d, accounts };
    });
    setForm({ id: "", name: "", type: "은행", institution: "", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" });
  };
  const edit = (a) => setForm({ ...a });
  const remove = (id) => update((d) => ({ ...d, accounts: d.accounts.filter((a) => a.id !== id) }));

  return (
    <div className="card">
      <h3>계좌관리</h3>
      <div className="grid grid-4">
        <Field label="계좌명"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="계좌유형"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>은행</option><option>증권</option><option>연금</option><option>현금</option><option>카드</option><option>대출</option><option>기타</option></select></Field>
        <Field label="기관명"><input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></Field>
        <Field label="통화"><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
        <Field label="소유자"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></Field>
        <Field label="활성여부"><select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}><option value="true">활성</option><option value="false">비활성</option></select></Field>
        <Field label="기본 입금계좌"><select value={String(form.defaultIn)} onChange={(e) => setForm({ ...form, defaultIn: e.target.value === "true" })}><option value="false">아니오</option><option value="true">예</option></select></Field>
        <Field label="비고"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={save}>계좌 저장</button>
        <button className="btn ghost" onClick={() => setForm({ id: "", name: "", type: "은행", institution: "", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "" })}>초기화</button>
      </div>
      <div className="hr" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>계좌명</th><th>유형</th><th>기관</th><th>통화</th><th>소유자</th><th>활성</th><th>기본입금</th><th>작업</th></tr></thead>
          <tbody>
            {data.accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td><td>{a.type}</td><td>{a.institution}</td><td>{a.currency}</td><td>{a.owner}</td><td>{a.active ? "예" : "아니오"}</td><td>{a.defaultIn ? "예" : "아니오"}</td>
                <td className="row"><button className="btn ghost" onClick={() => edit(a)}>수정</button><button className="btn danger" onClick={() => remove(a.id)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

export default App;
