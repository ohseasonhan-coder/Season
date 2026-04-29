import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "asset-app-final-complete-v1";
const LEGACY_STORAGE_KEYS = ["asset-app-sidebar-premium-season-fixed","asset-app-sidebar-premium-season-stock-server","asset-app-excel-parity-v1"];
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CLOUD_TABLE = "asset_app_profiles";
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ─── Utils ───────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0,10);
const thisMonthISO = () => new Date().toISOString().slice(0,7);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const n = (v) => { const x = Number(String(v ?? "").replace(/,/g,"").trim()); return Number.isFinite(x) ? x : 0; };
const fmt = (v) => new Intl.NumberFormat("ko-KR").format(Math.round(n(v)));
const fmtPct = (v, d=1) => `${n(v).toFixed(d)}%`;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const monthOf = (d) => String(d || "").slice(0,7);

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = {
  수입: { 근로소득:["월급","상여금","수당","기타"], 금융소득:["이자","배당","매매차익","환급"], 기타수입:["용돈","중고판매","기타"] },
  지출: { 식비:["외식","식재료","배달","커피/간식"], 주거:["관리비","전기/가스","통신비","인터넷"], 교통:["주유","대중교통","택시","주차"], 생활:["생필품","의류","미용","의료"], 보험세금:["보험료","세금","국민연금","기타"], 가족:["육아","부모님","선물","경조사"], 취미여행:["여행","구독","문화","운동"], 기타지출:["기타"] },
  자산이동: { 계좌이체:["내계좌간이체"], 투자:["주식매수","주식매도","ETF매수","ETF매도"], 대출:["대출실행","대출상환"] },
};
const DEFAULT_SETTINGS = {
  currentAge:36, retireAge:55, lifeExpectancy:100, currentNetWorthOverride:"",
  monthlySalary1:0, monthlySalary2:0, monthlyInvestDefault:2000000,
  annualReturnNasdaq:0.12, annualReturnDividend:0.08, annualRaise:0.03, annualInflation:0.025,
  isaAnnualLimit:20000000, isaCycleYears:5, isaStartYear:2026, isaStartMonth:2, isaPensionTransferDeduction:3000000, isaPensionTransferRatio:1,
  annualPensionContribution:0, pensionAnnualTaxCreditLimit:9000000, pensionTaxCreditRate:0.165,
  annualIsaContributionCurrent:0, annualTaxableIncomeEstimate:0, annualTaxOptimizingCash:0, expectedTaxableProfitRate:0.08,
  isaTaxFreeLimit:2000000, isaTaxRate:0.099, taxableDividendTaxRate:0.154, cashTaxRate:0.154,
  targetNasdaqWeight:0.45, targetNasdaqHWeight:0.45, targetDividendWeight:0.10,
  monthlyInvestStage1:2000000, monthlyInvestStage2:2500000, monthlyInvestStage3:5000000,
  stage1Years:2, stage2Years:4, stage3Years:10,
  includeEmergencyFundInNetWorth:true, spouseEnabled:true, childrenCount:0, dependentsCount:0,
  rebalanceBandPct:5, takeProfitPct:20, dipBuy3PctAmount:1000000, dipBuy5PctAmount:1000000, dipBuy10PctAmount:1000000,
  retirementTargetAmount:2000000000,
  retirementMonthlyExpense:5000000,
  retirementTravelBucket:500000000,
  retirementTravelYears:5,
  additionalPensionEnabled:false,
  additionalPensionName:"추가 연금",
  additionalPensionMonthly:0,
  additionalPensionAnnualIncrease:0,
  postRetirementReturn:0.07,
  compareRetireAge:60,
  fxUsdKrw:0,
  fxAsOf:"",
  marketDataLastUpdated:"",
  autoUpdateMarketDataOnStart:false,
  autoTaxUpdateEnabled:true,
  taxUpdateLastChecked:"",
  taxUpdateSummary:"",
  taxUpdateStatus:"not_checked",
  taxUpdateSource:"",
  autoTriggerEnabled:true,
  autoRebalanceTriggerEnabled:true,
  autoBuyTriggerEnabled:true,
  triggerMonthlyInvestAmount:2000000,
  triggerCashAvailable:0,
  investmentTargets:[
    { id:"target-nasdaq", name:"나스닥", expectedReturn:0.12, targetWeight:0.90, memo:"TIGER 나스닥100 / H 포함" },
    { id:"target-dividend", name:"배당", expectedReturn:0.08, targetWeight:0.10, memo:"배당 ETF" },
    { id:"target-cash", name:"현금", expectedReturn:0.03, targetWeight:0.00, memo:"KOFR·파킹통장 등" },
    { id:"target-other", name:"기타", expectedReturn:0.06, targetWeight:0.00, memo:"개별주·기타 ETF" },
  ],
};
const DEFAULT_BUDGETS = [
  { id:uid(), cat1:"식비", budget:800000, targetWeight:0.15 },
  { id:uid(), cat1:"주거", budget:400000, targetWeight:0.10 },
  { id:uid(), cat1:"교통", budget:250000, targetWeight:0.05 },
  { id:uid(), cat1:"생활", budget:300000, targetWeight:0.06 },
  { id:uid(), cat1:"보험세금", budget:500000, targetWeight:0.10 },
  { id:uid(), cat1:"가족", budget:250000, targetWeight:0.05 },
  { id:uid(), cat1:"취미여행", budget:400000, targetWeight:0.08 },
  { id:uid(), cat1:"기타지출", budget:200000, targetWeight:0.04 },
];
const DEFAULT_EVENTS = [
  { id:uid(), name:"👶 출산", yearsFromNow:1, amountNeeded:5000000, currentPrepared:1000000, priority:"높음" },
  { id:uid(), name:"🚼 육아 첫해", yearsFromNow:1, amountNeeded:6000000, currentPrepared:500000, priority:"높음" },
  { id:uid(), name:"🏖️ 가족여행", yearsFromNow:2, amountNeeded:3000000, currentPrepared:500000, priority:"중간" },
  { id:uid(), name:"🚗 차량 교체", yearsFromNow:4, amountNeeded:25000000, currentPrepared:8000000, priority:"높음" },
];
const DEFAULT_ACCOUNTS = [
  { id:uid(), name:"우리은행(급여)", type:"은행", institution:"우리은행", currency:"KRW", owner:"본인", active:true, defaultIn:true, note:"" },
  { id:uid(), name:"카카오뱅크", type:"은행", institution:"카카오뱅크", currency:"KRW", owner:"본인", active:true, defaultIn:false, note:"" },
  { id:uid(), name:"ISA", type:"증권", institution:"증권사", currency:"KRW", owner:"본인", active:true, defaultIn:false, note:"" },
  { id:uid(), name:"연금저축", type:"연금", institution:"증권사", currency:"KRW", owner:"본인", active:true, defaultIn:false, note:"" },
  { id:uid(), name:"IRP", type:"연금", institution:"증권사", currency:"KRW", owner:"본인", active:true, defaultIn:false, note:"" },
  { id:uid(), name:"신용카드", type:"카드", institution:"카드사", currency:"KRW", owner:"본인", active:true, defaultIn:false, note:"" },
];
const DEFAULT_ASSETS = [
  { id:uid(), kind:"자산", category:"현금성", name:"현금", current:0, previous:0, includeInEmergency:true, note:"" },
  { id:uid(), kind:"자산", category:"은행예금", name:"우리은행(급여)", current:0, previous:0, includeInEmergency:false, note:"" },
  { id:uid(), kind:"자산", category:"은행예금", name:"카카오뱅크", current:0, previous:0, includeInEmergency:true, note:"" },
  { id:uid(), kind:"부채", category:"카드", name:"신용카드", current:0, previous:0, includeInEmergency:false, note:"" },
];
const DEFAULT_PORTFOLIO = [
  { id:uid(), account:"ISA", name:"TIGER 나스닥100", qty:0, avgPrice:0, currentPrice:0, targetAmount:0, riskSigma:0.22, assetClass:"나스닥", memo:"" },
  { id:uid(), account:"ISA", name:"TIGER 나스닥100(H)", qty:0, avgPrice:0, currentPrice:0, targetAmount:0, riskSigma:0.22, assetClass:"나스닥", memo:"" },
  { id:uid(), account:"ISA", name:"TIGER 배당다우존스", qty:0, avgPrice:0, currentPrice:0, targetAmount:0, riskSigma:0.15, assetClass:"배당", memo:"" },
];
const STOCK_MASTER = [
  { name:"삼성전자", code:"005930", symbol:"005930.KS", ticker:"005930", market:"KRX", currency:"KRW", assetClass:"개별주식" },
  { name:"SK하이닉스", code:"000660", symbol:"000660.KS", ticker:"000660", market:"KRX", currency:"KRW", assetClass:"개별주식" },
  { name:"TIGER 나스닥100", code:"133690", symbol:"133690.KS", ticker:"133690", market:"KRX ETF", currency:"KRW", assetClass:"나스닥" },
  { name:"TIGER 나스닥100(H)", code:"448300", symbol:"448300.KS", ticker:"448300", market:"KRX ETF", currency:"KRW", assetClass:"나스닥" },
  { name:"TIGER 배당다우존스", code:"458730", symbol:"458730.KS", ticker:"458730", market:"KRX ETF", currency:"KRW", assetClass:"배당" },
  { name:"KODEX KOFR금리액티브(합성)", code:"423160", symbol:"423160.KS", ticker:"423160", market:"KRX ETF", currency:"KRW", assetClass:"현금" },
  { name:"Amazon", code:"AMZN", symbol:"AMZN", ticker:"AMZN", market:"NASDAQ", currency:"USD", assetClass:"개별주식" },
  { name:"Apple", code:"AAPL", symbol:"AAPL", ticker:"AAPL", market:"NASDAQ", currency:"USD", assetClass:"개별주식" },
  { name:"NVIDIA", code:"NVDA", symbol:"NVDA", ticker:"NVDA", market:"NASDAQ", currency:"USD", assetClass:"개별주식" },
  { name:"Tesla", code:"TSLA", symbol:"TSLA", ticker:"TSLA", market:"NASDAQ", currency:"USD", assetClass:"개별주식" },
  { name:"Microsoft", code:"MSFT", symbol:"MSFT", ticker:"MSFT", market:"NASDAQ", currency:"USD", assetClass:"개별주식" },
];

// ─── Data Normalization ──────────────────────────────────────────────────────
function normalizeSalaryLabel(v) { return v === "월급(승훈)" || v === "월급(정원)" || v === "월급" ? "월급" : v; }
function normalizeCategories(c) {
  const merged = { ...DEFAULT_CATEGORIES, ...(c || {}) };
  const labor = Array.isArray((merged.수입||{}).근로소득) ? merged.수입.근로소득 : [];
  merged.수입 = { ...merged.수입, 근로소득: [...new Set(labor.map(normalizeSalaryLabel))] };
  return merged;
}
function emptyData() {
  return { version:10, categories:DEFAULT_CATEGORIES, transactions:[], accounts:DEFAULT_ACCOUNTS, assets:DEFAULT_ASSETS, portfolio:DEFAULT_PORTFOLIO, budgets:DEFAULT_BUDGETS, events:DEFAULT_EVENTS, settings:DEFAULT_SETTINGS, lastSavedAt:null };
}
function migrateData(d) {
  const x = { ...emptyData(), ...d };
  x.categories = normalizeCategories(d.categories);
  x.transactions = Array.isArray(d.transactions) ? d.transactions.map((t) => ({ ...t, cat2: normalizeSalaryLabel(t.cat2) })) : [];
  x.accounts = Array.isArray(d.accounts) && d.accounts.length ? d.accounts : DEFAULT_ACCOUNTS;
  x.assets = Array.isArray(d.assets) ? d.assets.map((r) => ({ includeInEmergency:false, category:r.kind==="부채"?"부채":"기타", ...r })) : DEFAULT_ASSETS;
  x.portfolio = Array.isArray(d.portfolio) ? d.portfolio.map((p) => ({ riskSigma:0.22, assetClass:"기타", ...p })) : DEFAULT_PORTFOLIO;
  x.budgets = Array.isArray(d.budgets) && d.budgets.length ? d.budgets : DEFAULT_BUDGETS;
  x.events = Array.isArray(d.events) && d.events.length ? d.events : DEFAULT_EVENTS;
  x.settings = { ...DEFAULT_SETTINGS, ...(d.settings||{}) };
  // 추가 연금 필드 보정: 과거 버전의 보훈연금 필드가 있으면 새 필드로 안전하게 이전
  if (d.settings) {
    if (x.settings.additionalPensionMonthly === undefined || x.settings.additionalPensionMonthly === null) {
      x.settings.additionalPensionMonthly = n(d.settings.veteransPensionMonthly);
    }
    if (x.settings.additionalPensionAnnualIncrease === undefined || x.settings.additionalPensionAnnualIncrease === null) {
      x.settings.additionalPensionAnnualIncrease = n(d.settings.veteransPensionAnnualIncrease);
    }
    if (!x.settings.additionalPensionName) x.settings.additionalPensionName = "추가 연금";
    if (x.settings.additionalPensionEnabled === undefined || x.settings.additionalPensionEnabled === null) {
      x.settings.additionalPensionEnabled = n(x.settings.additionalPensionMonthly) > 0;
    }
  }
  const legacyTargets = [
    { id:"target-nasdaq", name:"나스닥", expectedReturn:n(x.settings.annualReturnNasdaq || 0.12), targetWeight:n(x.settings.targetNasdaqWeight)+n(x.settings.targetNasdaqHWeight), memo:"기존 나스닥 목표비중에서 자동 전환" },
    { id:"target-dividend", name:"배당", expectedReturn:n(x.settings.annualReturnDividend || 0.08), targetWeight:n(x.settings.targetDividendWeight), memo:"기존 배당 목표비중에서 자동 전환" },
  ];
  x.settings.investmentTargets = Array.isArray(x.settings.investmentTargets) && x.settings.investmentTargets.length
    ? x.settings.investmentTargets.map((t,i)=>({ id:t.id||uid(), name:t.name||`전략${i+1}`, expectedReturn:n(t.expectedReturn), targetWeight:n(t.targetWeight), memo:t.memo||"" }))
    : legacyTargets;
  x.settings.autoTriggerEnabled = x.settings.autoTriggerEnabled !== false;
  x.settings.autoRebalanceTriggerEnabled = x.settings.autoRebalanceTriggerEnabled !== false;
  x.settings.autoBuyTriggerEnabled = x.settings.autoBuyTriggerEnabled !== false;
  x.settings.triggerMonthlyInvestAmount = n(x.settings.triggerMonthlyInvestAmount || x.settings.monthlyInvestDefault || x.settings.monthlyInvestStage1 || 0);
  x.settings.triggerCashAvailable = n(x.settings.triggerCashAvailable || 0);
  x.settings.fxUsdKrw = n(x.settings.fxUsdKrw || 0);
  x.settings.fxAsOf = x.settings.fxAsOf || "";
  x.settings.marketDataLastUpdated = x.settings.marketDataLastUpdated || "";
  x.settings.autoUpdateMarketDataOnStart = x.settings.autoUpdateMarketDataOnStart === true;
  x.settings.autoTaxUpdateEnabled = x.settings.autoTaxUpdateEnabled !== false;
  x.settings.taxUpdateLastChecked = x.settings.taxUpdateLastChecked || "";
  x.settings.taxUpdateSummary = x.settings.taxUpdateSummary || "";
  x.settings.taxUpdateStatus = x.settings.taxUpdateStatus || "not_checked";
  x.settings.taxUpdateSource = x.settings.taxUpdateSource || "";
  return x;
}
function loadData() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return migrateData({ ...emptyData(), ...JSON.parse(raw) });
    }
    return emptyData();
  } catch { return emptyData(); }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...d, lastSavedAt: new Date().toISOString() })); }

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d0f14;
  --surface:#161920;
  --surface2:#1e2129;
  --surface3:#252830;
  --border:#2a2d36;
  --border2:#353840;
  --text:#f0f1f3;
  --text2:#9ba3b5;
  --text3:#5a6278;
  --accent:#6c7dff;
  --accent2:#8b9aff;
  --accent-bg:rgba(108,125,255,0.12);
  --green:#34d58a;
  --green-bg:rgba(52,213,138,0.12);
  --red:#ff5c72;
  --red-bg:rgba(255,92,114,0.12);
  --amber:#f0b429;
  --amber-bg:rgba(240,180,41,0.12);
  --radius:14px;
  --radius-lg:20px;
  --radius-xl:28px;
  --shadow:0 2px 12px rgba(0,0,0,0.4);
  --shadow-lg:0 8px 32px rgba(0,0,0,0.5);
}
body{font-family:'Pretendard',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer}
input,select,textarea{font-family:inherit}

/* Scrollbar */
*::-webkit-scrollbar{width:4px;height:4px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}

/* Layout */
.app{min-height:100vh;display:flex;flex-direction:column}
.shell{display:flex;flex:1;overflow:hidden;height:100vh}

/* Sidebar Nav */
.sidebar{width:220px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 12px;gap:4px;overflow-y:auto;position:fixed;height:100vh;z-index:50}
.sidebar-logo{padding:8px 12px 20px;display:flex;align-items:center;gap:10px}
.logo-mark{width:32px;height:32px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0}
.logo-text{font-size:14px;font-weight:700;color:var(--text);letter-spacing:-.02em}
.logo-sub{font-size:10px;color:var(--text3);margin-top:1px}
.nav-section{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.08em;padding:12px 12px 6px;text-transform:uppercase}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;transition:.15s ease;border:none;background:none;width:100%;text-align:left;white-space:nowrap}
.nav-item:hover{background:var(--surface2);color:var(--text)}
.nav-item.active{background:var(--accent-bg);color:var(--accent);font-weight:600}
.nav-item .nav-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0}
.nav-dot{width:6px;height:6px;border-radius:99px;background:var(--red);margin-left:auto;flex-shrink:0}


/* Collapsible sidebar - Apple blur motion compact */
.sidebar{
  transition:width .28s cubic-bezier(.2,.8,.2,1), padding .28s cubic-bezier(.2,.8,.2,1), background .28s ease, box-shadow .28s ease;
  backdrop-filter:blur(22px) saturate(160%);
  -webkit-backdrop-filter:blur(22px) saturate(160%);
  background:rgba(22,25,32,.82);
  box-shadow:inset -1px 0 0 rgba(255,255,255,.04), 12px 0 40px rgba(0,0,0,.18);
}
.main{transition:margin-left .28s cubic-bezier(.2,.8,.2,1)}
.sidebar-logo,.nav-item,.sidebar-toggle{transition:all .24s cubic-bezier(.2,.8,.2,1)}
.logo-copy,.nav-label,.nav-section{transition:opacity .16s ease, transform .18s ease}
.sidebar-toggle{
  height:32px;
  margin:2px 6px 10px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:14px;
  background:rgba(255,255,255,.055);
  color:rgba(240,241,243,.72);
  font-weight:800;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:background .18s ease,color .18s ease,transform .18s ease,border-color .18s ease,box-shadow .18s ease;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
}
.sidebar-toggle:hover{
  background:rgba(255,255,255,.105);
  color:#fff;
  border-color:rgba(255,255,255,.14);
  transform:translateY(-1px);
  box-shadow:0 8px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.07);
}
.toggle-glyph{
  font-size:16px;
  line-height:1;
  opacity:.86;
  transform:translateY(-1px);
  transition:transform .2s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
}
.sidebar-toggle:hover .toggle-glyph{opacity:1;transform:translateY(-1px) scale(1.12)}
.sidebar.collapsed{
  width:72px;
  padding:14px 10px;
  background:rgba(22,25,32,.9);
  overflow:visible;
}
.sidebar.collapsed .sidebar-logo{
  padding:4px 0 8px;
  justify-content:center;
  margin-bottom:0;
}
.sidebar.collapsed .logo-mark{
  width:34px;
  height:34px;
  border-radius:12px;
}
.sidebar.collapsed .logo-copy,
.sidebar.collapsed .nav-label{
  opacity:0;
  transform:translateX(-8px);
  pointer-events:none;
  width:0;
  max-width:0;
  overflow:hidden;
}
.sidebar.collapsed .nav-section{
  display:none;
}
.sidebar.collapsed .nav-item{
  width:42px;
  height:40px;
  min-height:40px;
  justify-content:center;
  padding:0;
  margin:2px auto;
  gap:0;
  border-radius:15px;
  position:relative;
  overflow:visible;
}
.sidebar.collapsed .nav-item.active{
  background:rgba(108,125,255,.18);
  box-shadow:inset 0 0 0 1px rgba(108,125,255,.16);
}
.sidebar.collapsed .nav-icon{
  width:auto;
  font-size:17px;
  line-height:1;
}
.sidebar.collapsed .nav-dot{
  position:absolute;
  right:8px;
  top:8px;
  margin-left:0;
}
.sidebar.collapsed .sidebar-toggle{
  width:42px;
  height:30px;
  margin:0 auto 8px;
  border-radius:15px;
}
.main.expanded{margin-left:72px}
.nav-item{position:relative;overflow:hidden}
.nav-item:before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:linear-gradient(135deg,rgba(255,255,255,.08),transparent 65%);
  opacity:0;
  transition:opacity .18s ease;
  pointer-events:none;
}
.nav-item:hover:before,.nav-item.active:before{opacity:1}
.sidebar.collapsed .nav-item::after{
  content:attr(data-tip);
  position:absolute;
  left:calc(100% + 12px);
  top:50%;
  transform:translateY(-50%) translateX(-4px);
  opacity:0;
  visibility:hidden;
  pointer-events:none;
  white-space:nowrap;
  z-index:9999;
  padding:8px 10px;
  border-radius:12px;
  background:rgba(28,30,36,.96);
  color:#f5f7fb;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 14px 30px rgba(0,0,0,.28);
  font-size:12px;
  font-weight:700;
  letter-spacing:-.01em;
  transition:opacity .14s ease, transform .14s ease, visibility .14s ease;
}
.sidebar.collapsed .nav-item::before{
  border-radius:15px;
}
.sidebar.collapsed .nav-item:hover::after{
  opacity:1;
  visibility:visible;
  transform:translateY(-50%) translateX(0);
}
@media(max-width:900px){
  .sidebar.collapsed{width:64px;padding-left:8px;padding-right:8px}
  .sidebar.collapsed .nav-item{width:40px;height:38px;min-height:38px}
  .main.expanded{margin-left:64px}
}

/* Main content */
.main{flex:1;margin-left:220px;overflow-y:auto;height:100vh}
.page{padding:28px 32px;max-width:1400px}

/* Top bar */
.topbar{padding:16px 32px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40}
.topbar-title{font-size:18px;font-weight:700;letter-spacing:-.02em}
.topbar-right{display:flex;align-items:center;gap:10px}

/* Cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px}
.card-sm{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px}
.card h3{font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px;letter-spacing:-.01em}
.card-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.card-title h3{margin-bottom:0}

/* KPI Cards */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;position:relative;overflow:hidden;transition:.2s ease}
.kpi-card:hover{border-color:var(--border2);transform:translateY(-1px)}
.kpi-card::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.02) 0%,transparent 60%);pointer-events:none}
.kpi-label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.kpi-value{font-size:26px;font-weight:800;letter-spacing:-.04em;color:var(--text);line-height:1}
.kpi-unit{font-size:13px;font-weight:500;color:var(--text3);margin-left:2px}
.kpi-sub{font-size:11px;margin-top:8px;display:flex;align-items:center;gap:5px}
.kpi-accent{border-color:rgba(108,125,255,.35);background:linear-gradient(135deg,var(--surface) 60%,rgba(108,125,255,.08))}
.kpi-green{border-color:rgba(52,213,138,.25)}
.kpi-red{border-color:rgba(255,92,114,.25)}

/* Grid */
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.stack{display:flex;flex-direction:column;gap:14px}
.row{display:flex;align-items:center;gap:10px}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:10px}

/* Badges / Chips */
.badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600}
.badge-accent{background:var(--accent-bg);color:var(--accent)}
.badge-green{background:var(--green-bg);color:var(--green)}
.badge-red{background:var(--red-bg);color:var(--red)}
.badge-amber{background:var(--amber-bg);color:var(--amber)}
.badge-muted{background:var(--surface2);color:var(--text2)}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;border:none;transition:.15s ease;white-space:nowrap}
.btn:hover{opacity:.88;transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:var(--accent);color:#fff}
.btn-ghost{background:var(--surface2);color:var(--text2);border:1px solid var(--border)}
.btn-danger{background:var(--red-bg);color:var(--red);border:1px solid rgba(255,92,114,.25)}
.btn-success{background:var(--green-bg);color:var(--green);border:1px solid rgba(52,213,138,.25)}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:8px}

/* Forms */
.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
.field input,.field select,.field textarea{width:100%;padding:10px 13px;border:1px solid var(--border2);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;transition:.15s;outline:none}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.field textarea{min-height:80px;resize:vertical}
.field select option{background:var(--surface2)}
.table-wrap input,.table-wrap select,.table-wrap textarea{width:100%;min-width:92px;padding:9px 12px;border:1px solid var(--border2);border-radius:10px;background:var(--surface2);color:var(--text);font-size:13px;transition:.15s;outline:none;font-family:inherit}
.table-wrap input:focus,.table-wrap select:focus,.table-wrap textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.table-wrap input::placeholder{color:var(--text3)}
.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.form-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.form-actions{display:flex;gap:8px;margin-top:14px}


/* Field validation + AI suggestion */
.field-label-with-alert{display:flex;align-items:center;gap:6px}
.field-hint{font-size:10.5px;color:var(--text3);margin-top:5px;line-height:1.35}
.field-alert-dot{
  position:relative;
  width:15px;height:15px;border-radius:99px;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:900;line-height:1;
  cursor:help;transition:.16s ease;
  box-shadow:0 0 0 1px rgba(255,255,255,.08), 0 6px 14px rgba(0,0,0,.18);
  outline:none;
}
.field-alert-dot.danger{background:var(--red-bg);color:var(--red);border:1px solid rgba(255,92,114,.32)}
.field-alert-dot.warn{background:var(--amber-bg);color:var(--amber);border:1px solid rgba(240,180,41,.32)}
.field-alert-dot:hover,.field-alert-dot:focus{transform:translateY(-1px) scale(1.12);opacity:1}
.field-alert-dot::after{
  content:attr(data-msg);
  position:absolute;
  bottom:140%;
  left:50%;
  transform:translateX(-50%) translateY(4px);
  min-width:max-content;
  max-width:260px;
  padding:7px 9px;
  border-radius:9px;
  background:rgba(20,22,28,.98);
  color:#fff;
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 12px 28px rgba(0,0,0,.36);
  font-size:11px;
  font-weight:700;
  letter-spacing:-.01em;
  white-space:nowrap;
  opacity:0;
  visibility:hidden;
  pointer-events:none;
  z-index:9999;
  transition:opacity .14s ease, transform .14s ease, visibility .14s ease;
}
.field-alert-dot::before{
  content:"";
  position:absolute;
  bottom:118%;
  left:50%;
  transform:translateX(-50%) translateY(4px);
  border:5px solid transparent;
  border-top-color:rgba(20,22,28,.98);
  opacity:0;
  visibility:hidden;
  pointer-events:none;
  z-index:9999;
  transition:opacity .14s ease, transform .14s ease, visibility .14s ease;
}
.field-alert-dot:hover::after,.field-alert-dot:hover::before,
.field-alert-dot:focus::after,.field-alert-dot:focus::before{
  opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);
}
.field-has-error input,.field-has-error select,.field-has-error textarea{border-color:rgba(255,92,114,.55)!important;box-shadow:0 0 0 3px rgba(255,92,114,.10)}
.field-has-warn input,.field-has-warn select,.field-has-warn textarea{border-color:rgba(240,180,41,.46)!important;box-shadow:0 0 0 3px rgba(240,180,41,.09)}
.suggestion-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
.suggestion-chip{
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.045);
  color:var(--text2);
  padding:4px 8px;
  border-radius:999px;
  font-size:10.5px;
  font-weight:700;
  transition:.15s ease;
}
.suggestion-chip:hover{background:rgba(108,125,255,.14);border-color:rgba(108,125,255,.24);color:var(--accent2);transform:translateY(-1px)}
.ai-suggest-card{
  margin:14px 0 0;padding:14px;border-radius:var(--radius);
  background:linear-gradient(135deg,rgba(108,125,255,.12),rgba(255,255,255,.035));
  border:1px solid rgba(108,125,255,.22);
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
}
.ai-suggest-title{font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px}
.ai-suggest-desc{font-size:12px;color:var(--text2);line-height:1.5}
.ai-chip-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.ai-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font-size:11px;color:var(--text2)}


/* Compact status tooltip */
.info-tooltip{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:22px;
  height:22px;
  padding:0 8px;
  border-radius:999px;
  font-size:11px;
  font-weight:900;
  cursor:help;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(255,255,255,.045);
  color:var(--text2);
  outline:none;
}
.info-tooltip.ok{background:var(--green-bg);color:var(--green);border-color:rgba(52,213,138,.25)}
.info-tooltip.danger{background:var(--red-bg);color:var(--red);border-color:rgba(255,92,114,.28)}
.info-tooltip.warn{background:var(--amber-bg);color:var(--amber);border-color:rgba(240,180,41,.28)}
.info-tooltip.info{background:var(--accent-bg);color:var(--accent2);border-color:rgba(108,125,255,.24)}
.info-tooltip::after{
  content:attr(data-msg);
  position:absolute;
  top:130%;
  left:50%;
  transform:translateX(-50%) translateY(-4px);
  min-width:max-content;
  max-width:320px;
  padding:8px 10px;
  border-radius:10px;
  background:rgba(20,22,28,.98);
  color:#fff;
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 14px 30px rgba(0,0,0,.34);
  font-size:11px;
  font-weight:700;
  line-height:1.45;
  white-space:nowrap;
  opacity:0;
  visibility:hidden;
  pointer-events:none;
  z-index:9999;
  transition:opacity .14s ease, transform .14s ease, visibility .14s ease;
}
.info-tooltip::before{
  content:"";
  position:absolute;
  top:105%;
  left:50%;
  transform:translateX(-50%) translateY(-4px);
  border:5px solid transparent;
  border-bottom-color:rgba(20,22,28,.98);
  opacity:0;
  visibility:hidden;
  z-index:9999;
  transition:opacity .14s ease, transform .14s ease, visibility .14s ease;
}
.info-tooltip:hover::after,.info-tooltip:hover::before,
.info-tooltip:focus::after,.info-tooltip:focus::before{
  opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);
}

/* Reduce always-visible helper text */
.field-hint{
  opacity:0;
  max-height:0;
  overflow:hidden;
  transition:opacity .14s ease, max-height .14s ease, margin-top .14s ease;
  margin-top:0!important;
}
.field:hover .field-hint,
.field:focus-within .field-hint{
  opacity:1;
  max-height:28px;
  margin-top:5px!important;
}
.input-status-row{
  margin-top:12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}
.input-status-left,.input-status-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.input-status-caption{font-size:11px;color:var(--text3)}

/* Table */
.table-wrap{overflow:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:12.5px}
thead tr{background:var(--surface2)}
th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid var(--border);white-space:nowrap;position:sticky;top:0;background:var(--surface2);z-index:1}
td{padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text2);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.02);color:var(--text)}
.td-right{text-align:right}
.td-mono{font-variant-numeric:tabular-nums;font-family:'Pretendard',monospace}
.td-name{font-weight:600;color:var(--text)}

/* Progress bar */
.progress{height:5px;border-radius:99px;background:var(--surface3);overflow:hidden}
.progress-fill{height:100%;border-radius:99px;transition:width .4s ease}
.pf-accent{background:var(--accent)}
.pf-green{background:var(--green)}
.pf-red{background:var(--red)}
.pf-amber{background:var(--amber)}

/* Transaction type colors */
.type-income{color:var(--green)}
.type-expense{color:var(--red)}
.type-transfer{color:var(--text2)}

/* Divider */
.hr{height:1px;background:var(--border);margin:16px 0}

/* Alert boxes */
.alert{padding:12px 14px;border-radius:10px;font-size:13px}
.alert-ok{background:var(--green-bg);border:1px solid rgba(52,213,138,.25);color:var(--green)}
.alert-warn{background:var(--amber-bg);border:1px solid rgba(240,180,41,.25);color:var(--amber)}
.alert-danger{background:var(--red-bg);border:1px solid rgba(255,92,114,.25);color:var(--red)}
.alert-info{background:var(--accent-bg);border:1px solid rgba(108,125,255,.25);color:var(--accent2)}

/* Empty state */
.empty{padding:32px;text-align:center;color:var(--text3);font-size:13px}

/* Auth */
.auth-bar{background:var(--surface);border-bottom:1px solid var(--border);padding:10px 32px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;color:var(--text3)}
.auth-input{padding:7px 11px;border:1px solid var(--border2);border-radius:8px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;min-width:150px}
.auth-input:focus{border-color:var(--accent)}

/* Charts */
.chart-svg{width:100%;height:auto;display:block}
.chart-legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;color:var(--text3)}
.legend-dot{display:inline-block;width:8px;height:8px;border-radius:99px;margin-right:4px}
.donut-wrap{display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:center}

/* Stat row */
.stat-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px}
.stat-row:last-child{border-bottom:none}
.stat-label{color:var(--text3)}
.stat-value{font-weight:600;color:var(--text);font-variant-numeric:tabular-nums}

/* Summary metric */
.muted{color:var(--text3)}
.mono{font-variant-numeric:tabular-nums}
.text-green{color:var(--green)}
.text-red{color:var(--red)}
.text-accent{color:var(--accent)}
.fw7{font-weight:700}
.small{font-size:12px}

/* FAB */
.fab{position:fixed;bottom:28px;right:28px;z-index:100;width:54px;height:54px;border-radius:99px;background:var(--accent);border:none;color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(108,125,255,.45);cursor:pointer;transition:.2s ease}
.fab:hover{transform:scale(1.08);box-shadow:0 12px 32px rgba(108,125,255,.55)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
.modal-sheet{background:var(--surface);border-radius:28px 28px 0 0;padding:28px;width:100%;max-width:680px;max-height:85vh;overflow-y:auto;border-top:1px solid var(--border2)}
.modal-handle{width:40px;height:4px;border-radius:99px;background:var(--border2);margin:0 auto 20px}
.modal-title{font-size:17px;font-weight:700;margin-bottom:20px;letter-spacing:-.02em}

/* insight card */
.insight-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;gap:12px;align-items:flex-start}
.insight-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.insight-body h4{font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px}
.insight-body p{font-size:12px;color:var(--text3);line-height:1.5}

/* Recent tx list */
.tx-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.tx-item:last-child{border-bottom:none}
.tx-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.tx-meta{flex:1;min-width:0}
.tx-name{font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-date{font-size:11px;color:var(--text3);margin-top:2px}
.tx-amt{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;flex-shrink:0}

/* Budget bars */
.budget-item{padding:12px 0;border-bottom:1px solid var(--border)}
.budget-item:last-child{border-bottom:none}
.budget-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.budget-name{font-size:13px;font-weight:600;color:var(--text)}
.budget-nums{font-size:11px;color:var(--text3)}

/* Goal gauge */
.gauge-wrap{text-align:center}
.gauge-pct{font-size:32px;font-weight:900;letter-spacing:-.04em;line-height:1;margin:8px 0 4px}
.gauge-label{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}

/* Tab chips */
.tab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.tab-chip{padding:7px 14px;border-radius:99px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:.15s;background:var(--surface2);color:var(--text2)}
.tab-chip.active{background:var(--accent-bg);color:var(--accent)}
.tab-chip:hover:not(.active){background:var(--surface3);color:var(--text)}








/* Automation System */
.automation-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border-color:rgba(108,125,255,.20)}
.automation-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.automation-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.automation-score{font-size:52px;font-weight:900;letter-spacing:-.06em;line-height:1}
.automation-score span{font-size:18px;color:var(--text3);margin-left:3px}
.automation-alert{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:flex-start;padding:13px;border-radius:14px;border:1px solid var(--border);background:var(--surface2)}
.automation-alert.danger{background:var(--red-bg);border-color:rgba(255,92,114,.28)}
.automation-alert.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.28)}
.automation-alert.info{background:var(--accent-bg);border-color:rgba(108,125,255,.24)}
.automation-alert strong{font-size:13px;color:var(--text)}
.automation-alert p{font-size:12px;color:var(--text2);line-height:1.5;margin-top:3px}
@media(max-width:900px){.automation-hero{flex-direction:column;align-items:flex-start}.automation-score{font-size:40px}}

/* CFO Final */
.cfo-hero,.goal-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(52,213,138,.08));border-color:rgba(52,213,138,.20)}
.cfo-hero h2,.goal-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.cfo-hero p,.goal-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.cfo-score{font-size:52px;font-weight:900;letter-spacing:-.06em;line-height:1}
.cfo-score span{font-size:18px;color:var(--text3);margin-left:3px}
.cfo-step{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:14px;border-radius:14px;border:1px solid var(--border);background:var(--surface2)}
.cfo-step.danger{background:var(--red-bg);border-color:rgba(255,92,114,.25)}
.cfo-step.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.25)}
.cfo-step.info{background:var(--accent-bg);border-color:rgba(108,125,255,.25)}
.cfo-step.green{background:var(--green-bg);border-color:rgba(52,213,138,.25)}
.cfo-step-no{width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-weight:900}
.cfo-step strong{display:block;margin:7px 0 4px;font-size:14px;color:var(--text)}
.cfo-step p{font-size:12px;color:var(--text2);line-height:1.5}
.goal-item-pro{border:1px solid var(--border)}
.goal-conflict{border-color:rgba(255,92,114,.35)!important;background:var(--red-bg)}
.goal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.goal-head strong{font-size:15px;color:var(--text)}
.goal-head p{font-size:11.5px;color:var(--text3);margin-top:3px}

/* Goal Funding */
.goal-item{padding:12px;border-bottom:1px solid var(--border)}
.goal-head{display:flex;justify-content:space-between;font-weight:800}
.goal-sub{font-size:12px;color:var(--text3);margin:4px 0}

/* Decision Center */
.decision-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(240,180,41,.08));border-color:rgba(240,180,41,.20)}
.decision-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.decision-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.decision-score{font-size:48px;font-weight:900;letter-spacing:-.06em;line-height:1}
.decision-score span{font-size:17px;color:var(--text3);margin-left:3px}
.decision-card{border:1px solid var(--border);background:var(--surface2);border-radius:14px;padding:14px}
.decision-card.danger{background:var(--red-bg);border-color:rgba(255,92,114,.25)}
.decision-card.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.25)}
.decision-card.info{background:var(--accent-bg);border-color:rgba(108,125,255,.25)}
.decision-card.green{background:var(--green-bg);border-color:rgba(52,213,138,.25)}
.decision-card-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.decision-card-head strong{font-size:13px;color:var(--text)}
.decision-card p{font-size:12px;color:var(--text2);line-height:1.5}
.decision-action{margin-top:9px;font-size:12px;font-weight:800;color:var(--text)}
.allocation-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.allocation-row:last-child{border-bottom:none}
.allocation-row strong{font-size:13px;color:var(--text)}
.allocation-row p{font-size:11.5px;color:var(--text3);margin-top:3px}
.allocation-row span{font-size:13px;font-weight:900;color:var(--accent);font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:900px){.decision-hero{flex-direction:column;align-items:flex-start}.decision-score{font-size:40px}}


/* Monthly Friendly Summary Spotlight */
.report-summary-spotlight{
  position:relative;
  overflow:hidden;
  padding:26px;
  border-radius:24px;
  background:linear-gradient(135deg,rgba(108,125,255,.15),rgba(255,255,255,.045));
  border-color:rgba(108,125,255,.26);
  box-shadow:0 18px 44px rgba(0,0,0,.22);
}
.report-summary-spotlight.good{background:linear-gradient(135deg,rgba(52,213,138,.14),rgba(108,125,255,.07));border-color:rgba(52,213,138,.26)}
.report-summary-spotlight.warn{background:linear-gradient(135deg,rgba(240,180,41,.14),rgba(108,125,255,.06));border-color:rgba(240,180,41,.26)}
.report-summary-spotlight.danger{background:linear-gradient(135deg,rgba(255,92,114,.14),rgba(108,125,255,.06));border-color:rgba(255,92,114,.26)}
.report-summary-spotlight:after{
  content:"";
  position:absolute;
  width:260px;height:260px;right:-80px;top:-120px;
  background:radial-gradient(circle,rgba(255,255,255,.14),transparent 64%);
  pointer-events:none;
}
.summary-kicker{font-size:12px;font-weight:900;color:var(--accent2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.report-summary-spotlight.good .summary-kicker{color:var(--green)}
.report-summary-spotlight.warn .summary-kicker{color:var(--amber)}
.report-summary-spotlight.danger .summary-kicker{color:var(--red)}
.summary-headline{font-size:28px;font-weight:950;letter-spacing:-.045em;line-height:1.2;margin-bottom:12px;color:var(--text)}
.summary-friendly-text{font-size:15px;line-height:1.8;color:var(--text2);white-space:pre-line;max-width:920px}
.summary-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.summary-chip-lg{display:inline-flex;align-items:center;gap:6px;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);font-size:12px;font-weight:800;color:var(--text)}
@media(max-width:700px){.summary-headline{font-size:22px}.summary-friendly-text{font-size:13.5px}.report-summary-spotlight{padding:20px}}

.ai-coach-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:stretch}
.ai-coach-panel{position:relative;overflow:hidden;padding:24px;border-radius:24px;background:linear-gradient(135deg,rgba(108,125,255,.16),rgba(52,213,138,.07));border:1px solid rgba(108,125,255,.24)}
.ai-coach-panel.warn{background:linear-gradient(135deg,rgba(240,180,41,.16),rgba(108,125,255,.06));border-color:rgba(240,180,41,.28)}
.ai-coach-panel.danger{background:linear-gradient(135deg,rgba(255,92,114,.16),rgba(108,125,255,.06));border-color:rgba(255,92,114,.28)}
.ai-coach-panel.good{background:linear-gradient(135deg,rgba(52,213,138,.15),rgba(108,125,255,.06));border-color:rgba(52,213,138,.28)}
.ai-coach-kicker{font-size:12px;font-weight:950;color:var(--accent2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.ai-coach-title{font-size:27px;font-weight:950;letter-spacing:-.045em;line-height:1.22;color:var(--text);margin-bottom:12px}
.ai-coach-message{font-size:15px;line-height:1.75;color:var(--text2);white-space:pre-line;max-width:920px}
.ai-coach-score-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:22px;display:flex;flex-direction:column;justify-content:center;gap:12px}
.ai-coach-score{font-size:48px;font-weight:950;letter-spacing:-.06em;line-height:1}.ai-coach-score span{font-size:18px;color:var(--text3);margin-left:3px}
.ai-coach-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.ai-coach-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:16px;min-height:128px}
.ai-coach-card.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.24)}.ai-coach-card.danger{background:var(--red-bg);border-color:rgba(255,92,114,.24)}.ai-coach-card.good{background:var(--green-bg);border-color:rgba(52,213,138,.24)}.ai-coach-card.info{background:var(--accent-bg);border-color:rgba(108,125,255,.24)}
.ai-coach-card-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}.ai-coach-card-head strong{font-size:13px;color:var(--text)}.ai-coach-card p{font-size:12px;color:var(--text2);line-height:1.55}
.ai-coach-next{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;background:var(--surface2);border:1px solid var(--border)}.ai-coach-next-no{width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);font-size:12px;font-weight:900;color:var(--text)}.ai-coach-next strong{font-size:13px;color:var(--text)}.ai-coach-next p{font-size:12px;color:var(--text3);line-height:1.45;margin-top:3px}
@media(max-width:1000px){.ai-coach-hero{grid-template-columns:1fr}.ai-coach-grid{grid-template-columns:1fr}.ai-coach-title{font-size:22px}.ai-coach-score{font-size:40px}}

/* Monthly Report */
.report-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border-color:rgba(108,125,255,.20)}
.report-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.report-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.monthly-report textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
@media print{
  .sidebar,.topbar,.auth-bar,.fab,.tab-row,.btn{display:none!important}
  .main{margin-left:0!important;height:auto!important;overflow:visible!important}
  .page{max-width:none!important;padding:0!important}
  body{background:#fff!important;color:#111!important}
  .card,.kpi-card,.card-sm{break-inside:avoid;background:#fff!important;color:#111!important;border-color:#ddd!important}
}
@media(max-width:900px){.report-hero{flex-direction:column;align-items:flex-start}}

/* Retirement Pro */
.retirement-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;background:linear-gradient(135deg,var(--surface),rgba(52,213,138,.07));border-color:rgba(52,213,138,.20)}
.retirement-hero h2{font-size:24px;font-weight:900;letter-spacing:-.04em;margin:4px 0}
.retirement-hero p{font-size:13px;color:var(--text3);line-height:1.5}
.retirement-pro .compact-insight{min-height:76px}
@media(max-width:900px){.retirement-hero{flex-direction:column;align-items:flex-start}}


/* Dashboard linked cross-tab summary */
.dashboard-linked-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.dashboard-linked-card{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:13px;border:1px solid var(--border);background:var(--surface2)}
.dashboard-linked-card span{font-size:18px;line-height:1;flex-shrink:0}
.dashboard-linked-card strong{font-size:12.5px;color:var(--text);display:block;margin-bottom:3px}
.dashboard-linked-card p{font-size:11.5px;color:var(--text3);line-height:1.45}
.dashboard-linked-card.green{border-color:rgba(52,213,138,.22);background:var(--green-bg)}
.dashboard-linked-card.amber{border-color:rgba(240,180,41,.24);background:var(--amber-bg)}
.dashboard-linked-card.red{border-color:rgba(255,92,114,.24);background:var(--red-bg)}
.dashboard-linked-card.info,.dashboard-linked-card.accent{border-color:rgba(108,125,255,.22);background:var(--accent-bg)}
@media(max-width:1100px){.dashboard-linked-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.dashboard-linked-grid{grid-template-columns:1fr}}

/* Dashboard Pro */
.dashboard-hero{display:grid;grid-template-columns:1.1fr 1.4fr;gap:14px}
.health-card{background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.08));border:1px solid rgba(108,125,255,.22);border-radius:var(--radius-lg);padding:22px;overflow:hidden}
.health-score{font-size:52px;font-weight:900;letter-spacing:-.06em;line-height:1}
.health-score span{font-size:18px;color:var(--text3);letter-spacing:-.02em;margin-left:3px}
.health-grade{display:inline-flex;margin-top:10px;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:800}
.dashboard-summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.mini-metric{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:17px;display:flex;flex-direction:column;gap:6px}
.mini-metric span{font-size:11px;color:var(--text3);font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.mini-metric strong{font-size:25px;font-weight:900;letter-spacing:-.04em}
.mini-metric small{font-size:11px;color:var(--text3)}
.compact-insight{display:flex;gap:10px;align-items:flex-start;padding:11px;border-radius:12px;border:1px solid var(--border);background:var(--surface2)}
.compact-insight span{font-size:18px}
.compact-insight strong,.action-item strong{font-size:12.5px;color:var(--text)}
.compact-insight p,.action-item p{font-size:11.5px;color:var(--text3);line-height:1.45;margin-top:2px}
.compact-insight.danger{border-color:rgba(255,92,114,.24);background:var(--red-bg)}
.compact-insight.warn{border-color:rgba(240,180,41,.22);background:var(--amber-bg)}
.compact-insight.info{border-color:rgba(108,125,255,.22);background:var(--accent-bg)}
.compact-insight.green{border-color:rgba(52,213,138,.22);background:var(--green-bg)}
.action-item{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:flex-start;padding:11px;border-radius:12px;background:var(--surface2);border:1px solid var(--border)}
@media(max-width:1100px){.dashboard-hero{grid-template-columns:1fr}.dashboard-summary-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.dashboard-summary-grid{grid-template-columns:1fr}.health-score{font-size:42px}}
.dashboard-advice-card{
  background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.055));
  border-color:rgba(108,125,255,.18);
}
.dashboard-advice-list{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:8px;
  margin-top:12px;
}
.dashboard-advice-item{
  display:grid;
  grid-template-columns:24px 1fr;
  gap:9px;
  align-items:flex-start;
  padding:11px;
  border-radius:12px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.07);
}
.dashboard-advice-no{
  width:24px;
  height:24px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--accent-bg);
  color:var(--accent2);
  font-size:11px;
  font-weight:900;
}
.dashboard-advice-item strong{
  display:block;
  font-size:12.5px;
  color:var(--text);
  line-height:1.35;
}
.dashboard-advice-item p{
  font-size:11px;
  color:var(--text3);
  line-height:1.4;
  margin-top:3px;
}
@media(max-width:1100px){.dashboard-advice-list{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.dashboard-advice-list{grid-template-columns:1fr}}



/* Net Worth Goal Timeline */
.networth-timeline-card{border-color:rgba(108,125,255,.22);background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.055))}
.networth-timeline-card .table-wrap{max-height:360px}


/* Tax monthly calendar */
.tax-calendar-month-card{background:linear-gradient(135deg,var(--surface),rgba(108,125,255,.06));border:1px solid rgba(108,125,255,.18);border-radius:var(--radius-lg);padding:22px}
.tax-cal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.tax-cal-title{display:flex;align-items:center;gap:10px}
.tax-cal-title h3{font-size:16px;margin:0;font-weight:900;letter-spacing:-.02em}
.tax-cal-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tax-cal-nav-btn{width:36px;height:36px;border-radius:12px;border:1px solid var(--border2);background:var(--surface2);color:var(--text);font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;transition:.15s ease}
.tax-cal-nav-btn:hover{background:rgba(108,125,255,.14);border-color:rgba(108,125,255,.28);color:var(--accent2);transform:translateY(-1px)}
.tax-cal-input{height:36px;border:1px solid var(--border2);border-radius:12px;background:var(--surface2);color:var(--text);padding:0 10px;font-size:13px;font-weight:800;outline:none}
.tax-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.tax-cal-weekday{font-size:11px;font-weight:900;color:var(--text3);text-align:center;padding:6px 0;letter-spacing:.04em}
.tax-cal-day{min-height:112px;border:1px solid var(--border);border-radius:14px;background:var(--surface2);padding:9px;display:flex;flex-direction:column;gap:7px;transition:.15s ease;overflow:hidden}
.tax-cal-day:hover{border-color:rgba(108,125,255,.28);transform:translateY(-1px)}
.tax-cal-day.outside{opacity:.35;background:rgba(255,255,255,.025)}
.tax-cal-day.today{box-shadow:inset 0 0 0 1px rgba(108,125,255,.45);border-color:rgba(108,125,255,.45)}
.tax-cal-date{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:900;color:var(--text)}
.tax-cal-events{display:flex;flex-direction:column;gap:5px}
.tax-cal-event{border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px;background:rgba(255,255,255,.04)}
.tax-cal-event strong{display:block;font-size:11.5px;color:var(--text);line-height:1.25;margin-top:4px}
.tax-cal-event p{font-size:10.5px;color:var(--text3);line-height:1.35;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tax-update-box{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:14px;padding:14px;border-radius:14px;border:1px solid rgba(108,125,255,.20);background:rgba(108,125,255,.08)}
.tax-update-box strong{font-size:13px;color:var(--text)}
.tax-update-box p{font-size:12px;color:var(--text2);line-height:1.5;margin-top:4px}
@media(max-width:900px){.tax-cal-grid{gap:6px}.tax-cal-day{min-height:92px;padding:7px}.tax-cal-event p{display:none}}
@media(max-width:700px){.tax-cal-grid{grid-template-columns:repeat(2,1fr)}.tax-cal-weekday{display:none}.tax-cal-day.outside{display:none}}


.tax-update-status-box{align-items:stretch}
.tax-update-status-card{display:grid;grid-template-columns:38px 1fr;gap:12px;align-items:flex-start;width:100%;padding:13px;border-radius:14px;border:1px solid var(--border);background:var(--surface2)}
.tax-update-status-card.green{background:var(--green-bg);border-color:rgba(52,213,138,.26)}
.tax-update-status-card.amber{background:var(--amber-bg);border-color:rgba(240,180,41,.28)}
.tax-update-status-card.accent,.tax-update-status-card.info{background:var(--accent-bg);border-color:rgba(108,125,255,.24)}
.tax-update-status-icon{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);font-size:17px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.tax-update-status-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px}
.tax-update-status-top strong{font-size:13.5px;color:var(--text)}
.tax-update-date{font-size:12px;font-weight:900;color:var(--text);letter-spacing:-.01em;margin:2px 0 5px}
.tax-update-brief{font-size:12px;color:var(--text2);line-height:1.45;margin:0}



/* Tax Action Coach */
.tax-action-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.tax-action-item{border:1px solid var(--border);background:var(--surface2);border-radius:14px;padding:14px;min-height:142px}
.tax-action-item.green{background:var(--green-bg);border-color:rgba(52,213,138,.25)}
.tax-action-item.warn{background:var(--amber-bg);border-color:rgba(240,180,41,.25)}
.tax-action-item.danger{background:var(--red-bg);border-color:rgba(255,92,114,.25)}
.tax-action-item.info{background:var(--accent-bg);border-color:rgba(108,125,255,.22)}
.tax-action-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.tax-action-item strong{display:block;font-size:14px;color:var(--text);margin-bottom:6px}
.tax-action-item p{font-size:12px;color:var(--text2);line-height:1.55}
.tax-action-amount{margin-top:10px;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.06);font-size:12px;font-weight:800;color:var(--text)}
@media(max-width:1100px){.tax-action-grid{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.tax-action-grid{grid-template-columns:1fr}}

/* Responsive */
@media(max-width:900px){
  .sidebar{width:180px}
  .main{margin-left:180px}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .g4{grid-template-columns:repeat(2,1fr)}
  .form-grid{grid-template-columns:repeat(2,1fr)}
  .donut-wrap{grid-template-columns:1fr}
  .page{padding:20px}
}
`;

// ─── SVG Charts ───────────────────────────────────────────────────────────────
function polarToCartesian(cx,cy,r,deg){ const rad=(deg-90)*Math.PI/180; return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}; }
function arcPath(cx,cy,r,s,e){
  if(Math.abs(e-s)>=360) e=s+359.99;
  const ps=polarToCartesian(cx,cy,r,s), pe=polarToCartesian(cx,cy,r,e);
  return `M${ps.x} ${ps.y} A${r} ${r} 0 ${e-s>180?1:0} 1 ${pe.x} ${pe.y}`;
}
function polylinePath(pts){ return pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" "); }
function areaPath(pts,base){ if(!pts.length) return ""; const d=polylinePath(pts); return `${d} L${pts[pts.length-1].x},${base} L${pts[0].x},${base} Z`; }

function MonthlyTrendChart({ data }) {
  const rows = (data||[]).slice(-12);
  if(!rows.length) return <div className="empty">거래내역을 입력하면 차트가 표시됩니다.</div>;
  const W=560,H=180,ml=52,mr=12,mt=12,mb=28,iW=W-ml-mr,iH=H-mt-mb;
  const maxVal=Math.max(...rows.map(r=>Math.max(n(r.income),n(r.expense))),1);
  const minNet=Math.min(...rows.map(r=>n(r.net)),0);
  const maxY=maxVal,minY=minNet,range=maxY-minY||1;
  const y=(v)=>mt+((maxY-v)/range)*iH;
  const step=iW/Math.max(rows.length,1);
  const linePts=rows.map((r,i)=>({x:ml+step*i+step/2,y:y(n(r.net))}));
  const incBars=rows.map((r,i)=>{ const bx=ml+step*i+step*.12,bw=step*.3,v=n(r.income),by=y(v); return {x:bx,y:by,w:bw,h:mt+iH-by}; });
  const expBars=rows.map((r,i)=>{ const bx=ml+step*i+step*.46,bw=step*.3,v=n(r.expense),by=y(v); return {x:bx,y:by,w:bw,h:mt+iH-by}; });
  const grids=Array.from({length:4}).map((_,i)=>minY+(range*i)/3);
  return (
    <div>
      <div className="chart-legend">
        <span><i className="legend-dot" style={{background:"#6c7dff"}}/>수입</span>
        <span><i className="legend-dot" style={{background:"#ff5c72"}}/>지출</span>
        <span><i className="legend-dot" style={{background:"#34d58a"}}/>순수입</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
        <defs>
          <linearGradient id="netGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d58a" stopOpacity=".2"/>
            <stop offset="100%" stopColor="#34d58a" stopOpacity=".02"/>
          </linearGradient>
        </defs>
        {grids.map((gv,i)=>(
          <g key={i}>
            <line x1={ml} x2={W-mr} y1={y(gv)} y2={y(gv)} stroke="#2a2d36" strokeDasharray="4 3"/>
            <text x={ml-6} y={y(gv)+4} textAnchor="end" fontSize="10" fill="#5a6278">{fmt(gv/10000)}만</text>
          </g>
        ))}
        <line x1={ml} x2={W-mr} y1={y(0)} y2={y(0)} stroke="#353840"/>
        {incBars.map((b,i)=><rect key={`i${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="#6c7dff" opacity=".7"/>)}
        {expBars.map((b,i)=><rect key={`e${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="#ff5c72" opacity=".7"/>)}
        <path d={areaPath(linePts,y(0))} fill="url(#netGrad)"/>
        <path d={polylinePath(linePts)} fill="none" stroke="#34d58a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {linePts.map((p,i)=><circle key={`p${i}`} cx={p.x} cy={p.y} r="3.5" fill="#34d58a"/>)}
        {rows.map((r,i)=>(
          <text key={r.month} x={ml+step*i+step/2} y={H-6} textAnchor="middle" fontSize="10" fill="#5a6278">
            {String(r.month).slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function AssetDonutChart({ segments }) {
  const rows=(segments||[]).filter(s=>n(s.value)>0);
  if(!rows.length) return <div className="empty">자산 데이터가 없습니다.</div>;
  const total=rows.reduce((s,r)=>s+n(r.value),0);
  const colors=["#6c7dff","#34d58a","#f0b429","#ff5c72","#60c5e8","#a78bfa"];
  let angle=0;
  const slices=rows.map((r,i)=>{ const value=n(r.value),sweep=(value/total)*360,start=angle,end=angle+sweep; angle=end; return {...r,color:colors[i%colors.length],start,end,pct:value/total*100}; });
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" className="chart-svg">
        {slices.map(s=><path key={s.label} d={arcPath(100,100,72,s.start,s.end)} fill="none" stroke={s.color} strokeWidth="28" strokeLinecap="butt"/>)}
        <circle cx="100" cy="100" r="50" fill="#161920"/>
        <text x="100" y="96" textAnchor="middle" fontSize="10" fill="#5a6278">총자산</text>
        <text x="100" y="116" textAnchor="middle" fontSize="16" fontWeight="800" fill="#f0f1f3">{fmt(total/100000000)}억</text>
      </svg>
      <div>
        {slices.map(s=>(
          <div key={s.label} className="stat-row" style={{padding:"7px 0"}}>
            <span className="row" style={{gap:8}}>
              <i className="legend-dot" style={{background:s.color,width:10,height:10,borderRadius:"50%",display:"inline-block",flexShrink:0}}/>
              <span style={{fontSize:12,color:"var(--text2)"}}>{s.label}</span>
            </span>
            <span style={{fontSize:12,color:"var(--text)",fontVariantNumeric:"tabular-nums"}}>{fmtPct(s.pct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalGauge({ value, target, title }) {
  const rate=Math.min((Math.max(n(value),0)/Math.max(n(target),1))*100,100);
  const angle=-180+(rate/100)*180;
  const end=polarToCartesian(120,110,75,angle);
  const color=rate>=100?"#34d58a":rate>=70?"#6c7dff":rate>=40?"#f0b429":"#ff5c72";
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 240 140" className="chart-svg">
        <path d={arcPath(120,110,75,-180,0)} fill="none" stroke="#252830" strokeWidth="16"/>
        <path d={arcPath(120,110,75,-180,angle)} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"/>
        <line x1="120" y1="110" x2={end.x} y2={end.y} stroke={color} strokeWidth="3" strokeLinecap="round" opacity=".6"/>
        <circle cx="120" cy="110" r="5" fill={color}/>
        <text x="34" y="128" fontSize="10" fill="#5a6278">0%</text>
        <text x="188" y="128" fontSize="10" fill="#5a6278">100%</text>
      </svg>
      <div className="gauge-pct" style={{color}}>{fmtPct(rate)}</div>
      <div className="gauge-label">{title}</div>
      <div style={{marginTop:10,display:"flex",justifyContent:"center",gap:20,fontSize:12}}>
        <span style={{color:"var(--text3)"}}>현재 <span style={{color:"var(--text)",fontWeight:600}}>{fmt(value)}원</span></span>
        <span style={{color:"var(--text3)"}}>목표 <span style={{color:"var(--text)",fontWeight:600}}>{fmt(target)}원</span></span>
      </div>
    </div>
  );
}

// ─── 공통: 자연어 인사이트 카드 컴포넌트 ────────────────────────────────────
/**
 * NaturalInsightCard
 * 각 탭 최상단에 배치되는 자연어 요약 카드.
 * tone: "green" | "accent" | "amber" | "red" | "info"
 * actions: [{ label, tag }] — 권장 행동 목록 (선택)
 */
function NaturalInsightCard({ icon, title, message, tone = "accent", actions = [], compact = false }) {
  const bg = {
    green: "rgba(52,213,138,.10)",
    accent: "rgba(108,125,255,.10)",
    amber: "rgba(240,180,41,.10)",
    red: "rgba(255,92,114,.10)",
    info: "rgba(108,125,255,.08)",
  }[tone] || "rgba(108,125,255,.10)";
  const border = {
    green: "rgba(52,213,138,.28)",
    accent: "rgba(108,125,255,.28)",
    amber: "rgba(240,180,41,.28)",
    red: "rgba(255,92,114,.28)",
    info: "rgba(108,125,255,.20)",
  }[tone] || "rgba(108,125,255,.28)";
  const color = {
    green: "var(--green)", accent: "var(--accent)",
    amber: "var(--amber)", red: "var(--red)", info: "var(--accent2)",
  }[tone] || "var(--accent)";

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: "var(--radius-lg)",
      padding: compact ? "14px 16px" : "18px 22px",
      display: "flex", alignItems: "flex-start", gap: 14,
      marginBottom: 4,
    }}>
      {icon && (
        <div style={{
          fontSize: compact ? 20 : 26, flexShrink: 0,
          lineHeight: 1, marginTop: 1,
        }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
            textTransform: "uppercase", color, marginBottom: 5, opacity: .8,
          }}>{title}</div>
        )}
        <div style={{
          fontSize: compact ? 13 : 15, fontWeight: 600,
          lineHeight: 1.55, color: "var(--text)", letterSpacing: "-.01em",
        }}>{message}</div>
        {actions.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {actions.map((a, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600, color,
                padding: "4px 11px", borderRadius: 99,
                border: `1px solid ${border}`,
                background: "rgba(255,255,255,.04)",
              }}>
                → {a.label}
                {a.tag && (
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 99,
                    background: color, color: "var(--surface)", opacity: .9,
                  }}>{a.tag}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── 공통: AI 코칭 패널 ──────────────────────────────────────────────────────
function buildIntegratedCoach({ area="통합 분석", dashboard={}, dashboardDetail={}, financialAnalysis={}, budgetAnalysis=[], taxAnalysis=[], futureSim=[], eventAnalysis=[], monthlySeries=[], data={} }) {
  const income=n(dashboard?.income), expense=n(dashboard?.expense), net=n(dashboard?.net);
  const savingsRate=income>0?net/income*100:0;
  const emergencyFund=n(dashboardDetail?.emergencyFund);
  const emergencyMonths=expense>0?emergencyFund/expense:0;
  const portfolioTotal=n(financialAnalysis?.total);
  const rows=financialAnalysis?.rows||[];
  const invested=rows.reduce((sum,r)=>sum+n(r.invested),0);
  const profit=portfolioTotal-invested;
  const returnRate=invested>0?profit/invested*100:0;
  const concentrated=rows.filter(r=>r.state==="쏠림 경고"||n(r.weight)>0.5);
  const overBudget=(budgetAnalysis||[]).filter(b=>b.status==="초과");
  const warnBudget=(budgetAnalysis||[]).filter(b=>b.status==="주의");
  const taxableTax=(taxAnalysis||[]).filter(t=>t.name==="일반계좌").reduce((sum,t)=>sum+n(t.estimatedTax),0);
  const pensionValue=(taxAnalysis||[]).filter(t=>["연금저축","IRP"].includes(t.name)).reduce((sum,t)=>sum+n(t.value),0);
  const events=eventAnalysis?.length?eventAnalysis:(data?.events||[]).map(e=>{
    const shortage=Math.max(n(e.amountNeeded)-n(e.currentPrepared),0);
    const months=Math.max(n(e.yearsFromNow)*12,1);
    return {...e,shortage,monthlyNeed:shortage/months,progress:n(e.amountNeeded)>0?n(e.currentPrepared)/n(e.amountNeeded)*100:0};
  });
  const urgentGoals=events.filter(e=>n(e.yearsFromNow)<=1 && n(e.shortage)>0);
  const totalGoalNeed=events.reduce((sum,e)=>sum+n(e.monthlyNeed),0);
  const lastFuture=Array.isArray(futureSim)&&futureSim.length?futureSim[futureSim.length-1]:null;
  const retireTarget=n(data?.settings?.retirementTargetAmount);
  const retireAsset=n(lastFuture?.total || dashboardDetail?.retirementRow?.total || 0);
  const retireRate=retireTarget>0?retireAsset/retireTarget*100:0;
  const last6=(monthlySeries||[]).slice(-6);
  const deficitMonths=last6.filter(r=>n(r.net)<0).length;
  const avgNet=last6.length?last6.reduce((sum,r)=>sum+n(r.net),0)/last6.length:net;

  let score=55;
  if(income>0) score+=clamp(savingsRate,-30,60)*0.35;
  score+=clamp(emergencyMonths,0,8)*3.0;
  score+=retireRate>=100?12:retireRate>=70?7:retireRate>=40?3:0;
  score+=returnRate>0?4:returnRate<0?-5:0;
  score-=overBudget.length*5;
  score-=concentrated.length*4;
  score-=urgentGoals.length*5;
  score-=taxableTax>0?3:0;
  score-=deficitMonths>=2?6:0;
  score=clamp(Math.round(score),0,100);

  let tone=score>=80?"green":score>=65?"accent":score>=50?"amber":"red";
  let icon=score>=80?"✅":score>=65?"🧠":score>=50?"⚠️":"🚨";
  const title=`AI ${area} 코칭`;
  let headline=score>=80?`${area} 기준으로 흐름이 안정적이에요.`:score>=65?`${area} 기준으로 방향은 좋지만, 조정하면 더 좋아질 부분이 있어요.`:score>=50?`${area} 기준으로 관리가 필요한 구간이에요.`:`${area} 기준으로 우선순위 재정리가 필요해요.`;

  const signals=[];
  if(income>0) signals.push({label:"저축률",value:fmtPct(savingsRate),tone:savingsRate>=30?"green":savingsRate>=10?"amber":"red"});
  if(expense>0) signals.push({label:"비상금",value:`${emergencyMonths.toFixed(1)}개월`,tone:emergencyMonths>=6?"green":emergencyMonths>=3?"amber":"red"});
  if(portfolioTotal>0) signals.push({label:"투자수익률",value:fmtPct(returnRate),tone:returnRate>=0?"green":"red"});
  if(retireTarget>0) signals.push({label:"은퇴목표",value:fmtPct(retireRate),tone:retireRate>=100?"green":retireRate>=70?"amber":"red"});
  if(events.length) signals.push({label:"목표 월필요액",value:fmt(totalGoalNeed),tone:totalGoalNeed<=Math.max(net,0)?"green":"amber"});
  if(taxAnalysis?.length) signals.push({label:"과세노출",value:fmt(taxableTax),tone:taxableTax>0?"amber":"green"});

  const actions=[];
  if(net<0) actions.push({label:"이번 달 적자 원인을 먼저 분리",tag:"현금흐름"});
  if(deficitMonths>=2) actions.push({label:`최근 6개월 중 적자 ${deficitMonths}개월 추세 점검`,tag:"추세"});
  if(emergencyMonths<3 && expense>0) actions.push({label:"투자 증액보다 비상금 3개월치 확보",tag:"안전"});
  else if(emergencyMonths<6 && expense>0) actions.push({label:"비상금 6개월치까지 단계 보강",tag:"안전"});
  if(overBudget.length) actions.push({label:`${overBudget.slice(0,2).map(b=>b.cat1).join("·")} 예산 초과 조정`,tag:"예산"});
  if(concentrated.length) actions.push({label:"포트폴리오 쏠림 리스크 확인",tag:"리스크"});
  if(taxableTax>0) actions.push({label:"일반계좌 과세 노출을 ISA/연금과 비교",tag:"절세"});
  if(urgentGoals.length) actions.push({label:`${urgentGoals[0].name} 부족분 우선 배정`,tag:"목표"});
  if(retireTarget>0 && retireRate<70) actions.push({label:"월 투자금·수익률·은퇴나이 가정 재점검",tag:"시뮬레이션"});
  if(!actions.length) actions.push({label:"현재 전략 유지, 월 1회 점검만 진행",tag:"유지"});

  const summary=`${headline} 현재 순현금흐름은 ${fmt(net)}원, 최근 평균 현금흐름은 ${fmt(avgNet)}원입니다. 투자자산은 ${fmt(portfolioTotal)}원이고, 목표·세금·리스크까지 함께 보면 다음 행동은 “${actions[0]?.label}”입니다.`;
  return {score,tone,icon,title,summary,signals:signals.slice(0,6),actions:actions.slice(0,5)};
}

function AICoachPanel({ coach }) {
  if(!coach) return null;
  const badgeClass=coach.tone==="green"?"badge-green":coach.tone==="amber"?"badge-amber":coach.tone==="red"?"badge-red":"badge-accent";
  return (
    <div className="card ai-coach-panel" style={{background:"linear-gradient(135deg,var(--surface),rgba(108,125,255,.085))",borderColor:"rgba(108,125,255,.24)"}}>
      <div className="row-between" style={{alignItems:"flex-start",marginBottom:14}}>
        <div className="row" style={{alignItems:"flex-start",gap:12}}>
          <div style={{fontSize:28,lineHeight:1}}>{coach.icon}</div>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"var(--accent2)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>AI COACH</div>
            <h3 style={{fontSize:20,marginBottom:6,letterSpacing:"-.03em"}}>{coach.title}</h3>
            <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,whiteSpace:"pre-line"}}>{coach.summary}</p>
          </div>
        </div>
        <div style={{textAlign:"right",minWidth:90}}>
          <div style={{fontSize:34,fontWeight:900,letterSpacing:"-.05em",lineHeight:1}}>{coach.score}<span style={{fontSize:13,color:"var(--text3)",marginLeft:2}}>점</span></div>
          <span className={`badge ${badgeClass}`} style={{marginTop:7}}>종합판단</span>
        </div>
      </div>
      {coach.signals?.length>0&&(
        <div className="g3" style={{marginBottom:12}}>
          {coach.signals.map((s,i)=><div key={i} className="card-sm" style={{padding:12,background:"rgba(255,255,255,.035)"}}><div className="kpi-label" style={{marginBottom:6}}>{s.label}</div><div className={`fw7 ${s.tone==="green"?"text-green":s.tone==="red"?"text-red":"text-accent"}`}>{s.value}</div></div>)}
        </div>
      )}
      {coach.actions?.length>0&&(
        <div className="ai-chip-row">
          {coach.actions.map((a,i)=><span key={i} className="ai-chip">{i+1}. {a.label}{a.tag?` · ${a.tag}`:""}</span>)}
        </div>
      )}
    </div>
  );
}

// ─── 대시보드 자연어 요약/결론/조언 생성 ────────────────────────────────────
function buildDashboardNLP({ advanced, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, monthlySeries, eventAnalysis, taxAnalysis, futureSim, data }) {
  const score = n(advanced?.score);
  const savingsRate = n(advanced?.savingsRate);
  const emergencyMonths = n(advanced?.emergencyMonths);
  const targetRate = n(advanced?.targetRate);
  const net = n(dashboard?.net);
  const expense = n(dashboard?.expense);
  const income = n(dashboard?.income);
  const netWorth = n(dashboard?.netWorth);
  const totalInvest = n(financialAnalysis?.total);
  const validationIssues = n(dashboardDetail?.totalValidationIssues);
  const overBudgets = (budgetAnalysis || []).filter(b => b.status === "초과");
  const warningBudgets = (budgetAnalysis || []).filter(b => b.status === "주의");
  const rows = financialAnalysis?.rows || [];
  const totalInvested = rows.reduce((sum, r) => sum + n(r.invested), 0);
  const totalProfit = totalInvest - totalInvested;
  const totalReturn = totalInvested > 0 ? totalProfit / totalInvested * 100 : 0;
  const concentrated = rows.filter(r => r.state === "쏠림 경고");
  const last6 = (monthlySeries || []).slice(-6);
  const avgNet = last6.length ? last6.reduce((sum, r) => sum + n(r.net), 0) / last6.length : 0;
  const deficitMonths = last6.filter(r => n(r.net) < 0).length;
  const urgentEvents = (eventAnalysis || []).filter(e => n(e.yearsFromNow) <= 1 && n(e.shortage) > 0);
  const eventNeed = (eventAnalysis || []).reduce((sum, e) => sum + n(e.monthlyNeed), 0);
  const eventTarget = (eventAnalysis || []).reduce((sum, e) => sum + n(e.amountNeeded), 0);
  const eventPrepared = (eventAnalysis || []).reduce((sum, e) => sum + n(e.currentPrepared), 0);
  const eventRate = eventTarget > 0 ? eventPrepared / eventTarget * 100 : 0;
  const pensionValue = (taxAnalysis || []).filter(t => ["연금저축", "IRP"].includes(t.name)).reduce((sum, t) => sum + n(t.value), 0);
  const taxableTax = (taxAnalysis || []).filter(t => t.name === "일반계좌").reduce((sum, t) => sum + n(t.estimatedTax), 0);
  const finalSim = Array.isArray(futureSim) && futureSim.length ? futureSim[futureSim.length - 1] : null;
  const projectedRetirement = n(finalSim?.total || dashboardDetail?.retirementRow?.total || 0);
  const targetAmount = n(data?.settings?.retirementTargetAmount || 0);
  const projectedGap = targetAmount > 0 ? projectedRetirement - targetAmount : 0;

  let tone = "accent";
  let icon = "🧭";
  let title = "통합 재무 결론";
  let conclusion = "현재 재무 상태는 대시보드·가계부·포트폴리오·절세·목표·시뮬레이션을 함께 봐야 정확합니다.";
  const reasons = [];
  const actions = [];
  const linked = [];

  if (score >= 80) { tone = "green"; icon = "✅"; conclusion = "현재 재무 흐름은 안정적입니다. 현금흐름을 유지하면서 투자·절세·목표 적립을 정기 점검하는 단계입니다."; }
  else if (score >= 65) { tone = "accent"; icon = "📊"; conclusion = "전체적으로는 양호하지만, 몇 가지 연결 지표를 조정하면 장기 목표 달성 가능성을 더 높일 수 있습니다."; }
  else if (score >= 50) { tone = "amber"; icon = "⚠️"; conclusion = "현재는 관리가 필요한 구간입니다. 투자 확대보다 현금흐름·예산·비상금·목표 적립 순서를 먼저 정리하는 것이 좋습니다."; }
  else { tone = "red"; icon = "🚨"; conclusion = "현재는 위험 신호가 있습니다. 지출·비상금·입력 오류를 먼저 정리한 뒤 투자와 은퇴 시뮬레이션을 다시 확인하는 것이 안전합니다."; }

  if (income <= 0 && expense <= 0) {
    conclusion = "아직 이번 달 수입·지출 데이터가 부족합니다. 거래 입력이 쌓이면 다른 분석 탭까지 연결해 통합 결론을 계산합니다.";
    reasons.push("이번 달 거래내역이 부족하여 현금흐름 판단 정확도가 낮습니다.");
    actions.push({ tag: "입력", label: "이번 달 수입·지출 먼저 입력" });
  } else {
    reasons.push(`현금흐름 ${fmt(net)}원, 저축률 ${fmtPct(savingsRate)}, 비상금 ${emergencyMonths.toFixed(1)}개월치입니다.`);
    reasons.push(`투자자산 ${fmt(totalInvest)}원, 전체 투자수익률 ${fmtPct(totalReturn)}, 은퇴 목표 달성률 ${fmtPct(targetRate)}입니다.`);
    reasons.push(`목표 준비율 ${fmtPct(eventRate)}, 예상 은퇴자산 ${fmt(projectedRetirement)}원입니다.`);
  }

  linked.push({ icon: net >= 0 ? "💵" : "🔻", title: "현금흐름", text: net >= 0 ? `이번 달 ${fmt(net)}원 흑자입니다. 투자·목표 적립 재원으로 활용 가능합니다.` : `이번 달 ${fmt(Math.abs(net))}원 적자입니다. 투자 증액보다 지출 조정이 우선입니다.`, tone: net >= 0 ? "green" : "red" });
  linked.push({ icon: overBudgets.length ? "💸" : warningBudgets.length ? "👀" : "📋", title: "가계부·예산", text: overBudgets.length ? `${overBudgets.length}개 예산 초과: ${overBudgets.slice(0,2).map(b=>b.cat1).join("·")} 우선 조정` : warningBudgets.length ? `${warningBudgets[0].cat1} 항목이 예산 80% 이상입니다.` : "예산 초과 항목이 크지 않습니다.", tone: overBudgets.length ? "red" : warningBudgets.length ? "amber" : "green" });
  linked.push({ icon: totalReturn >= 0 ? "📈" : "📉", title: "포트폴리오", text: rows.length ? `투자수익률 ${fmtPct(totalReturn)}, 평가손익 ${fmt(totalProfit)}원${concentrated.length ? `, 쏠림 경고 ${concentrated.length}건` : ""}` : "보유 종목을 입력하면 수익률·비중·쏠림 리스크를 연결합니다.", tone: !rows.length ? "info" : concentrated.length ? "amber" : totalReturn >= 0 ? "green" : "red" });
  linked.push({ icon: taxableTax > 0 ? "💡" : "🧾", title: "세금·절세", text: taxableTax > 0 ? `일반계좌 예상 세금 노출 ${fmt(taxableTax)}원입니다. ISA·연금계좌 활용을 검토하세요.` : `연금/IRP 평가액 ${fmt(pensionValue)}원, 큰 세금 노출은 제한적입니다.`, tone: taxableTax > 0 ? "amber" : "green" });
  linked.push({ icon: urgentEvents.length ? "⏰" : "🎯", title: "목표·이벤트", text: urgentEvents.length ? `1년 이내 부족 목표 ${urgentEvents.length}개가 있습니다. 월 ${fmt(urgentEvents.reduce((sum,e)=>sum+n(e.monthlyNeed),0))}원 우선 배정이 필요합니다.` : `전체 목표 준비율 ${fmtPct(eventRate)}, 월 필요 적립액 ${fmt(eventNeed)}원입니다.`, tone: urgentEvents.length ? "red" : eventRate >= 70 ? "green" : "accent" });
  linked.push({ icon: projectedGap >= 0 ? "🏁" : "🧮", title: "미래 시뮬레이션", text: targetAmount > 0 ? (projectedGap >= 0 ? `은퇴 목표 대비 ${fmt(projectedGap)}원 초과 예상입니다.` : `은퇴 목표 대비 ${fmt(Math.abs(projectedGap))}원 부족 예상입니다. 월 투자금·수익률·은퇴나이 가정 점검이 필요합니다.`) : "은퇴 목표금액을 설정하면 부족/초과 금액을 연결합니다.", tone: targetAmount <= 0 ? "info" : projectedGap >= 0 ? "green" : "amber" });

  if (net < 0) actions.push({ tag: "현금흐름", label: "이번 달 적자 원인부터 확인" });
  if (deficitMonths >= 2) actions.push({ tag: "추세", label: `최근 6개월 중 적자 ${deficitMonths}개월 원인 점검` });
  if (savingsRate < 20 && income > 0) actions.push({ tag: "저축률", label: "고정비·변동비를 줄여 저축률 20% 이상 회복" });
  if (emergencyMonths < 3 && expense > 0) actions.push({ tag: "비상금", label: "투자 증액보다 비상금 3개월치 우선 확보" });
  else if (emergencyMonths < 6 && expense > 0) actions.push({ tag: "안전", label: "비상금 6개월치까지 단계적으로 보강" });
  if (overBudgets.length) actions.push({ tag: "예산", label: `${overBudgets.slice(0,2).map(b=>b.cat1).join("·")} 예산 초과 항목 조정` });
  if (concentrated.length) actions.push({ tag: "리밸런싱", label: `${concentrated[0].name} 비중 쏠림 점검` });
  if (taxableTax > 100000) actions.push({ tag: "절세", label: "일반계좌 세금 노출을 절세계좌와 비교" });
  if (urgentEvents.length) actions.push({ tag: "목표", label: `${urgentEvents[0].name} 우선 적립 계획 설정` });
  if (targetRate < 70 && totalInvest > 0) actions.push({ tag: "은퇴", label: "월 투자금·기대수익률·은퇴나이 가정 재점검" });
  if (validationIssues > 0) actions.push({ tag: "데이터", label: `입력 점검 ${validationIssues}건 먼저 수정` });
  if (!actions.length) actions.push({ tag: "유지", label: "현재 전략 유지, 월 1회 리밸런싱·절세·목표 점검" });

  const message = `${conclusion}\n\n근거: ${reasons.slice(0,3).join(" ")} 현재 순자산은 ${fmt(netWorth)}원이며, 최근 6개월 평균 현금흐름은 ${fmt(avgNet)}원입니다.`;
  return { icon, title, tone, message, actions: actions.slice(0, 5), linked: linked.slice(0, 6) };
}

function DashboardAdvicePanel({ nlp }) {
  const actionList = Array.isArray(nlp?.actions) ? nlp.actions : [];
  return (
    <div className="card dashboard-advice-card">
      <div className="card-title">
        <h3>요약 및 결과 · 자동 조언</h3>
        <span className={`badge ${
          nlp.tone === "green" ? "badge-green" :
          nlp.tone === "amber" ? "badge-amber" :
          nlp.tone === "red" ? "badge-red" : "badge-accent"
        }`}>자동 분석</span>
      </div>

      <NaturalInsightCard
        icon={nlp.icon}
        title={nlp.title}
        message={nlp.message}
        tone={nlp.tone}
        actions={actionList}
        compact
      />

      {Array.isArray(nlp.linked) && nlp.linked.length > 0 && (
        <div className="dashboard-linked-grid">
          {nlp.linked.map((x, i) => (
            <div key={i} className={`dashboard-linked-card ${x.tone || "info"}`}>
              <span>{x.icon}</span>
              <div>
                <strong>{x.title}</strong>
                <p>{x.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-advice-list">
        {actionList.map((a, i) => (
          <div key={i} className="dashboard-advice-item">
            <span className="dashboard-advice-no">{i + 1}</span>
            <div>
              <strong>{a.label}</strong>
              <p>{a.tag} 관점에서 우선 실행할 항목입니다.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── 은퇴 시뮬레이션 자연어 요약 생성 ───────────────────────────────────────
function buildSimulationNLP({ advanced, base, w, targetRate, scenario }) {
  const retireAge = advanced.retireAge;
  const compareAge = advanced.compareAge;
  const survivalOk = w.success;
  const firstZero = w.firstZeroAge;
  const scenLabel = scenario === "stress" ? "보수적" : scenario === "optimistic" ? "낙관적" : "기본";

  let tone = "green";
  let icon = "😊";
  let message = "";
  const actions = [];

  if (targetRate >= 100 && survivalOk) {
    tone = "green"; icon = "🎉";
    message = `${scenLabel} 시나리오에서 ${retireAge}세 은퇴 목표를 ${fmtPct(targetRate)} 달성할 것으로 예상돼요. 은퇴 후 ${advanced.lifeAge}세까지 자산을 유지할 수 있을 것으로 보입니다.`;
  } else if (targetRate >= 100 && !survivalOk) {
    tone = "amber"; icon = "⚠️";
    message = `${retireAge}세 목표금액은 달성 가능하지만, ${firstZero}세 전후에 자산이 고갈될 수 있어요. 은퇴 후 생활비를 줄이거나 추가 연금 설정을 검토해보세요.`;
    actions.push({ label: "추가 연금 설정 검토", tag: "은퇴" });
  } else if (targetRate >= 70 && survivalOk) {
    tone = "accent"; icon = "🙂";
    message = `목표의 ${fmtPct(targetRate)}까지 도달할 전망이에요. 조금 더 저축하거나 은퇴 시기를 1~2년 늦추면 목표를 완전히 달성할 수 있어요.`;
    actions.push({ label: `${compareAge}세 은퇴 시 ${fmt(advanced.compareAcc.last.total - base.total)}원 추가`, tag: "비교" });
  } else if (!survivalOk) {
    tone = "red"; icon = "⚡";
    message = `현재 가정에서 ${firstZero}세 전후에 은퇴 자산이 고갈될 위험이 있어요. 월 투자금을 늘리거나, 은퇴 후 생활비를 줄이거나, 은퇴 시기를 조정해보세요.`;
    actions.push({ label: "월 투자금 증액 검토", tag: "투자" });
    actions.push({ label: "은퇴 후 생활비 재설정", tag: "설정" });
  } else {
    tone = "amber"; icon = "📊";
    message = `${scenLabel} 시나리오 기준 목표 달성률은 ${fmtPct(targetRate)}예요. 월 투자금 증액이나 기대수익률 조정으로 더 가까워질 수 있어요.`;
    actions.push({ label: "투자 전략 설정 확인", tag: "설정" });
  }

  // 낙관 vs 보수 힌트
  if (scenario === "base") {
    message += ` (보수적 시나리오도 함께 확인해보세요.)`;
  }

  return { tone, icon, title: `은퇴 시뮬레이션 — ${scenLabel} 시나리오`, message, actions };
}

// ─── 가계부(예산) 자연어 요약 ────────────────────────────────────────────────
function buildBudgetNLP(budgetAnalysis) {
  if (!budgetAnalysis || budgetAnalysis.length === 0) {
    return { tone: "info", icon: "📋", title: "이번 달 예산", message: "예산을 먼저 설정하면 소비 패턴을 한눈에 볼 수 있어요.", actions: [] };
  }
  const over = budgetAnalysis.filter(b => b.status === "초과");
  const warn = budgetAnalysis.filter(b => b.status === "주의");
  const ok = budgetAnalysis.filter(b => b.status === "정상");
  const totalBudget = budgetAnalysis.reduce((s, b) => s + n(b.budget), 0);
  const totalSpent = budgetAnalysis.reduce((s, b) => s + n(b.spent), 0);
  const totalRate = totalBudget > 0 ? totalSpent / totalBudget * 100 : 0;

  let tone, icon, message;
  const actions = [];

  if (over.length === 0 && warn.length === 0) {
    tone = "green"; icon = "✅";
    message = `모든 카테고리가 예산 내에서 잘 관리되고 있어요. 전체 예산 대비 ${fmtPct(totalRate)} 사용했습니다. 이 페이스를 유지하면 이번 달 마무리도 좋을 것 같아요.`;
  } else if (over.length === 0 && warn.length > 0) {
    tone = "amber"; icon = "👀";
    const warnNames = warn.map(b => b.cat1).join(", ");
    message = `전체적으로 괜찮지만 ${warnNames}${warn.length > 1 ? " 등" : ""}이 예산의 80%를 넘었어요. 이번 달 남은 기간 조금만 신경 쓰면 초과 없이 마무리할 수 있어요.`;
    actions.push({ label: `${warn[0].cat1} 지출 점검`, tag: "지출" });
  } else if (over.length <= 2) {
    tone = "amber"; icon = "💸";
    const overNames = over.map(b => b.cat1).join(", ");
    const overAmounts = over.reduce((s, b) => s + Math.max(b.spent - b.budget, 0), 0);
    message = `${overNames}에서 예산을 ${fmt(overAmounts)}원 초과했어요. 다음 달 같은 카테고리 예산을 현실에 맞게 조정하거나, 지출 패턴을 살펴보는 게 도움이 될 거예요.`;
    actions.push({ label: "예산 재조정 검토", tag: "예산" });
  } else {
    tone = "red"; icon = "⚠️";
    message = `이번 달 ${over.length}개 카테고리가 예산을 초과했어요. 전체 지출이 예산의 ${fmtPct(totalRate)}까지 올라왔어요. 지출 패턴 전체를 한번 점검해볼 시점이에요.`;
    actions.push({ label: "지출 전체 검토", tag: "지출" });
    actions.push({ label: "예산 현실화", tag: "예산" });
  }

  return { tone, icon, title: "이번 달 예산 건강도", message, actions };
}

// ─── 세금/절세 자연어 요약 ───────────────────────────────────────────────────
function buildTaxNLP(opt, taxAnalysis) {
  if (!opt) return { tone: "info", icon: "💡", title: "절세 현황", message: "납입 정보를 입력하면 절세 기회를 분석해드릴게요.", actions: [] };

  const totalBenefit = n(opt.totalImmediateBenefit);
  const pensionGap = n(opt.pensionGap);
  const isaGap = n(opt.isaGap);
  const taxNow = n(opt.taxableTaxNow);

  let tone, icon, message;
  const actions = [];

  if (totalBenefit === 0 && pensionGap === 0 && isaGap === 0) {
    tone = "green"; icon = "🏆";
    message = "절세 한도를 거의 다 활용하고 있어요. ISA와 연금 한도를 최대한 채웠다면 현재 세금 전략은 매우 효율적이에요.";
  } else if (totalBenefit > 500000) {
    tone = "accent"; icon = "💰";
    message = `지금 바로 활용할 수 있는 절세 기회가 약 ${fmt(totalBenefit)}원 있어요.`;
    if (pensionGap > 0) {
      message += ` 연금/IRP에 ${fmt(pensionGap)}원을 더 납입하면 세액공제를 추가로 받을 수 있어요.`;
      actions.push({ label: `연금 ${fmt(pensionGap)}원 추가 납입`, tag: "절세" });
    }
    if (isaGap > 0) {
      message += ` ISA에도 ${fmt(isaGap)}원 여력이 남아있어요.`;
      actions.push({ label: `ISA ${fmt(isaGap)}원 활용`, tag: "절세" });
    }
  } else if (totalBenefit > 0) {
    tone = "amber"; icon = "💡";
    message = `소규모 절세 기회가 ${fmt(totalBenefit)}원 남아있어요.`;
    if (pensionGap > 0) { message += ` 연금 한도를 조금 더 채워보세요.`; actions.push({ label: "연금 한도 점검", tag: "절세" }); }
    if (isaGap > 0) { message += ` ISA 납입 여력도 있어요.`; }
  } else {
    tone = "green"; icon = "✅";
    message = "현재 가용한 절세 전략을 잘 활용하고 있어요.";
  }

  if (taxNow > 100000) {
    message += ` 과세계좌에서 ${fmt(taxNow)}원의 세금 노출이 있어요. 가능하면 절세 계좌로 이동을 검토해보세요.`;
    if (!actions.find(a => a.tag === "절세")) actions.push({ label: "절세계좌 이동 검토", tag: "절세" });
  }

  return { tone, icon, title: "절세 기회 진단", message, actions };
}

// ─── 포트폴리오 자연어 요약 ─────────────────────────────────────────────────
function buildPortfolioNLP(financialAnalysis, data) {
  const { rows, total, byClass } = financialAnalysis;
  if (!rows || rows.length === 0) {
    return { tone: "info", icon: "📈", title: "포트폴리오 현황", message: "종목을 입력하면 수익률과 리스크를 분석해드릴게요.", actions: [] };
  }

  const totalInvested = rows.reduce((s, r) => s + n(r.invested), 0);
  const totalProfit = total - totalInvested;
  const totalRate = totalInvested > 0 ? totalProfit / totalInvested * 100 : 0;
  const overConcentrated = rows.filter(r => r.state === "쏠림 경고");
  const warnRows = rows.filter(r => r.state === "주의");
  const profitRows = rows.filter(r => n(r.value) > n(r.invested)).sort((a, b) => (n(b.value) - n(b.invested)) - (n(a.value) - n(a.invested)));
  const lossRows = rows.filter(r => n(r.value) < n(r.invested)).sort((a, b) => (n(a.value) - n(a.invested)) - (n(b.value) - n(b.invested)));
  const takeProfit = n(data.settings?.takeProfitPct || 20);

  let tone, icon, message;
  const actions = [];

  if (totalRate >= 15 && overConcentrated.length === 0) {
    tone = "green"; icon = "🚀";
    message = `전체 수익률 +${fmtPct(totalRate)}로 좋은 성과를 내고 있어요. 평가금액 ${fmt(total)}원, 수익 ${fmt(totalProfit)}원이에요.`;
    if (profitRows.length > 0) message += ` ${profitRows[0].name}이 가장 많이 올랐어요.`;
  } else if (totalRate >= 0 && overConcentrated.length === 0) {
    tone = "accent"; icon = "📈";
    message = `전체 수익률은 +${fmtPct(totalRate)}예요. 평가금액 ${fmt(total)}원으로 안정적으로 운용 중이에요.`;
  } else if (totalRate >= 0 && overConcentrated.length > 0) {
    tone = "amber"; icon = "⚖️";
    message = `수익률은 +${fmtPct(totalRate)}지만 ${overConcentrated.map(r => r.name).join(", ")} 비중이 높아요. 리밸런싱을 검토해보세요.`;
    actions.push({ label: "리밸런싱 계산기 확인", tag: "리밸런싱" });
  } else if (totalRate < 0) {
    tone = "red"; icon = "📉";
    message = `현재 전체 수익률 ${fmtPct(totalRate)}, 평가손실 ${fmt(Math.abs(totalProfit))}원이에요.`;
    if (lossRows.length > 0) { message += ` ${lossRows[0].name}의 손실이 가장 커요.`; }
    message += " 장기 투자 관점에서 흔들리지 않는 게 중요해요.";
    if (overConcentrated.length > 0) actions.push({ label: "집중 리스크 점검", tag: "리스크" });
  } else {
    tone = "info"; icon = "💼";
    message = `평가금액 ${fmt(total)}원, 수익률 ${fmtPct(totalRate)}예요.`;
  }

  // 익절 기준 달성 종목 언급
  const takeProfitHits = rows.filter(r => {
    const rate = n(r.invested) > 0 ? (n(r.value) - n(r.invested)) / n(r.invested) * 100 : 0;
    return rate >= takeProfit;
  });
  if (takeProfitHits.length > 0) {
    message += ` ${takeProfitHits[0].name}이 익절 기준(+${fmtPct(takeProfit)})을 넘었어요.`;
    actions.push({ label: `${takeProfitHits[0].name} 익절 검토`, tag: "익절" });
  }

  return { tone, icon, title: "포트폴리오 진단", message, actions };
}

// ─── 목표·계획 자연어 요약 ──────────────────────────────────────────────────
function buildPlanningNLP(eventAnalysis, dashboard) {
  if (!eventAnalysis || eventAnalysis.length === 0) {
    return { tone: "info", icon: "🎯", title: "목표 현황", message: "라이프 이벤트를 등록하면 월 필요 적립액을 알려드릴게요.", actions: [] };
  }

  const totalNeeded = eventAnalysis.reduce((s, e) => s + n(e.amountNeeded), 0);
  const totalPrepared = eventAnalysis.reduce((s, e) => s + n(e.currentPrepared), 0);
  const totalRate = totalNeeded > 0 ? totalPrepared / totalNeeded * 100 : 0;
  const totalMonthlyNeed = eventAnalysis.reduce((s, e) => s + n(e.monthlyNeed), 0);
  const urgent = eventAnalysis.filter(e => n(e.yearsFromNow) <= 1 && n(e.shortage) > 0);
  const onTrack = eventAnalysis.filter(e => n(e.progress) >= 80);
  const net = n(dashboard?.net || 0);

  let tone, icon, message;
  const actions = [];

  if (totalRate >= 80) {
    tone = "green"; icon = "🎯";
    message = `등록된 ${eventAnalysis.length}개 목표의 평균 준비율이 ${fmtPct(totalRate)}예요. 대부분의 목표가 잘 진행 중이에요.`;
  } else if (urgent.length > 0) {
    tone = "red"; icon = "⏰";
    const urgentNames = urgent.map(e => e.name).join(", ");
    message = `${urgentNames}은 1년 이내 목표인데 아직 준비가 부족해요. 월 ${fmt(urgent.reduce((s, e) => s + n(e.monthlyNeed), 0))}원을 우선 배정해보세요.`;
    actions.push({ label: "긴급 목표 우선 적립", tag: "목표" });
  } else if (totalMonthlyNeed > net && net > 0) {
    tone = "amber"; icon = "⚖️";
    message = `목표 달성을 위해 월 ${fmt(totalMonthlyNeed)}원이 필요한데, 현재 월 여유 현금(${fmt(net)}원)보다 많아요. 우선순위를 정해서 중요한 목표부터 집중해보세요.`;
    actions.push({ label: "목표 우선순위 재정렬", tag: "목표" });
  } else {
    tone = "accent"; icon = "🌱";
    message = `전체 준비율 ${fmtPct(totalRate)}, 월 필요 적립액은 ${fmt(totalMonthlyNeed)}원이에요.`;
    if (onTrack.length > 0) message += ` ${onTrack[0].name} 등 ${onTrack.length}개 목표는 순조로워요.`;
    actions.push({ label: "목표별 월 적립 확인", tag: "목표" });
  }

  return { tone, icon, title: "목표 달성 진단", message, actions };
}

// ─── 재무분석 자연어 요약 ────────────────────────────────────────────────────
function buildAnalysisNLP(monthlySeries, dashboardDetail) {
  if (!monthlySeries || monthlySeries.length < 2) {
    return { tone: "info", icon: "📊", title: "재무 패턴 분석", message: "2개월 이상의 거래 내역이 쌓이면 수입·지출 패턴을 분석해드릴게요.", actions: [] };
  }

  const last6 = monthlySeries.slice(-6);
  const avgIncome = last6.reduce((s, r) => s + n(r.income), 0) / last6.length;
  const avgExpense = last6.reduce((s, r) => s + n(r.expense), 0) / last6.length;
  const avgNet = last6.reduce((s, r) => s + n(r.net), 0) / last6.length;
  const avgSavingsRate = avgIncome > 0 ? avgNet / avgIncome * 100 : 0;

  const recent = monthlySeries[monthlySeries.length - 1];
  const prev = monthlySeries[monthlySeries.length - 2];
  const expChangePct = n(prev.expense) > 0 ? (n(recent.expense) - n(prev.expense)) / n(prev.expense) * 100 : 0;

  const consistentSurplus = last6.every(r => n(r.net) > 0);
  const hasDeficit = last6.some(r => n(r.net) < 0);
  const deficitMonths = last6.filter(r => n(r.net) < 0).length;

  let tone, icon, message;
  const actions = [];

  if (consistentSurplus && avgSavingsRate >= 25) {
    tone = "green"; icon = "📈";
    message = `최근 ${last6.length}개월 모두 흑자예요. 평균 저축률 ${fmtPct(avgSavingsRate)}, 월평균 ${fmt(avgNet)}원을 저축하고 있어요. 꾸준히 잘 관리되고 있어요.`;
  } else if (consistentSurplus) {
    tone = "accent"; icon = "🙂";
    message = `최근 ${last6.length}개월 연속 흑자예요. 평균 저축률은 ${fmtPct(avgSavingsRate)}이에요. 저축률을 조금 더 높이면 목표에 더 빠르게 다가갈 수 있어요.`;
    if (avgSavingsRate < 20) actions.push({ label: "저축률 20% 목표 설정", tag: "저축" });
  } else if (hasDeficit) {
    tone = deficitMonths >= 3 ? "red" : "amber";
    icon = "⚠️";
    message = `최근 ${last6.length}개월 중 ${deficitMonths}개월이 적자예요. 평균 월 ${fmt(Math.abs(avgNet))}원의 현금이 줄고 있어요. 지출 패턴을 점검해볼 시점이에요.`;
    actions.push({ label: "지출 카테고리 분석", tag: "지출" });
  } else {
    tone = "info"; icon = "📊";
    message = `6개월 평균 수입 ${fmt(avgIncome)}원, 지출 ${fmt(avgExpense)}원, 저축률 ${fmtPct(avgSavingsRate)}예요.`;
  }

  if (Math.abs(expChangePct) > 15) {
    message += expChangePct > 0
      ? ` 지난달보다 지출이 ${fmtPct(expChangePct)} 늘었어요.`
      : ` 지난달보다 지출이 ${fmtPct(Math.abs(expChangePct))} 줄었어요. 잘 하셨어요!`;
  }

  return { tone, icon, title: "6개월 재무 패턴", message, actions };
}

// ─── Auth Panel ───────────────────────────────────────────────────────────────
function AuthBar({ session, syncState, onLoadCloud, onSaveCloud }) {
  const [email,setEmail]=useState(""),  [pw,setPw]=useState(""), [busy,setBusy]=useState(false), [msg,setMsg]=useState("");
  const runAuth=async(mode)=>{
    if(!supabase){setMsg("Supabase 미설정");return}
    if(!email||!pw){setMsg("이메일·비밀번호 입력 필요");return}
    setBusy(true);setMsg("");
    try{
      const r=mode==="signup"?await supabase.auth.signUp({email,password:pw}):await supabase.auth.signInWithPassword({email,password:pw});
      if(r.error)throw r.error;
      setMsg(mode==="signup"?"가입 완료":"로그인 완료");
    }catch(e){setMsg(e.message||"오류")}finally{setBusy(false)}
  };
  if(!supabase) return (
    <div className="auth-bar"><span>로컬 전용 모드 (Supabase 미연결)</span><span style={{color:"var(--text2)"}}>{syncState||""}</span></div>
  );
  if(session?.user) return (
    <div className="auth-bar">
      <span>{session.user.email}</span>
      <div className="row">
        <span style={{color:"var(--text3)"}}>{syncState}</span>
        <button className="btn btn-sm btn-ghost" onClick={onLoadCloud}>불러오기</button>
        <button className="btn btn-sm btn-ghost" onClick={onSaveCloud}>저장</button>
        <button className="btn btn-sm btn-ghost" onClick={()=>supabase.auth.signOut()}>로그아웃</button>
      </div>
    </div>
  );
  return (
    <div className="auth-bar">
      <span>클라우드 동기화</span>
      <div className="row">
        <input className="auth-input" type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="auth-input" type="password" placeholder="비밀번호" value={pw} onChange={e=>setPw(e.target.value)}/>
        <button className="btn btn-sm btn-primary" onClick={()=>runAuth("signin")} disabled={busy}>로그인</button>
        <button className="btn btn-sm btn-ghost" onClick={()=>runAuth("signup")} disabled={busy}>가입</button>
        {msg&&<span style={{fontSize:11}}>{msg}</span>}
      </div>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────

function ValidationMark({ message, tone="danger" }) {
  if(!message) return null;
  return (
    <span
      className={`field-alert-dot ${tone==="warn"?"warn":"danger"}`}
      data-msg={message}
      tabIndex={0}
      aria-label={message}
    >
      !
    </span>
  );
}

function FieldHint({ hint }) {
  if(!hint) return null;
  return <div className="field-hint">{hint}</div>;
}


function InfoTooltip({ label, message, tone="info" }) {
  if(!message) return null;
  return (
    <span className={`info-tooltip ${tone}`} data-msg={message} tabIndex={0}>
      {label}
    </span>
  );
}

function Field({ label, error, warn, children }) {
  const msg = error || warn;
  return (
    <div className={`field ${error?"field-has-error":warn?"field-has-warn":""}`}>
      <label className="field-label-with-alert">
        <span>{label}</span>
        {msg && <ValidationMark message={msg} tone={error?"danger":"warn"}/>}
      </label>
      {children}
    </div>
  );
}


// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ data, dashboard, dashboardDetail, dashboardChartData, financialAnalysis, budgetAnalysis, monthlySeries, eventAnalysis, taxAnalysis, futureSim }) {
  const recentTx=dashboardDetail.recentTx||[];
  const topExp=dashboardDetail.topExpenseCats||[];

  const advanced=useMemo(()=>{
    const rows=dashboardChartData.monthlyTrend||[];
    const curMonth=rows[rows.length-1]||{income:dashboard.income,expense:dashboard.expense,net:dashboard.net};
    const prevMonth=rows[rows.length-2]||{income:0,expense:0,net:0};
    const income=n(curMonth.income), expense=n(curMonth.expense), net=n(curMonth.net);
    const prevNet=n(prevMonth.net), prevExpense=n(prevMonth.expense);
    const savingsRate=income>0 ? (net/income)*100 : 0;
    const monthlyInvest=n(data.settings?.monthlyInvestDefault||0);
    const investRate=income>0 ? (monthlyInvest/income)*100 : 0;
    const debtRatio=dashboard.totalAssets>0 ? (dashboard.totalLiabs/dashboard.totalAssets)*100 : 0;
    const emergencyMonths=expense>0 ? n(dashboardDetail.emergencyFund)/expense : 0;
    const budgetOver=(budgetAnalysis||[]).filter(b=>b.status==="초과").length;
    const target=n(data.settings?.retirementTargetAmount||dashboardChartData.retirementTarget||0);
    const projected=n(dashboardDetail.retirementRow?.total||dashboardChartData.retirementProjected||0);
    const targetRate=target>0 ? projected/target*100 : 0;
    const expenseChange=prevExpense>0 ? (expense-prevExpense)/prevExpense*100 : 0;
    const netChange=prevNet!==0 ? (net-prevNet)/Math.abs(prevNet)*100 : 0;

    let score=50;
    score += clamp(savingsRate, -20, 50)*0.45;
    score += clamp(investRate, 0, 50)*0.25;
    score += clamp(emergencyMonths, 0, 12)*2.1;
    score -= clamp(debtRatio, 0, 80)*0.22;
    score -= budgetOver*6;
    score += targetRate>=100 ? 8 : targetRate>=70 ? 4 : 0;
    score=clamp(Math.round(score),0,100);

    const grade=score>=80?"우수":score>=65?"양호":score>=50?"주의":"위험";
    const tone=score>=80?"green":score>=65?"accent":score>=50?"amber":"red";

    const topBudget=[...(budgetAnalysis||[])].sort((a,b)=>n(b.rate)-n(a.rate)).slice(0,3);
    const issueCards=[];
    if(savingsRate<20) issueCards.push({icon:"💧",title:"저축률 점검",text:`현재 저축률 ${fmtPct(savingsRate)}입니다. 지출 또는 투자 여력을 점검하세요.`,tone:"warn"});
    if(emergencyMonths<3) issueCards.push({icon:"🛟",title:"비상금 부족",text:`현재 비상금은 약 ${emergencyMonths.toFixed(1)}개월치입니다. 최소 3~6개월치를 권장합니다.`,tone:"danger"});
    if(budgetOver>0) issueCards.push({icon:"💸",title:"예산 초과",text:`${budgetOver}개 항목이 예산을 초과했습니다.`,tone:"warn"});
    if(expenseChange>20) issueCards.push({icon:"📈",title:"지출 급증",text:`전월 대비 지출이 ${fmtPct(expenseChange)} 증가했습니다.`,tone:"warn"});
    if(dashboardDetail.totalValidationIssues>0) issueCards.push({icon:"🔍",title:"입력 점검",text:`거래 입력 이슈 ${dashboardDetail.totalValidationIssues}건을 확인하세요.`,tone:"info"});
    if(issueCards.length===0) issueCards.push({icon:"✅",title:"특이 이슈 없음",text:"이번 달 주요 재무 이상 신호가 크지 않습니다.",tone:"green"});

    const actions=[];
    if(budgetOver>0) actions.push({title:"예산 초과 항목부터 조정",desc:topBudget.filter(b=>b.status==="초과").map(b=>b.cat1).join(" · ") || "지출 항목",tag:"지출"});
    if(emergencyMonths<6) actions.push({title:"비상금 우선 보강",desc:`현재 ${emergencyMonths.toFixed(1)}개월치 → 6개월치까지 보강`,tag:"안전"});
    if(targetRate<100) actions.push({title:"월 투자금 점검",desc:`목표 달성률 ${fmtPct(targetRate)} 기준, 투자금 증액 여지 검토`,tag:"투자"});
    if(data.settings?.annualPensionContribution < data.settings?.pensionAnnualTaxCreditLimit) actions.push({title:"연금/IRP 절세 여력 확인",desc:"세액공제 한도 미사용분이 있는지 확인",tag:"절세"});
    if(actions.length===0) actions.push({title:"현재 전략 유지",desc:"큰 이탈 없이 관리되고 있습니다.",tag:"유지"});

    return {income,expense,net,savingsRate,investRate,debtRatio,emergencyMonths,score,grade,tone,expenseChange,netChange,targetRate,topBudget,issueCards:issueCards.slice(0,4),actions:actions.slice(0,4)};
  },[data,dashboard,dashboardDetail,dashboardChartData,budgetAnalysis]);

  const dashboardNLP = useMemo(
    () => buildDashboardNLP({ advanced, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, monthlySeries, eventAnalysis, taxAnalysis, futureSim, data }),
    [advanced, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, monthlySeries, eventAnalysis, taxAnalysis, futureSim, data]
  );

  const healthColor=advanced.tone==="green"?"var(--green)":advanced.tone==="accent"?"var(--accent)":advanced.tone==="amber"?"var(--amber)":"var(--red)";
  const healthBg=advanced.tone==="green"?"var(--green-bg)":advanced.tone==="accent"?"var(--accent-bg)":advanced.tone==="amber"?"var(--amber-bg)":"var(--red-bg)";

  return (
    <div className="stack dashboard-pro">
      <DashboardAdvicePanel nlp={dashboardNLP} />
      <AICoachPanel coach={buildIntegratedCoach({ area:"대시보드", data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim, eventAnalysis, monthlySeries })}/>

      <div className="dashboard-hero">
        <div className="health-card">
          <div className="row-between">
            <div>
              <div className="kpi-label">FINANCIAL HEALTH</div>
              <div className="health-score" style={{color:healthColor}}>{advanced.score}<span>/100</span></div>
              <div className="health-grade" style={{background:healthBg,color:healthColor}}>{advanced.grade}</div>
            </div>
            <GoalGauge value={advanced.score} target={100} title="재무 건강 점수"/>
          </div>
        </div>
        <div className="dashboard-summary-grid">
          <div className="mini-metric">
            <span>저축률</span>
            <strong className={advanced.savingsRate>=20?"text-green":"text-red"}>{fmtPct(advanced.savingsRate)}</strong>
            <small>이번달 순수입 / 수입</small>
          </div>
          <div className="mini-metric">
            <span>투자율</span>
            <strong className="text-accent">{fmtPct(advanced.investRate)}</strong>
            <small>월 투자계획 기준</small>
          </div>
          <div className="mini-metric">
            <span>비상금</span>
            <strong className={advanced.emergencyMonths>=6?"text-green":advanced.emergencyMonths>=3?"text-accent":"text-red"}>{advanced.emergencyMonths.toFixed(1)}개월</strong>
            <small>월 지출 기준</small>
          </div>
          <div className="mini-metric">
            <span>목표 달성</span>
            <strong className="text-accent">{fmtPct(advanced.targetRate)}</strong>
            <small>은퇴 목표 대비</small>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="순자산" value={dashboard.netWorth} unit="원" accent/>
        <KpiCard label="이번달 현금흐름" value={dashboard.net} unit="원" tone={dashboard.net>=0?"green":"red"}/>
        <KpiCard label="총 투자자산" value={financialAnalysis.total} unit="원"/>
        <KpiCard label="비상금" value={dashboardDetail.emergencyFund} unit="원"/>
      </div>

      <div className="g3">
        <div className="card">
          <div className="card-title"><h3>이번달 핵심 요약</h3></div>
          <div className="stat-row"><span className="stat-label">수입</span><span className="stat-value text-green">{fmt(dashboard.income)}원</span></div>
          <div className="stat-row"><span className="stat-label">지출</span><span className="stat-value text-red">{fmt(dashboard.expense)}원</span></div>
          <div className="stat-row"><span className="stat-label">순수입</span><span className={`stat-value ${dashboard.net>=0?"text-green":"text-red"}`}>{fmt(dashboard.net)}원</span></div>
          <div className="stat-row"><span className="stat-label">전월 대비 지출</span><span className={`stat-value ${advanced.expenseChange>0?"text-red":"text-green"}`}>{fmtPct(advanced.expenseChange)}</span></div>
        </div>

        <div className="card">
          <div className="card-title"><h3>문제 탐지</h3></div>
          <div className="stack" style={{gap:8}}>
            {advanced.issueCards.map((x,i)=>(
              <div key={i} className={`compact-insight ${x.tone}`}>
                <span>{x.icon}</span>
                <div><strong>{x.title}</strong><p>{x.text}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><h3>다음 행동 추천</h3></div>
          <div className="stack" style={{gap:8}}>
            {advanced.actions.map((a,i)=>(
              <div key={i} className="action-item">
                <span className="badge badge-accent">{a.tag}</span>
                <div><strong>{a.title}</strong><p>{a.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <h3>월별 수입·지출 추이</h3>
          <MonthlyTrendChart data={dashboardChartData.monthlyTrend}/>
        </div>
        <div className="card">
          <h3>자산 구성</h3>
          <AssetDonutChart segments={dashboardChartData.assetSegments}/>
        </div>
        <div className="card">
          <h3>은퇴 목표 달성률</h3>
          <GoalGauge value={dashboardChartData.retirementProjected} target={dashboardChartData.retirementTarget} title="은퇴 목표자산 도달률"/>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title"><h3>예산 초과 TOP 3</h3></div>
          {advanced.topBudget.map(b=>(
            <div key={b.cat1} className="budget-item">
              <div className="budget-header">
                <span className="budget-name">{b.cat1}</span>
                <div className="row" style={{gap:8}}>
                  <span className="budget-nums">{fmt(b.spent)} / {fmt(b.budget)}원</span>
                  <span className={`badge ${b.status==="초과"?"badge-red":b.status==="주의"?"badge-amber":"badge-green"}`}>{fmtPct(b.rate)}</span>
                </div>
              </div>
              <div className="progress">
                <div className={`progress-fill ${b.status==="초과"?"pf-red":b.status==="주의"?"pf-amber":"pf-accent"}`} style={{width:`${clamp(b.rate,0,100)}%`}}/>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><h3>최근 거래</h3></div>
          {recentTx.length?recentTx.slice(0,6).map(t=>(
            <div key={t.id} className="tx-item">
              <div className="tx-icon" style={{background:t.type==="수입"?"var(--green-bg)":t.type==="지출"?"var(--red-bg)":"var(--surface2)"}}>
                {t.type==="수입"?"💰":t.type==="지출"?"💳":"🔄"}
              </div>
              <div className="tx-meta">
                <div className="tx-name">{t.content||t.cat2}</div>
                <div className="tx-date">{t.date} · {t.cat1}</div>
              </div>
              <div className={`tx-amt ${t.type==="수입"?"text-green":t.type==="지출"?"text-red":""}`}>{t.type==="수입"?"+":"-"}{fmt(t.amount)}</div>
            </div>
          )):<div className="empty">거래내역이 없습니다.</div>}
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <h3>현재 상태</h3>
          <div className="stat-row"><span className="stat-label">총 자산</span><span className="stat-value">{fmt(dashboard.totalAssets)}원</span></div>
          <div className="stat-row"><span className="stat-label">총 부채</span><span className="stat-value text-red">{fmt(dashboard.totalLiabs)}원</span></div>
          <div className="stat-row"><span className="stat-label">부채비율</span><span className="stat-value">{fmtPct(advanced.debtRatio)}</span></div>
          <div className="stat-row"><span className="stat-label">유동자산</span><span className="stat-value">{fmt(dashboardDetail.liquidAssets)}원</span></div>
          <div className="stat-row"><span className="stat-label">입력 점검 필요</span><span className="stat-value">{dashboardDetail.totalValidationIssues}건</span></div>
        </div>
        <div className="card">
          <h3>목표 전망</h3>
          <div className="stat-row"><span className="stat-label">은퇴 시뮬 최종자산</span><span className="stat-value">{fmt(dashboardDetail.retirementRow?.total||0)}원</span></div>
          <div className="stat-row"><span className="stat-label">목표금액</span><span className="stat-value">{fmt(data.settings.retirementTargetAmount||0)}원</span></div>
          <div className="stat-row"><span className="stat-label">ISA 절세 예상</span><span className="stat-value">{fmt(dashboardDetail.retirementRow?.isaTaxSaved||0)}원</span></div>
          <div className="stat-row"><span className="stat-label">연금세액공제 누적</span><span className="stat-value">{fmt(dashboardDetail.retirementRow?.pensionCreditAcc||0)}원</span></div>
          <div className="stat-row"><span className="stat-label">은퇴까지 남은 기간</span><span className="stat-value">{Math.max(n(data.settings.retireAge)-n(data.settings.currentAge),0)}년</span></div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, unit, tone, accent }) {
  const cls=accent?"kpi-card kpi-accent":tone==="green"?"kpi-card kpi-green":tone==="red"?"kpi-card kpi-red":"kpi-card";
  const valColor=tone==="green"?"var(--green)":tone==="red"?"var(--red)":accent?"var(--accent)":"var(--text)";
  return (
    <div className={cls}>
      <div className="kpi-label">{label}</div>
      <div>
        <span className="kpi-value" style={{color:valColor}}>{fmt(value)}</span>
        <span className="kpi-unit">{unit}</span>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab({ data, update, accountNamesIn, accountNamesOut }) {
  const EMPTY={id:"",date:todayISO(),type:"지출",cat1:"",cat2:"",amount:"",inAccount:"",outAccount:"",content:"",memo:""};
  const [form,setForm]=useState(EMPTY);
  const [showForm,setShowForm]=useState(true);

  // 필터 state
  const [search,setSearch]=useState("");
  const [filterMonth,setFilterMonth]=useState(thisMonthISO());
  const [filterType,setFilterType]=useState("");
  const [filterCat1,setFilterCat1]=useState("");
  const [autoFillMonth,setAutoFillMonth]=useState(thisMonthISO());
  const [templateName,setTemplateName]=useState("");

  const txTemplates=Array.isArray(data.settings?.transactionTemplates)?data.settings.transactionTemplates:[];
  const fixedRules=Array.isArray(data.settings?.fixedTransactionRules)?data.settings.fixedTransactionRules:[];
  const cat1Opts=Object.keys(data.categories[form.type]||{});
  const cat2Opts=(data.categories[form.type]||{})[form.cat1]||[];

  // 필터용 대분류 목록
  const filterCat1Opts=useMemo(()=>{
    if(!filterType) return [...new Set(Object.values(data.categories).flatMap(g=>Object.keys(g)))].sort();
    return Object.keys(data.categories[filterType]||{});
  },[filterType,data.categories]);

  // 필터 적용
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return [...data.transactions]
      .filter(t=>{
        if(filterMonth&&monthOf(t.date)!==filterMonth) return false;
        if(filterType&&t.type!==filterType) return false;
        if(filterCat1&&t.cat1!==filterCat1) return false;
        if(q){const hay=[t.content,t.memo,t.cat1,t.cat2,t.inAccount,t.outAccount].join(" ").toLowerCase();if(!hay.includes(q)) return false;}
        return true;
      })
      .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  },[data.transactions,filterMonth,filterType,filterCat1,search]);

  // 소계
  const subtotal=useMemo(()=>{
    let income=0,expense=0;
    filtered.forEach(t=>{if(t.type==="수입")income+=n(t.amount);if(t.type==="지출")expense+=n(t.amount);});
    return{income,expense,net:income-expense};
  },[filtered]);

  const normalizedForm=useMemo(()=>({
    ...form,
    amount:n(form.amount),
    date:String(form.date||"").trim(),
    type:String(form.type||"").trim(),
    cat1:String(form.cat1||"").trim(),
    cat2:String(form.cat2||"").trim(),
    content:String(form.content||"").trim(),
    inAccount:String(form.inAccount||"").trim(),
    outAccount:String(form.outAccount||"").trim(),
  }),[form]);

  const validationMessages=useMemo(()=>{
    const list=[]; const f=normalizedForm;
    const add=(level,title,desc)=>list.push({level,title,desc});
    if(!f.date) add("danger","날짜 누락","거래일자를 입력하세요.");
    if(!f.type) add("danger","구분 누락","수입·지출·자산이동 중 하나를 선택하세요.");
    if(!f.cat1) add("danger","대분류 누락","대분류를 선택하세요.");
    if(!f.cat2) add("danger","소분류 누락","소분류를 선택하세요.");
    if(f.amount<=0) add("danger","금액 오류","금액은 0보다 커야 합니다.");
    if(!f.content) add("danger","내용 누락","검색·분석을 위해 거래 내용을 입력하세요.");
    if(f.type==="수입"&&!f.inAccount) add("danger","입금계좌 누락","수입 거래는 입금계좌가 필요합니다.");
    if(f.type==="지출"&&!f.outAccount) add("danger","출금계좌 누락","지출 거래는 출금계좌가 필요합니다.");
    if(f.type==="자산이동"&&(!f.inAccount||!f.outAccount)) add("danger","이체 계좌 누락","자산이동은 입금계좌와 출금계좌가 모두 필요합니다.");
    if(f.type==="자산이동"&&f.inAccount&&f.outAccount&&f.inAccount===f.outAccount) add("warn","동일 계좌 이동","입금계좌와 출금계좌가 같습니다.");
    if(f.amount>=1000000&&!form.memo) add("warn","고액 거래 메모 권장","100만원 이상 거래는 메모를 남기면 분석 정확도가 좋아집니다.");
    if(f.type==="지출"&&f.cat1==="기타지출") add("info","기타지출 확인","가능하면 구체적인 대분류로 바꾸는 것이 좋습니다.");
    return list;
  },[normalizedForm,form.memo]);
  const canSave=validationMessages.filter(x=>x.level==="danger").length===0;

  const duplicateCandidates=useMemo(()=>{
    const f=normalizedForm;
    if(!f.date||!f.content||f.amount<=0) return [];
    return data.transactions.filter(t=>{
      if(form.id&&t.id===form.id) return false;
      return t.date===f.date&&n(t.amount)===f.amount&&String(t.content||"").trim()===f.content&&t.type===f.type;
    }).slice(0,5);
  },[data.transactions,normalizedForm,form.id]);


  const fieldAlerts=useMemo(()=>{
    const f=normalizedForm;
    const errors={}, warns={};
    if(!f.date) errors.date="거래일자를 입력하세요.";
    if(!f.type) errors.type="수입·지출·자산이동 중 하나를 선택하세요.";
    if(!f.cat1) errors.cat1="대분류를 선택하세요.";
    if(!f.cat2) errors.cat2="소분류를 선택하세요.";
    if(f.amount<=0) errors.amount="금액은 0보다 커야 합니다.";
    if(!f.content) errors.content="검색·분석을 위해 거래 내용을 입력하세요.";
    if(f.type==="수입"&&!f.inAccount) errors.inAccount="수입 거래는 입금계좌가 필요합니다.";
    if(f.type==="지출"&&!f.outAccount) errors.outAccount="지출 거래는 출금계좌가 필요합니다.";
    if(f.type==="자산이동"&&(!f.inAccount||!f.outAccount)) {
      if(!f.inAccount) errors.inAccount="자산이동은 입금계좌가 필요합니다.";
      if(!f.outAccount) errors.outAccount="자산이동은 출금계좌가 필요합니다.";
    }
    if(f.type==="자산이동"&&f.inAccount&&f.outAccount&&f.inAccount===f.outAccount) warns.outAccount="입금계좌와 출금계좌가 같습니다.";
    if(duplicateCandidates.length>0) warns.content="같은 날짜·금액·내용의 거래가 이미 있습니다.";
    if(f.amount>=1000000&&!String(form.memo||"").trim()) warns.memo="100만원 이상 거래는 메모를 남기면 분석 정확도가 좋아집니다.";
    return {errors,warns};
  },[normalizedForm,form.memo,duplicateCandidates.length]);


  const fieldExamples={
    date:"예: 오늘 날짜 또는 거래일",
    type:"수입·지출·자산이동 중 선택",
    cat1:"예: 식비, 교통, 금융소득",
    cat2:"예: 외식, 커피/간식, ETF매수",
    amount:"예: 15000",
    inAccount:"수입 또는 이체 입금 계좌",
    outAccount:"지출 또는 이체 출금 계좌",
    content:"예: 점심식사, 월급, 카드결제",
    memo:"예: 고액 거래 사유, 예외사항"
  };

  const smartSuggestions=useMemo(()=>{
    const tx=(data.transactions||[]).filter(t=>!form.id||t.id!==form.id);
    const f=normalizedForm;
    const pickTop=(arr,key,limit=5)=>{
      const map=new Map();
      arr.forEach(t=>{
        const v=String(t[key]||"").trim();
        if(!v) return;
        map.set(v,(map.get(v)||0)+1);
      });
      return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([value,count])=>({value,count}));
    };
    const sameType=tx.filter(t=>!f.type||t.type===f.type);
    const sameCat1=sameType.filter(t=>!f.cat1||t.cat1===f.cat1);
    const sameCat2=sameCat1.filter(t=>!f.cat2||t.cat2===f.cat2);
    return {
      cat1: pickTop(sameType,"cat1"),
      cat2: pickTop(sameCat1.length?sameCat1:sameType,"cat2"),
      content: pickTop(sameCat2.length?sameCat2:sameCat1.length?sameCat1:sameType,"content",6),
      inAccount: pickTop(sameCat2.length?sameCat2:sameType,"inAccount"),
      outAccount: pickTop(sameCat2.length?sameCat2:sameType,"outAccount"),
      amount: pickTop(sameCat2.length?sameCat2:sameCat1.length?sameCat1:sameType,"amount",5).map(x=>({...x,value:n(x.value)})).filter(x=>x.value>0)
    };
  },[data.transactions,normalizedForm,form.id]);

  const SuggestionChips=({items,onPick,formatter=(v)=>v})=>{
    if(!items||!items.length) return null;
    return (
      <div className="suggestion-chips">
        {items.slice(0,5).map((it,i)=>(
          <button key={`${it.value}-${i}`} type="button" className="suggestion-chip" onClick={()=>onPick(it.value)}>
            {formatter(it.value)}
          </button>
        ))}
      </div>
    );
  };

  const aiSuggestion=useMemo(()=>{
    const tx=(data.transactions||[]).filter(t=>!form.id||t.id!==form.id);
    const f=normalizedForm;
    const score=(t)=>{
      let s=0;
      if(f.type&&t.type===f.type) s+=4;
      if(f.cat1&&t.cat1===f.cat1) s+=6;
      if(f.cat2&&t.cat2===f.cat2) s+=8;
      const content=String(f.content||"").trim();
      if(content&&String(t.content||"").includes(content)) s+=4;
      return s;
    };
    const candidates=tx.map(t=>({t,s:score(t)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||String(b.t.date).localeCompare(String(a.t.date))).slice(0,12);
    if(!candidates.length) return null;
    const best=candidates[0].t;
    const sameCat=candidates.filter(x=>x.t.cat1===best.cat1&&x.t.cat2===best.cat2).map(x=>x.t);
    const avgAmount=sameCat.length?Math.round(sameCat.reduce((sum,t)=>sum+n(t.amount),0)/sameCat.length):n(best.amount);
    const mode=(arr)=>{const m=new Map();arr.filter(Boolean).forEach(v=>m.set(v,(m.get(v)||0)+1));return [...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||"";};
    return {
      type: f.type||best.type||"지출",
      cat1: f.cat1||best.cat1||"",
      cat2: f.cat2||best.cat2||"",
      amount: f.amount>0?f.amount:avgAmount,
      inAccount: f.inAccount||mode(candidates.map(x=>x.t.inAccount))||best.inAccount||"",
      outAccount: f.outAccount||mode(candidates.map(x=>x.t.outAccount))||best.outAccount||"",
      content: f.content||best.content||"",
      memo: form.memo||best.memo||"",
      count:candidates.length,
      basis:best.content||best.cat2||best.cat1||"최근 거래"
    };
  },[data.transactions,normalizedForm,form.id,form.memo]);

  const applyAiSuggestion=()=>{
    if(!aiSuggestion) return;
    setForm({
      ...form,
      type:aiSuggestion.type||form.type,
      cat1:aiSuggestion.cat1||form.cat1,
      cat2:aiSuggestion.cat2||form.cat2,
      amount:aiSuggestion.amount||form.amount,
      inAccount:aiSuggestion.inAccount||form.inAccount,
      outAccount:aiSuggestion.outAccount||form.outAccount,
      content:aiSuggestion.content||form.content,
      memo:aiSuggestion.memo||form.memo
    });
  };

  const validationSummary=useMemo(()=>{
    const tx=data.transactions||[];
    const missing=tx.filter(t=>!t.date||!t.type||!t.cat1||!t.cat2||!t.content||n(t.amount)<=0).length;
    const accountMiss=tx.filter(t=>(t.type==="수입"&&!t.inAccount)||(t.type==="지출"&&!t.outAccount)||(t.type==="자산이동"&&(!t.inAccount||!t.outAccount))).length;
    const keyCount=new Map();
    tx.forEach(t=>{const k=[t.date,t.type,n(t.amount),String(t.content||"").trim()].join("|");keyCount.set(k,(keyCount.get(k)||0)+1);});
    const duplicates=[...keyCount.values()].filter(v=>v>1).reduce((acc,v)=>acc+v,0);
    return {missing,accountMiss,duplicates,total:missing+accountMiss+duplicates};
  },[data.transactions]);

  const activeFilterCount=[filterMonth!==thisMonthISO(),!!filterType,!!filterCat1,!!search.trim()].filter(Boolean).length;
  const resetFilters=()=>{setSearch("");setFilterMonth(thisMonthISO());setFilterType("");setFilterCat1("");};

  const saveTemplate=()=>{
    if(!canSave) return alert("템플릿 저장 전 필수값을 먼저 채워주세요.");
    const name=templateName.trim()||form.content||`${form.type} 템플릿`;
    update(d=>({...d,settings:{...d.settings,transactionTemplates:[...(Array.isArray(d.settings.transactionTemplates)?d.settings.transactionTemplates:[]),{id:uid(),name,type:form.type,cat1:form.cat1,cat2:form.cat2,amount:n(form.amount),inAccount:form.inAccount,outAccount:form.outAccount,content:form.content,memo:form.memo}]}}));
    setTemplateName("");
  };
  const applyTemplate=(tpl)=>{if(!tpl)return;setForm({...EMPTY,date:todayISO(),type:tpl.type||"지출",cat1:tpl.cat1||"",cat2:tpl.cat2||"",amount:tpl.amount||"",inAccount:tpl.inAccount||"",outAccount:tpl.outAccount||"",content:tpl.content||tpl.name||"",memo:tpl.memo||""});setShowForm(true);};
  const deleteTemplate=(id)=>update(d=>({...d,settings:{...d.settings,transactionTemplates:(Array.isArray(d.settings.transactionTemplates)?d.settings.transactionTemplates:[]).filter(t=>t.id!==id)}}));
  const addFixedRuleFromForm=()=>{
    if(!canSave) return alert("고정거래 등록 전 필수값을 먼저 채워주세요.");
    const day=clamp(Number(String(form.date||todayISO()).slice(8,10))||1,1,28);
    const name=templateName.trim()||form.content||`${form.type} 고정거래`;
    update(d=>({...d,settings:{...d.settings,fixedTransactionRules:[...(Array.isArray(d.settings.fixedTransactionRules)?d.settings.fixedTransactionRules:[]),{id:uid(),name,day,type:form.type,cat1:form.cat1,cat2:form.cat2,amount:n(form.amount),inAccount:form.inAccount,outAccount:form.outAccount,content:form.content,memo:form.memo,active:true}]}}));
    setTemplateName("");
  };
  const deleteFixedRule=(id)=>update(d=>({...d,settings:{...d.settings,fixedTransactionRules:(Array.isArray(d.settings.fixedTransactionRules)?d.settings.fixedTransactionRules:[]).filter(r=>r.id!==id)}}));
  const generateFixedTransactions=()=>{
    const month=autoFillMonth||thisMonthISO();
    const active=fixedRules.filter(r=>r.active!==false);
    if(!active.length) return alert("등록된 고정거래가 없습니다.");
    let added=0,skipped=0;
    update(d=>{
      const current=[...d.transactions];
      active.forEach(r=>{
        const date=`${month}-${String(clamp(n(r.day)||1,1,28)).padStart(2,"0")}`;
        const exists=current.some(t=>t.date===date&&t.type===r.type&&n(t.amount)===n(r.amount)&&String(t.content||"").trim()===String(r.content||r.name||"").trim());
        if(exists){skipped++;return;}
        current.push({id:uid(),date,type:r.type,cat1:r.cat1,cat2:r.cat2,amount:n(r.amount),inAccount:r.inAccount||"",outAccount:r.outAccount||"",content:r.content||r.name,memo:r.memo||""});
        added++;
      });
      return {...d,transactions:current};
    });
    alert(`${month} 고정거래 생성 완료추가: ${added}건 / 중복 제외: ${skipped}건`);
  };

  const save=()=>{
    if(!canSave) return alert(validationMessages.filter(x=>x.level==="danger").map(x=>`- ${x.title}`).join(""));
    if(duplicateCandidates.length>0&&!confirm("같은 날짜·금액·내용의 거래가 이미 있습니다. 그래도 저장할까요?")) return;
    update(d=>{
      const row={...form,amount:n(form.amount),id:form.id||uid()};
      const list=form.id?d.transactions.map(t=>t.id===form.id?row:t):[...d.transactions,row];
      return {...d,transactions:list};
    });
    setForm(EMPTY);
  };
  const remove=(id)=>update(d=>({...d,transactions:d.transactions.filter(t=>t.id!==id)}));
  const edit=(t)=>{setForm({...t});setShowForm(true);};

  // 검색 하이라이트
  const Hl=({text=""})=>{
    if(!search.trim()||!text) return <>{text}</>;
    const q=search.trim(),idx=text.toLowerCase().indexOf(q.toLowerCase());
    if(idx===-1) return <>{text}</>;
    return <>{text.slice(0,idx)}<mark style={{background:"rgba(108,125,255,.28)",color:"var(--accent2)",borderRadius:3,padding:"0 1px"}}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</>;
  };

  const inpS={width:"100%",padding:"10px 13px",border:"1px solid var(--border2)",borderRadius:10,background:"var(--surface2)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"inherit"};

  return (
    <div className="stack">
      {validationSummary.total>0&&(
        <div className="kpi-grid">
          <KpiCard label="입력 검증 이슈" value={validationSummary.total} unit="건" tone="red"/>
          <KpiCard label="필수값 누락" value={validationSummary.missing} unit="건"/>
          <KpiCard label="계좌 누락" value={validationSummary.accountMiss} unit="건"/>
          <KpiCard label="중복 의심" value={validationSummary.duplicates} unit="건"/>
        </div>
      )}
      <div className="card">
        <div className="card-title">
          <h3>{form.id?"거래 수정":"입력센터"} <span style={{fontSize:12,fontWeight:400,color:"var(--text3)",marginLeft:6}}>자동 검증 · 템플릿 · 고정거래</span></h3>
          <button onClick={()=>setShowForm(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:12,padding:"2px 6px"}}>{showForm?"▲ 접기":"▼ 펼치기"}</button>
        </div>
        {showForm&&(
          <>
            <div className="form-grid">
              <Field label="날짜" error={fieldAlerts.errors.date}>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
                <FieldHint hint={fieldExamples.date}/>
              </Field>
              <Field label="구분" error={fieldAlerts.errors.type}>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value,cat1:"",cat2:""})}><option>수입</option><option>지출</option><option>자산이동</option></select>
                <FieldHint hint={fieldExamples.type}/>
              </Field>
              <Field label="대분류" error={fieldAlerts.errors.cat1}>
                <select value={form.cat1} onChange={e=>setForm({...form,cat1:e.target.value,cat2:""})}><option value="">선택</option>{cat1Opts.map(x=><option key={x}>{x}</option>)}</select>
                <SuggestionChips items={smartSuggestions.cat1} onPick={(v)=>setForm({...form,cat1:v,cat2:""})}/>
                <FieldHint hint={fieldExamples.cat1}/>
              </Field>
              <Field label="소분류" error={fieldAlerts.errors.cat2}>
                <select value={form.cat2} onChange={e=>setForm({...form,cat2:e.target.value})}><option value="">선택</option>{cat2Opts.map(x=><option key={x}>{x}</option>)}</select>
                <SuggestionChips items={smartSuggestions.cat2} onPick={(v)=>setForm({...form,cat2:v})}/>
                <FieldHint hint={fieldExamples.cat2}/>
              </Field>
              <Field label="금액" error={fieldAlerts.errors.amount}>
                <input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/>
                <SuggestionChips items={smartSuggestions.amount} onPick={(v)=>setForm({...form,amount:v})} formatter={(v)=>`${fmt(v)}원`}/>
                <FieldHint hint={fieldExamples.amount}/>
              </Field>
              <Field label="입금계좌" error={fieldAlerts.errors.inAccount}>
                <select value={form.inAccount} onChange={e=>setForm({...form,inAccount:e.target.value})}><option value="">선택</option>{accountNamesIn.map(x=><option key={x}>{x}</option>)}</select>
                <SuggestionChips items={smartSuggestions.inAccount} onPick={(v)=>setForm({...form,inAccount:v})}/>
                <FieldHint hint={fieldExamples.inAccount}/>
              </Field>
              <Field label="출금계좌" error={fieldAlerts.errors.outAccount} warn={fieldAlerts.warns.outAccount}>
                <select value={form.outAccount} onChange={e=>setForm({...form,outAccount:e.target.value})}><option value="">선택</option>{accountNamesOut.map(x=><option key={x}>{x}</option>)}</select>
                <SuggestionChips items={smartSuggestions.outAccount} onPick={(v)=>setForm({...form,outAccount:v})}/>
                <FieldHint hint={fieldExamples.outAccount}/>
              </Field>
              <Field label="내용" error={fieldAlerts.errors.content} warn={fieldAlerts.warns.content}>
                <input value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="내용 입력"/>
                <SuggestionChips items={smartSuggestions.content} onPick={(v)=>setForm({...form,content:v})}/>
                <FieldHint hint={fieldExamples.content}/>
              </Field>
            </div>
            <div style={{marginTop:10}}><Field label="메모" warn={fieldAlerts.warns.memo}>
                <textarea value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} placeholder="고액 거래, 예외 거래, 카드 결제 예정 등 참고사항"/>
                <FieldHint hint={fieldExamples.memo}/>
              </Field></div>
            <div className="input-status-row">
              <div className="input-status-left">
                <span className="input-status-caption">입력 상태</span>
                <InfoTooltip
                  label={canSave ? "저장 가능" : "확인 필요"}
                  tone={canSave ? "ok" : "danger"}
                  message={canSave ? "필수 검증을 통과했습니다." : "필수 입력값을 채워야 저장됩니다. 느낌표가 표시된 항목을 확인하세요."}
                />
                <InfoTooltip
                  label={duplicateCandidates.length ? `중복 ${duplicateCandidates.length}` : "중복 없음"}
                  tone={duplicateCandidates.length ? "warn" : "info"}
                  message={duplicateCandidates.length ? "같은 날짜·금액·내용의 거래가 이미 있습니다. 저장 전 확인하세요." : "같은 날짜·금액·내용 기준으로 중복 의심 거래가 없습니다."}
                />
              </div>
              <div className="input-status-right">
                <InfoTooltip
                  label="도움말"
                  tone="info"
                  message="각 입력칸 옆 느낌표 또는 상태 배지를 올리면 필요한 안내가 표시됩니다."
                />
              </div>
            </div>

            {aiSuggestion&&(
              <div className="ai-suggest-card">
                <div>
                  <div className="ai-suggest-title">🤖 AI 입력 추천</div>
                  <div className="ai-suggest-desc">과거 유사 거래 {aiSuggestion.count}건을 기준으로 금액·계좌·분류를 추천합니다.</div>
                  <div className="ai-chip-row">
                    {aiSuggestion.cat1&&<span className="ai-chip">대분류 {aiSuggestion.cat1}</span>}
                    {aiSuggestion.cat2&&<span className="ai-chip">소분류 {aiSuggestion.cat2}</span>}
                    {aiSuggestion.amount>0&&<span className="ai-chip">금액 {fmt(aiSuggestion.amount)}원</span>}
                    {(aiSuggestion.outAccount||aiSuggestion.inAccount)&&<span className="ai-chip">계좌 {aiSuggestion.outAccount||aiSuggestion.inAccount}</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={applyAiSuggestion}>추천 적용</button>
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-primary" onClick={save} disabled={!canSave}>{form.id?"수정 저장":"거래 저장"}</button>
              <button className="btn btn-ghost" onClick={()=>setForm(EMPTY)}>초기화</button>
              <button className="btn btn-success" onClick={saveTemplate}>현재 입력값 템플릿 저장</button>
              <button className="btn btn-ghost" onClick={addFixedRuleFromForm}>고정거래 등록</button>
            </div>
            <div style={{marginTop:10,maxWidth:320}}><Field label="템플릿/고정거래 이름"><input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="예: 월급, 통신비, 보험료"/></Field></div>
          </>
        )}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title"><h3>빠른 입력 템플릿</h3></div>
          {txTemplates.length?(
            <div className="table-wrap">
              <table><thead><tr><th>이름</th><th>구분</th><th className="td-right">금액</th><th>작업</th></tr></thead><tbody>
                {txTemplates.map(t=><tr key={t.id}><td className="td-name">{t.name}</td><td>{t.type}</td><td className="td-right td-mono">{fmt(t.amount)}</td><td><div className="row"><button className="btn btn-sm btn-ghost" onClick={()=>applyTemplate(t)}>적용</button><button className="btn btn-sm btn-danger" onClick={()=>deleteTemplate(t.id)}>삭제</button></div></td></tr>)}
              </tbody></table>
            </div>
          ):<div className="empty">자주 쓰는 입력값을 템플릿으로 저장하면 원클릭 입력이 가능합니다.</div>}
        </div>
        <div className="card">
          <div className="card-title"><h3>고정거래 자동 생성</h3></div>
          <div className="form-grid-3" style={{gridTemplateColumns:"1fr auto auto",alignItems:"end"}}>
            <Field label="생성 월"><input type="month" value={autoFillMonth} onChange={e=>setAutoFillMonth(e.target.value)}/></Field>
            <button className="btn btn-primary" onClick={generateFixedTransactions}>해당 월 생성</button>
            <span className="badge badge-muted">등록 {fixedRules.length}건</span>
          </div>
          <div style={{marginTop:14}}>
            {fixedRules.length?fixedRules.map(r=><div key={r.id} className="stat-row"><span>{String(r.day).padStart(2,"0")}일 · {r.name}</span><span className="row"><span className="stat-value">{fmt(r.amount)}원</span><button className="btn btn-sm btn-danger" onClick={()=>deleteFixedRule(r.id)}>삭제</button></span></div>):<div className="empty">월급, 보험료, 통신비처럼 반복되는 거래를 고정거래로 등록하세요.</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>거래 목록 <span style={{fontSize:12,fontWeight:400,color:"var(--text3)",marginLeft:6}}>전체 {data.transactions.length}건 중 {filtered.length}건</span></h3>
          {activeFilterCount>0&&(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:99,background:"var(--accent-bg)",color:"var(--accent)",fontSize:11,fontWeight:600}}>필터 {activeFilterCount}개 적용</span>
              <button onClick={resetFilters} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,border:"none",cursor:"pointer",background:"var(--surface3)",color:"var(--text2)",fontSize:11,fontWeight:600}}>✕ 초기화</button>
            </div>
          )}
        </div>

        {/* 검색 + 월 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"var(--text3)",pointerEvents:"none"}}>🔍</span>
            <input style={{...inpS,paddingLeft:34}} placeholder="내용·메모·카테고리 검색..." value={search} onChange={e=>setSearch(e.target.value)}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:14,lineHeight:1}}>✕</button>}
          </div>
          <input type="month" style={inpS} value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}/>
        </div>

        {/* 구분 + 대분류 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,marginBottom:14,alignItems:"center"}}>
          <select style={inpS} value={filterType} onChange={e=>{setFilterType(e.target.value);setFilterCat1("");}}>
            <option value="">전체 구분</option><option>수입</option><option>지출</option><option>자산이동</option>
          </select>
          <select style={inpS} value={filterCat1} onChange={e=>setFilterCat1(e.target.value)}>
            <option value="">전체 대분류</option>{filterCat1Opts.map(x=><option key={x}>{x}</option>)}
          </select>
          {activeFilterCount>0
            ?<button onClick={resetFilters} style={{padding:"9px 14px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>모두 초기화</button>
            :<span style={{fontSize:11,color:"var(--text3)",whiteSpace:"nowrap"}}>필터 없음</span>
          }
        </div>

        {/* 소계 바 */}
        {filtered.length>0&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--surface2)",borderRadius:10,marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {[["수입","var(--green)","+"+fmt(subtotal.income)],["지출","var(--red)","−"+fmt(subtotal.expense)],["순수입",subtotal.net>=0?"var(--green)":"var(--red)",(subtotal.net>=0?"+":"−")+fmt(Math.abs(subtotal.net))]].map(([label,color,val])=>(
                <span key={label} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:color,display:"inline-block"}}/>
                  <span style={{color:"var(--text3)"}}>{label}</span>
                  <span style={{color,fontVariantNumeric:"tabular-nums",fontWeight:700}}>{val}</span>
                </span>
              ))}
            </div>
            <span style={{fontSize:11,color:"var(--text3)"}}>{filtered.length}건 합계</span>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>날짜</th><th>구분</th><th>대분류</th><th>소분류</th><th className="td-right">금액</th><th>입금계좌</th><th>출금계좌</th><th>내용</th><th>작업</th></tr></thead>
            <tbody>
              {filtered.map(t=>(
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td><span className={`badge ${t.type==="수입"?"badge-green":t.type==="지출"?"badge-red":"badge-muted"}`}>{t.type}</span></td>
                  <td className="td-name">{t.cat1}</td><td>{t.cat2}</td>
                  <td className="td-right td-mono" style={{color:t.type==="수입"?"var(--green)":t.type==="지출"?"var(--red)":"inherit"}}>{fmt(t.amount)}</td>
                  <td>{t.inAccount}</td><td>{t.outAccount}</td>
                  <td style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    <Hl text={t.content}/>
                    {t.memo&&<div style={{fontSize:11,color:"var(--text3)",marginTop:2}}><Hl text={t.memo}/></div>}
                  </td>
                  <td>
                    <div className="row">
                      <button className="btn btn-sm btn-ghost" onClick={()=>edit(t)}>수정</button>
                      <button className="btn btn-sm btn-danger" onClick={()=>remove(t.id)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length&&<tr><td colSpan={9}><div className="empty">{data.transactions.length===0?"거래내역이 없습니다.":"검색 결과가 없습니다. 필터를 조정해보세요."}</div></td></tr>}
            </tbody>
          </table>
        </div>
        {filtered.length>0&&<div style={{marginTop:10,fontSize:11,color:"var(--text3)",textAlign:"right"}}>{filterMonth||"전체 기간"} · {filtered.length}건 표시</div>}
      </div>
    </div>
  );
}

// ─── Assets Tab ───────────────────────────────────────────────────────────────
function AssetsTab({ data, update }) {
  const empty={id:"",kind:"자산",category:"은행예금",name:"",current:"",previous:"",includeInEmergency:false,note:""};
  const [form,setForm]=useState(empty);
  const save=()=>{
    if(!form.name) return alert("이름을 입력하세요.");
    update(d=>{
      const row={...form,current:n(form.current),previous:n(form.previous),id:form.id||uid()};
      const assets=form.id?d.assets.map(a=>a.id===form.id?row:a):[...d.assets,row];
      return {...d,assets};
    });
    setForm(empty);
  };
  const net=data.assets.filter(a=>a.kind==="자산").reduce((s,a)=>s+n(a.current),0)-data.assets.filter(a=>a.kind==="부채").reduce((s,a)=>s+n(a.current),0);
  return (
    <div className="stack">
      <div className="card">
        <h3>자산·부채 입력</h3>
        <div className="form-grid">
          <Field label="구분"><select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option>자산</option><option>부채</option></select></Field>
          <Field label="카테고리"><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></Field>
          <Field label="이름"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          <Field label="현재 잔고"><input value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></Field>
          <Field label="전월 잔고"><input value={form.previous} onChange={e=>setForm({...form,previous:e.target.value})}/></Field>
          <Field label="비상금 포함">
            <select value={String(form.includeInEmergency)} onChange={e=>setForm({...form,includeInEmergency:e.target.value==="true"})}>
              <option value="false">아니오</option><option value="true">예</option>
            </select>
          </Field>
          <Field label="비고"><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></Field>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={save}>저장</button>
          <button className="btn btn-ghost" onClick={()=>setForm(empty)}>초기화</button>
          <span style={{fontSize:13,color:"var(--text3)"}}>순자산: <strong style={{color:"var(--text)"}}>{fmt(net)}원</strong></span>
        </div>
      </div>
      <div className="card">
        <h3>자산·부채 목록</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>구분</th><th>카테고리</th><th>이름</th><th className="td-right">현재</th><th className="td-right">전월</th><th className="td-right">증감</th><th>비상금</th><th>작업</th></tr></thead>
            <tbody>
              {data.assets.map(a=>(
                <tr key={a.id}>
                  <td><span className={`badge ${a.kind==="자산"?"badge-accent":"badge-red"}`}>{a.kind}</span></td>
                  <td>{a.category}</td><td className="td-name">{a.name}</td>
                  <td className="td-right td-mono">{fmt(a.current)}</td>
                  <td className="td-right td-mono">{fmt(a.previous)}</td>
                  <td className={`td-right td-mono ${n(a.current)-n(a.previous)>=0?"text-green":"text-red"}`}>{fmt(n(a.current)-n(a.previous))}</td>
                  <td>{a.includeInEmergency?<span className="badge badge-green">예</span>:"-"}</td>
                  <td><div className="row"><button className="btn btn-sm btn-ghost" onClick={()=>setForm({...a})}>수정</button><button className="btn btn-sm btn-danger" onClick={()=>update(d=>({...d,assets:d.assets.filter(x=>x.id!==a.id)}))}>삭제</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 차트 공용 헬퍼 ──────────────────────────────────────────────────────────
const CHART_COLORS=["#6c7dff","#34d58a","#f0b429","#ff5c72","#60c5e8","#a78bfa","#f97316","#14b8a6"];
function ChartTooltip({active,payload,label,unit="원"}){
  if(!active||!payload?.length) return null;
  return <div style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 14px",fontSize:12}}>
    <div style={{color:"var(--text3)",marginBottom:6}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,fontVariantNumeric:"tabular-nums",marginBottom:2}}>{p.name}: {typeof p.value==="number"?fmt(p.value):p.value}{unit}</div>)}
  </div>;
}
function ChartTooltipPct({active,payload,label}){
  if(!active||!payload?.length) return null;
  return <div style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 14px",fontSize:12}}>
    <div style={{color:"var(--text3)",marginBottom:6}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,fontVariantNumeric:"tabular-nums"}}>{p.name}: {Number(p.value).toFixed(1)}%</div>)}
  </div>;
}


// ─── 투자전략 설정 헬퍼 ──────────────────────────────────────────────────────
function getInvestmentTargets(settings){
  const list = Array.isArray(settings?.investmentTargets) ? settings.investmentTargets : [];
  const normalized = list
    .map((t,i)=>({ id:t.id||`target-${i}`, name:String(t.name||"").trim()||`전략${i+1}`, expectedReturn:n(t.expectedReturn), targetWeight:n(t.targetWeight), memo:t.memo||"" }))
    .filter(t=>t.name);
  if(normalized.length) return normalized;
  return [
    {id:"target-nasdaq",name:"나스닥",expectedReturn:n(settings?.annualReturnNasdaq||0.12),targetWeight:n(settings?.targetNasdaqWeight)+n(settings?.targetNasdaqHWeight),memo:"기존 설정 자동 변환"},
    {id:"target-dividend",name:"배당",expectedReturn:n(settings?.annualReturnDividend||0.08),targetWeight:n(settings?.targetDividendWeight),memo:"기존 설정 자동 변환"},
  ];
}
function getInvestmentTargetMap(settings){
  const map={};
  getInvestmentTargets(settings).forEach(t=>{ map[t.name]=n(t.targetWeight); });
  return map;
}
function getWeightedExpectedReturn(settings){
  const targets=getInvestmentTargets(settings);
  const totalW=targets.reduce((sum,t)=>sum+n(t.targetWeight),0);
  if(totalW<=0) return n(settings?.annualReturnNasdaq||0.1);
  return targets.reduce((sum,t)=>sum+n(t.expectedReturn)*n(t.targetWeight),0)/totalW;
}
function buildAutoTriggerPlan(rows, settings){
  const s=settings||{};
  const enabled=s.autoTriggerEnabled!==false;
  const total=rows.reduce((sum,r)=>sum+n(r.value),0);
  const investPool=n(s.triggerCashAvailable)>0?n(s.triggerCashAvailable):n(s.triggerMonthlyInvestAmount||s.monthlyInvestDefault||s.monthlyInvestStage1||0);
  const band=n(s.rebalanceBandPct||5);
  const targetMap=getInvestmentTargetMap(s);
  const byClass={};
  rows.forEach(r=>{ const cls=r.assetClass||"기타"; byClass[cls]=(byClass[cls]||0)+n(r.value); });
  Object.keys(byClass).forEach(cls=>{ if(targetMap[cls]===undefined) targetMap[cls]=0; });
  const sumTarget=Object.values(targetMap).reduce((a,b)=>a+n(b),0);
  if(sumTarget<1 && targetMap["기타"]===undefined) targetMap["기타"]=1-sumTarget;
  const rebalanceSignals=Object.entries(targetMap).map(([assetClass,targetWeight])=>{
    const currentAmount=byClass[assetClass]||0;
    const currentWeight=total>0?currentAmount/total:0;
    const gapPct=(targetWeight-currentWeight)*100;
    const gapAmount=targetWeight*total-currentAmount;
    const action=Math.abs(gapPct)<=band?"대기":gapAmount>0?"매수 우선":"비중 축소";
    return {assetClass,targetWeight,currentWeight,gapPct,gapAmount,action};
  }).sort((a,b)=>Math.abs(b.gapPct)-Math.abs(a.gapPct));
  const buyTargets=rebalanceSignals.filter(x=>x.gapAmount>0 && x.action!=="대기");
  const gapTotal=buyTargets.reduce((sum,x)=>sum+x.gapAmount,0);
  const rebalancePlan=enabled && s.autoRebalanceTriggerEnabled!==false ? buyTargets.map(x=>({
    type:"리밸런싱",
    assetClass:x.assetClass,
    action:"신규 투자금 우선 배분",
    amount:gapTotal>0?Math.round(investPool*x.gapAmount/gapTotal):0,
    reason:`목표비중 대비 ${fmtPct(Math.abs(x.gapPct))} 부족`,
  })).filter(x=>x.amount>0) : [];
  const dipCandidates=rows.filter(r=>n(r.avgPrice)>0&&n(r.currentPrice||r.avgPrice)>0).map(r=>{
    const cur=n(r.currentPrice||r.avgPrice), avg=n(r.avgPrice), dropPct=(cur-avg)/avg*100;
    let trigger=null, amount=0;
    if(dropPct<=-10){trigger="-10%";amount=n(s.dipBuy10PctAmount);}
    else if(dropPct<=-5){trigger="-5%";amount=n(s.dipBuy5PctAmount);}
    else if(dropPct<=-3){trigger="-3%";amount=n(s.dipBuy3PctAmount);}
    return {...r,cur,avg,dropPct,trigger,amount};
  }).filter(r=>r.trigger&&r.amount>0).sort((a,b)=>a.dropPct-b.dropPct);
  const dipPlan=enabled && s.autoBuyTriggerEnabled!==false ? dipCandidates.map(r=>({
    type:"하락매수",
    assetClass:r.assetClass||"기타",
    name:r.name,
    action:`${r.trigger} 구간 추가매수`,
    amount:r.amount,
    reason:`평단 대비 ${fmtPct(r.dropPct)} 하락`,
  })) : [];
  return {enabled,investPool,rebalanceSignals,rebalancePlan,dipPlan,all:[...dipPlan,...rebalancePlan]};
}

// ─── 리밸런싱 계산기 ──────────────────────────────────────────────────────────
function RebalanceCard({financialAnalysis,settings}){
  const{rows,total,byClass}=financialAnalysis;
  const band=n(settings.rebalanceBandPct),takeProfit=n(settings.takeProfitPct);
  const targetMap=getInvestmentTargetMap(settings);
  Object.keys(byClass).forEach(cls=>{ if(targetMap[cls]===undefined) targetMap[cls]=0; });
  const explicitSum=Object.values(targetMap).reduce((s,v)=>s+n(v),0);
  if(explicitSum<1 && targetMap["기타"]===undefined) targetMap["기타"]=parseFloat((1-explicitSum).toFixed(4));
  const classRows=Object.entries(byClass).map(([cls,val])=>{
    const cw=total>0?val/total:0,tw=targetMap[cls]??0,diff=cw-tw,diffPct=diff*100,needAmount=Math.abs(diff)*total;
    const status=Math.abs(diffPct)<=band?"정상":diff>0?"매도 필요":"매수 필요";
    return{cls,val,cw,tw,diff,diffPct,needAmount,status};
  });
  const takeProfitRows=rows.filter(r=>n(r.invested)>0&&(r.value-r.invested)/r.invested*100>=takeProfit).map(r=>({...r,rate:(r.value-r.invested)/r.invested*100,profit:r.value-r.invested}));
  const hasIssues=classRows.some(r=>r.status!=="정상")||takeProfitRows.length>0;
  const sc=s=>s==="정상"?"var(--green)":s==="매도 필요"?"var(--red)":"var(--accent)";
  const sb=s=>s==="정상"?"rgba(52,213,138,.1)":s==="매도 필요"?"rgba(255,92,114,.1)":"rgba(108,125,255,.1)";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{padding:"12px 16px",borderRadius:12,background:hasIssues?"rgba(240,180,41,.1)":"rgba(52,213,138,.1)",border:`1px solid ${hasIssues?"rgba(240,180,41,.3)":"rgba(52,213,138,.3)"}`,display:"flex",alignItems:"center",gap:10,fontSize:13}}>
        <span style={{fontSize:18}}>{hasIssues?"⚠️":"✅"}</span>
        <span style={{color:hasIssues?"var(--amber)":"var(--green)",fontWeight:600}}>{hasIssues?"리밸런싱이 필요한 자산군이 있습니다.":"현재 포트폴리오가 목표 비중 내에 있습니다."}</span>
        <span style={{marginLeft:"auto",fontSize:11,color:"var(--text3)"}}>허용 편차 ±{band}% · 익절 기준 +{takeProfit}%</span>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>자산군별 비중 vs 목표</div>
      {classRows.length===0?<div className="empty">포트폴리오 종목을 입력하면 자동으로 계산됩니다.</div>:classRows.map(r=>(
        <div key={r.cls} style={{padding:"13px 16px",marginBottom:8,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontWeight:700,fontSize:13}}>{r.cls}</span>
            <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:sb(r.status),color:sc(r.status)}}>{r.status}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text3)",marginBottom:4}}>
            <span>현재 {fmtPct(r.cw*100)} / 목표 {fmtPct(r.tw*100)}</span>
            <span style={{color:sc(r.status),fontWeight:600}}>{r.diffPct>0?"+":""}{fmtPct(r.diffPct)} 차이</span>
          </div>
          <div style={{position:"relative",height:8,borderRadius:99,background:"var(--surface3)",overflow:"hidden",marginBottom:3}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${clamp(r.cw*100,0,100)}%`,background:sc(r.status),borderRadius:99,transition:"width .4s ease"}}/>
            {r.tw>0&&<div style={{position:"absolute",top:0,bottom:0,left:`${clamp(r.tw*100,0,100)}%`,width:2,background:"rgba(255,255,255,.5)",transform:"translateX(-50%)"}}/>}
          </div>
          <div style={{fontSize:10,color:"var(--text3)"}}>│ = 목표 비중</div>
          {r.status!=="정상"&&<div style={{marginTop:8,padding:"9px 12px",borderRadius:9,background:sb(r.status),border:`1px solid ${sc(r.status)}44`,fontSize:12}}>
            <span style={{fontWeight:700,color:sc(r.status)}}>{r.status==="매도 필요"?"📉 ":"📈 "}{r.status}: 약 {fmt(r.needAmount)}원</span>
            <span style={{color:"var(--text3)",marginLeft:8}}>({r.status==="매도 필요"?"-":"+"}{fmtPct(Math.abs(r.diffPct))} 조정)</span>
          </div>}
        </div>
      ))}
      {rows.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>종목별 현재 비중</div>
          {[...rows].sort((a,b)=>b.value-a.value).map((r,i)=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:12,minWidth:130,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
              <div style={{flex:1,height:6,borderRadius:99,background:"var(--surface3)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${clamp(r.weight*100,0,100)}%`,background:CHART_COLORS[i%CHART_COLORS.length],borderRadius:99,transition:"width .4s ease"}}/>
              </div>
              <span style={{fontSize:11,color:"var(--text2)",minWidth:48,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{fmtPct(r.weight*100)}</span>
              <span style={{fontSize:11,color:"var(--text3)",minWidth:80,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{fmt(r.value)}원</span>
            </div>
          ))}
        </div>
      )}
      {takeProfitRows.length>0&&(
        <div style={{padding:"14px 16px",borderRadius:12,background:"rgba(240,180,41,.08)",border:"1px solid rgba(240,180,41,.3)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--amber)",marginBottom:10}}>🏆 익절 기준 도달 종목 (+{takeProfit}% 이상)</div>
          {takeProfitRows.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(240,180,41,.15)",fontSize:12}}>
              <span style={{fontWeight:600,color:"var(--text)"}}>{r.name}</span>
              <span style={{color:"var(--green)",fontVariantNumeric:"tabular-nums",fontWeight:700}}>+{fmtPct(r.rate)} · 수익 {fmt(r.profit)}원</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 매수 알림 카드 ───────────────────────────────────────────────────────────
function DipBuyAlertCard({rows,settings}){
  const dip3=n(settings.dipBuy3PctAmount),dip5=n(settings.dipBuy5PctAmount),dip10=n(settings.dipBuy10PctAmount);
  const dipRows=rows.filter(r=>n(r.avgPrice)>0&&n(r.currentPrice||r.avgPrice)>0).map(r=>{
    const cur=n(r.currentPrice||r.avgPrice),avg=n(r.avgPrice),dropPct=(cur-avg)/avg*100;
    return{...r,cur,avg,dropPct};
  }).filter(r=>r.dropPct<0).sort((a,b)=>a.dropPct-b.dropPct);
  const dip3rows=dipRows.filter(r=>r.dropPct<=-3&&r.dropPct>-5);
  const dip5rows=dipRows.filter(r=>r.dropPct<=-5&&r.dropPct>-10);
  const dip10rows=dipRows.filter(r=>r.dropPct<=-10);
  const total=dip3rows.length+dip5rows.length+dip10rows.length;
  const DipRow=({r,amount,color})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",marginBottom:6,background:"var(--surface2)",border:`1px solid ${color}33`,borderRadius:10,fontSize:12,gap:12}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,color:"var(--text)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
        <div style={{color:"var(--text3)"}}>평단 {fmt(r.avg)}원 → 현재 {fmt(r.cur)}원</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{color,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmtPct(r.dropPct)} 하락</div>
        {amount>0&&<div style={{marginTop:4,padding:"3px 9px",borderRadius:99,background:`${color}22`,color,fontSize:11,fontWeight:600}}>추가매수 {fmt(amount)}원</div>}
      </div>
    </div>
  );
  const SecHdr=({emoji,label,color,count})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,marginTop:4,fontSize:12,fontWeight:700,color}}>
      <span style={{fontSize:16}}>{emoji}</span>{label}
      <span style={{padding:"1px 8px",borderRadius:99,fontSize:10,background:`${color}22`,color,fontWeight:700}}>{count}종목</span>
    </div>
  );
  if(rows.length===0) return <div className="empty">포트폴리오에 종목과 현재가를 입력하면 매수 알림이 표시됩니다.</div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{padding:"11px 15px",borderRadius:11,fontSize:13,background:total>0?"rgba(108,125,255,.1)":"rgba(52,213,138,.1)",border:`1px solid ${total>0?"rgba(108,125,255,.3)":"rgba(52,213,138,.3)"}`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{total>0?"📉":"📈"}</span>
        <span style={{fontWeight:600,color:total>0?"var(--accent)":"var(--green)"}}>{total>0?`${total}개 종목이 추가매수 구간에 진입했습니다.`:"현재 추가매수 구간에 진입한 종목이 없습니다."}</span>
        <span style={{marginLeft:"auto",fontSize:11,color:"var(--text3)"}}>-3% / -5% / -10% 기준</span>
      </div>
      {(dip3===0&&dip5===0&&dip10===0)&&<div style={{padding:"10px 14px",borderRadius:10,fontSize:12,background:"rgba(240,180,41,.08)",border:"1px solid rgba(240,180,41,.25)",color:"var(--amber)"}}>💡 설정 탭 → 투자 스케줄에서 -3%, -5%, -10% 추가매수 금액을 설정하면 구체적인 금액이 표시됩니다.</div>}
      {dip10rows.length>0&&<div><SecHdr emoji="🔴" label="-10% 이하 — 강력 매수 구간" color="#ff5c72" count={dip10rows.length}/>{dip10rows.map(r=><DipRow key={r.id} r={r} amount={dip10} color="#ff5c72"/>)}</div>}
      {dip5rows.length>0&&<div><SecHdr emoji="🟡" label="-5% ~ -10% — 분할매수 구간" color="#f0b429" count={dip5rows.length}/>{dip5rows.map(r=><DipRow key={r.id} r={r} amount={dip5} color="#f0b429"/>)}</div>}
      {dip3rows.length>0&&<div><SecHdr emoji="🔵" label="-3% ~ -5% — 관심 구간" color="#6c7dff" count={dip3rows.length}/>{dip3rows.map(r=><DipRow key={r.id} r={r} amount={dip3} color="#6c7dff"/>)}</div>}
      {total===0&&rows.filter(r=>n(r.avgPrice)>0).length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:11,color:"var(--text3)",padding:"0 2px"}}>보유 종목 현황 (평단 대비)</div>
          {[...rows].filter(r=>n(r.avgPrice)>0).sort((a,b)=>{const da=(n(b.currentPrice||b.avgPrice)-n(b.avgPrice))/n(b.avgPrice)*100,db=(n(a.currentPrice||a.avgPrice)-n(a.avgPrice))/n(a.avgPrice)*100;return db-da;}).map(r=>{
            const cur=n(r.currentPrice||r.avgPrice),avg=n(r.avgPrice),dp=(cur-avg)/avg*100;
            return<div key={r.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,fontSize:12,gap:10}}>
              <span style={{fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
              <span style={{fontVariantNumeric:"tabular-nums",fontWeight:700,flexShrink:0,color:dp>=0?"var(--green)":"var(--red)"}}>{dp>=0?"+":""}{fmtPct(dp)}<span style={{fontWeight:400,color:"var(--text3)",marginLeft:6}}>({fmt(cur)}원)</span></span>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}


// ─── 자동 매수 / 리밸런싱 트리거 ─────────────────────────────────────────────
function AutoTriggerCard({rows,settings}){
  const plan=buildAutoTriggerPlan(rows,settings);
  const enabled=plan.enabled;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className={`alert ${enabled?"alert-info":"alert-warn"}`}>
        {enabled?`자동 트리거 감시 중 · 실행 예산 ${fmt(plan.investPool)}원 기준`:`자동 트리거가 꺼져 있습니다. 설정 탭에서 켤 수 있습니다.`}
      </div>
      {plan.all.length>0 ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>구분</th><th>대상</th><th>동작</th><th className="td-right">추천금액</th><th>근거</th></tr></thead>
            <tbody>
              {plan.all.map((x,i)=>(
                <tr key={`${x.type}-${x.name||x.assetClass}-${i}`}>
                  <td><span className={`badge ${x.type==="하락매수"?"badge-accent":"badge-amber"}`}>{x.type}</span></td>
                  <td className="td-name">{x.name||x.assetClass}</td>
                  <td>{x.action}</td>
                  <td className="td-right td-mono text-accent">{fmt(x.amount)}원</td>
                  <td>{x.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">현재 조건에서는 자동 매수 또는 리밸런싱 실행 후보가 없습니다.</div>
      )}
      {plan.rebalanceSignals.length>0&&(<div>
        <div style={{fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:".06em",textTransform:"uppercase",margin:"4px 0 8px"}}>트리거 감시 상태</div>
        {plan.rebalanceSignals.map(s=>(
          <div key={s.assetClass} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7,fontSize:12}}>
            <span style={{minWidth:85,fontWeight:700,color:"var(--text)"}}>{s.assetClass}</span>
            <div style={{flex:1,height:6,borderRadius:99,background:"var(--surface3)",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${clamp(s.currentWeight*100,0,100)}%`,background:s.action==="대기"?"var(--green)":s.action==="비중 축소"?"var(--red)":"var(--accent)",borderRadius:99}}/>
            </div>
            <span style={{minWidth:120,textAlign:"right",color:"var(--text3)"}}>현재 {fmtPct(s.currentWeight*100)} / 목표 {fmtPct(s.targetWeight*100)}</span>
            <span className={`badge ${s.action==="대기"?"badge-green":s.action==="비중 축소"?"badge-red":"badge-accent"}`}>{s.action}</span>
          </div>
        ))}
      </div>)}
      <div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5}}>※ 실제 증권사 주문은 실행하지 않습니다. 이 앱은 조건 충족 시 “매수/배분 후보”를 계산해 보여주는 안전한 수동 실행 방식입니다.</div>
    </div>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────
function normalizeStockQuery(v){ return String(v||"").toLowerCase().replace(/\s+/g,"").replace(/[()\-_.]/g,""); }
function buildServerSymbolFromRow(row){ if(row.symbol) return row.symbol; if((row.market==="KRX"||row.market==="KRX ETF")&&/^\d{6}$/.test(String(row.code||row.ticker||""))) return `${String(row.code||row.ticker).padStart(6,"0")}.KS`; return String(row.ticker||row.code||"").trim().toUpperCase(); }
function normalizeCurrency(v){ return String(v||"KRW").trim().toUpperCase(); }
function getFxUsdKrw(settings){ return n(settings?.fxUsdKrw||0)>0?n(settings.fxUsdKrw):1; }
function priceToKRW(row, settings){ const price=n(row.currentPrice||row.avgPrice); return normalizeCurrency(row.currency)==="USD" ? price*getFxUsdKrw(settings) : price; }
function investedToKRW(row, settings){ const price=n(row.avgPrice); return normalizeCurrency(row.currency)==="USD" ? price*getFxUsdKrw(settings) : price; }
async function fetchFxUsdKrw(){
  const endpoints=["/api/fx?base=USD&quote=KRW","/api/exchange-rate?base=USD&quote=KRW"];
  for(const url of endpoints){
    try{ const r=await fetch(url); if(!r.ok) continue; const j=await r.json(); const rate=n(j.rate||j.usdKrw||j.USDKRW||j.item?.rate); if(rate>0) return {rate,asOf:j.asOf||j.date||j.item?.asOf||new Date().toISOString(),source:url}; }catch{}
  }
  throw new Error("환율 API 응답 없음");
}

function PortfolioTab({ data, update, accountOptions, financialAnalysis }) {
  const ef=()=>({ id:"",account:accountOptions[0]?.name||"",name:"",code:"",ticker:"",symbol:"",market:"",currency:"KRW",quoteAsOf:"",qty:"",avgPrice:"",currentPrice:"",targetAmount:"",riskSigma:"0.22",assetClass:"나스닥",memo:"" });
  const [form,setForm]=useState(ef());
  const [kw,setKw]=useState(""),  [sugs,setSugs]=useState([]),  [isOpen,setIsOpen]=useState(false);
  const [fetching,setFetching]=useState(false),  [bulkUp,setBulkUp]=useState(false),  [qErr,setQErr]=useState("");
  const [serverOk,setServerOk]=useState("checking");
  const [marketMsg,setMarketMsg]=useState("");
  const [fxBusy,setFxBusy]=useState(false);

  useEffect(()=>{ if(!form.account&&accountOptions[0]) setForm(f=>({...f,account:accountOptions[0].name})); },[accountOptions]);
  useEffect(()=>{
    fetch("/api/health").then(r=>{if(r.ok)setServerOk("ok");else setServerOk("down");}).catch(()=>setServerOk("down"));
  },[]);
  useEffect(()=>{
    if(!kw.trim()){setSugs([]);return;}
    const local=STOCK_MASTER.filter(item=>[item.name,item.code,item.ticker,item.market].map(normalizeStockQuery).some(x=>x.includes(normalizeStockQuery(kw)))).slice(0,8);
    setSugs(local);
    let active=true;
    const t=setTimeout(async()=>{
      try{
        const r=await fetch(`/api/search?q=${encodeURIComponent(kw)}`);
        if(!r.ok)throw new Error();
        const j=await r.json();
        if(!active)return;
        const merged=new Map();
        [...local,...(Array.isArray(j.items)?j.items:[]).map(r=>({name:r.name,code:r.code,ticker:r.code||r.symbol,symbol:r.symbol,market:r.market||"",currency:r.currency||"",assetClass:"기타"}))].forEach(item=>{const k=item.symbol||item.code||item.name;if(k)merged.set(k,item);});
        setSugs(Array.from(merged.values()).slice(0,10));
        setServerOk("ok");
      }catch{if(active)setServerOk("down");}
    },250);
    return()=>{active=false;clearTimeout(t);};
  },[kw]);

  const applySug=async(item)=>{
    setIsOpen(false);
    const next={...form,name:item.name,code:item.code||item.ticker||"",ticker:item.ticker||item.code||"",symbol:item.symbol||"",market:item.market||"",currency:item.currency||"KRW",assetClass:item.assetClass||form.assetClass||"기타"};
    setForm(next);setKw(item.name||"");
    try{
      setFetching(true);
      const r=await fetch(`/api/quote?symbol=${encodeURIComponent(buildServerSymbolFromRow(next))}&name=${encodeURIComponent(item.name)}`);
      const j=await r.json();
      if(!r.ok||!j.ok||!j.item)throw new Error();
      setForm(f=>({...f,currentPrice:j.item.currentPrice?String(j.item.currentPrice):f.currentPrice,quoteAsOf:j.item.asOf||f.quoteAsOf,symbol:j.item.symbol||f.symbol,market:j.item.market||f.market,currency:j.item.currency||f.currency}));
    }catch{setQErr("현재가 자동 조회 실패. 직접 입력하세요.");}
    finally{setFetching(false);}
  };

  const save=()=>{
    if(!form.account||!form.name) return alert("계좌와 종목명 필수");
    update(d=>{
      const row={...form,qty:n(form.qty),avgPrice:n(form.avgPrice),currentPrice:n(form.currentPrice||form.avgPrice),targetAmount:n(form.targetAmount),riskSigma:n(form.riskSigma),symbol:form.symbol||buildServerSymbolFromRow(form),id:form.id||uid()};
      const portfolio=form.id?d.portfolio.map(p=>p.id===form.id?row:p):[...d.portfolio,row];
      return {...d,portfolio};
    });
    setQErr("");setKw("");setForm(ef());
  };

  const bulkUpdate=async()=>{
    setBulkUp(true);
    try{
      const items=data.portfolio.map(p=>({id:p.id,symbol:buildServerSymbolFromRow(p),name:p.name,code:p.code,ticker:p.ticker}));
      const r=await fetch("/api/bulk-quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items})});
      const j=await r.json();
      if(!r.ok||!j.ok)throw new Error();
      update(d=>({...d,settings:{...d.settings,marketDataLastUpdated:new Date().toISOString()},portfolio:d.portfolio.map(p=>{ const hit=(j.results||[]).find(x=>x.id===p.id); if(!hit||!hit.ok) return p; return {...p,currentPrice:n(hit.currentPrice||p.currentPrice),quoteAsOf:hit.asOf||p.quoteAsOf,symbol:hit.symbol||p.symbol,currency:hit.currency||p.currency}; })}));
      setMarketMsg("현재가 갱신 완료");
    }catch{setQErr("전체 업데이트 실패");}
    finally{setBulkUp(false);}
  };

  const updateFx=async()=>{
    setFxBusy(true); setMarketMsg("");
    try{
      const fx=await fetchFxUsdKrw();
      update(d=>({...d,settings:{...d.settings,fxUsdKrw:fx.rate,fxAsOf:fx.asOf,marketDataLastUpdated:new Date().toISOString()}}));
      setMarketMsg(`환율 갱신 완료: 1 USD = ${fmt(fx.rate)} KRW`);
    }catch{
      setQErr("환율 자동 조회 실패. 설정에서 USD/KRW 환율을 직접 입력하세요.");
    }finally{setFxBusy(false);}
  };

  const updateAllMarketData=async()=>{
    await updateFx();
    await bulkUpdate();
  };

  // 자연어 요약
  const portNLP = useMemo(() => buildPortfolioNLP(financialAnalysis, data), [financialAnalysis, data]);

  return (
    <div className="stack">
      {/* ── 자연어 요약 카드 ── */}
      <NaturalInsightCard icon={portNLP.icon} title={portNLP.title} message={portNLP.message} tone={portNLP.tone} actions={portNLP.actions}/>
      <div className="card">
        <div className="card-title">
          <h3>🌐 시장 데이터 자동 업데이트</h3>
          <div className="row">
            <span className="badge badge-muted">USD/KRW {n(data.settings.fxUsdKrw)>0?fmt(data.settings.fxUsdKrw):"미설정"}</span>
            <span className={`badge ${serverOk==="ok"?"badge-green":"badge-red"}`}>{serverOk==="ok"?"시세서버 연결":"시세서버 확인 필요"}</span>
          </div>
        </div>
        <div className="g3">
          <div className="card-sm">
            <div className="kpi-label">환율 기준</div>
            <div className="kpi-value" style={{fontSize:22}}>{n(data.settings.fxUsdKrw)>0?fmt(data.settings.fxUsdKrw):"-"}<span className="kpi-unit">KRW</span></div>
            <div className="kpi-sub muted">{data.settings.fxAsOf?String(data.settings.fxAsOf).replace("T"," ").slice(0,19):"환율 미갱신"}</div>
          </div>
          <div className="card-sm">
            <div className="kpi-label">마지막 갱신</div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginTop:8}}>{data.settings.marketDataLastUpdated?String(data.settings.marketDataLastUpdated).replace("T"," ").slice(0,19):"기록 없음"}</div>
            <div className="kpi-sub muted">현재가·환율 갱신 기록</div>
          </div>
          <div className="card-sm">
            <div className="row" style={{flexWrap:"wrap"}}>
              <button className="btn btn-primary btn-sm" onClick={updateAllMarketData} disabled={bulkUp||fxBusy}>{bulkUp||fxBusy?"갱신 중":"현재가+환율 갱신"}</button>
              <button className="btn btn-ghost btn-sm" onClick={updateFx} disabled={fxBusy}>{fxBusy?"환율 조회중":"환율만 갱신"}</button>
              <button className="btn btn-ghost btn-sm" onClick={bulkUpdate} disabled={bulkUp||!data.portfolio.length}>{bulkUp?"현재가 조회중":"현재가만 갱신"}</button>
            </div>
            <div className="kpi-sub muted">USD 종목은 환율을 곱해 원화 평가금액에 반영됩니다.</div>
          </div>
        </div>
        {marketMsg&&<div className="alert alert-ok" style={{marginTop:12}}>{marketMsg}</div>}
      </div>

      {/* ── 리밸런싱 계산기 + 매수 알림 ── */}
      <div className="g2">
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 style={{margin:0}}>⚖️ 리밸런싱 계산기</h3>
            <span style={{fontSize:11,color:"var(--text3)",background:"var(--surface2)",padding:"3px 9px",borderRadius:99,border:"1px solid var(--border)"}}>목표 비중은 설정 탭에서 변경</span>
          </div>
          <RebalanceCard financialAnalysis={financialAnalysis} settings={data.settings}/>
        </div>
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 style={{margin:0}}>📉 추가매수 알림</h3>
            <span style={{fontSize:11,color:"var(--text3)",background:"var(--surface2)",padding:"3px 9px",borderRadius:99,border:"1px solid var(--border)"}}>평단 대비 현재가 기준</span>
          </div>
          <DipBuyAlertCard rows={financialAnalysis.rows} settings={data.settings}/>
        </div>
      </div>

      {/* ── 종목 입력 ── */}
      <div className="card">
        <div className="card-title">
          <h3>종목 입력</h3>
          <span className={`badge ${serverOk==="ok"?"badge-green":serverOk==="checking"?"badge-accent":"badge-red"}`}>
            {serverOk==="ok"?"시세서버 연결":serverOk==="checking"?"확인중":"시세서버 오프라인"}
          </span>
        </div>
        <div className="form-grid">
          <Field label="계좌">
            <select value={form.account} onChange={e=>setForm({...form,account:e.target.value})}>
              <option value="">선택</option>{accountOptions.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="종목 검색">
            <div style={{position:"relative"}}>
              <input value={kw} onFocus={()=>setIsOpen(true)} onChange={e=>{setKw(e.target.value);setForm(f=>({...f,name:e.target.value}));setIsOpen(true);}} placeholder="종목명, 코드, 티커"/>
              {isOpen&&sugs.length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:50,background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,boxShadow:"var(--shadow-lg)",maxHeight:240,overflowY:"auto"}}>
                  {sugs.map(item=>(
                    <button key={`${item.symbol||item.code}-${item.name}`} type="button" onClick={()=>applySug(item)}
                      style={{width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"10px 12px",borderBottom:"1px solid var(--border)",cursor:"pointer",color:"var(--text)"}}>
                      <div style={{fontWeight:600,fontSize:13}}>{item.name}</div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{item.code} · {item.market}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="종목코드"><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></Field>
          <Field label="티커"><input value={form.ticker} onChange={e=>setForm({...form,ticker:e.target.value})}/></Field>
          <Field label="시장"><input value={form.market} onChange={e=>setForm({...form,market:e.target.value})}/></Field>
          <Field label="통화"><input value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}/></Field>
          <Field label="수량"><input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></Field>
          <Field label="매입평균가"><input value={form.avgPrice} onChange={e=>setForm({...form,avgPrice:e.target.value})}/></Field>
          <Field label="현재가">
            <div className="row">
              <input value={form.currentPrice} onChange={e=>setForm({...form,currentPrice:e.target.value})} placeholder="자동 또는 직접 입력" style={{flex:1}}/>
              <button className="btn btn-sm btn-ghost" onClick={()=>applySug({...form})} disabled={fetching}>{fetching?"조회중":"현재가 조회"}</button>
            </div>
          </Field>
          <Field label="목표금액"><input value={form.targetAmount} onChange={e=>setForm({...form,targetAmount:e.target.value})}/></Field>
          <Field label="변동성 σ"><input value={form.riskSigma} onChange={e=>setForm({...form,riskSigma:e.target.value})}/></Field>
          <Field label="자산분류">
            <select value={form.assetClass} onChange={e=>setForm({...form,assetClass:e.target.value})}>
              <option>나스닥</option><option>배당</option><option>현금</option><option>개별주식</option><option>기타</option>
            </select>
          </Field>
        </div>
        <div className="g2" style={{marginTop:10}}>
          <Field label="시세 기준시각"><input value={form.quoteAsOf?String(form.quoteAsOf).replace("T"," ").slice(0,19):""} readOnly placeholder="자동 기입"/></Field>
          <Field label="시세 심볼"><input value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})}/></Field>
        </div>
        <div style={{marginTop:10}}><Field label="메모"><input value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})}/></Field></div>
        {qErr&&<div className="alert alert-danger" style={{marginTop:10}}>{qErr}</div>}
        <div className="form-actions">
          <button className="btn btn-primary" onClick={save}>저장</button>
          <button className="btn btn-ghost" onClick={()=>{setForm(ef());setKw("");setIsOpen(false);setQErr("");}}>초기화</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>보유 종목 ({data.portfolio.length}종목 · 총 {fmt(financialAnalysis.total)}원)</h3>
          <button className="btn btn-ghost btn-sm" onClick={bulkUpdate} disabled={bulkUp||!data.portfolio.length}>{bulkUp?"업데이트 중...":"전체 현재가 갱신"}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>계좌</th><th>종목명</th><th>코드</th><th>통화</th><th className="td-right">수량</th><th className="td-right">평단</th><th className="td-right">현재가</th><th className="td-right">매입원금(KRW)</th><th className="td-right">평가금액(KRW)</th><th className="td-right">손익</th><th className="td-right">수익률</th><th>작업</th></tr></thead>
            <tbody>
              {data.portfolio.map(p=>{
                const unitAvgKRW=investedToKRW(p,data.settings), unitCurKRW=priceToKRW(p,data.settings), invested=n(p.qty)*unitAvgKRW, value=n(p.qty)*unitCurKRW, profit=value-invested, rate=invested>0?profit/invested*100:0;
                return (
                  <tr key={p.id}>
                    <td>{p.account}</td><td className="td-name">{p.name}</td><td style={{color:"var(--text3)"}}>{p.code}</td><td><span className="badge badge-muted">{normalizeCurrency(p.currency)}</span></td>
                    <td className="td-right td-mono">{p.qty}</td>
                    <td className="td-right td-mono">{fmt(p.avgPrice)}</td>
                    <td className="td-right td-mono">{fmt(p.currentPrice||p.avgPrice)}</td>
                    <td className="td-right td-mono">{fmt(invested)}</td>
                    <td className="td-right td-mono">{fmt(value)}</td>
                    <td className={`td-right td-mono ${profit>=0?"text-green":"text-red"}`}>{fmt(profit)}</td>
                    <td className={`td-right td-mono ${rate>=0?"text-green":"text-red"}`}>{fmtPct(rate)}</td>
                    <td><div className="row"><button className="btn btn-sm btn-ghost" onClick={()=>{setForm({...ef(),...p,qty:p.qty??"",avgPrice:p.avgPrice??"",currentPrice:p.currentPrice??"",targetAmount:p.targetAmount??"",riskSigma:p.riskSigma??"0.22"});setKw(p.name||"");}}>수정</button><button className="btn btn-sm btn-danger" onClick={()=>update(d=>({...d,portfolio:d.portfolio.filter(x=>x.id!==p.id)}))}>삭제</button></div></td>
                  </tr>
                );
              })}
              {!data.portfolio.length&&<tr><td colSpan={12}><div className="empty">포트폴리오가 비어있습니다.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────
function BudgetTab({ data, update, budgetAnalysis }) {
  const empty={id:"",cat1:"식비",budget:"",targetWeight:""};
  const [form,setForm]=useState(empty);
  const saveBudget=()=>{
    if(!form.cat1||n(form.budget)<=0) return alert("카테고리와 예산을 입력하세요.");
    update(d=>{
      const row={...form,budget:n(form.budget),targetWeight:n(form.targetWeight),id:form.id||uid()};
      const budgets=form.id?d.budgets.map(b=>b.id===form.id?row:b):[...d.budgets,row];
      return {...d,budgets};
    });
    setForm(empty);
  };

  // 자연어 요약
  const budgetNLP = useMemo(() => buildBudgetNLP(budgetAnalysis), [budgetAnalysis]);

  return (
    <div className="stack">
      {/* ── 자연어 요약 카드 ── */}
      <NaturalInsightCard icon={budgetNLP.icon} title={budgetNLP.title} message={budgetNLP.message} tone={budgetNLP.tone} actions={budgetNLP.actions}/>
      <div className="card">
        <h3>예산 설정</h3>
        <div className="form-grid-3">
          <Field label="카테고리"><input value={form.cat1} onChange={e=>setForm({...form,cat1:e.target.value})}/></Field>
          <Field label="예산 (원)"><input value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/></Field>
          <Field label="목표 비중 (0~1)"><input value={form.targetWeight} onChange={e=>setForm({...form,targetWeight:e.target.value})} placeholder="예: 0.15"/></Field>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={saveBudget}>저장</button>
          <button className="btn btn-ghost" onClick={()=>setForm(empty)}>초기화</button>
        </div>
      </div>

      <div className="g2">
        {budgetAnalysis.map(b=>(
          <div key={b.cat1} className="card-sm">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{b.cat1}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>목표비중 {fmtPct((b.targetWeight||0)*100)}</div>
              </div>
              <span className={`badge ${b.status==="초과"?"badge-red":b.status==="주의"?"badge-amber":"badge-green"}`}>{b.status}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text3)",marginBottom:6}}>
              <span>지출 {fmt(b.spent)}원</span><span>예산 {fmt(b.budget)}원</span>
            </div>
            <div className="progress">
              <div className={`progress-fill ${b.status==="초과"?"pf-red":b.status==="주의"?"pf-amber":"pf-accent"}`} style={{width:`${clamp(b.rate,0,100)}%`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              <span style={{fontSize:11,color:"var(--text3)"}}>권장 {fmt(b.recommendedBudget)}원</span>
              <button className="btn btn-sm btn-ghost" onClick={()=>setForm({...b})}>수정</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>예산 목록</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>카테고리</th><th className="td-right">예산</th><th className="td-right">지출</th><th className="td-right">잔여</th><th className="td-right">소진율</th><th>상태</th><th>작업</th></tr></thead>
            <tbody>
              {budgetAnalysis.map(b=>(
                <tr key={b.cat1}>
                  <td className="td-name">{b.cat1}</td>
                  <td className="td-right td-mono">{fmt(b.budget)}</td>
                  <td className="td-right td-mono">{fmt(b.spent)}</td>
                  <td className={`td-right td-mono ${b.budget-b.spent>=0?"text-green":"text-red"}`}>{fmt(b.budget-b.spent)}</td>
                  <td className="td-right td-mono">{fmtPct(b.rate)}</td>
                  <td><span className={`badge ${b.status==="초과"?"badge-red":b.status==="주의"?"badge-amber":"badge-green"}`}>{b.status}</span></td>
                  <td><div className="row"><button className="btn btn-sm btn-ghost" onClick={()=>setForm({...b})}>수정</button><button className="btn btn-sm btn-danger" onClick={()=>update(d=>({...d,budgets:d.budgets.filter(x=>x.id!==b.id)}))}>삭제</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────
function AnalysisTab({ data, monthlySeries, budgetAnalysis, financialAnalysis, dashboardDetail }) {

  // 월별 수입·지출·순수입 복합 차트
  const monthlyData=monthlySeries.slice(-12).map(r=>({month:r.month.slice(5),수입:r.income,지출:r.expense,순수입:r.net}));

  // 월별 저축률
  const savingsData=monthlySeries.slice(-12).map(r=>({month:r.month.slice(5),저축률:r.income>0?Math.round(r.net/r.income*1000)/10:0,순수입:r.net}));

  // 이번달 카테고리별 지출 파이
  const thisMonth=thisMonthISO();
  const catMap={};
  data.transactions.filter(t=>t.date?.slice(0,7)===thisMonth&&t.type==="지출").forEach(t=>{catMap[t.cat1||"기타"]=(catMap[t.cat1||"기타"]||0)+n(t.amount);});
  const pieData=Object.entries(catMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const pieTotal=pieData.reduce((s,d)=>s+d.value,0);
  const RADIAN=Math.PI/180;
  const renderLabel=({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{
    if(percent<0.05) return null;
    const r=innerRadius+(outerRadius-innerRadius)*0.55;
    return <text x={cx+r*Math.cos(-midAngle*RADIAN)} y={cy+r*Math.sin(-midAngle*RADIAN)} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>{`${(percent*100).toFixed(0)}%`}</text>;
  };

  // 종목별 수익률 수평 바
  const returnData=[...financialAnalysis.rows].filter(r=>n(r.invested)>0).map(r=>({name:r.name.length>8?r.name.slice(0,8)+"…":r.name,수익률:Math.round((r.value-r.invested)/r.invested*1000)/10})).sort((a,b)=>b.수익률-a.수익률);

  // 자연어 요약
  const analysisNLP = useMemo(() => buildAnalysisNLP(monthlySeries, dashboardDetail), [monthlySeries, dashboardDetail]);
  const analysisCoach = useMemo(() => buildIntegratedCoach({ area:"재무분석", data, dashboard:dashboardDetail?.dashboard||{}, dashboardDetail, financialAnalysis, budgetAnalysis, monthlySeries }), [data, dashboardDetail, financialAnalysis, budgetAnalysis, monthlySeries]);

  return (
    <div className="stack">
      {/* ── 자연어 요약 카드 ── */}
      <NaturalInsightCard icon={analysisNLP.icon} title={analysisNLP.title} message={analysisNLP.message} tone={analysisNLP.tone} actions={analysisNLP.actions}/>
      <AICoachPanel coach={analysisCoach}/>
      {/* 1행: 월별 수입·지출 + 저축률 */}
      <div className="g2">
        <div className="card">
          <h3>월별 수입 · 지출 추이</h3>
          {monthlyData.length>0
            ?<ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthlyData} margin={{top:8,right:8,bottom:0,left:-16}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)"/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:"#5a6278"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#5a6278"}} tickFormatter={v=>`${Math.round(v/10000)}만`} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{fontSize:11,color:"#9ba3b5",paddingTop:8}}/>
                <Bar dataKey="수입" fill="rgba(108,125,255,.75)" radius={[3,3,0,0]}/>
                <Bar dataKey="지출" fill="rgba(255,92,114,.75)" radius={[3,3,0,0]}/>
                <Line type="monotone" dataKey="순수입" stroke="#34d58a" strokeWidth={2.5} dot={{r:3,fill:"#34d58a",strokeWidth:0}} activeDot={{r:5}}/>
              </ComposedChart>
            </ResponsiveContainer>
            :<div className="empty">거래내역을 입력하면 표시됩니다.</div>
          }
        </div>
        <div className="card">
          <h3>월별 저축률 추이</h3>
          <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>저축률 = 순수입 / 수입 × 100. 막대는 순수입 절대값.</div>
          {savingsData.length>0
            ?<ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={savingsData} margin={{top:8,right:8,bottom:0,left:-16}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)"/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:"#5a6278"}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left" tick={{fontSize:10,fill:"#5a6278"}} tickFormatter={v=>`${v}%`} domain={["auto","auto"]} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#5a6278"}} tickFormatter={v=>`${Math.round(v/10000)}만`} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltipPct/>}/>
                <Legend wrapperStyle={{fontSize:11,color:"#9ba3b5",paddingTop:8}}/>
                <Area yAxisId="left" type="monotone" dataKey="저축률" stroke="#6c7dff" fill="rgba(108,125,255,.15)" strokeWidth={2.5} dot={{r:3,fill:"#6c7dff",strokeWidth:0}} activeDot={{r:5}}/>
                <Bar yAxisId="right" dataKey="순수입" fill="rgba(52,213,138,.25)" stroke="#34d58a" strokeWidth={1} radius={[3,3,0,0]} name="순수입(원)"/>
              </ComposedChart>
            </ResponsiveContainer>
            :<div className="empty">거래내역을 입력하면 표시됩니다.</div>
          }
        </div>
      </div>

      {/* 2행: 카테고리 파이 + 종목 수익률 */}
      <div className="g2">
        <div className="card">
          <h3>이번달 카테고리별 지출</h3>
          {pieData.length>0
            ?<div style={{display:"flex",alignItems:"center",gap:16}}>
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx={95} cy={95} innerRadius={52} outerRadius={90} paddingAngle={2} dataKey="value" labelLine={false} label={renderLabel}>
                  {pieData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<ChartTooltip/>}/>
              </PieChart>
              <div style={{flex:1,maxHeight:200,overflowY:"auto"}}>
                {pieData.map((d,i)=>{
                  const pct=pieTotal>0?d.value/pieTotal*100:0;
                  const budget=budgetAnalysis.find(b=>b.cat1===d.name);
                  return(
                    <div key={d.name} style={{marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0,display:"inline-block"}}/>
                          {d.name}
                        </span>
                        <span style={{fontSize:11,color:"var(--text3)",fontVariantNumeric:"tabular-nums"}}>{fmt(d.value)}원 ({pct.toFixed(1)}%)</span>
                      </div>
                      {budget&&<div style={{height:3,background:"rgba(255,255,255,.08)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${clamp(budget.rate,0,100)}%`,background:budget.status==="초과"?"#ff5c72":budget.status==="주의"?"#f0b429":CHART_COLORS[i%CHART_COLORS.length],borderRadius:99}}/>
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>
            :<div className="empty">이번 달 지출 데이터가 없습니다.</div>
          }
        </div>
        <div className="card">
          <h3>종목별 수익률</h3>
          {returnData.length>0
            ?<ResponsiveContainer width="100%" height={Math.max(returnData.length*36+40,120)}>
              <BarChart data={returnData} layout="vertical" margin={{top:4,right:40,bottom:0,left:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:"#5a6278"}} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:"#9ba3b5"}} width={90} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltipPct/>}/>
                <Bar dataKey="수익률" radius={[0,4,4,0]}>
                  {returnData.map((d,i)=><Cell key={i} fill={d.수익률>=0?"#34d58a":"#ff5c72"} opacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            :<div className="empty">보유 종목이 없습니다.</div>
          }
        </div>
      </div>

      {/* 3행: 월별 수지 표 + 리스크 분석 표 */}
      <div className="g2">
        <div className="card">
          <h3>월별 수지 요약 (최근 12개월)</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>월</th><th className="td-right">수입</th><th className="td-right">지출</th><th className="td-right">순수입</th><th className="td-right">저축률</th></tr></thead>
              <tbody>
                {monthlySeries.slice(-12).reverse().map(r=>{
                  const rate=r.income>0?r.net/r.income*100:0;
                  return(
                    <tr key={r.month}>
                      <td className="td-name">{r.month}</td>
                      <td className="td-right td-mono text-green">{fmt(r.income)}</td>
                      <td className="td-right td-mono text-red">{fmt(r.expense)}</td>
                      <td className={`td-right td-mono ${r.net>=0?"text-green":"text-red"}`}>{fmt(r.net)}</td>
                      <td className="td-right td-mono" style={{color:rate>=20?"var(--green)":rate>=0?"var(--amber)":"var(--red)"}}>{fmtPct(rate)}</td>
                    </tr>
                  );
                })}
                {!monthlySeries.length&&<tr><td colSpan={5}><div className="empty">데이터 없음</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>포트폴리오 리스크 분석</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>종목</th><th className="td-right">평가금액</th><th className="td-right">비중</th><th className="td-right">-1σ 손실</th><th className="td-right">-2σ 손실</th><th>상태</th></tr></thead>
              <tbody>
                {financialAnalysis.rows.map(r=>(
                  <tr key={r.id}>
                    <td className="td-name">{r.name}</td>
                    <td className="td-right td-mono">{fmt(r.value)}</td>
                    <td className="td-right td-mono">{fmtPct(r.weight*100)}</td>
                    <td className="td-right td-mono text-red">{fmt(r.loss1)}</td>
                    <td className="td-right td-mono text-red">{fmt(r.loss2??r.loss1*2)}</td>
                    <td><span className={`badge ${r.state==="쏠림 경고"?"badge-red":r.state==="주의"?"badge-amber":"badge-green"}`}>{r.state}</span></td>
                  </tr>
                ))}
                {!financialAnalysis.rows.length&&<tr><td colSpan={6}><div className="empty">포트폴리오 없음</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4행: 자산군 비중 바 + 요약 */}
      <div className="g2">
        <div className="card">
          <h3>투자 자산군 비중</h3>
          {Object.entries(financialAnalysis.byClass).length>0
            ?<ResponsiveContainer width="100%" height={Math.max(Object.keys(financialAnalysis.byClass).length*40+40,120)}>
              <BarChart data={Object.entries(financialAnalysis.byClass).map(([k,v])=>({name:k,평가금액:v}))} layout="vertical" margin={{top:4,right:16,bottom:0,left:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:"#5a6278"}} tickFormatter={v=>`${Math.round(v/10000)}만`} axisLine={false} tickLine={false}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:"#9ba3b5"}} width={72} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="평가금액" radius={[0,4,4,0]}>
                  {Object.keys(financialAnalysis.byClass).map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} opacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            :<div className="empty">포트폴리오를 입력하세요.</div>
          }
        </div>
        <div className="card">
          <h3>재무 요약</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              ["총 평가금액","var(--text)",fmt(financialAnalysis.total)+"원"],
              ["총 매입원금","var(--text)",fmt(financialAnalysis.rows.reduce((s,r)=>s+r.invested,0))+"원"],
            ].map(([l,c,v])=><div key={l} className="stat-row"><span className="stat-label">{l}</span><span className="stat-value" style={{color:c}}>{v}</span></div>)}
            <div className="stat-row"><span className="stat-label">총 평가손익</span><span className="stat-value" style={{color:financialAnalysis.total-financialAnalysis.rows.reduce((s,r)=>s+r.invested,0)>=0?"var(--green)":"var(--red)"}}>{fmt(financialAnalysis.total-financialAnalysis.rows.reduce((s,r)=>s+r.invested,0))}원</span></div>
            <div className="stat-row"><span className="stat-label">종목 수</span><span className="stat-value">{data.portfolio.length}개</span></div>
            <div className="stat-row"><span className="stat-label">주의·경고 종목</span><span className="stat-value" style={{color:financialAnalysis.rows.filter(r=>r.state!=="정상").length>0?"var(--amber)":"var(--green)"}}>{financialAnalysis.rows.filter(r=>r.state!=="정상").length}개</span></div>
            <div style={{height:1,background:"rgba(255,255,255,.06)",margin:"4px 0"}}/>
            <div className="stat-row"><span className="stat-label">6개월 평균 수입</span><span className="stat-value text-green">{fmt(dashboardDetail.avgIncome)}원</span></div>
            <div className="stat-row"><span className="stat-label">6개월 평균 지출</span><span className="stat-value text-red">{fmt(dashboardDetail.avgExpense)}원</span></div>
            <div className="stat-row"><span className="stat-label">6개월 평균 저축률</span><span className="stat-value" style={{color:dashboardDetail.avgIncome>0&&dashboardDetail.avgNet/dashboardDetail.avgIncome*100>=20?"var(--green)":"var(--amber)"}}>{fmtPct(dashboardDetail.avgIncome>0?dashboardDetail.avgNet/dashboardDetail.avgIncome*100:0)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tax / Optimization Tab ───────────────────────────────────────────────
function calcTaxOptimization(data, taxAnalysis) {
  const s = data.settings || {};
  const groups = Object.fromEntries((taxAnalysis || []).map(g => [g.name, g]));
  const isa = groups.ISA || { value:0, principal:0, profit:0, estimatedTax:0 };
  const taxable = groups.일반계좌 || { value:0, principal:0, profit:0, estimatedTax:0 };
  const pension = groups.연금저축 || { value:0 };
  const irp = groups.IRP || { value:0 };

  const pensionCurrent = Math.max(n(s.annualPensionContribution), 0);
  const pensionLimit = Math.max(n(s.pensionAnnualTaxCreditLimit), 0);
  const pensionGap = Math.max(pensionLimit - pensionCurrent, 0);
  const pensionCreditRate = Math.max(n(s.pensionTaxCreditRate), 0);
  const pensionExtraCredit = pensionGap * pensionCreditRate;

  const isaCurrent = Math.max(n(s.annualIsaContributionCurrent), 0);
  const isaLimit = Math.max(n(s.isaAnnualLimit), 0);
  const isaGap = Math.max(isaLimit - isaCurrent, 0);
  const normalTaxRate = Math.max(n(s.taxableDividendTaxRate), 0);
  const isaTaxRate = Math.max(n(s.isaTaxRate), 0);
  const isaTaxFreeLimit = Math.max(n(s.isaTaxFreeLimit), 0);
  const expectedProfitRate = Math.max(n(s.expectedTaxableProfitRate || 0.08), 0);
  const optimizingCash = Math.max(n(s.annualTaxOptimizingCash), 0);

  const isaCurrentProfit = Math.max(n(isa.profit), 0);
  const normalTaxIfIsaWasTaxable = isaCurrentProfit * normalTaxRate;
  const isaTax = Math.max(isaCurrentProfit - isaTaxFreeLimit, 0) * isaTaxRate;
  const isaSavedCurrent = Math.max(normalTaxIfIsaWasTaxable - isaTax, 0);

  const taxableProfit = Math.max(n(taxable.profit), 0);
  const taxableTaxNow = taxableProfit * normalTaxRate;

  const possibleIsaMove = Math.min(optimizingCash || isaGap, isaGap);
  const expectedProfitOnIsaMove = possibleIsaMove * expectedProfitRate;
  const expectedNormalTax = expectedProfitOnIsaMove * normalTaxRate;
  const expectedIsaTax = Math.max(expectedProfitOnIsaMove - Math.max(isaTaxFreeLimit - isaCurrentProfit, 0), 0) * isaTaxRate;
  const expectedIsaSaving = Math.max(expectedNormalTax - expectedIsaTax, 0);

  const totalImmediateBenefit = pensionExtraCredit + expectedIsaSaving;
  const warnings = [];
  if (pensionCurrent < pensionLimit) warnings.push(`연금 세액공제 한도가 ${fmt(pensionGap)}원 남아 있습니다.`);
  if (isaCurrent < isaLimit) warnings.push(`ISA 연간 납입 여력이 ${fmt(isaGap)}원 남아 있습니다.`);
  if (taxable.value > isa.value && isaGap > 0) warnings.push("일반계좌 비중이 ISA보다 크고 ISA 여력이 남아 있어 과세 효율 점검이 필요합니다.");
  if (pensionCurrent > pensionLimit) warnings.push("연금 납입액이 세액공제 한도를 초과했습니다. 초과분은 공제 효과가 제한될 수 있습니다.");

  const recommendations = [
    {
      title:"연금저축/IRP 세액공제 한도 채우기",
      priority:pensionGap>0?"높음":"완료",
      amount:pensionGap,
      benefit:pensionExtraCredit,
      reason:pensionGap>0 ? `추가 납입 시 예상 세액공제 ${fmt(pensionExtraCredit)}원` : "현재 설정 기준 세액공제 한도를 모두 채웠습니다.",
    },
    {
      title:"ISA 납입 여력 우선 활용",
      priority:isaGap>0?"높음":"완료",
      amount:isaGap,
      benefit:expectedIsaSaving,
      reason:isaGap>0 ? `향후 기대수익 ${fmt(expectedProfitOnIsaMove)}원 가정 시 예상 절세 ${fmt(expectedIsaSaving)}원` : "현재 설정 기준 ISA 연간 한도를 모두 사용했습니다.",
    },
    {
      title:"일반계좌 신규 매수 최소화",
      priority:taxable.value>0&&isaGap>0?"중간":"점검",
      amount:Math.min(taxable.value, isaGap),
      benefit:taxableTaxNow,
      reason:taxableProfit>0 ? `현재 일반계좌 평가이익 기준 추정 과세 노출 ${fmt(taxableTaxNow)}원` : "일반계좌 평가이익이 크지 않아 즉시 과세 부담은 제한적입니다.",
    },
  ];

  return { isa, taxable, pension, irp, pensionCurrent, pensionLimit, pensionGap, pensionExtraCredit, isaCurrent, isaLimit, isaGap, isaSavedCurrent, taxableTaxNow, expectedIsaSaving, totalImmediateBenefit, warnings, recommendations };
}


// ─── 세금 캘린더 / 연간 타임라인 ──────────────────────────────────────────────
function taxDeadlineDate(year, month, preferredDay) {
  const last = new Date(year, month, 0).getDate();
  return Math.min(preferredDay, last);
}
function buildTaxCalendar(data, taxAnalysis, futureSim) {
  const s = data.settings || {};
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const groups = Object.fromEntries((taxAnalysis || []).map(g => [g.name, g]));
  const taxableTax = n(groups.일반계좌?.estimatedTax);
  const isaGap = Math.max(n(s.isaAnnualLimit) - n(s.annualIsaContributionCurrent), 0);
  const pensionGap = Math.max(n(s.pensionAnnualTaxCreditLimit) - n(s.annualPensionContribution), 0);
  const isaStartYear = n(s.isaStartYear) || year;
  const isaStartMonth = clamp(n(s.isaStartMonth) || 1, 1, 12);
  const isaCycleYears = Math.max(n(s.isaCycleYears) || 5, 1);
  const isaMaturityYear = isaStartYear + isaCycleYears;
  const isaMaturityMonth = isaStartMonth;
  const finalFuture = Array.isArray(futureSim) && futureSim.length ? futureSim[futureSim.length - 1] : null;
  const target = n(s.retirementTargetAmount);
  const projected = n(finalFuture?.total);
  const mk = (yyyy, month, day, type, title, amount, desc, tone) => ({
    year: yyyy,
    month,
    day: taxDeadlineDate(yyyy, month, day),
    date: `${yyyy}-${String(month).padStart(2,"0")}-${String(taxDeadlineDate(yyyy, month, day)).padStart(2,"0")}`,
    type,
    title,
    amount,
    desc,
    tone,
    completed:false,
  });
  const events = [
    mk(year, 5, 31, "신고", "종합소득세", taxableTax, taxableTax > 0 ? `일반계좌 추정 과세 노출 ${fmt(taxableTax)}원 점검` : "근로 외 소득·금융소득·사업소득 여부 확인", "amber"),
    mk(year, 7, 31, "납부", "재산세 1기", 0, "주택 1기분·건축물분 등 고지서 확인", "info"),
    mk(year, 9, 30, "납부", "재산세 2기", 0, "주택 2기분·토지분 등 고지서 확인", "info"),
    mk(year, 12, 20, "절세", "연금/IRP 한도 마감", pensionGap, pensionGap > 0 ? `세액공제 잔여 한도 ${fmt(pensionGap)}원` : "연금 세액공제 한도 사용 완료", pensionGap > 0 ? "green" : "info"),
    mk(year, 12, 31, "절세", "ISA 연간 한도 점검", isaGap, isaGap > 0 ? `ISA 남은 납입 여력 ${fmt(isaGap)}원` : "ISA 연간 납입 한도 사용 완료", isaGap > 0 ? "green" : "info"),
  ];
  if (isaMaturityYear === year) {
    events.push(mk(year, isaMaturityMonth, 1, "만기", "ISA 만기", 0, "연금 이전·새 ISA 재개설·일반계좌 분리 결정", "red"));
  } else {
    events.push(mk(year, 12, 10, "예정", `ISA 만기 예정 ${isaMaturityYear}.${String(isaMaturityMonth).padStart(2,"0")}`, 0, "올해는 만기 전 준비 단계입니다. 이전 비율과 재개설 계획을 정리하세요.", "accent"));
  }
  if (target > 0 && projected > 0) {
    events.push(mk(year, 12, 15, "시뮬", "은퇴 시뮬 점검", projected - target, projected >= target ? `목표 대비 예상 초과 ${fmt(projected-target)}원` : `목표 대비 예상 부족 ${fmt(target-projected)}원`, projected >= target ? "green" : "amber"));
  }
  const months = Array.from({ length:12 }, (_,i) => ({ month:i+1, label:`${i+1}월`, events:events.filter(e => e.month === i+1).sort((a,b)=>a.day-b.day) }));
  const upcoming = events.filter(e => e.month > currentMonth || (e.month === currentMonth && e.day >= now.getDate())).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const next = upcoming[0] || [...events].sort((a,b)=>a.date.localeCompare(b.date))[0];
  const actions = [];
  if (taxableTax > 0) actions.push(`5월 종합소득세 전 일반계좌 손익과 배당 내역을 정리하세요.`);
  if (isaGap > 0) actions.push(`12월 전 ISA 잔여 한도 ${fmt(isaGap)}원을 월별로 나눠 납입 계획을 세우세요.`);
  if (pensionGap > 0) actions.push(`연말정산 전 연금/IRP 잔여 한도 ${fmt(pensionGap)}원을 확인하세요.`);
  if (isaMaturityYear <= year + 1) actions.push(`ISA 만기가 가까우면 연금 이전 금액과 새 ISA 재개설 금액을 미리 정하세요.`);
  return { year, months, events, upcoming, next, actions: actions.slice(0,4), isaMaturityYear, isaMaturityMonth, taxableTax, isaGap, pensionGap };
}

function buildCalendarCells(year, month, events) {
  const first = new Date(year, month - 1, 1);
  const firstDay = first.getDay();
  const start = new Date(year, month - 1, 1 - firstDay);
  const today = todayISO();
  return Array.from({ length:42 }, (_,idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    const yyyy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const iso = `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
    return { iso, year:yyyy, month:mm, day:dd, outside:mm !== month, today:iso === today, events:(events || []).filter(e => e.date === iso) };
  });
}

const TAX_UPDATE_SOURCES = [
  { name:"국세청", url:"https://www.nts.go.kr", keywords:["종합소득세","소득세","세법","ISA","연금"] },
  { name:"홈택스", url:"https://www.hometax.go.kr", keywords:["종합소득세","신고","납부","연말정산"] },
  { name:"위택스", url:"https://www.wetax.go.kr", keywords:["재산세","지방세","납부"] },
];
async function fetchTaxUpdateSnapshot() {
  const checkedAt = new Date().toISOString();
  const results = [];
  for (const src of TAX_UPDATE_SOURCES) {
    try {
      const proxyUrl = `https://r.jina.ai/http://${src.url.replace(/^https?:\/\//, "")}`;
      const res = await fetch(proxyUrl, { method:"GET" });
      const text = await res.text();
      const hit = src.keywords.filter(k => text.includes(k));
      results.push({ source:src.name, url:src.url, ok:res.ok, hit, sample:text.slice(0,500) });
    } catch (err) {
      results.push({ source:src.name, url:src.url, ok:false, hit:[], error:String(err?.message || err) });
    }
  }
  const okCount = results.filter(r => r.ok).length;
  const hitTexts = results.flatMap(r => r.hit.map(k => `${r.source}:${k}`));
  return {
    checkedAt,
    status: okCount > 0 ? "checked" : "failed",
    source: results.filter(r=>r.ok).map(r=>r.source).join(", ") || "공식 사이트 직접 확인 필요",
    summary: okCount > 0
      ? `공식 사이트 ${okCount}곳을 조회했습니다. 감지 키워드: ${hitTexts.length ? hitTexts.join(" · ") : "주요 키워드 변화 없음"}`
      : "브라우저 보안/CORS 또는 네트워크 문제로 자동 조회에 실패했습니다. 공식 사이트 버튼으로 직접 확인하세요.",
    results,
  };
}


function formatTaxUpdateDateTime(iso) {
  if (!iso) return "아직 확인 전";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "확인일 정보 없음";
  return d.toLocaleString("ko-KR", {
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
  });
}
function summarizeTaxUpdateStatus(settings, localMsg) {
  const status = settings?.taxUpdateStatus || "not_checked";
  const raw = localMsg || settings?.taxUpdateSummary || "최신 세법 업데이트를 아직 확인하지 않았습니다.";
  const clean = String(raw).replace(/\s+/g," ").trim();
  let title = "업데이트 대기";
  let tone = "info";
  let icon = "🕘";
  if (status === "checked") { title = "최신 정보 확인 완료"; tone = "green"; icon = "✅"; }
  if (status === "failed") { title = "자동 확인 실패"; tone = "amber"; icon = "⚠️"; }
  if (clean.includes("확인하는 중")) { title = "업데이트 확인 중"; tone = "accent"; icon = "🔎"; }
  const brief = clean.length > 92 ? `${clean.slice(0,92)}…` : clean;
  return { title, tone, icon, brief };
}


function buildTaxActionRecommendations(calendar, settings, monthEvents = []) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const actions = [];
  const isaGap = n(calendar?.isaGap || 0);
  const pensionGap = n(calendar?.pensionGap || 0);
  const taxableTax = n(calendar?.taxableTax || 0);
  const monthlyIsaNeed = isaGap > 0 ? Math.ceil(isaGap / Math.max(1, 12 - currentMonth + 1)) : 0;
  const monthlyPensionNeed = pensionGap > 0 ? Math.ceil(pensionGap / Math.max(1, 12 - currentMonth + 1)) : 0;
  const add = (type, title, text, timing, tone = "info", amount = 0) => actions.push({ type, title, text, timing, tone, amount });

  if (monthEvents.some(e => e.title.includes("종합소득세"))) {
    add("신고", "종합소득세 신고 준비", `일반계좌 배당·매매손익, 기타소득, 필요경비 자료를 한 번에 모아두세요.${taxableTax > 0 ? ` 현재 과세 노출 추정액은 ${fmt(taxableTax)}원입니다.` : ""}`, "5월 신고 전", taxableTax > 0 ? "amber" : "accent", taxableTax);
  }
  if (monthEvents.some(e => e.title.includes("재산세"))) {
    add("납부", "재산세 납부 자금 분리", "납부월에는 카드 결제·투자금과 섞이지 않게 세금 전용 현금으로 분리해두는 것이 안전합니다.", "해당 월 초", "amber", 0);
  }
  if (isaGap > 0) {
    add("납입", "ISA 잔여 한도 자동 배분", `올해 ISA 잔여 한도 ${fmt(isaGap)}원을 연말까지 맞추려면 월 약 ${fmt(monthlyIsaNeed)}원씩 납입하면 됩니다.`, "매월 급여일 직후", "green", monthlyIsaNeed);
  } else {
    add("유지", "ISA 한도 점검 완료", "올해 ISA 납입 계획은 충분한 편입니다. 새 납입보다 리밸런싱과 현금흐름 안정성을 우선 확인하세요.", "월 1회", "green", 0);
  }
  if (pensionGap > 0) {
    add("절세", "연금/IRP 세액공제 타이밍", `연금·IRP 잔여 세액공제 한도 ${fmt(pensionGap)}원이 남아 있습니다. 연말에 몰아서 넣기보다 월 약 ${fmt(monthlyPensionNeed)}원씩 나누면 현금흐름 부담이 줄어듭니다.`, "매월 또는 11~12월 집중", "accent", monthlyPensionNeed);
  }
  if (calendar?.isaMaturityYear && calendar.isaMaturityYear <= calendar.year + 1) {
    add("만기", "ISA 만기 실행 순서 확정", "ISA 만기 전에는 ① 연금 이전 금액 ② 새 ISA 재개설 금액 ③ 일반계좌 이동 금액을 먼저 정해야 절세 효과가 흔들리지 않습니다.", "만기 3~6개월 전", "red", 0);
  }
  if (monthEvents.length === 0) {
    add("점검", "이번 달 세금 루틴", "큰 신고·납부 일정이 없는 달입니다. 납입한도, 증빙자료, 배당·이자 내역만 가볍게 점검하세요.", "월말 10분", "info", 0);
  }
  return actions.slice(0, 6);
}

function TaxActionCoach({ actions, settings, onUpdateSettings }) {
  const status = settings?.autoTaxUpdateEnabled !== false;
  const cls = (t) => t === "red" ? "danger" : t === "amber" ? "warn" : t === "green" ? "green" : "info";
  const badge = (t) => t === "red" ? "badge-red" : t === "amber" ? "badge-amber" : t === "green" ? "badge-green" : "badge-accent";
  return (
    <div className="tax-action-coach card">
      <div className="card-title">
        <div>
          <h3>세금 알림 · 자동 행동 추천</h3>
          <p className="small muted" style={{marginTop:4}}>신고 일정, ISA·연금 납입 한도, 만기 일정을 연결해 이번 달 행동을 추천합니다.</p>
        </div>
        <button className={`btn btn-sm ${status ? "btn-success" : "btn-ghost"}`} onClick={() => onUpdateSettings?.({ autoTaxUpdateEnabled: !status })}>
          {status ? "접속 시 자동 확인 ON" : "접속 시 자동 확인 OFF"}
        </button>
      </div>
      <div className="tax-action-grid">
        {(actions || []).map((a, idx) => (
          <div className={`tax-action-item ${cls(a.tone)}`} key={`${a.title}-${idx}`}>
            <div className="tax-action-top">
              <span className={`badge ${badge(a.tone)}`}>{a.type}</span>
              <span className="small muted">{a.timing}</span>
            </div>
            <strong>{a.title}</strong>
            <p>{a.text}</p>
            {n(a.amount) > 0 && <div className="tax-action-amount">권장 기준 금액: {fmt(a.amount)}원</div>}
          </div>
        ))}
      </div>
      <div className="alert alert-info" style={{marginTop:14}}>자동 업데이트는 접속할 때마다 공식 사이트 조회를 시도하고, 실패하면 마지막 확인일과 직접 확인 버튼을 남깁니다. 세법·납부기한은 실제 신고 전 공식 사이트에서 최종 확인하세요.</div>
    </div>
  );
}

function TaxCalendarTimeline({ calendar, settings, onUpdateSettings }) {
  const initial = `${calendar.year}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
  const [monthValue, setMonthValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [localMsg, setLocalMsg] = useState("");
  const [y,m] = monthValue.split("-").map(Number);
  const cells = useMemo(() => buildCalendarCells(y || calendar.year, m || 1, calendar.events), [y, m, calendar]);
  const monthEvents = useMemo(() => (calendar.events || []).filter(e => e.year === y && e.month === m).sort((a,b)=>a.day-b.day), [calendar, y, m]);
  const toneClass = (t) => t === "red" ? "badge-red" : t === "amber" ? "badge-amber" : t === "green" ? "badge-green" : t === "accent" ? "badge-accent" : "badge-muted";
  const moveMonth = (delta) => {
    const base = new Date(y || calendar.year, (m || 1) - 1 + delta, 1);
    setMonthValue(`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}`);
  };
  const runUpdate = async () => {
    setLoading(true);
    setLocalMsg("최신 세법·신고 일정 정보를 확인하는 중입니다.");
    try {
      const snapshot = await fetchTaxUpdateSnapshot();
      onUpdateSettings?.({
        taxUpdateLastChecked:snapshot.checkedAt,
        taxUpdateStatus:snapshot.status,
        taxUpdateSummary:snapshot.summary,
        taxUpdateSource:snapshot.source,
      });
      setLocalMsg(snapshot.summary);
    } catch (err) {
      const msg = `자동 확인 실패: ${String(err?.message || err)}. 공식 사이트에서 직접 확인해 주세요.`;
      onUpdateSettings?.({ taxUpdateLastChecked:new Date().toISOString(), taxUpdateStatus:"failed", taxUpdateSummary:msg, taxUpdateSource:"공식 사이트 직접 확인 필요" });
      setLocalMsg(msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (settings?.autoTaxUpdateEnabled === false) return;
    runUpdate();
    // 접속 시마다 최신 세법·일정 확인을 시도합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="tax-calendar-month-card">
      <div className="tax-cal-header">
        <div className="tax-cal-title">
          <span className="badge badge-accent">월간 보기</span>
          <div>
            <h3>세금 캘린더 · 월 단위 타임라인</h3>
            <p className="small muted" style={{marginTop:4}}>taxAnalysis와 futureSim 데이터를 월별 신고·납부·절세 일정으로 전환합니다.</p>
          </div>
        </div>
        <div className="tax-cal-nav">
          <button className="tax-cal-nav-btn" onClick={()=>moveMonth(-1)} title="이전 달">‹</button>
          <input className="tax-cal-input" type="month" value={monthValue} onChange={e=>setMonthValue(e.target.value)} />
          <button className="tax-cal-nav-btn" onClick={()=>moveMonth(1)} title="다음 달">›</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setMonthValue(initial)}>이번 달</button>
          <button className="btn btn-primary btn-sm" onClick={runUpdate} disabled={loading}>{loading ? "확인 중..." : "최신 세법 업데이트 확인"}</button>
        </div>
      </div>
      <div className="g3" style={{marginBottom:14}}>
        <div className="compact-insight amber"><span>🧾</span><div><strong>다음 세금 일정</strong><p>{calendar.next ? `${calendar.next.date} · ${calendar.next.title}` : "등록된 일정 없음"}</p></div></div>
        <div className="compact-insight green"><span>🌱</span><div><strong>절세 잔여 여력</strong><p>ISA {fmt(calendar.isaGap)}원 · 연금 {fmt(calendar.pensionGap)}원</p></div></div>
        <div className="compact-insight info"><span>🏁</span><div><strong>접속 시 자동 업데이트</strong><p>{settings?.taxUpdateLastChecked ? `${formatTaxUpdateDateTime(settings.taxUpdateLastChecked)} · ${settings?.taxUpdateStatus === "checked" ? "확인 완료" : settings?.taxUpdateStatus === "failed" ? "확인 실패" : "대기"}` : "접속하면 자동 확인"}</p></div></div>
      </div>
      <div className="tax-cal-grid">
        {["일","월","화","수","목","금","토"].map(w => <div className="tax-cal-weekday" key={w}>{w}</div>)}
        {cells.map(c => (
          <div key={c.iso} className={`tax-cal-day ${c.outside ? "outside" : ""} ${c.today ? "today" : ""}`}>
            <div className="tax-cal-date"><span>{c.day}</span>{c.events.length>0 && <span className="badge badge-muted">{c.events.length}</span>}</div>
            <div className="tax-cal-events">
              {c.events.map((e,idx) => (
                <div className="tax-cal-event" key={`${e.title}-${idx}`}>
                  <span className={`badge ${toneClass(e.tone)}`}>{e.type}</span>
                  <strong>{e.title}</strong>
                  <p>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="tax-update-box tax-update-status-box">
        <div className={`tax-update-status-card ${summarizeTaxUpdateStatus(settings, localMsg).tone}`}>
          <div className="tax-update-status-icon">{summarizeTaxUpdateStatus(settings, localMsg).icon}</div>
          <div>
            <div className="tax-update-status-top">
              <strong>{summarizeTaxUpdateStatus(settings, localMsg).title}</strong>
              <span className="badge badge-muted">{settings?.taxUpdateStatus === "checked" ? "자동 확인" : settings?.taxUpdateStatus === "failed" ? "직접 확인 필요" : "대기"}</span>
            </div>
            <div className="tax-update-date">{formatTaxUpdateDateTime(settings?.taxUpdateLastChecked)}</div>
            <p className="tax-update-brief">{summarizeTaxUpdateStatus(settings, localMsg).brief}</p>
            <div className="ai-chip-row" style={{marginTop:8}}>
              <span className="ai-chip">소스: {settings?.taxUpdateSource || "국세청 · 홈택스 · 위택스"}</span>
              <span className="ai-chip">이번 달 일정 {monthEvents.length}건</span>
              {calendar.actions.slice(0,2).map(a => <span className="ai-chip" key={a}>{a}</span>)}
            </div>
          </div>
        </div>
        <div className="row" style={{flexShrink:0}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>window.open("https://www.nts.go.kr", "_blank")}>국세청</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>window.open("https://www.hometax.go.kr", "_blank")}>홈택스</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>window.open("https://www.wetax.go.kr", "_blank")}>위택스</button>
        </div>
      </div>
    </div>
  );
}

function TaxTab({ data, update, taxAnalysis, futureSim }) {
  const s = data.settings || {};
  const set = (k, v) => update(d => ({ ...d, settings:{ ...d.settings, [k]:v } }));
  const opt = useMemo(() => calcTaxOptimization(data, taxAnalysis), [data, taxAnalysis]);
  const priorityBadge = (p) => p === "높음" ? "badge-red" : p === "중간" ? "badge-amber" : p === "완료" ? "badge-green" : "badge-muted";

  // 자연어 요약
  const taxNLP = useMemo(() => buildTaxNLP(opt, taxAnalysis), [opt, taxAnalysis]);
  const taxCoach = useMemo(() => buildIntegratedCoach({ area:"세금·절세", data, taxAnalysis, futureSim }), [data, taxAnalysis, futureSim]);
  const taxCalendar = useMemo(() => buildTaxCalendar(data, taxAnalysis, futureSim), [data, taxAnalysis, futureSim]);

  return (
    <div className="stack">
      {/* ── 자연어 요약 카드 ── */}
      <NaturalInsightCard icon={taxNLP.icon} title={taxNLP.title} message={taxNLP.message} tone={taxNLP.tone} actions={taxNLP.actions}/>
      <AICoachPanel coach={taxCoach}/>
      <TaxCalendarTimeline calendar={taxCalendar} settings={s} onUpdateSettings={(patch)=>update(d=>({ ...d, settings:{ ...d.settings, ...patch } }))}/>
      <TaxActionCoach actions={buildTaxActionRecommendations(taxCalendar, s, taxCalendar.events.filter(e => e.month === new Date().getMonth()+1))} settings={s} onUpdateSettings={(patch)=>update(d=>({ ...d, settings:{ ...d.settings, ...patch } }))}/>
      <div className="kpi-grid">
        <KpiCard label="추가 세액공제 가능액" value={opt.pensionExtraCredit} unit="원" accent/>
        <KpiCard label="ISA 예상 절세효과" value={opt.expectedIsaSaving} unit="원"/>
        <KpiCard label="일반계좌 과세 노출" value={opt.taxableTaxNow} unit="원" tone={opt.taxableTaxNow>0?"red":undefined}/>
        <KpiCard label="총 최적화 기대효과" value={opt.totalImmediateBenefit} unit="원" tone="green"/>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>3단계 세금 최적화 입력값</h3>
          <span className="badge badge-accent">수동 수정 가능</span>
        </div>
        <div className="form-grid">
          <Field label="올해 ISA 납입액"><input value={s.annualIsaContributionCurrent||""} onChange={e=>set("annualIsaContributionCurrent", n(e.target.value))} placeholder="예: 12000000"/></Field>
          <Field label="연금/IRP 올해 납입액"><input value={s.annualPensionContribution||""} onChange={e=>set("annualPensionContribution", n(e.target.value))} placeholder="예: 6000000"/></Field>
          <Field label="세금 최적화 가능 현금"><input value={s.annualTaxOptimizingCash||""} onChange={e=>set("annualTaxOptimizingCash", n(e.target.value))} placeholder="예: 5000000"/></Field>
          <Field label="과세계좌 기대수익률"><input type="number" step="0.001" value={s.expectedTaxableProfitRate??0.08} onChange={e=>set("expectedTaxableProfitRate", Number(e.target.value))}/></Field>
        </div>
        <div className="hr"/>
        <div className="form-grid">
          <Field label="ISA 연간 한도"><input value={s.isaAnnualLimit} onChange={e=>set("isaAnnualLimit", n(e.target.value))}/></Field>
          <Field label="ISA 비과세 한도"><input value={s.isaTaxFreeLimit} onChange={e=>set("isaTaxFreeLimit", n(e.target.value))}/></Field>
          <Field label="ISA 초과분 세율"><input type="number" step="0.001" value={s.isaTaxRate} onChange={e=>set("isaTaxRate", Number(e.target.value))}/></Field>
          <Field label="일반 배당세율"><input type="number" step="0.001" value={s.taxableDividendTaxRate} onChange={e=>set("taxableDividendTaxRate", Number(e.target.value))}/></Field>
          <Field label="연금 공제한도"><input value={s.pensionAnnualTaxCreditLimit} onChange={e=>set("pensionAnnualTaxCreditLimit", n(e.target.value))}/></Field>
          <Field label="연금 세액공제율"><input type="number" step="0.001" value={s.pensionTaxCreditRate} onChange={e=>set("pensionTaxCreditRate", Number(e.target.value))}/></Field>
        </div>
        <p className="small muted" style={{marginTop:12}}>입력값은 앱 내부 시뮬레이션용입니다. 실제 세액공제 한도와 과세 방식은 소득구간·상품·계좌 유형에 따라 달라질 수 있습니다.</p>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title"><h3>절세 우선순위</h3><span className="badge badge-muted">추천 순서</span></div>
          <div className="stack">
            {opt.recommendations.map((r,i)=>(
              <div key={r.title} className="insight-card">
                <div className="insight-icon" style={{background:i===0?"var(--green-bg)":i===1?"var(--accent-bg)":"var(--amber-bg)"}}>{i+1}</div>
                <div className="insight-body" style={{flex:1}}>
                  <div className="row-between">
                    <h4>{r.title}</h4>
                    <span className={`badge ${priorityBadge(r.priority)}`}>{r.priority}</span>
                  </div>
                  <p>{r.reason}</p>
                  <div className="row" style={{marginTop:8,flexWrap:"wrap"}}>
                    <span className="badge badge-muted">추천금액 {fmt(r.amount)}원</span>
                    <span className="badge badge-green">기대효과 {fmt(r.benefit)}원</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><h3>한도 사용 현황</h3><span className="badge badge-muted">올해 기준</span></div>
          <div className="budget-item">
            <div className="budget-header"><span className="budget-name">ISA 납입 한도</span><span className="budget-nums">{fmt(opt.isaCurrent)} / {fmt(opt.isaLimit)}원</span></div>
            <div className="progress"><div className="progress-fill pf-accent" style={{width:`${clamp(opt.isaLimit>0?opt.isaCurrent/opt.isaLimit*100:0,0,100)}%`}}/></div>
          </div>
          <div className="budget-item">
            <div className="budget-header"><span className="budget-name">연금 세액공제 한도</span><span className="budget-nums">{fmt(opt.pensionCurrent)} / {fmt(opt.pensionLimit)}원</span></div>
            <div className="progress"><div className="progress-fill pf-green" style={{width:`${clamp(opt.pensionLimit>0?opt.pensionCurrent/opt.pensionLimit*100:0,0,100)}%`}}/></div>
          </div>
          <div className="hr"/>
          <div className="stat-row"><span className="stat-label">ISA 남은 한도</span><span className="stat-value">{fmt(opt.isaGap)}원</span></div>
          <div className="stat-row"><span className="stat-label">연금 남은 공제한도</span><span className="stat-value">{fmt(opt.pensionGap)}원</span></div>
          <div className="stat-row"><span className="stat-label">ISA 현재 누적 절세효과</span><span className="stat-value text-green">{fmt(opt.isaSavedCurrent)}원</span></div>
          {opt.warnings.length>0 && <div className="alert alert-warn" style={{marginTop:14}}>{opt.warnings[0]}</div>}
        </div>
      </div>

      <div className="card">
        <h3>계좌별 세금 분석</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>계좌</th><th>세금 구조</th><th className="td-right">평가금액</th><th className="td-right">원금</th><th className="td-right">손익</th><th className="td-right">추정 세금</th><th>비고</th></tr></thead>
            <tbody>
              {taxAnalysis.map(g=>(
                <tr key={g.name}>
                  <td className="td-name">{g.name}</td>
                  <td>{g.taxLabel}</td>
                  <td className="td-right td-mono">{fmt(g.value)}</td>
                  <td className="td-right td-mono">{fmt(g.principal)}</td>
                  <td className={`td-right td-mono ${g.profit>=0?"text-green":"text-red"}`}>{fmt(g.profit)}</td>
                  <td className="td-right td-mono text-red">{fmt(g.estimatedTax)}</td>
                  <td style={{color:"var(--text3)"}}>{g.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="alert alert-info">이 화면은 세금 최적화를 위한 추정 도구입니다. 실제 신고·납입 전에는 증권사/국세청/세무 전문가 기준으로 확인하세요.</div>
    </div>
  );
}

// ─── Planning Tab ─────────────────────────────────────────────────────────────
function PlanningTab({ data, update, eventAnalysis, dashboard }) {
  const empty={id:"",name:"",yearsFromNow:1,amountNeeded:"",currentPrepared:"",priority:"높음"};
  const [form,setForm]=useState(empty);
  const saveEvent=()=>{
    if(!form.name||n(form.amountNeeded)<=0) return alert("이름과 필요금액을 입력하세요.");
    update(d=>{
      const row={...form,yearsFromNow:n(form.yearsFromNow),amountNeeded:n(form.amountNeeded),currentPrepared:n(form.currentPrepared),id:form.id||uid()};
      const events=form.id?d.events.map(e=>e.id===form.id?row:e):[...d.events,row];
      return {...d,events};
    });
    setForm(empty);
  };

  // 자연어 요약
  const planNLP = useMemo(() => buildPlanningNLP(eventAnalysis, dashboard), [eventAnalysis, dashboard]);
  const planningCoach = useMemo(() => buildIntegratedCoach({ area:"목표·이벤트", data, dashboard, eventAnalysis }), [data, dashboard, eventAnalysis]);

  return (
    <div className="stack">
      {/* ── 자연어 요약 카드 ── */}
      <NaturalInsightCard icon={planNLP.icon} title={planNLP.title} message={planNLP.message} tone={planNLP.tone} actions={planNLP.actions}/>
      <div className="card">
        <h3>라이프 이벤트 입력</h3>
        <div className="form-grid">
          <Field label="이름"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="예: 자동차 구매"/></Field>
          <Field label="몇 년 후"><input type="number" value={form.yearsFromNow} onChange={e=>setForm({...form,yearsFromNow:e.target.value})}/></Field>
          <Field label="필요 금액"><input value={form.amountNeeded} onChange={e=>setForm({...form,amountNeeded:e.target.value})}/></Field>
          <Field label="현재 준비금"><input value={form.currentPrepared} onChange={e=>setForm({...form,currentPrepared:e.target.value})}/></Field>
          <Field label="우선순위">
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
              <option>높음</option><option>중간</option><option>낮음</option>
            </select>
          </Field>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={saveEvent}>저장</button>
          <button className="btn btn-ghost" onClick={()=>setForm(empty)}>초기화</button>
        </div>
      </div>

      <div className="g2">
        {eventAnalysis.map(e=>(
          <div key={e.id} className="card-sm">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{e.name}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{e.yearsFromNow}년 후 · {e.age}세</div>
              </div>
              <span className={`badge ${e.priority==="높음"?"badge-red":e.priority==="중간"?"badge-amber":"badge-muted"}`}>{e.priority}</span>
            </div>
            <div className="progress" style={{marginBottom:8}}>
              <div className="progress-fill pf-accent" style={{width:`${clamp(e.progress,0,100)}%`}}/>
            </div>
            <div style={{fontSize:12,color:"var(--text3)",display:"flex",justifyContent:"space-between"}}>
              <span>준비 {fmt(e.currentPrepared)}원</span><span>목표 {fmt(e.amountNeeded)}원</span>
            </div>
            {e.shortage>0&&<div style={{fontSize:11,color:"var(--text3)",marginTop:6}}>월 {fmt(e.monthlyNeed)}원 추가 필요</div>}
            <div style={{marginTop:8,display:"flex",gap:6}}>
              <button className="btn btn-sm btn-ghost" onClick={()=>setForm({...e})}>수정</button>
              <button className="btn btn-sm btn-danger" onClick={()=>update(d=>({...d,events:d.events.filter(x=>x.id!==e.id)}))}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}






// ─── Automation System Tab ───────────────────────────────────────────────────
function AutomationSystemTab({ data, update, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim }) {
  const today=todayISO();
  const thisMonth=thisMonthISO();

  const settings=data.settings||{};
  const auto=useMemo(()=>({
    monthlyReportDay:n(settings.autoMonthlyReportDay||1),
    backupReminderDays:n(settings.autoBackupReminderDays||14),
    rebalanceEnabled:settings.autoCheckRebalance!==false,
    budgetEnabled:settings.autoCheckBudget!==false,
    goalEnabled:settings.autoCheckGoals!==false,
    taxEnabled:settings.autoCheckTax!==false,
    lastBackupAt:settings.lastBackupAt||"",
    lastMonthlyReportAt:settings.lastMonthlyReportAt||"",
    automationRunLog:Array.isArray(settings.automationRunLog)?settings.automationRunLog:[],
  }),[settings]);

  const runChecks=useMemo(()=>{
    const alerts=[];
    const actions=[];
    const income=n(dashboard.income), expense=n(dashboard.expense), net=n(dashboard.net);
    const emergencyMonths=expense>0?n(dashboardDetail.emergencyFund)/expense:0;

    const day=Number(today.slice(8,10));
    if(day>=auto.monthlyReportDay && String(auto.lastMonthlyReportAt||"").slice(0,7)!==thisMonth){
      alerts.push({level:"info",area:"월간 리포트",title:"이번 달 리포트 생성 필요",text:`${thisMonth} 월간 리포트를 아직 확정하지 않았습니다.`});
      actions.push({type:"monthlyReport",label:"월간 리포트 완료 처리",desc:"이번 달 리포트 확인 후 완료 처리"});
    }

    const lastBackup=auto.lastBackupAt?new Date(auto.lastBackupAt):null;
    const diffDays=lastBackup?Math.floor((new Date(today)-lastBackup)/(1000*60*60*24)):999;
    if(diffDays>=auto.backupReminderDays){
      alerts.push({level:"warn",area:"백업",title:"백업 필요",text:lastBackup?`마지막 백업 후 ${diffDays}일이 지났습니다.`:"아직 백업 기록이 없습니다."});
      actions.push({type:"backupMark",label:"백업 완료로 표시",desc:"백업 다운로드 후 완료 처리"});
    }

    if(auto.budgetEnabled){
      const over=(budgetAnalysis||[]).filter(b=>b.status==="초과");
      const warn=(budgetAnalysis||[]).filter(b=>b.status==="주의");
      if(over.length>0) alerts.push({level:"warn",area:"예산",title:`예산 초과 ${over.length}개`,text:over.map(b=>b.cat1).slice(0,3).join(" · ")+" 항목을 확인하세요."});
      else if(warn.length>0) alerts.push({level:"info",area:"예산",title:`예산 주의 ${warn.length}개`,text:warn.map(b=>b.cat1).slice(0,3).join(" · ")+" 항목 사용률이 높습니다."});
    }

    if(net<0) alerts.push({level:"danger",area:"현금흐름",title:"이번 달 적자",text:`수입보다 지출이 ${fmt(Math.abs(net))}원 많습니다.`});
    if(emergencyMonths<3) alerts.push({level:"danger",area:"비상금",title:"비상금 부족",text:`현재 비상금은 약 ${emergencyMonths.toFixed(1)}개월치입니다.`});
    else if(emergencyMonths<6) alerts.push({level:"warn",area:"비상금",title:"비상금 보강 권장",text:`현재 ${emergencyMonths.toFixed(1)}개월치입니다. 6개월치까지 보강을 권장합니다.`});

    if(auto.rebalanceEnabled){
      const total=n(financialAnalysis.total);
      const rows=financialAnalysis.rows||[];
      const targets=getInvestmentTargets(settings).filter(t=>n(t.targetWeight)>0);
      const totalTarget=targets.reduce((s,t)=>s+n(t.targetWeight),0)||1;
      const byClass={};
      rows.forEach(r=>{const k=r.assetClass||"기타";byClass[k]=(byClass[k]||0)+n(r.value);});
      const band=n(settings.rebalanceBandPct||5)/100;
      targets.forEach(t=>{
        const targetW=n(t.targetWeight)/totalTarget;
        const currentW=total>0?n(byClass[t.name])/total:0;
        const gap=targetW-currentW;
        if(Math.abs(gap)>=band){
          alerts.push({level:gap>0?"info":"warn",area:"리밸런싱",title:`${t.name} 비중 ${gap>0?"부족":"초과"}`,text:`현재 ${fmtPct(currentW*100)} / 목표 ${fmtPct(targetW*100)}입니다.`});
        }
      });
    }

    if(auto.taxEnabled){
      if(n(taxAnalysis?.pensionRemaining)>0) alerts.push({level:"info",area:"절세",title:"연금 세액공제 여력",text:`잔여 한도 ${fmt(taxAnalysis.pensionRemaining)}원을 확인하세요.`});
      if(n(taxAnalysis?.isaRemaining)>0) alerts.push({level:"info",area:"절세",title:"ISA 납입 여력",text:`잔여 한도 ${fmt(taxAnalysis.isaRemaining)}원을 확인하세요.`});
    }

    if(auto.goalEnabled){
      const monthlyInvest=n(settings.monthlyInvestDefault||settings.monthlyInvestStage1||0);
      const capacity=Math.max(income-expense,0);
      (data.events||[]).forEach(e=>{
        const shortage=Math.max(n(e.amountNeeded)-n(e.currentPrepared),0);
        const monthlyNeed=shortage/Math.max(n(e.yearsFromNow)*12,1);
        if(shortage>0 && monthlyNeed+monthlyInvest>capacity){
          alerts.push({level:"warn",area:"목표",title:`${e.name} 목표 충돌`,text:`월 필요액 ${fmt(monthlyNeed)}원이 현재 투자계획과 충돌할 수 있습니다.`});
        }
      });
    }

    const danger=alerts.filter(a=>a.level==="danger").length;
    const warn=alerts.filter(a=>a.level==="warn").length;
    const info=alerts.filter(a=>a.level==="info").length;
    const score=clamp(100-danger*25-warn*10-info*2,0,100);
    return {alerts,actions,danger,warn,info,score};
  },[data,settings,dashboard,dashboardDetail,financialAnalysis,budgetAnalysis,taxAnalysis,auto,today,thisMonth]);

  const setAuto=(k,v)=>update(d=>({...d,settings:{...d.settings,[k]:v}}));
  const markMonthlyReport=()=>update(d=>({...d,settings:{...d.settings,lastMonthlyReportAt:new Date().toISOString(),automationRunLog:[...(Array.isArray(d.settings.automationRunLog)?d.settings.automationRunLog:[]),{id:uid(),at:new Date().toISOString(),type:"monthlyReport",text:`${thisMonth} 월간 리포트 완료`}].slice(-50)}}));
  const markBackup=()=>update(d=>({...d,settings:{...d.settings,lastBackupAt:today,automationRunLog:[...(Array.isArray(d.settings.automationRunLog)?d.settings.automationRunLog:[]),{id:uid(),at:new Date().toISOString(),type:"backup",text:"백업 완료 표시"}].slice(-50)}}));

  const scoreColor=runChecks.score>=80?"var(--green)":runChecks.score>=60?"var(--accent)":runChecks.score>=40?"var(--amber)":"var(--red)";

  return (
    <div className="stack automation-system">
      <AICoachPanel coach={buildIntegratedCoach({ area:"자동화 시스템", data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim })}/>
      <div className="card automation-hero">
        <div>
          <div className="kpi-label">AUTOMATION SYSTEM</div>
          <h2>자동으로 굴러가는 시스템</h2>
          <p>매월 리포트, 백업 주기, 예산·리밸런싱·절세·목표 충돌을 자동 점검합니다.</p>
        </div>
        <div className="automation-score" style={{color:scoreColor}}>{runChecks.score}<span>/100</span></div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="긴급 경고" value={runChecks.danger} unit="건" tone={runChecks.danger?"red":"green"}/>
        <KpiCard label="주의 알림" value={runChecks.warn} unit="건" tone={runChecks.warn?"red":"green"}/>
        <KpiCard label="정보 알림" value={runChecks.info} unit="건" accent/>
        <KpiCard label="자동 실행 로그" value={auto.automationRunLog.length} unit="건"/>
      </div>

      <div className="g2">
        <div className="card">
          <h3>자동 점검 설정</h3>
          <div className="form-grid-3">
            <Field label="월간 리포트 기준일"><input type="number" min="1" max="28" value={auto.monthlyReportDay} onChange={e=>setAuto("autoMonthlyReportDay",clamp(n(e.target.value),1,28))}/></Field>
            <Field label="백업 알림 주기(일)"><input type="number" min="1" value={auto.backupReminderDays} onChange={e=>setAuto("autoBackupReminderDays",Math.max(n(e.target.value),1))}/></Field>
            <Field label="리밸런싱 점검"><select value={auto.rebalanceEnabled?"사용":"미사용"} onChange={e=>setAuto("autoCheckRebalance",e.target.value==="사용")}><option>사용</option><option>미사용</option></select></Field>
            <Field label="예산 점검"><select value={auto.budgetEnabled?"사용":"미사용"} onChange={e=>setAuto("autoCheckBudget",e.target.value==="사용")}><option>사용</option><option>미사용</option></select></Field>
            <Field label="목표 충돌 점검"><select value={auto.goalEnabled?"사용":"미사용"} onChange={e=>setAuto("autoCheckGoals",e.target.value==="사용")}><option>사용</option><option>미사용</option></select></Field>
            <Field label="절세 점검"><select value={auto.taxEnabled?"사용":"미사용"} onChange={e=>setAuto("autoCheckTax",e.target.value==="사용")}><option>사용</option><option>미사용</option></select></Field>
          </div>
        </div>

        <div className="card">
          <h3>자동 실행 버튼</h3>
          <div className="stack" style={{gap:10}}>
            <button className="btn btn-primary" onClick={markMonthlyReport}>이번 달 월간 리포트 완료 처리</button>
            <button className="btn btn-ghost" onClick={markBackup}>백업 완료로 표시</button>
            <div className="alert alert-info">
              <strong>실행 방식</strong>
              <div style={{marginTop:6,fontSize:12,lineHeight:1.5}}>브라우저 로컬 앱 특성상 실제 백그라운드 알림 대신, 앱을 열 때마다 조건을 자동 점검하고 이 화면에 알림을 표시합니다.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><h3>자동 점검 결과</h3><span className="badge badge-accent">{today}</span></div>
        <div className="stack" style={{gap:10}}>
          {runChecks.alerts.length?runChecks.alerts.map((a,i)=>(
            <div key={i} className={`automation-alert ${a.level}`}>
              <span className="badge badge-muted">{a.area}</span>
              <div>
                <strong>{a.title}</strong>
                <p>{a.text}</p>
              </div>
            </div>
          )):<div className="empty">현재 자동 점검 알림이 없습니다.</div>}
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <h3>권장 자동 행동</h3>
          {runChecks.actions.length?runChecks.actions.map((a,i)=>(
            <div key={i} className="allocation-row">
              <div><strong>{a.label}</strong><p>{a.desc}</p></div>
              {a.type==="monthlyReport"&&<button className="btn btn-sm btn-primary" onClick={markMonthlyReport}>완료</button>}
              {a.type==="backupMark"&&<button className="btn btn-sm btn-ghost" onClick={markBackup}>완료</button>}
            </div>
          )):<div className="empty">지금 즉시 처리할 자동 행동이 없습니다.</div>}
        </div>

        <div className="card">
          <h3>자동 실행 로그</h3>
          {auto.automationRunLog.length?[...auto.automationRunLog].reverse().slice(0,10).map(log=>(
            <div key={log.id} className="stat-row">
              <span className="stat-label">{String(log.at||"").slice(0,10)} · {log.type}</span>
              <span className="stat-value" style={{fontSize:12}}>{log.text}</span>
            </div>
          )):<div className="empty">아직 자동 실행 로그가 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}


// ─── CFO Final Center ────────────────────────────────────────────────────────
function CFOCenterTab({ data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim }) {
  const cfo=useMemo(()=>{
    const income=n(dashboard.income), expense=n(dashboard.expense), net=n(dashboard.net);
    const savingsRate=income>0?net/income*100:0;
    const emergencyMonths=expense>0?n(dashboardDetail.emergencyFund)/expense:0;
    const portfolioTotal=n(financialAnalysis.total);
    const retireLast=futureSim[futureSim.length-1]||{};
    const target=n(data.settings?.retirementTargetAmount||0);
    const retireRate=target>0?n(retireLast.total)/target*100:0;
    const budgetOver=(budgetAnalysis||[]).filter(b=>b.status==="초과").length;
    const pensionRemain=n(taxAnalysis?.pensionRemaining);
    const isaRemain=n(taxAnalysis?.isaRemaining);
    const goalNeeds=(data.events||[]).reduce((sum,e)=>{
      const shortage=Math.max(n(e.amountNeeded)-n(e.currentPrepared),0);
      const months=Math.max(n(e.yearsFromNow)*12,1);
      return sum+shortage/months;
    },0);

    let score=50;
    score+=clamp(savingsRate,-20,50)*0.45;
    score+=clamp(emergencyMonths,0,12)*2.2;
    score+=retireRate>=100?14:retireRate>=70?8:retireRate>=40?3:0;
    score-=budgetOver*6;
    score-=goalNeeds>Math.max(net,0)?12:0;
    score=clamp(Math.round(score),0,100);

    const agenda=[];
    if(net<0) agenda.push({tone:"danger",area:"현금흐름",title:"적자 구조 먼저 해결",desc:`이번 달 ${fmt(Math.abs(net))}원 적자입니다. 투자보다 지출 통제가 우선입니다.`});
    if(emergencyMonths<3) agenda.push({tone:"danger",area:"안전",title:"비상금 최소 3개월치 확보",desc:`현재 ${emergencyMonths.toFixed(1)}개월치입니다.`});
    else if(emergencyMonths<6) agenda.push({tone:"warn",area:"안전",title:"비상금 6개월치 보강",desc:`6개월 기준까지 ${fmt(Math.max(expense*6-dashboardDetail.emergencyFund,0))}원 부족합니다.`});
    if(budgetOver>0) agenda.push({tone:"warn",area:"소비",title:"예산 초과 항목 조정",desc:`초과 항목 ${budgetOver}개를 점검하세요.`});
    if(goalNeeds>Math.max(net,0)) agenda.push({tone:"warn",area:"목표",title:"목표 적립과 투자금 충돌",desc:`목표별 월 필요액 ${fmt(goalNeeds)}원이 현재 여유현금을 압박합니다.`});
    if(retireRate<70) agenda.push({tone:"warn",area:"은퇴",title:"은퇴 목표 달성률 점검",desc:`현재 가정상 목표 달성률은 ${fmtPct(retireRate)}입니다.`});
    if(pensionRemain>0||isaRemain>0) agenda.push({tone:"info",area:"절세",title:"절세계좌 활용 여력",desc:`연금 잔여 ${fmt(pensionRemain)}원, ISA 잔여 ${fmt(isaRemain)}원 확인.`});
    if(!agenda.length) agenda.push({tone:"green",area:"유지",title:"현재 전략 유지 가능",desc:"현금흐름, 비상금, 목표 진행에 큰 경고 신호가 없습니다."});

    const nextSteps=agenda.slice(0,5).map((a,i)=>({no:i+1,...a}));
    return {score,savingsRate,emergencyMonths,retireRate,goalNeeds,agenda,nextSteps,portfolioTotal};
  },[data,dashboard,dashboardDetail,financialAnalysis,budgetAnalysis,taxAnalysis,futureSim]);

  const color=cfo.score>=80?"var(--green)":cfo.score>=60?"var(--accent)":cfo.score>=45?"var(--amber)":"var(--red)";

  return (
    <div className="stack cfo-center">
      <AICoachPanel coach={buildIntegratedCoach({ area:"CFO 종합판단", data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim })}/>
      <div className="card cfo-hero">
        <div>
          <div className="kpi-label">PERSONAL CFO FINAL BOARD</div>
          <h2>개인 CFO 종합판단</h2>
          <p>대시보드, 의사결정, 목표, 세금, 은퇴 데이터를 통합해 이번 달 최우선 행동을 정리합니다.</p>
        </div>
        <div className="cfo-score" style={{color}}>{cfo.score}<span>/100</span></div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="저축률" value={cfo.savingsRate} unit="%" accent/>
        <KpiCard label="비상금 커버" value={cfo.emergencyMonths} unit="개월" tone={cfo.emergencyMonths>=6?"green":cfo.emergencyMonths>=3?"":"red"}/>
        <KpiCard label="은퇴 목표 달성률" value={cfo.retireRate} unit="%" tone={cfo.retireRate>=100?"green":"red"}/>
        <KpiCard label="목표별 월 필요액" value={cfo.goalNeeds} unit="원"/>
      </div>

      <div className="g2">
        <div className="card">
          <h3>이번 달 최우선 의사결정</h3>
          <div className="stack" style={{gap:10}}>
            {cfo.nextSteps.map(s=>(
              <div key={s.no} className={`cfo-step ${s.tone}`}>
                <div className="cfo-step-no">{s.no}</div>
                <div>
                  <span className="badge badge-accent">{s.area}</span>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>CFO 요약</h3>
          <div className="stat-row"><span className="stat-label">순현금흐름</span><span className={`stat-value ${dashboard.net>=0?"text-green":"text-red"}`}>{fmt(dashboard.net)}원</span></div>
          <div className="stat-row"><span className="stat-label">투자 포트폴리오</span><span className="stat-value">{fmt(cfo.portfolioTotal)}원</span></div>
          <div className="stat-row"><span className="stat-label">비상금</span><span className="stat-value">{fmt(dashboardDetail.emergencyFund)}원</span></div>
          <div className="stat-row"><span className="stat-label">입력 점검 이슈</span><span className="stat-value">{dashboardDetail.totalValidationIssues}건</span></div>
          <div className="alert alert-info" style={{marginTop:14}}>
            <strong>판단 기준</strong>
            <div style={{fontSize:12,marginTop:6,lineHeight:1.5}}>현금흐름 → 비상금 → 목표 충돌 → 절세 → 투자 순서로 우선순위를 정합니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Goal Funding Tab ────────────────────────────────────────────────────────
function GoalFundingTab({ data, update, dashboard, dashboardDetail, futureSim }) {
  const empty={
    id:"", goalKind:"일반목표", name:"", yearsFromNow:3,
    amountNeeded:"", currentPrepared:"", priority:"중간",
    targetNetWorth:"", startNetWorth:"", memo:""
  };
  const [form,setForm]=useState(empty);
  const [timelineView,setTimelineView]=useState("순자산목표");
  const events=Array.isArray(data.events)?data.events:[];
  const currentNetWorth=n(dashboard?.netWorth);
  const avgMonthlyNet=n(dashboardDetail?.avgNet || dashboard?.net || 0);

  const analysis=useMemo(()=>{
    const income=n(dashboard.income);
    const expense=n(dashboard.expense);
    const net=n(dashboard.net);
    const avgNet=n(dashboardDetail?.avgNet || net);
    const currentNW=n(dashboard?.netWorth);
    const monthlyInvest=n(data.settings?.monthlyInvestDefault||data.settings?.monthlyInvestStage1||0);
    const investCapacity=Math.max(income-expense,0);
    return events.map(e=>{
      const kind=e.goalKind || "일반목표";
      const months=Math.max(Math.round(n(e.yearsFromNow)*12),1);
      if(kind==="순자산목표"){
        const startNW=n(e.startNetWorth)>0?n(e.startNetWorth):currentNW;
        const targetNW=n(e.targetNetWorth||e.amountNeeded);
        const shortage=Math.max(targetNW-startNW,0);
        const monthlyNeed=shortage/months;
        const projectedAtCurrentPace=startNW + Math.max(avgNet,0)*months;
        const projectedGap=Math.max(targetNW-projectedAtCurrentPace,0);
        const progress=targetNW>0?startNW/targetNW*100:0;
        const conflict=monthlyNeed>Math.max(avgNet,0) && shortage>0;
        const afterGoalInvestCapacity=Math.max(investCapacity-monthlyNeed,0);
        return {
          ...e, goalKind:kind, targetNetWorth:targetNW, startNetWorth:startNW,
          amountNeeded:targetNW, currentPrepared:startNW,
          shortage, monthlyNeed, progress, conflict, afterGoalInvestCapacity,
          months, projectedAtCurrentPace, projectedGap,
          summary:`${Math.round(months/12*10)/10}년 후 ${fmt(targetNW)}원 달성을 위해 월 ${fmt(monthlyNeed)}원 순증가가 필요합니다.`
        };
      }
      const shortage=Math.max(n(e.amountNeeded)-n(e.currentPrepared),0);
      const monthlyNeed=shortage/months;
      const progress=n(e.amountNeeded)>0?n(e.currentPrepared)/n(e.amountNeeded)*100:0;
      const conflict=monthlyNeed+monthlyInvest>investCapacity && shortage>0;
      const afterGoalInvestCapacity=Math.max(investCapacity-monthlyNeed,0);
      return {...e,goalKind:kind,shortage,monthlyNeed,progress,conflict,afterGoalInvestCapacity,months,summary:`${e.name} 목표까지 월 ${fmt(monthlyNeed)}원 적립이 필요합니다.`};
    }).sort((a,b)=>{
      const pa={높음:3,중간:2,낮음:1};
      if((a.goalKind==="순자산목표") !== (b.goalKind==="순자산목표")) return a.goalKind==="순자산목표"?-1:1;
      return (pa[b.priority]||0)-(pa[a.priority]||0)||n(a.yearsFromNow)-n(b.yearsFromNow)||b.monthlyNeed-a.monthlyNeed;
    });
  },[events,dashboard,dashboardDetail,data.settings]);

  const netWorthGoals=analysis.filter(g=>g.goalKind==="순자산목표");
  const normalGoals=analysis.filter(g=>g.goalKind!=="순자산목표");
  const visibleGoals=timelineView==="전체"?analysis:timelineView==="순자산목표"?netWorthGoals:normalGoals;
  const totalMonthlyNeed=analysis.reduce((s,e)=>s+n(e.monthlyNeed),0);
  const netWorthMonthlyNeed=netWorthGoals.reduce((s,e)=>s+n(e.monthlyNeed),0);
  const conflictCount=analysis.filter(e=>e.conflict).length;
  const nextNetWorthGoal=netWorthGoals[0] || null;

  const timelineRows=useMemo(()=>{
    if(!nextNetWorthGoal) return [];
    const months=Math.max(nextNetWorthGoal.months,1);
    const monthlyNeed=n(nextNetWorthGoal.monthlyNeed);
    const startNW=n(nextNetWorthGoal.startNetWorth);
    const targetNW=n(nextNetWorthGoal.targetNetWorth);
    const rows=[];
    for(let m=0;m<=months;m++){
      if(m!==0 && m!==months && m%3!==0) continue;
      const required=startNW + monthlyNeed*m;
      const projected=startNW + Math.max(avgMonthlyNet,0)*m;
      rows.push({month:m, required, projected, gap:Math.max(required-projected,0), rate:targetNW>0?required/targetNW*100:0});
    }
    return rows;
  },[nextNetWorthGoal,avgMonthlyNet]);

  const save=()=>{
    if(!form.name) return alert("목표명을 입력하세요.");
    if(form.goalKind==="순자산목표"){
      if(n(form.targetNetWorth||form.amountNeeded)<=0) return alert("목표 순자산을 입력하세요.");
    } else if(n(form.amountNeeded)<=0) return alert("목표금액을 입력하세요.");
    update(d=>{
      const goalKind=form.goalKind||"일반목표";
      const row={
        ...form,
        id:form.id||uid(),
        goalKind,
        yearsFromNow:n(form.yearsFromNow),
        amountNeeded:goalKind==="순자산목표"?n(form.targetNetWorth||form.amountNeeded):n(form.amountNeeded),
        currentPrepared:goalKind==="순자산목표"?n(form.startNetWorth||currentNetWorth):n(form.currentPrepared),
        targetNetWorth:goalKind==="순자산목표"?n(form.targetNetWorth||form.amountNeeded):0,
        startNetWorth:goalKind==="순자산목표"?n(form.startNetWorth||currentNetWorth):0,
        memo:form.memo||"",
      };
      const list=form.id?d.events.map(e=>e.id===form.id?row:e):[...d.events,row];
      return {...d,events:list};
    });
    setForm(empty);
  };

  const remove=(id)=>update(d=>({...d,events:d.events.filter(e=>e.id!==id)}));
  const loadPreset=(years,target)=>setForm({
    ...empty, goalKind:"순자산목표", name:`${years}년 후 ${fmt(target)}원 달성`, yearsFromNow:years,
    targetNetWorth:target, startNetWorth:currentNetWorth, priority:"높음",
    memo:"은퇴 시뮬레이션과 분리한 단기 순자산 목표"
  });

  return (
    <div className="stack goal-center">
      <AICoachPanel coach={buildIntegratedCoach({ area:"목표 자금관리", data, dashboard, dashboardDetail, futureSim, eventAnalysis:analysis })}/>
      <div className="card goal-hero">
        <div>
          <div className="kpi-label">NET WORTH TIMELINE</div>
          <h2>순자산 목표 타임라인</h2>
          <p>“3년 후 5억 달성”처럼 중간 순자산 목표를 만들고, 월별 필요 순증가액을 역산합니다. 은퇴 시뮬레이션과 분리해서 단기 목표를 관리합니다.</p>
        </div>
        <div className="stack" style={{minWidth:220}}>
          <button className="btn btn-primary" onClick={()=>loadPreset(3,500000000)}>+ 3년 후 5억 목표</button>
          <button className="btn btn-ghost" onClick={()=>loadPreset(5,1000000000)}>+ 5년 후 10억 목표</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="현재 순자산" value={currentNetWorth} unit="원" accent/>
        <KpiCard label="순자산 목표 월 필요액" value={netWorthMonthlyNeed} unit="원" tone={netWorthMonthlyNeed<=Math.max(avgMonthlyNet,0)?"green":"red"}/>
        <KpiCard label="전체 목표 월 필요액" value={totalMonthlyNeed} unit="원"/>
        <KpiCard label="충돌 목표" value={conflictCount} unit="개" tone={conflictCount?"red":"green"}/>
      </div>

      {nextNetWorthGoal && (
        <div className="card networth-timeline-card">
          <div className="card-title">
            <h3>가장 가까운 순자산 목표 요약</h3>
            <span className={`badge ${nextNetWorthGoal.conflict?"badge-red":"badge-green"}`}>{nextNetWorthGoal.conflict?"현재 속도 부족":"현재 속도 가능권"}</span>
          </div>
          <div className="g3">
            <div className="compact-insight info"><span>🎯</span><div><strong>{nextNetWorthGoal.name}</strong><p>{nextNetWorthGoal.summary}</p></div></div>
            <div className="compact-insight green"><span>📈</span><div><strong>현재 속도 예상</strong><p>현재 평균 순현금흐름 기준 예상 순자산은 {fmt(nextNetWorthGoal.projectedAtCurrentPace)}원입니다.</p></div></div>
            <div className={`compact-insight ${nextNetWorthGoal.projectedGap>0?"warn":"green"}`}><span>🧭</span><div><strong>추가 필요액</strong><p>{nextNetWorthGoal.projectedGap>0?`현재 속도 대비 ${fmt(nextNetWorthGoal.projectedGap)}원이 부족합니다.`:"현재 흐름이면 목표선에 도달 가능한 구간입니다."}</p></div></div>
          </div>
          <div className="table-wrap" style={{marginTop:14}}>
            <table>
              <thead><tr><th>경과</th><th>필요 순자산</th><th>현재 속도 예상</th><th>차이</th><th>목표 진행률</th></tr></thead>
              <tbody>
                {timelineRows.map(r=>(
                  <tr key={r.month}>
                    <td>{r.month===0?"현재":`${r.month}개월 후`}</td>
                    <td className="td-right td-mono">{fmt(r.required)}원</td>
                    <td className="td-right td-mono">{fmt(r.projected)}원</td>
                    <td className={`td-right td-mono ${r.gap>0?"text-red":"text-green"}`}>{fmt(r.gap)}원</td>
                    <td className="td-right td-mono">{fmtPct(r.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{form.id?"목표 수정":"목표 추가"}</h3>
        <div className="form-grid">
          <Field label="목표 유형"><select value={form.goalKind} onChange={e=>setForm({...form,goalKind:e.target.value})}><option>순자산목표</option><option>일반목표</option></select></Field>
          <Field label="목표명"><input placeholder="예: 3년 후 5억 달성" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          {form.goalKind==="순자산목표" ? (
            <>
              <Field label="목표 순자산"><input placeholder="500000000" value={form.targetNetWorth} onChange={e=>setForm({...form,targetNetWorth:n(e.target.value),amountNeeded:n(e.target.value)})}/></Field>
              <Field label="시작 순자산"><input placeholder={fmt(currentNetWorth)} value={form.startNetWorth} onChange={e=>setForm({...form,startNetWorth:n(e.target.value),currentPrepared:n(e.target.value)})}/></Field>
            </>
          ) : (
            <>
              <Field label="목표금액"><input placeholder="0" value={form.amountNeeded} onChange={e=>setForm({...form,amountNeeded:n(e.target.value)})}/></Field>
              <Field label="현재 준비금"><input placeholder="0" value={form.currentPrepared} onChange={e=>setForm({...form,currentPrepared:n(e.target.value)})}/></Field>
            </>
          )}
          <Field label="기간(년)"><input type="number" value={form.yearsFromNow} onChange={e=>setForm({...form,yearsFromNow:n(e.target.value)})}/></Field>
          <Field label="우선순위"><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>높음</option><option>중간</option><option>낮음</option></select></Field>
          <Field label="메모"><input placeholder="목표 설명" value={form.memo||""} onChange={e=>setForm({...form,memo:e.target.value})}/></Field>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={save}>{form.id?"수정 저장":"목표 저장"}</button>
          <button className="btn btn-ghost" onClick={()=>setForm(empty)}>초기화</button>
        </div>
      </div>

      <div className="tab-row">
        {["순자산목표","일반목표","전체"].map(v=><button key={v} className={`tab-chip ${timelineView===v?"active":""}`} onClick={()=>setTimelineView(v)}>{v}</button>)}
      </div>

      <div className="g2">
        {visibleGoals.map(g=> (
          <div key={g.id} className={`card-sm goal-item-pro ${g.conflict?"goal-conflict":""}`}>
            <div className="goal-head">
              <div>
                <strong>{g.name}</strong>
                <p>{g.goalKind} · {g.yearsFromNow}년 후 · 우선순위 {g.priority}</p>
              </div>
              <span className={`badge ${g.conflict?"badge-red":g.priority==="높음"?"badge-amber":"badge-accent"}`}>{g.conflict?"조정필요":"정상"}</span>
            </div>
            <div className="progress" style={{margin:"12px 0 8px"}}>
              <div className={`progress-fill ${g.conflict?"pf-red":"pf-accent"}`} style={{width:`${clamp(g.progress,0,100)}%`}}/>
            </div>
            <div className="stat-row"><span className="stat-label">달성률</span><span className="stat-value">{fmtPct(g.progress)}</span></div>
            <div className="stat-row"><span className="stat-label">목표금액</span><span className="stat-value">{fmt(g.goalKind==="순자산목표"?g.targetNetWorth:g.amountNeeded)}원</span></div>
            <div className="stat-row"><span className="stat-label">현재 기준액</span><span className="stat-value">{fmt(g.goalKind==="순자산목표"?g.startNetWorth:g.currentPrepared)}원</span></div>
            <div className="stat-row"><span className="stat-label">부족액</span><span className="stat-value">{fmt(g.shortage)}원</span></div>
            <div className="stat-row"><span className="stat-label">월 필요 {g.goalKind==="순자산목표"?"순증가액":"적립액"}</span><span className="stat-value text-accent">{fmt(g.monthlyNeed)}원</span></div>
            {g.goalKind==="순자산목표" && <div className="stat-row"><span className="stat-label">현재 속도 예상 부족액</span><span className={`stat-value ${g.projectedGap>0?"text-red":"text-green"}`}>{fmt(g.projectedGap)}원</span></div>}
            <div className="alert alert-info" style={{marginTop:12,fontSize:12,lineHeight:1.5}}>{g.summary}</div>
            <div className="form-actions">
              <button className="btn btn-sm btn-ghost" onClick={()=>setForm({...empty,...g,targetNetWorth:g.targetNetWorth||g.amountNeeded,startNetWorth:g.startNetWorth||g.currentPrepared})}>수정</button>
              <button className="btn btn-sm btn-danger" onClick={()=>remove(g.id)}>삭제</button>
            </div>
          </div>
        ))}
        {!visibleGoals.length&&<div className="empty">목표를 추가해주세요.</div>}
      </div>
    </div>
  );
}

function DecisionCenterTab({ data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim }) {
  const decisions=useMemo(()=>{
    const s=data.settings||{};
    const income=n(dashboard.income);
    const expense=n(dashboard.expense);
    const net=n(dashboard.net);
    const monthlyInvest=n(s.triggerMonthlyInvestAmount||s.monthlyInvestDefault||s.monthlyInvestStage1||0);
    const emergencyFund=n(dashboardDetail.emergencyFund);
    const emergencyMonths=expense>0?emergencyFund/expense:0;
    const targetEmergency=expense*6;
    const emergencyGap=Math.max(targetEmergency-emergencyFund,0);
    const investableCash=Math.max(net,0);
    const budgetOver=(budgetAnalysis||[]).filter(b=>b.status==="초과");
    const budgetWarn=(budgetAnalysis||[]).filter(b=>b.status==="주의");

    const portfolioTotal=n(financialAnalysis.total);
    const rows=financialAnalysis.rows||[];
    const targets=getInvestmentTargets(s).filter(t=>n(t.targetWeight)>0);
    const totalTargetWeight=targets.reduce((sum,t)=>sum+n(t.targetWeight),0)||1;
    const byClass={};
    rows.forEach(r=>{
      const key=r.assetClass||"기타";
      byClass[key]=(byClass[key]||0)+n(r.value);
    });

    const rebalance=[];
    targets.forEach(t=>{
      const targetWeight=n(t.targetWeight)/totalTargetWeight;
      const currentValue=n(byClass[t.name]);
      const currentWeight=portfolioTotal>0?currentValue/portfolioTotal:0;
      const gapWeight=targetWeight-currentWeight;
      const gapAmount=gapWeight*Math.max(portfolioTotal+monthlyInvest,1);
      const band=n(s.rebalanceBandPct||5)/100;
      if(Math.abs(gapWeight)>=band || Math.abs(gapAmount)>=100000){
        rebalance.push({
          name:t.name,
          targetWeight,
          currentWeight,
          gapWeight,
          gapAmount,
          action:gapAmount>0?"매수 우선":"비중 축소",
          priority:Math.abs(gapWeight)>=band*2?"높음":"중간"
        });
      }
    });
    rebalance.sort((a,b)=>Math.abs(b.gapAmount)-Math.abs(a.gapAmount));

    const taxActions=[];
    const pensionRemain=n(taxAnalysis?.pensionRemaining);
    const isaRemain=n(taxAnalysis?.isaRemaining);
    if(pensionRemain>0) taxActions.push({title:"연금/IRP 세액공제 여력",amount:pensionRemain,text:`세액공제 한도 잔여 ${fmt(pensionRemain)}원을 확인하세요.`});
    if(isaRemain>0) taxActions.push({title:"ISA 납입 여력",amount:isaRemain,text:`ISA 잔여 납입 가능액 ${fmt(isaRemain)}원을 활용할 수 있습니다.`});

    const lifeConflicts=(data.events||[]).map(e=>{
      const shortage=Math.max(n(e.amountNeeded)-n(e.currentPrepared),0);
      const months=Math.max(n(e.yearsFromNow)*12,1);
      const monthlyNeed=shortage/months;
      const conflict=monthlyNeed>0 && monthlyNeed+monthlyInvest>Math.max(income-expense+monthlyInvest,0);
      return {...e,shortage,monthlyNeed,conflict};
    }).filter(e=>e.shortage>0).sort((a,b)=>n(b.priority==="높음")-n(a.priority==="높음") || b.monthlyNeed-a.monthlyNeed);

    const cards=[];
    if(net<0){
      cards.push({rank:1,tone:"danger",tag:"현금흐름",title:"이번 달 투자보다 지출 점검 우선",text:`현재 ${fmt(Math.abs(net))}원 적자입니다. 자동투자 또는 추가매수 전 지출을 먼저 확인하세요.`,action:"지출 조정"});
    } else if(emergencyMonths<3){
      cards.push({rank:1,tone:"danger",tag:"안전",title:"비상금 우선 보강",text:`비상금이 약 ${emergencyMonths.toFixed(1)}개월치입니다. 최소 3개월까지는 투자보다 비상금 보강이 우선입니다.`,action:`비상금 ${fmt(Math.min(investableCash, emergencyGap))}원 배정`});
    } else if(emergencyMonths<6){
      cards.push({rank:1,tone:"warn",tag:"안전",title:"비상금 6개월치까지 보강",text:`현재 ${emergencyMonths.toFixed(1)}개월치입니다. 6개월치 목표까지 ${fmt(emergencyGap)}원이 부족합니다.`,action:"투자금 일부를 비상금으로 분배"});
    } else {
      cards.push({rank:1,tone:"green",tag:"투자",title:"투자 진행 가능",text:`비상금 기준이 양호합니다. 이번 달 투자 가능 현금은 약 ${fmt(investableCash)}원입니다.`,action:"목표비중 기준 매수"});
    }

    if(rebalance.length>0){
      const top=rebalance[0];
      cards.push({rank:2,tone:top.gapAmount>0?"info":"warn",tag:"리밸런싱",title:`${top.name} ${top.action}`,text:`현재 ${fmtPct(top.currentWeight*100)} / 목표 ${fmtPct(top.targetWeight*100)}입니다.`,action:`${top.name} ${top.gapAmount>0?fmt(Math.abs(top.gapAmount))+"원 매수 검토":"비중 축소 검토"}`});
    } else {
      cards.push({rank:2,tone:"green",tag:"리밸런싱",title:"목표비중 이탈 크지 않음",text:"현재 포트폴리오가 설정한 목표비중에서 크게 벗어나지 않았습니다.",action:"기존 매수 유지"});
    }

    if(budgetOver.length>0){
      cards.push({rank:3,tone:"warn",tag:"소비",title:"예산 초과 항목 조정",text:`${budgetOver.map(b=>b.cat1).slice(0,3).join(" · ")} 항목이 예산을 초과했습니다.`,action:"다음 달 예산 재배분"});
    }

    if(taxActions.length>0){
      cards.push({rank:4,tone:"info",tag:"절세",title:taxActions[0].title,text:taxActions[0].text,action:"절세 납입 검토"});
    }

    if(lifeConflicts.some(e=>e.conflict)){
      const e=lifeConflicts.find(e=>e.conflict);
      cards.push({rank:5,tone:"danger",tag:"목표",title:`${e.name} 준비금 충돌`,text:`목표 준비에 월 ${fmt(e.monthlyNeed)}원이 필요해 현재 투자계획과 충돌 가능성이 있습니다.`,action:"목표 금액/기간 조정"});
    } else if(lifeConflicts.length>0){
      const e=lifeConflicts[0];
      cards.push({rank:5,tone:"info",tag:"목표",title:`${e.name} 준비`,text:`부족액 ${fmt(e.shortage)}원, 월 필요액 ${fmt(e.monthlyNeed)}원입니다.`,action:"목표별 적립 설정"});
    }

    const allocation=[];
    let remaining=investableCash;
    if(net>0){
      if(emergencyMonths<6){
        const toEmergency=Math.min(remaining, emergencyGap, Math.max(remaining*0.6,0));
        if(toEmergency>0){allocation.push({name:"비상금",amount:toEmergency,reason:"6개월치 안전자금 확보"});remaining-=toEmergency;}
      }
      if(taxActions.length>0 && remaining>0){
        const toTax=Math.min(remaining, taxActions[0].amount, Math.max(remaining*0.4,0));
        if(toTax>0){allocation.push({name:"절세계좌",amount:toTax,reason:taxActions[0].title});remaining-=toTax;}
      }
      if(remaining>0 && rebalance.length>0){
        const positive=rebalance.filter(r=>r.gapAmount>0);
        const totalGap=positive.reduce((sum,r)=>sum+Math.max(r.gapAmount,0),0)||1;
        positive.slice(0,3).forEach(r=>{
          const amt=Math.min(remaining, remaining*(r.gapAmount/totalGap));
          if(amt>0) allocation.push({name:r.name,amount:amt,reason:"목표비중 부족분 보완"});
        });
      } else if(remaining>0) {
        allocation.push({name:"기본 투자",amount:remaining,reason:"목표비중 이탈 없음"});
      }
    }

    const score=cards.reduce((acc,c)=>acc+(c.tone==="danger"?-20:c.tone==="warn"?-8:c.tone==="info"?2:6),70);
    const decisionScore=clamp(Math.round(score),0,100);

    return {cards:cards.sort((a,b)=>a.rank-b.rank),rebalance,taxActions,lifeConflicts,allocation,decisionScore,emergencyMonths,investableCash,budgetOver,budgetWarn};
  },[data,dashboard,dashboardDetail,financialAnalysis,budgetAnalysis,taxAnalysis]);

  const scoreTone=decisions.decisionScore>=80?"green":decisions.decisionScore>=60?"accent":decisions.decisionScore>=45?"amber":"red";
  const scoreColor=scoreTone==="green"?"var(--green)":scoreTone==="accent"?"var(--accent)":scoreTone==="amber"?"var(--amber)":"var(--red)";

  return (
    <div className="stack decision-center">
      <AICoachPanel coach={buildIntegratedCoach({ area:"의사결정 센터", data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim })}/>
      <div className="card decision-hero">
        <div>
          <div className="kpi-label">DECISION CENTER</div>
          <h2>의사결정 센터</h2>
          <p>현금흐름, 비상금, 리밸런싱, 절세, 목표 준비금을 한 화면에서 판단합니다.</p>
        </div>
        <div className="decision-score" style={{color:scoreColor}}>
          {decisions.decisionScore}<span>/100</span>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="이번 달 투자 가능 현금" value={decisions.investableCash} unit="원" tone={decisions.investableCash>=0?"green":"red"}/>
        <KpiCard label="비상금 커버" value={decisions.emergencyMonths} unit="개월" accent/>
        <KpiCard label="리밸런싱 후보" value={decisions.rebalance.length} unit="건"/>
        <KpiCard label="예산 초과" value={decisions.budgetOver.length} unit="건" tone={decisions.budgetOver.length?"red":"green"}/>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title"><h3>우선순위 결정 카드</h3></div>
          <div className="stack" style={{gap:10}}>
            {decisions.cards.map((c,i)=>(
              <div key={i} className={`decision-card ${c.tone}`}>
                <div className="decision-card-head">
                  <span className="badge badge-accent">{c.tag}</span>
                  <strong>{c.title}</strong>
                </div>
                <p>{c.text}</p>
                <div className="decision-action">👉 {c.action}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><h3>이번 달 자금 배분안</h3></div>
          {decisions.allocation.length?decisions.allocation.map((a,i)=>(
            <div key={i} className="allocation-row">
              <div>
                <strong>{a.name}</strong>
                <p>{a.reason}</p>
              </div>
              <span>{fmt(a.amount)}원</span>
            </div>
          )):<div className="empty">배분 가능한 잉여 현금이 없거나 지출 점검이 우선입니다.</div>}
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <h3>리밸런싱 판단</h3>
          {decisions.rebalance.length?decisions.rebalance.slice(0,6).map(r=>(
            <div key={r.name} className="stat-row">
              <span className="stat-label">{r.name} · {r.action}</span>
              <span className={`stat-value ${r.gapAmount>0?"text-green":"text-red"}`}>{fmt(Math.abs(r.gapAmount))}원</span>
            </div>
          )):<div className="empty">목표비중 이탈이 크지 않습니다.</div>}
        </div>

        <div className="card">
          <h3>절세 판단</h3>
          {decisions.taxActions.length?decisions.taxActions.map((t,i)=>(
            <div key={i} className="stat-row">
              <span className="stat-label">{t.title}</span>
              <span className="stat-value text-green">{fmt(t.amount)}원</span>
            </div>
          )):<div className="empty">현재 확인된 절세 행동 후보가 없습니다.</div>}
        </div>

        <div className="card">
          <h3>목표 충돌 점검</h3>
          {decisions.lifeConflicts.length?decisions.lifeConflicts.slice(0,5).map(e=>(
            <div key={e.id} className="stat-row">
              <span className="stat-label">{e.name} {e.conflict?"⚠️":""}</span>
              <span className="stat-value">{fmt(e.monthlyNeed)}원/월</span>
            </div>
          )):<div className="empty">등록된 목표 준비 부족액이 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}


// ─── Monthly Report Tab ───────────────────────────────────────────────────────
function MonthlyReportTab({ data, monthlySeries, budgetAnalysis, financialAnalysis, dashboard, dashboardDetail, taxAnalysis }) {
  const months=useMemo(()=>[...new Set((data.transactions||[]).map(t=>monthOf(t.date)).filter(Boolean))].sort().reverse(),[data.transactions]);
  const [month,setMonth]=useState(months[0]||thisMonthISO());

  const report=useMemo(()=>{
    const tx=(data.transactions||[]).filter(t=>monthOf(t.date)===month);
    const income=tx.filter(t=>t.type==="수입").reduce((sum,t)=>sum+n(t.amount),0);
    const expense=tx.filter(t=>t.type==="지출").reduce((sum,t)=>sum+n(t.amount),0);
    const transfer=tx.filter(t=>t.type==="자산이동").reduce((sum,t)=>sum+n(t.amount),0);
    const net=income-expense;
    const savingsRate=income>0?net/income*100:0;

    const prevMonth=(()=>{
      const d=new Date(`${month}-01T00:00:00`);
      d.setMonth(d.getMonth()-1);
      return d.toISOString().slice(0,7);
    })();
    const prev=monthlySeries.find(r=>r.month===prevMonth)||{income:0,expense:0,net:0};
    const incomeChange=n(prev.income)>0?(income-n(prev.income))/n(prev.income)*100:0;
    const expenseChange=n(prev.expense)>0?(expense-n(prev.expense))/n(prev.expense)*100:0;
    const netChange=n(prev.net)!==0?(net-n(prev.net))/Math.abs(n(prev.net))*100:0;

    const catMap={};
    tx.filter(t=>t.type==="지출").forEach(t=>{const k=t.cat1||"기타";catMap[k]=(catMap[k]||0)+n(t.amount);});
    const topExpenses=Object.entries(catMap).map(([cat,amount])=>({cat,amount,rate:expense>0?amount/expense*100:0})).sort((a,b)=>b.amount-a.amount).slice(0,5);

    const incomeMap={};
    tx.filter(t=>t.type==="수입").forEach(t=>{const k=t.cat1||"기타";incomeMap[k]=(incomeMap[k]||0)+n(t.amount);});
    const incomeBreakdown=Object.entries(incomeMap).map(([cat,amount])=>({cat,amount,rate:income>0?amount/income*100:0})).sort((a,b)=>b.amount-a.amount);

    const highTx=tx.filter(t=>n(t.amount)>=1000000).sort((a,b)=>n(b.amount)-n(a.amount)).slice(0,5);
    const dailyMap={};
    tx.filter(t=>t.type==="지출").forEach(t=>{dailyMap[t.date]=(dailyMap[t.date]||0)+n(t.amount);});
    const topDays=Object.entries(dailyMap).map(([date,amount])=>({date,amount})).sort((a,b)=>b.amount-a.amount).slice(0,3);

    const budgetRows=(budgetAnalysis||[]).map(b=>({...b})).sort((a,b)=>n(b.rate)-n(a.rate));
    const overBudget=budgetRows.filter(b=>b.status==="초과");
    const warningBudget=budgetRows.filter(b=>b.status==="주의");

    const emergencyMonths=expense>0?n(dashboardDetail?.emergencyFund)/expense:0;
    const pensionRemaining=n(taxAnalysis?.pensionRemaining);
    const investTotal=n(financialAnalysis?.total);
    const netWorth=n(dashboard?.netWorth);
    const investWeight=netWorth>0?investTotal/netWorth*100:0;
    const monthlyInvestTarget=n(data.settings?.monthlyInvestDefault||data.settings?.monthlyInvestStage1||data.settings?.triggerMonthlyInvestAmount||0);

    const issues=[];
    if(net<0) issues.push({tone:"danger",title:"월간 적자",text:`이번 달은 ${fmt(Math.abs(net))}원 적자입니다.`});
    if(expenseChange>20) issues.push({tone:"warn",title:"지출 급증",text:`전월 대비 지출이 ${fmtPct(expenseChange)} 증가했습니다.`});
    if(overBudget.length>0) issues.push({tone:"warn",title:"예산 초과",text:`${overBudget.map(b=>b.cat1).slice(0,3).join(" · ")} 항목이 예산을 초과했습니다.`});
    if(savingsRate<20) issues.push({tone:"warn",title:"저축률 낮음",text:`이번 달 저축률은 ${fmtPct(savingsRate)}입니다.`});
    if(emergencyMonths>0 && emergencyMonths<3) issues.push({tone:"danger",title:"비상금 부족",text:`현재 비상금은 월 지출 기준 약 ${emergencyMonths.toFixed(1)}개월치입니다.`});
    if(pensionRemaining>0) issues.push({tone:"info",title:"절세 여력",text:`연금 세액공제 한도 잔여분 ${fmt(pensionRemaining)}원이 남아 있습니다.`});
    if(issues.length===0) issues.push({tone:"green",title:"월간 상태 양호",text:"큰 이상 신호 없이 관리되고 있습니다."});

    const actions=[];
    if(overBudget.length>0) actions.push({tag:"지출",title:"예산 초과 항목 조정",text:`다음 달은 ${overBudget[0].cat1} 항목을 먼저 점검하세요.`});
    if(net<0) actions.push({tag:"방어",title:"고정비·큰 지출 우선 확인",text:"적자가 난 달은 투자 확대보다 현금흐름 복구가 우선입니다."});
    if(net>0 && emergencyMonths<6) actions.push({tag:"안전",title:"잉여 현금 일부를 비상금으로",text:`흑자 ${fmt(net)}원 중 일부를 비상금 6개월치 목표에 배분하세요.`});
    if(net>0 && emergencyMonths>=3) actions.push({tag:"투자",title:"잉여 현금 투자 배분",text:`이번 달 잉여 현금 ${fmt(net)}원 중 일부를 목표 포트폴리오에 배분해도 좋습니다.`});
    if(pensionRemaining>0) actions.push({tag:"절세",title:"연금 세액공제 여력 확인",text:`잔여 한도 ${fmt(pensionRemaining)}원을 연말 전에 나눠 채우는 방식을 검토하세요.`});
    if(actions.length===0) actions.push({tag:"유지",title:"현재 전략 유지",text:"다음 달도 같은 기준으로 기록과 점검을 이어가세요."});

    let aiScore=50;
    if(net>0) aiScore+=16; else aiScore-=18;
    if(savingsRate>=40) aiScore+=18; else if(savingsRate>=20) aiScore+=10; else if(savingsRate<0) aiScore-=18; else aiScore-=8;
    if(expenseChange<=0) aiScore+=8; else if(expenseChange>20) aiScore-=10;
    if(overBudget.length===0) aiScore+=8; else aiScore-=Math.min(14,overBudget.length*5);
    if(emergencyMonths>=6) aiScore+=10; else if(emergencyMonths>=3) aiScore+=4; else aiScore-=10;
    if(pensionRemaining>0) aiScore-=2;
    aiScore=clamp(Math.round(aiScore),0,100);
    const aiTone=aiScore>=75?"good":aiScore>=55?"warn":"danger";
    const aiGrade=aiScore>=85?"매우 좋음":aiScore>=70?"양호":aiScore>=55?"주의":aiScore>=40?"개선 필요":"위험";

    const headline = net < 0
      ? `이번 달은 ${fmt(Math.abs(net))}원 적자라 지출 점검이 먼저예요.`
      : savingsRate >= 40
        ? `이번 달은 저축률 ${fmtPct(savingsRate)}로 아주 잘 관리되고 있어요.`
        : savingsRate >= 20
          ? `이번 달은 흑자 흐름이에요. 조금만 더 다듬으면 더 좋아져요.`
          : `이번 달은 흑자지만 저축률을 조금 더 끌어올리면 좋아요.`;

    const topExpenseSentence = topExpenses[0]
      ? `가장 많이 쓴 항목은 ${topExpenses[0].cat}이고, 금액은 ${fmt(topExpenses[0].amount)}원이에요.`
      : "아직 지출 항목이 충분히 입력되지 않았어요.";

    const aiMessage=[
      `이번 달 재무 컨디션은 ${aiGrade}로 볼 수 있어요.`,
      net>=0 ? `수입에서 지출을 제외하고 ${fmt(net)}원이 남았기 때문에 기본 흐름은 괜찮습니다.` : `수입보다 지출이 ${fmt(Math.abs(net))}원 더 컸기 때문에 다음 달은 방어 모드가 필요합니다.`,
      savingsRate>=30 ? `저축률도 ${fmtPct(savingsRate)}라 장기 목표를 향한 속도는 좋은 편이에요.` : `다만 저축률이 ${fmtPct(savingsRate)}라 목표 자산 형성 속도는 조금 느려질 수 있어요.`,
      topExpenseSentence,
      overBudget.length>0 ? `특히 ${overBudget.map(b=>b.cat1).slice(0,2).join(" · ")} 예산을 먼저 다듬으면 다음 달 결과가 바로 좋아질 가능성이 큽니다.` : `예산 초과 항목은 크지 않아 현재 소비 구조는 비교적 안정적이에요.`,
      emergencyMonths<3 ? `비상금은 아직 부족한 편이라 투자 확대보다 안전자금 보강을 우선하는 편이 좋습니다.` : emergencyMonths<6 ? `비상금은 최소 방어선은 갖췄지만 6개월치까지 채우면 더 안정적이에요.` : `비상금 방어력은 안정적이어서 남는 현금은 투자·절세로 연결하기 좋습니다.`
    ].join(" ");

    const coachingCards=[
      {tone:net>=0?"good":"danger",icon:"💸",title:"현금흐름 판단",text:net>=0?`이번 달 ${fmt(net)}원 흑자입니다. 남는 돈의 목적지를 정하면 좋아요.`:`${fmt(Math.abs(net))}원 적자입니다. 다음 달은 큰 지출과 고정비를 먼저 줄이세요.`},
      {tone:savingsRate>=30?"good":savingsRate>=20?"info":"warn",icon:"📈",title:"저축률 코칭",text:savingsRate>=30?"목표 자산 형성에 유리한 저축률입니다.":`현재 저축률은 ${fmtPct(savingsRate)}입니다. 1차 목표는 20%, 다음 목표는 30%로 잡아보세요.`},
      {tone:emergencyMonths>=6?"good":emergencyMonths>=3?"info":"danger",icon:"🛡️",title:"안전자금 판단",text:expense>0?`현재 비상금은 월 지출 기준 약 ${emergencyMonths.toFixed(1)}개월치입니다.`:"월 지출 데이터가 있어야 비상금 개월 수를 계산할 수 있어요."},
      {tone:overBudget.length?"warn":"good",icon:"🧾",title:"예산 습관",text:overBudget.length?`${overBudget.map(b=>b.cat1).slice(0,3).join(" · ")} 항목이 예산을 넘었습니다.`:"예산 초과 항목이 크지 않아 소비 통제는 양호합니다."},
      {tone:pensionRemaining>0?"info":"good",icon:"🏦",title:"절세 포인트",text:pensionRemaining>0?`연금 세액공제 여력 ${fmt(pensionRemaining)}원이 남아 있습니다.`:"현재 입력 기준으로 큰 절세 누락 신호는 없습니다."},
      {tone:investWeight>=50?"good":"info",icon:"🎯",title:"투자 연결",text:monthlyInvestTarget>0?`월 투자 기준금액은 ${fmt(monthlyInvestTarget)}원입니다. 흑자 달에는 자동 배분 규칙을 적용해보세요.`:"월 투자 기준금액을 설정하면 코칭 정확도가 올라갑니다."},
    ];

    const nextSteps=[];
    if(net<0) nextSteps.push({title:"적자 원인 1개만 먼저 찾기",text:"고액 거래와 지출 TOP 5에서 다음 달 줄일 항목을 하나만 고르세요."});
    if(overBudget.length>0) nextSteps.push({title:`${overBudget[0].cat1} 예산 재설계`,text:"예산을 올릴지, 소비 횟수를 줄일지 둘 중 하나를 정하세요."});
    if(net>0 && emergencyMonths<6) nextSteps.push({title:"흑자 금액 자동 분배",text:"잉여 현금을 비상금 50%, 투자 50%처럼 규칙화하세요."});
    if(net>0 && emergencyMonths>=6) nextSteps.push({title:"목표 포트폴리오로 자동 매수",text:"남는 현금을 목표 비중에 맞춰 배분하세요."});
    if(pensionRemaining>0) nextSteps.push({title:"절세 한도 월할 계산",text:"남은 세액공제 한도를 남은 개월 수로 나눠 월 납입액을 정하세요."});
    if(nextSteps.length===0) nextSteps.push({title:"현재 루틴 유지",text:"거래 입력, 예산 점검, 월말 리포트 확인 루틴을 유지하세요."});

    const summaryText=[
      `${month} 월간 리포트예요 😊`,
      `AI 코칭 점수는 ${aiScore}점(${aiGrade})입니다. ${headline}`,
      `이번 달 수입은 ${fmt(income)}원, 지출은 ${fmt(expense)}원이에요. 그래서 최종 순현금흐름은 ${fmt(net)}원입니다.`,
      `저축률은 ${fmtPct(savingsRate)}이고, 전월 대비 지출 변화율은 ${fmtPct(expenseChange)}예요. ${topExpenseSentence}`,
      `AI 해석: ${aiMessage}`,
      issues.length ? `확인할 점\n${issues.map(i => `• ${i.title}: ${i.text}`).join("\n")}` : "확인할 점\n• 특별한 이상 신호는 크지 않아요.",
      actions.length ? `다음 달 추천 행동\n${actions.map(a => `• ${a.title}: ${a.text}`).join("\n")}` : "다음 달 추천 행동\n• 지금처럼 꾸준히 기록하고 점검하면 돼요.",
      nextSteps.length ? `실행 순서\n${nextSteps.slice(0,3).map((a,idx)=>`${idx+1}. ${a.title} - ${a.text}`).join("\n")}` : ""
    ].filter(Boolean).join("\n\n");

    return {tx,income,expense,transfer,net,savingsRate,incomeChange,expenseChange,netChange,topExpenses,incomeBreakdown,highTx,topDays,budgetRows,overBudget,warningBudget,issues,actions,summaryText,headline,topExpenseSentence,aiScore,aiTone,aiGrade,aiMessage,coachingCards,nextSteps,emergencyMonths};
  },[data,month,monthlySeries,budgetAnalysis,taxAnalysis,dashboardDetail,financialAnalysis,dashboard]);

  const copyReport=async()=>{
    try{await navigator.clipboard.writeText(report.summaryText);alert("월간 리포트 요약을 복사했습니다.");}
    catch{alert("복사에 실패했습니다. 브라우저 권한을 확인하세요.");}
  };

  const printReport=()=>window.print();

  return (
    <div className="stack monthly-report">
      <div className="card report-hero">
        <div>
          <div className="kpi-label">MONTHLY CFO REPORT</div>
          <h2>월간 리포트 자동 생성</h2>
          <p>거래내역을 기준으로 수입·지출·예산·투자·절세 행동을 월별로 자동 요약합니다.</p>
        </div>
        <div className="row">
          <select value={month} onChange={e=>setMonth(e.target.value)}>
            {(months.length?months:[thisMonthISO()]).map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn btn-sm btn-ghost" onClick={copyReport}>요약 복사</button>
          <button className="btn btn-sm btn-primary" onClick={printReport}>출력/PDF</button>
        </div>
      </div>

      <div className="ai-coach-hero">
        <div className={`ai-coach-panel ${report.aiTone}`}>
          <div className="ai-coach-kicker">AI Monthly Coach</div>
          <div className="ai-coach-title">{report.headline}</div>
          <div className="ai-coach-message">{report.aiMessage}</div>
          <div className="summary-chip-row">
            <span className="summary-chip-lg">💰 순현금흐름 {fmt(report.net)}원</span>
            <span className="summary-chip-lg">📈 저축률 {fmtPct(report.savingsRate)}</span>
            <span className="summary-chip-lg">🛡️ 비상금 {report.emergencyMonths.toFixed(1)}개월</span>
            <span className="summary-chip-lg">✅ 추천 행동 {report.actions.length}개</span>
          </div>
        </div>
        <div className="ai-coach-score-card">
          <div className="kpi-label">AI COACHING SCORE</div>
          <div className={`ai-coach-score ${report.aiTone==="good"?"text-green":report.aiTone==="danger"?"text-red":"text-accent"}`}>{report.aiScore}<span>/100</span></div>
          <span className={`badge ${report.aiTone==="good"?"badge-green":report.aiTone==="danger"?"badge-red":"badge-amber"}`}>{report.aiGrade}</span>
          <p className="small muted">현금흐름, 저축률, 예산 초과, 비상금, 절세 여력을 함께 반영한 월간 코칭 점수입니다.</p>
        </div>
      </div>

      <div className="ai-coach-grid">
        {report.coachingCards.map((c,idx)=>(
          <div key={idx} className={`ai-coach-card ${c.tone}`}>
            <div className="ai-coach-card-head"><span>{c.icon}</span><strong>{c.title}</strong></div>
            <p>{c.text}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title"><h3>다음 달 실행 순서</h3><span className="badge badge-accent">자동 코칭</span></div>
        <div className="g3">
          {report.nextSteps.slice(0,3).map((step,idx)=>(
            <div key={idx} className="ai-coach-next">
              <div className="ai-coach-next-no">{idx+1}</div>
              <div><strong>{step.title}</strong><p>{step.text}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="월 수입" value={report.income} unit="원" tone="green"/>
        <KpiCard label="월 지출" value={report.expense} unit="원" tone="red"/>
        <KpiCard label="순현금흐름" value={report.net} unit="원" tone={report.net>=0?"green":"red"}/>
        <KpiCard label="저축률" value={report.savingsRate} unit="%" accent/>
      </div>

      <div className="g3">
        <div className="card">
          <h3>월간 핵심 요약</h3>
          <div className="stat-row"><span className="stat-label">전월 대비 수입</span><span className={`stat-value ${report.incomeChange>=0?"text-green":"text-red"}`}>{fmtPct(report.incomeChange)}</span></div>
          <div className="stat-row"><span className="stat-label">전월 대비 지출</span><span className={`stat-value ${report.expenseChange>0?"text-red":"text-green"}`}>{fmtPct(report.expenseChange)}</span></div>
          <div className="stat-row"><span className="stat-label">전월 대비 순현금흐름</span><span className={`stat-value ${report.netChange>=0?"text-green":"text-red"}`}>{fmtPct(report.netChange)}</span></div>
          <div className="stat-row"><span className="stat-label">거래 건수</span><span className="stat-value">{report.tx.length}건</span></div>
        </div>

        <div className="card">
          <h3>자동 진단</h3>
          <div className="stack" style={{gap:8}}>
            {report.issues.map((i,idx)=>(
              <div key={idx} className={`compact-insight ${i.tone}`}>
                <span>{i.tone==="danger"?"🔥":i.tone==="warn"?"⚠️":i.tone==="info"?"💡":"✅"}</span>
                <div><strong>{i.title}</strong><p>{i.text}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>다음 달 행동 추천</h3>
          <div className="stack" style={{gap:8}}>
            {report.actions.map((a,idx)=>(
              <div key={idx} className="action-item">
                <span className="badge badge-accent">{a.tag}</span>
                <div><strong>{a.title}</strong><p>{a.text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <h3>지출 TOP 5</h3>
          {report.topExpenses.length?report.topExpenses.map(x=>(
            <div key={x.cat} className="budget-item">
              <div className="budget-header">
                <span className="budget-name">{x.cat}</span>
                <span className="budget-nums">{fmt(x.amount)}원 · {fmtPct(x.rate)}</span>
              </div>
              <div className="progress"><div className="progress-fill pf-red" style={{width:`${clamp(x.rate,0,100)}%`}}/></div>
            </div>
          )):<div className="empty">지출 데이터가 없습니다.</div>}
        </div>

        <div className="card">
          <h3>예산 점검</h3>
          {report.budgetRows.slice(0,6).map(b=>(
            <div key={b.cat1} className="budget-item">
              <div className="budget-header">
                <span className="budget-name">{b.cat1}</span>
                <div className="row" style={{gap:8}}>
                  <span className="budget-nums">{fmt(b.spent)} / {fmt(b.budget)}원</span>
                  <span className={`badge ${b.status==="초과"?"badge-red":b.status==="주의"?"badge-amber":"badge-green"}`}>{b.status}</span>
                </div>
              </div>
              <div className="progress"><div className={`progress-fill ${b.status==="초과"?"pf-red":b.status==="주의"?"pf-amber":"pf-accent"}`} style={{width:`${clamp(b.rate,0,100)}%`}}/></div>
            </div>
          ))}
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <h3>고액 거래 TOP 5</h3>
          {report.highTx.length?report.highTx.map(t=>(
            <div key={t.id} className="tx-item">
              <div className="tx-icon" style={{background:t.type==="수입"?"var(--green-bg)":t.type==="지출"?"var(--red-bg)":"var(--surface2)"}}>{t.type==="수입"?"💰":t.type==="지출"?"💳":"🔄"}</div>
              <div className="tx-meta"><div className="tx-name">{t.content||t.cat2}</div><div className="tx-date">{t.date} · {t.cat1}</div></div>
              <div className={`tx-amt ${t.type==="수입"?"text-green":t.type==="지출"?"text-red":""}`}>{fmt(t.amount)}원</div>
            </div>
          )):<div className="empty">100만원 이상 거래가 없습니다.</div>}
        </div>

        <div className="card">
          <h3>보고서 원문</h3>
          <textarea readOnly value={report.summaryText} style={{width:"100%",minHeight:300,padding:14,borderRadius:12,border:"1px solid var(--border2)",background:"var(--surface2)",color:"var(--text2)",fontSize:12,lineHeight:1.6}}/>
        </div>
      </div>
    </div>
  );
}

// ─── Simulation Tab ───────────────────────────────────────────────────────────
function SimulationTab({ data, futureSim }) {
  const [scenario,setScenario]=useState("base");
  const s=data.settings;

  const advanced=useMemo(()=>{
    const currentAge=n(s.currentAge), retireAge=n(s.retireAge), compareAge=n(s.compareRetireAge||60), lifeAge=n(s.lifeExpectancy||100);
    const inflation=n(s.annualInflation||0.025);
    const postReturnBase=n(s.postRetirementReturn||0.07);
    const monthlyExpenseBase=n(s.retirementMonthlyExpense||5000000);
    const additionalPensionEnabled=!!s.additionalPensionEnabled;
    const pension0=additionalPensionEnabled?n(s.additionalPensionMonthly||0):0;
    const pensionAnnualInc=additionalPensionEnabled?n(s.additionalPensionAnnualIncrease||0):0;
    const travelBucket=n(s.retirementTravelBucket||0);
    const travelYears=Math.max(n(s.retirementTravelYears||5),1);
    const target=n(s.retirementTargetAmount||0);

    const rawTargets=getInvestmentTargets(s).filter(t=>n(t.targetWeight)>0);
    const fallbackTargets=[
      {id:"target-nasdaq",name:"나스닥",expectedReturn:n(s.annualReturnNasdaq||0.12),targetWeight:n(s.targetNasdaqWeight)+n(s.targetNasdaqHWeight)},
      {id:"target-dividend",name:"배당",expectedReturn:n(s.annualReturnDividend||0.08),targetWeight:n(s.targetDividendWeight)}
    ].filter(t=>n(t.targetWeight)>0);
    const targetRows=(rawTargets.length?rawTargets:fallbackTargets).map(t=>({
      id:t.id||t.name||uid(),
      name:t.name||"전략",
      expectedReturn:n(t.expectedReturn),
      targetWeight:n(t.targetWeight)
    }));
    const totalWeight=targetRows.reduce((sum,t)=>sum+n(t.targetWeight),0)||1;
    const normalizedTargets=targetRows.map(t=>({...t,normalizedWeight:n(t.targetWeight)/totalWeight}));
    const weightedReturn=normalizedTargets.reduce((sum,t)=>sum+n(t.expectedReturn)*n(t.normalizedWeight),0);

    const scenarioReturnAdjust=scenario==="stress"?-0.03:scenario==="optimistic"?0.02:0;
    const scenarioExpenseMultiplier=scenario==="stress"?1.15:scenario==="optimistic"?0.95:1;
    const postReturn=Math.max(postReturnBase+scenarioReturnAdjust,0);
    const monthlyExpense0=monthlyExpenseBase*scenarioExpenseMultiplier;
    const scenarioLabel=scenario==="stress"?"보수":scenario==="optimistic"?"낙관":"기본";

    const buildAccumulation=(targetRetireAge)=>{
      const years=Math.max(targetRetireAge-currentAge,0);
      const buckets={};
      normalizedTargets.forEach(t=>{buckets[t.name]=0;});
      let isaBalance=0,isaPrincipalInCycle=0,realizedIsaTaxSavedAcc=0,pensionCreditAcc=0,total=0;
      const isaAnnualLimit=Math.max(n(s.isaAnnualLimit),0),isaCycleYears=Math.max(n(s.isaCycleYears),1);
      const isaTaxFreeLimit=Math.max(n(s.isaTaxFreeLimit),0),isaTaxRate=Math.max(n(s.isaTaxRate),0);
      const normalTaxRate=Math.max(n(s.taxableDividendTaxRate),0);
      const pensionTaxCreditRate=Math.max(n(s.pensionTaxCreditRate),0);
      const annualPensionContribution=Math.max(n(s.annualPensionContribution),0);
      const pensionAnnualTaxCreditLimit=Math.max(n(s.pensionAnnualTaxCreditLimit),0);
      const rows=[];
      for(let year=1;year<=years;year++){
        let monthlyInvest=n(s.monthlyInvestStage3);
        if(year<=n(s.stage1Years))monthlyInvest=n(s.monthlyInvestStage1);
        else if(year<=n(s.stage2Years))monthlyInvest=n(s.monthlyInvestStage2);
        const annualInvest=monthlyInvest*12;
        normalizedTargets.forEach(t=>{
          const r=Math.max(n(t.expectedReturn)+scenarioReturnAdjust, -0.95);
          buckets[t.name]=(n(buckets[t.name])+annualInvest*n(t.normalizedWeight))*(1+r);
        });
        total=Object.values(buckets).reduce((sum,v)=>sum+n(v),0);
        const annualIsaContribution=Math.min(annualInvest,isaAnnualLimit);
        const yearInCycle=((year-1)%isaCycleYears)+1;
        if(yearInCycle===1){isaBalance=0;isaPrincipalInCycle=0;}
        isaPrincipalInCycle+=annualIsaContribution;
        isaBalance=(isaBalance+annualIsaContribution)*(1+Math.max(weightedReturn+scenarioReturnAdjust,-0.95));
        const isaProfitInCycle=Math.max(isaBalance-isaPrincipalInCycle,0);
        const normalTaxIfTaxable=isaProfitInCycle*normalTaxRate;
        const isaTax=isaProfitInCycle<=isaTaxFreeLimit?0:(isaProfitInCycle-isaTaxFreeLimit)*isaTaxRate;
        const currentCycleTaxSaved=Math.max(normalTaxIfTaxable-isaTax,0);
        if(yearInCycle===isaCycleYears) realizedIsaTaxSavedAcc+=currentCycleTaxSaved;
        pensionCreditAcc+=Math.min(annualPensionContribution,pensionAnnualTaxCreditLimit)*pensionTaxCreditRate;
        rows.push({
          year,
          yearLabel:`${new Date().getFullYear()+year-1}`,
          age:currentAge+year,
          monthlyInvest,
          annualInvest,
          total,
          buckets:{...buckets},
          bucketValues:normalizedTargets.map(t=>({name:t.name,value:n(buckets[t.name]),weight:n(t.normalizedWeight),returnRate:n(t.expectedReturn)+scenarioReturnAdjust})),
          isaBalance,
          isaTaxSaved:realizedIsaTaxSavedAcc+(yearInCycle===isaCycleYears?0:currentCycleTaxSaved),
          pensionCreditAcc
        });
      }
      return {
        rows,
        last:rows[rows.length-1]||{
          age:targetRetireAge,total:0,buckets:{},bucketValues:normalizedTargets.map(t=>({name:t.name,value:0,weight:n(t.normalizedWeight),returnRate:n(t.expectedReturn)+scenarioReturnAdjust})),
          isaTaxSaved:0,pensionCreditAcc:0
        }
      };
    };

    const buildWithdrawal=(retireAge, startAsset)=>{
      const rows=[];
      let asset=Math.max(n(startAsset)-travelBucket,0);
      for(let age=retireAge; age<=lifeAge; age++){
        const y=age-retireAge;
        const annualExpense=monthlyExpense0*12*Math.pow(1+inflation,y);
        const annualPension=(pension0+(pensionAnnualInc*y))*12;
        const travelExtra=y<travelYears ? travelBucket/travelYears : 0;
        const needWithdraw=Math.max(annualExpense+travelExtra-annualPension,0);
        const beginAsset=asset;
        asset=Math.max((asset-needWithdraw)*(1+postReturn),0);
        rows.push({age,year:y+1,beginAsset,annualExpense,annualPension,travelExtra,needWithdraw,endAsset:asset,shortfall:beginAsset<needWithdraw});
      }
      const firstZero=rows.find(r=>r.endAsset<=0);
      return {rows,success:!firstZero,firstZeroAge:firstZero?.age||null,last:rows[rows.length-1]};
    };

    const baseAcc=buildAccumulation(retireAge);
    const compareAcc=buildAccumulation(compareAge);
    const baseWithdraw=buildWithdrawal(retireAge,baseAcc.last.total);
    const compareWithdraw=buildWithdrawal(compareAge,compareAcc.last.total);

    return {currentAge,retireAge,compareAge,lifeAge,target,baseAcc,compareAcc,baseWithdraw,compareWithdraw,scenarioReturnAdjust,scenarioExpenseMultiplier,scenarioLabel,targets:normalizedTargets,weightedReturn,postReturn,monthlyExpense0};
  },[s,scenario]);

  const base=advanced.baseAcc.last;
  const w=advanced.baseWithdraw;
  const compare=advanced.compareAcc.last;
  const cw=advanced.compareWithdraw;
  const survivalAge=w.success?advanced.lifeAge:w.firstZeroAge;
  const targetRate=advanced.target>0?n(base.total)/advanced.target*100:0;

  return (
    <div className="stack retirement-pro">
      {/* ── 자연어 요약 카드 ── */}
      {(() => {
        const nlp = buildSimulationNLP({ advanced, base, w, targetRate, scenario });
        return <NaturalInsightCard icon={nlp.icon} title={nlp.title} message={nlp.message} tone={nlp.tone} actions={nlp.actions}/>;
      })()}
      <AICoachPanel coach={buildIntegratedCoach({ area:"미래 시뮬레이션", data, futureSim })}/>
      <div className="card retirement-hero">
        <div>
          <div className="kpi-label">ADVANCED RETIREMENT SIMULATION</div>
          <h2>은퇴 시뮬레이션 완전 고도화</h2>
          <p>설정 탭의 투자 수익률 / 목표 비중을 자동으로 가져와 연도별 시뮬레이션에 반영합니다.</p>
        </div>
        <div className="tab-row" style={{marginBottom:0}}>
          <button className={`tab-chip ${scenario==="base"?"active":""}`} onClick={()=>setScenario("base")}>기본</button>
          <button className={`tab-chip ${scenario==="stress"?"active":""}`} onClick={()=>setScenario("stress")}>보수</button>
          <button className={`tab-chip ${scenario==="optimistic"?"active":""}`} onClick={()=>setScenario("optimistic")}>낙관</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label={`${advanced.retireAge}세 예상자산`} value={base.total} unit="원" accent/>
        <KpiCard label="목표 달성률" value={targetRate} unit="%" tone={targetRate>=100?"green":"red"}/>
        <KpiCard label="은퇴 후 생존 가능 나이" value={survivalAge||0} unit="세" tone={w.success?"green":"red"}/>
        <KpiCard label="가중 기대수익률" value={advanced.weightedReturn*100} unit="%" />
      </div>

      <div className="card">
        <div className="card-title">
          <h3>시뮬레이션 반영 전략</h3>
          <span className="badge badge-accent">설정 탭에서 자동 반영</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>전략/자산군</th><th className="td-right">목표비중</th><th className="td-right">연 기대수익률</th><th className="td-right">{advanced.retireAge}세 예상금액</th></tr></thead>
            <tbody>
              {base.bucketValues.map(b=>(
                <tr key={b.name}>
                  <td className="td-name">{b.name}</td>
                  <td className="td-right td-mono">{fmtPct(b.weight*100)}</td>
                  <td className="td-right td-mono">{fmtPct(b.returnRate*100)}</td>
                  <td className="td-right td-mono text-accent">{fmt(b.value)}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <h3>은퇴 후 인출 핵심</h3>
          <div className="stat-row"><span className="stat-label">은퇴 후 월 생활비</span><span className="stat-value">{fmt(s.retirementMonthlyExpense)}원</span></div>
          <div className="stat-row"><span className="stat-label">{s.additionalPensionEnabled?(s.additionalPensionName||"추가 연금"):"추가 연금 미사용"}</span><span className="stat-value text-green">{fmt(s.additionalPensionEnabled?s.additionalPensionMonthly:0)}원</span></div>
          <div className="stat-row"><span className="stat-label">여행비 선차감</span><span className="stat-value">{fmt(s.retirementTravelBucket)}원</span></div>
          <div className="stat-row"><span className="stat-label">은퇴 후 운용수익률</span><span className="stat-value">{fmtPct(n(s.postRetirementReturn)*100)}</span></div>
          <div className="stat-row"><span className="stat-label">물가상승률</span><span className="stat-value">{fmtPct(n(s.annualInflation)*100)}</span></div>
        </div>

        <div className="card">
          <h3>{advanced.retireAge}세 vs {advanced.compareAge}세 비교</h3>
          <div className="stat-row"><span className="stat-label">{advanced.retireAge}세 은퇴자산</span><span className="stat-value">{fmt(base.total)}원</span></div>
          <div className="stat-row"><span className="stat-label">{advanced.compareAge}세 은퇴자산</span><span className="stat-value text-accent">{fmt(compare.total)}원</span></div>
          <div className="stat-row"><span className="stat-label">차이</span><span className="stat-value text-green">{fmt(compare.total-base.total)}원</span></div>
          <div className="stat-row"><span className="stat-label">{advanced.retireAge}세 생존</span><span className={`stat-value ${w.success?"text-green":"text-red"}`}>{w.success?"기대수명까지":"중도 고갈"}</span></div>
          <div className="stat-row"><span className="stat-label">{advanced.compareAge}세 생존</span><span className={`stat-value ${cw.success?"text-green":"text-red"}`}>{cw.success?"기대수명까지":"중도 고갈"}</span></div>
        </div>

        <div className="card">
          <h3>판단 요약</h3>
          <div className={`compact-insight ${targetRate>=100?"green":"warn"}`}>
            <span>{targetRate>=100?"✅":"⚠️"}</span>
            <div><strong>목표 달성률</strong><p>{fmtPct(targetRate)}입니다. {targetRate>=100?"현재 가정상 목표를 초과합니다.":"월 투자금 또는 은퇴 나이 조정 검토가 필요합니다."}</p></div>
          </div>
          <div className={`compact-insight ${w.success?"green":"danger"}`} style={{marginTop:8}}>
            <span>{w.success?"🛡️":"🔥"}</span>
            <div><strong>은퇴 후 고갈 위험</strong><p>{w.success?`${advanced.lifeAge}세까지 자산 유지 가능`:`${w.firstZeroAge}세 전후 자산 고갈 가능`}</p></div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <h3>은퇴 전 적립 시뮬레이션</h3>
          <div className="table-wrap" style={{maxHeight:420}}>
            <table>
              <thead>
                <tr>
                  <th>연도</th><th>나이</th><th className="td-right">월투자금</th>
                  {advanced.targets.map(t=><th key={t.name} className="td-right">{t.name}</th>)}
                  <th className="td-right">총자산</th>
                </tr>
              </thead>
              <tbody>
                {advanced.baseAcc.rows.map(r=>(
                  <tr key={r.year}>
                    <td>{r.yearLabel}</td><td>{r.age}</td>
                    <td className="td-right td-mono">{fmt(r.monthlyInvest)}</td>
                    {advanced.targets.map(t=><td key={t.name} className="td-right td-mono">{fmt(r.buckets[t.name]||0)}</td>)}
                    <td className="td-right td-mono text-accent">{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>은퇴 후 인출 시뮬레이션</h3>
          <div className="table-wrap" style={{maxHeight:420}}>
            <table>
              <thead><tr><th>나이</th><th className="td-right">생활비</th><th className="td-right">추가연금</th><th className="td-right">여행비</th><th className="td-right">인출액</th><th className="td-right">연말자산</th></tr></thead>
              <tbody>
                {advanced.baseWithdraw.rows.map(r=>(
                  <tr key={r.age}>
                    <td>{r.age}</td>
                    <td className="td-right td-mono">{fmt(r.annualExpense)}</td>
                    <td className="td-right td-mono text-green">{fmt(r.annualPension)}</td>
                    <td className="td-right td-mono">{fmt(r.travelExtra)}</td>
                    <td className="td-right td-mono text-red">{fmt(r.needWithdraw)}</td>
                    <td className={`td-right td-mono ${r.endAsset>0?"text-accent":"text-red"}`}>{fmt(r.endAsset)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>연도별 시뮬레이션 결과</h3>
        <div className="table-wrap" style={{maxHeight:420}}>
          <table>
            <thead>
              <tr>
                <th>연도</th><th>나이</th><th>년차</th><th className="td-right">월투자금</th>
                {advanced.targets.map(t=><th key={t.name} className="td-right">{t.name}</th>)}
                <th className="td-right">ISA절세누적</th><th className="td-right">연금세액공제누적</th><th className="td-right">총자산</th>
              </tr>
            </thead>
            <tbody>
              {advanced.baseAcc.rows.map(r=>(
                <tr key={r.year}>
                  <td>{r.yearLabel}</td><td>{r.age}</td><td>{r.year}</td>
                  <td className="td-right td-mono">{fmt(r.monthlyInvest)}</td>
                  {advanced.targets.map(t=><td key={t.name} className="td-right td-mono">{fmt(r.buckets[t.name]||0)}</td>)}
                  <td className="td-right td-mono text-green">{fmt(r.isaTaxSaved)}</td>
                  <td className="td-right td-mono text-green">{fmt(r.pensionCreditAcc)}</td>
                  <td className="td-right td-mono text-accent">{fmt(r.total)}</td>
                </tr>
              ))}
              {!advanced.baseAcc.rows.length&&<tr><td colSpan={advanced.targets.length+7}><div className="empty">설정값을 확인하세요.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InvestmentTargetSettings({settings,set}){
  const rows=getInvestmentTargets(settings);
  const updateRow=(id,patch)=>{
    set("investmentTargets", rows.map(r=>r.id===id?{...r,...patch}:r));
  };
  const addRow=()=>{
    set("investmentTargets", [...rows,{id:uid(),name:"새 전략",expectedReturn:0.08,targetWeight:0,memo:""}]);
  };
  const removeRow=(id)=>{
    set("investmentTargets", rows.filter(r=>r.id!==id));
  };
  const totalWeight=rows.reduce((sum,r)=>sum+n(r.targetWeight),0);
  const weightedReturn=getWeightedExpectedReturn(settings);
  return (
    <div className="card">
      <div className="card-title">
        <h3>투자 수익률 / 목표 비중</h3>
        <div className="row">
          <span className={`badge ${Math.abs(totalWeight-1)<=0.001?"badge-green":"badge-amber"}`}>합계 {fmtPct(totalWeight*100)}</span>
          <span className="badge badge-accent">가중 기대수익률 {fmtPct(weightedReturn*100)}</span>
          <button className="btn btn-sm btn-ghost" onClick={addRow}>+ 전략 추가</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>전략/자산군명</th><th>연 기대수익률</th><th>목표비중</th><th>메모</th><th>작업</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td><input value={r.name} onChange={e=>updateRow(r.id,{name:e.target.value})} placeholder="예: 나스닥, 배당, 현금"/></td>
                <td><input type="number" step="0.001" value={r.expectedReturn} onChange={e=>updateRow(r.id,{expectedReturn:Number(e.target.value)})}/></td>
                <td><input type="number" step="0.01" value={r.targetWeight} onChange={e=>updateRow(r.id,{targetWeight:Number(e.target.value)})}/></td>
                <td><input value={r.memo||""} onChange={e=>updateRow(r.id,{memo:e.target.value})} placeholder="설명"/></td>
                <td><button className="btn btn-sm btn-danger" onClick={()=>removeRow(r.id)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:10,fontSize:12,color:Math.abs(totalWeight-1)<=0.001?"var(--text3)":"var(--amber)",lineHeight:1.5}}>
        목표비중은 0~1로 입력합니다. 예: 90% = 0.90. 포트폴리오 종목의 자산군명과 이 표의 전략명이 같아야 리밸런싱에 반영됩니다.
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ data, update }) {
  const s=data.settings;
  const set=(k,v)=>update(d=>({...d,settings:{...d.settings,[k]:v}}));
  return (
    <div className="stack">
      <div className="g2">
        <div className="card">
          <h3>기본 정보</h3>
          <div className="form-grid-3">
            <Field label="현재 나이"><input type="number" value={s.currentAge} onChange={e=>set("currentAge",n(e.target.value))}/></Field>
            <Field label="은퇴 나이"><input type="number" value={s.retireAge} onChange={e=>set("retireAge",n(e.target.value))}/></Field>
            <Field label="기대 수명"><input type="number" value={s.lifeExpectancy} onChange={e=>set("lifeExpectancy",n(e.target.value))}/></Field>
            <Field label="월급(본인)"><input value={s.monthlySalary1} onChange={e=>set("monthlySalary1",n(e.target.value))}/></Field>
            <Field label="월급(배우자)"><input value={s.monthlySalary2} onChange={e=>set("monthlySalary2",n(e.target.value))}/></Field>
            <Field label="연 물가상승률"><input type="number" step="0.001" value={s.annualInflation} onChange={e=>set("annualInflation",Number(e.target.value))}/></Field>
            <Field label="은퇴 목표자산"><input value={s.retirementTargetAmount} onChange={e=>set("retirementTargetAmount",n(e.target.value))}/></Field>
            <Field label="은퇴 후 월 생활비"><input value={s.retirementMonthlyExpense} onChange={e=>set("retirementMonthlyExpense",n(e.target.value))}/></Field>
            <Field label="추가 연금 사용 여부">
              <select value={s.additionalPensionEnabled ? "사용" : "미사용"} onChange={e=>set("additionalPensionEnabled", e.target.value==="사용")}>
                <option value="미사용">미사용</option>
                <option value="사용">사용</option>
              </select>
            </Field>
            <Field label="추가 연금 명칭">
              <input value={s.additionalPensionName ?? "추가 연금"} onChange={e=>set("additionalPensionName", e.target.value)} placeholder="예: 보훈연금, 장애인연금, 개인연금"/>
            </Field>
            <Field label="추가 연금 월 수령액">
              <input value={s.additionalPensionMonthly ?? ""} onChange={e=>set("additionalPensionMonthly", n(e.target.value))} placeholder="0"/>
            </Field>
            <Field label="추가 연금 연 증가액">
              <input value={s.additionalPensionAnnualIncrease ?? ""} onChange={e=>set("additionalPensionAnnualIncrease", n(e.target.value))} placeholder="0"/>
            </Field>
            <Field label="여행비 예산"><input value={s.retirementTravelBucket} onChange={e=>set("retirementTravelBucket",n(e.target.value))}/></Field>
            <Field label="여행비 사용기간(년)"><input type="number" value={s.retirementTravelYears} onChange={e=>set("retirementTravelYears",n(e.target.value))}/></Field>
            <Field label="은퇴 후 운용수익률"><input type="number" step="0.001" value={s.postRetirementReturn} onChange={e=>set("postRetirementReturn",Number(e.target.value))}/></Field>
            <Field label="비교 은퇴나이"><input type="number" value={s.compareRetireAge} onChange={e=>set("compareRetireAge",n(e.target.value))}/></Field>
          </div>
          <div className={`alert ${s.additionalPensionEnabled?"alert-info":"alert-warn"}`} style={{marginTop:14}}>
            <strong>추가 연금 반영 상태: {s.additionalPensionEnabled ? "사용" : "미사용"}</strong>
            <div style={{marginTop:6,fontSize:12,lineHeight:1.5}}>
              {s.additionalPensionEnabled
                ? `${s.additionalPensionName || "추가 연금"} 월 ${fmt(s.additionalPensionMonthly || 0)}원, 연 증가액 ${fmt(s.additionalPensionAnnualIncrease || 0)}원이 은퇴 후 인출 시뮬레이션에 반영됩니다.`
                : "미사용 상태에서는 입력값이 저장되어도 은퇴 시뮬레이션에는 0원으로 반영됩니다."}
            </div>
          </div>
        </div>
        <div className="card">
          <h3>ISA / 절세 설정</h3>
          <div className="form-grid-3">
            <Field label="ISA 연간 납입 한도"><input value={s.isaAnnualLimit} onChange={e=>set("isaAnnualLimit",n(e.target.value))}/></Field>
            <Field label="ISA 만기 주기(년)"><input value={s.isaCycleYears} onChange={e=>set("isaCycleYears",n(e.target.value))}/></Field>
            <Field label="ISA 비과세 한도"><input value={s.isaTaxFreeLimit} onChange={e=>set("isaTaxFreeLimit",n(e.target.value))}/></Field>
            <Field label="ISA 초과분 세율"><input type="number" step="0.001" value={s.isaTaxRate} onChange={e=>set("isaTaxRate",Number(e.target.value))}/></Field>
            <Field label="연금 세액공제율"><input type="number" step="0.001" value={s.pensionTaxCreditRate} onChange={e=>set("pensionTaxCreditRate",Number(e.target.value))}/></Field>
            <Field label="일반 배당세율"><input type="number" step="0.001" value={s.taxableDividendTaxRate} onChange={e=>set("taxableDividendTaxRate",Number(e.target.value))}/></Field>
            <Field label="ISA→연금 이전 비율"><input type="number" step="0.1" value={s.isaPensionTransferRatio} onChange={e=>set("isaPensionTransferRatio",Number(e.target.value))}/></Field>
            <Field label="연금 납입액(연)"><input value={s.annualPensionContribution} onChange={e=>set("annualPensionContribution",n(e.target.value))}/></Field>
            <Field label="연금 공제한도(연)"><input value={s.pensionAnnualTaxCreditLimit} onChange={e=>set("pensionAnnualTaxCreditLimit",n(e.target.value))}/></Field>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">
          <h3>시장 데이터 / 환율 설정</h3>
          <span className="badge badge-muted">1단계: 실제 가격·환율 반영</span>
        </div>
        <div className="form-grid-3">
          <Field label="USD/KRW 환율"><input value={s.fxUsdKrw||""} onChange={e=>set("fxUsdKrw",n(e.target.value))} placeholder="예: 1380"/></Field>
          <Field label="환율 기준시각"><input value={s.fxAsOf?String(s.fxAsOf).replace("T"," ").slice(0,19):""} onChange={e=>set("fxAsOf",e.target.value)} placeholder="자동 갱신 시 입력"/></Field>
          <Field label="마지막 시장데이터 갱신"><input value={s.marketDataLastUpdated?String(s.marketDataLastUpdated).replace("T"," ").slice(0,19):""} readOnly placeholder="자동 기록"/></Field>
        </div>
        <div style={{marginTop:10,fontSize:12,color:"var(--text3)",lineHeight:1.5}}>
          해외주식·해외 ETF처럼 통화가 USD인 종목은 현재가와 평단에 USD/KRW 환율을 곱해 원화 평가금액으로 계산합니다. 자동 조회가 실패하면 이 환율을 직접 입력해도 됩니다.
        </div>
      </div>
      <InvestmentTargetSettings settings={s} set={set}/>
      <div className="g2">
        <div className="card">
          <h3>투자 스케줄 / 규칙</h3>
          <div className="form-grid-3">
            <Field label="1단계 월 투자금"><input value={s.monthlyInvestStage1} onChange={e=>set("monthlyInvestStage1",n(e.target.value))}/></Field>
            <Field label="2단계 월 투자금"><input value={s.monthlyInvestStage2} onChange={e=>set("monthlyInvestStage2",n(e.target.value))}/></Field>
            <Field label="3단계 월 투자금"><input value={s.monthlyInvestStage3} onChange={e=>set("monthlyInvestStage3",n(e.target.value))}/></Field>
            <Field label="1단계 기간(년)"><input value={s.stage1Years} onChange={e=>set("stage1Years",n(e.target.value))}/></Field>
            <Field label="2단계 기간(년)"><input value={s.stage2Years} onChange={e=>set("stage2Years",n(e.target.value))}/></Field>
            <Field label="리밸런싱 허용편차(%)"><input value={s.rebalanceBandPct} onChange={e=>set("rebalanceBandPct",n(e.target.value))}/></Field>
            <Field label="익절 기준(%)"><input value={s.takeProfitPct} onChange={e=>set("takeProfitPct",n(e.target.value))}/></Field>
            <Field label="-3% 추가매수"><input value={s.dipBuy3PctAmount} onChange={e=>set("dipBuy3PctAmount",n(e.target.value))}/></Field>
            <Field label="-5% 추가매수"><input value={s.dipBuy5PctAmount} onChange={e=>set("dipBuy5PctAmount",n(e.target.value))}/></Field>
            <Field label="-10% 추가매수"><input value={s.dipBuy10PctAmount} onChange={e=>set("dipBuy10PctAmount",n(e.target.value))}/></Field>
            <Field label="트리거 월 실행예산"><input value={s.triggerMonthlyInvestAmount} onChange={e=>set("triggerMonthlyInvestAmount",n(e.target.value))}/></Field>
            <Field label="현재 사용가능 현금"><input value={s.triggerCashAvailable} onChange={e=>set("triggerCashAvailable",n(e.target.value))}/></Field>
            <Field label="전체 자동 트리거"><select value={String(s.autoTriggerEnabled!==false)} onChange={e=>set("autoTriggerEnabled",e.target.value==="true")}><option value="true">켜기</option><option value="false">끄기</option></select></Field>
            <Field label="리밸런싱 트리거"><select value={String(s.autoRebalanceTriggerEnabled!==false)} onChange={e=>set("autoRebalanceTriggerEnabled",e.target.value==="true")}><option value="true">켜기</option><option value="false">끄기</option></select></Field>
            <Field label="하락매수 트리거"><select value={String(s.autoBuyTriggerEnabled!==false)} onChange={e=>set("autoBuyTriggerEnabled",e.target.value==="true")}><option value="true">켜기</option><option value="false">끄기</option></select></Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accounts Tab ─────────────────────────────────────────────────────────────
function AccountsTab({ data, update }) {
  const empty={id:"",name:"",type:"은행",institution:"",currency:"KRW",owner:"본인",active:true,defaultIn:false,note:""};
  const [form,setForm]=useState(empty);
  const save=()=>{
    if(!form.name) return alert("계좌명을 입력하세요.");
    update(d=>{
      const row={...form,id:form.id||uid()};
      const accounts=form.id?d.accounts.map(a=>a.id===form.id?row:a):[...d.accounts,row];
      return {...d,accounts};
    });
    setForm(empty);
  };
  return (
    <div className="stack">
      <div className="card">
        <h3>계좌 등록</h3>
        <div className="form-grid">
          <Field label="계좌명"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
          <Field label="유형">
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option>은행</option><option>증권</option><option>연금</option><option>현금</option><option>카드</option><option>대출</option><option>기타</option>
            </select>
          </Field>
          <Field label="기관명"><input value={form.institution} onChange={e=>setForm({...form,institution:e.target.value})}/></Field>
          <Field label="통화"><input value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}/></Field>
          <Field label="소유자"><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}/></Field>
          <Field label="활성">
            <select value={String(form.active)} onChange={e=>setForm({...form,active:e.target.value==="true"})}>
              <option value="true">활성</option><option value="false">비활성</option>
            </select>
          </Field>
          <Field label="기본 입금계좌">
            <select value={String(form.defaultIn)} onChange={e=>setForm({...form,defaultIn:e.target.value==="true"})}>
              <option value="false">아니오</option><option value="true">예</option>
            </select>
          </Field>
          <Field label="비고"><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></Field>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={save}>저장</button>
          <button className="btn btn-ghost" onClick={()=>setForm(empty)}>초기화</button>
        </div>
      </div>
      <div className="card">
        <h3>계좌 목록</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>계좌명</th><th>유형</th><th>기관</th><th>통화</th><th>소유자</th><th>활성</th><th>기본입금</th><th>작업</th></tr></thead>
            <tbody>
              {data.accounts.map(a=>(
                <tr key={a.id}>
                  <td className="td-name">{a.name}</td><td>{a.type}</td><td>{a.institution}</td><td>{a.currency}</td><td>{a.owner}</td>
                  <td>{a.active?<span className="badge badge-green">활성</span>:<span className="badge badge-muted">비활성</span>}</td>
                  <td>{a.defaultIn?<span className="badge badge-accent">예</span>:"-"}</td>
                  <td><div className="row"><button className="btn btn-sm btn-ghost" onClick={()=>setForm({...a})}>수정</button><button className="btn btn-sm btn-danger" onClick={()=>update(d=>({...d,accounts:d.accounts.filter(x=>x.id!==a.id)}))}>삭제</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Data Tab ─────────────────────────────────────────────────────────────────
function DataTab({ data, update, validations }) {
  const fileRef=useRef();
  const exportJSON=()=>{ const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`asset-backup-${todayISO()}.json`; a.click(); };
  const importJSON=(file)=>{ const rd=new FileReader(); rd.onload=()=>{ try{setData(migrateData(JSON.parse(rd.result)));alert("복원 완료");}catch(e){alert("복원 실패: "+e.message);} }; rd.readAsText(file); };
  const clearAll=()=>{ if(!window.confirm("전체 데이터를 초기화할까요?")) return; update(()=>emptyData()); };
  return (
    <div className="stack">
      <div className="card">
        <h3>자동 입력 점검</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>점검 항목</th><th>상태</th><th className="td-right">오류</th><th>확인 위치</th><th>설명</th></tr></thead>
            <tbody>
              {validations.map(v=>(
                <tr key={v.item}>
                  <td className="td-name">{v.item}</td>
                  <td>{v.count===0?<span className="badge badge-green">정상</span>:<span className="badge badge-red">확인필요</span>}</td>
                  <td className="td-right td-mono">{fmt(v.count)}</td>
                  <td style={{color:"var(--text3)"}}>{v.where}</td>
                  <td style={{color:"var(--text3)",fontSize:12}}>{v.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>백업 / 복원</h3>
        <div className="row" style={{flexWrap:"wrap",gap:10}}>
          <button className="btn btn-primary" onClick={exportJSON}>JSON 백업 다운로드</button>
          <button className="btn btn-ghost" onClick={()=>fileRef.current?.click()}>JSON 복원</button>
          <button className="btn btn-danger" onClick={clearAll}>전체 초기화</button>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&importJSON(e.target.files[0])}/>
        </div>
        <div style={{marginTop:12,fontSize:12,color:"var(--text3)"}}>마지막 저장: {data.lastSavedAt?new Date(data.lastSavedAt).toLocaleString():"-"}</div>
      </div>
    </div>
  );
}


// ─── Professional Top 3 Engines ──────────────────────────────────────────────
// 추가 기능: ① 리밸런싱 ② 리스크 분석 ③ 목표 달성/생존력 진단
const pfPortfolioValue = (p) => n(p.qty) * n(p.currentPrice || p.avgPrice);
const pfAnnualToMonthly = (r) => Math.pow(1 + n(r), 1 / 12) - 1;

function buildProfessionalRebalance(data) {
  const s = data?.settings || {};
  const portfolio = Array.isArray(data?.portfolio) ? data.portfolio : [];
  const total = portfolio.reduce((sum, p) => sum + pfPortfolioValue(p), 0);
  const targetMap = getInvestmentTargetMap(s);
  const usedTarget = Object.values(targetMap).reduce((sum, v) => sum + n(v), 0);
  if (usedTarget < 1 && targetMap.기타 === undefined) targetMap.기타 = 1 - usedTarget;
  const grouped = {};
  portfolio.forEach((p) => {
    const cls = p.assetClass || "기타";
    grouped[cls] = (grouped[cls] || 0) + pfPortfolioValue(p);
  });
  Object.keys(grouped).forEach((cls) => { if (targetMap[cls] === undefined) targetMap[cls] = 0; });
  const bandPct = n(s.rebalanceBandPct || 5);
  const rows = Object.entries(targetMap).map(([assetClass, targetWeight]) => {
    const currentAmount = grouped[assetClass] || 0;
    const currentWeight = total > 0 ? currentAmount / total : 0;
    const targetAmount = total * targetWeight;
    const gapAmount = targetAmount - currentAmount;
    const gapPct = currentWeight - targetWeight;
    let action = "유지";
    if (Math.abs(gapPct * 100) > bandPct) action = gapAmount > 0 ? "매수 우선" : "비중 축소";
    return { assetClass, currentAmount, currentWeight, targetWeight, targetAmount, gapAmount, gapPct, action };
  }).sort((a,b)=>Math.abs(b.gapPct)-Math.abs(a.gapPct));
  const alerts = rows.filter((r) => r.action !== "유지");
  const monthlyInvest = n(s.monthlyInvestDefault || s.monthlyInvestStage1 || 0);
  const positiveGap = rows.filter(r => r.gapAmount > 0).reduce((sum,r)=>sum+r.gapAmount,0);
  const buyPlan = rows.filter(r => r.gapAmount > 0).map(r => ({
    assetClass: r.assetClass,
    investAmount: positiveGap > 0 ? Math.round(monthlyInvest * (r.gapAmount / positiveGap)) : 0,
    reason: `${r.assetClass} 목표비중 부족분 보완`,
  }));
  return { total, bandPct, rows, alerts, buyPlan, status: alerts.length ? "리밸런싱 필요" : "정상 범위" };
}

function buildProfessionalRisk(data) {
  const portfolio = Array.isArray(data?.portfolio) ? data.portfolio : [];
  const total = portfolio.reduce((sum, p) => sum + pfPortfolioValue(p), 0);
  const rows = portfolio.map((p) => {
    const value = pfPortfolioValue(p);
    const weight = total > 0 ? value / total : 0;
    const sigma = n(p.riskSigma || 0.22);
    return { id:p.id, name:p.name, assetClass:p.assetClass || "기타", value, weight, sigma, riskContribution: weight * sigma };
  }).filter(r => r.value > 0).sort((a,b)=>b.riskContribution-a.riskContribution);
  const weightedVolatility = rows.reduce((sum, r) => sum + r.riskContribution, 0);
  const monthlyVol = weightedVolatility / Math.sqrt(12);
  const oneMonthVaR95 = total * monthlyVol * 1.65;
  const estimatedMddPct = clamp(weightedVolatility * 2.1, 0.05, 0.75);
  const estimatedMddAmount = total * estimatedMddPct;
  const concentration = rows.length ? Math.max(...rows.map(r => r.weight)) : 0;
  const riskScore = Math.round(clamp(weightedVolatility * 220 + concentration * 45, 0, 100));
  const riskLevel = riskScore >= 70 ? "높음" : riskScore >= 40 ? "중간" : "낮음";
  const warnings = [];
  if (concentration >= 0.7) warnings.push("단일 자산군 또는 종목 집중도가 높습니다.");
  if (estimatedMddPct >= 0.35) warnings.push("큰 하락장에서 손실폭이 클 수 있습니다.");
  if (weightedVolatility >= 0.2) warnings.push("포트폴리오 변동성이 높은 편입니다.");
  return { total, rows, weightedVolatility, monthlyVol, oneMonthVaR95, estimatedMddPct, estimatedMddAmount, concentration, riskScore, riskLevel, warnings };
}

function buildProfessionalGoal(data, dashboard, dashboardDetail, monthlySeries) {
  const s = data?.settings || {};
  const nowNetWorth = n(s.currentNetWorthOverride) > 0 ? n(s.currentNetWorthOverride) : n(dashboard?.netWorth);
  const target = n(s.retirementTargetAmount || 2000000000);
  const currentAge = n(s.currentAge || 36);
  const retireAge = n(s.retireAge || 55);
  const yearsLeft = Math.max(retireAge - currentAge, 0);
  const monthsLeft = yearsLeft * 12;
  const annualReturn = getWeightedExpectedReturn(s);
  const monthlyReturn = pfAnnualToMonthly(annualReturn);
  const monthlyInvest = n(s.monthlyInvestDefault || s.monthlyInvestStage1 || 0);
  let projected = nowNetWorth;
  for (let i = 0; i < monthsLeft; i++) projected = projected * (1 + monthlyReturn) + monthlyInvest;
  let requiredMonthlyInvest = 0;
  if (monthsLeft > 0 && monthlyReturn > 0) {
    const fvCurrent = nowNetWorth * Math.pow(1 + monthlyReturn, monthsLeft);
    const annuityFactor = (Math.pow(1 + monthlyReturn, monthsLeft) - 1) / monthlyReturn;
    requiredMonthlyInvest = Math.max(0, (target - fvCurrent) / annuityFactor);
  } else if (monthsLeft > 0) {
    requiredMonthlyInvest = Math.max(0, (target - nowNetWorth) / monthsLeft);
  }
  const recent = Array.isArray(monthlySeries) ? monthlySeries.slice(-6) : [];
  const avgExpense = recent.length ? recent.reduce((sum,r)=>sum+n(r.expense),0) / recent.length : n(dashboard?.expense);
  const emergencyFund = n(dashboardDetail?.emergencyFund || dashboardDetail?.liquidAssets || 0);
  const survivalMonths = avgExpense > 0 ? emergencyFund / avgExpense : 0;
  const achievementRate = target > 0 ? projected / target : 0;
  let status = achievementRate >= 1 ? "목표 달성 가능권" : achievementRate >= .75 ? "목표 근접" : "투자금 증액 필요";
  if (survivalMonths < 6) status += " / 비상금 보강 필요";
  return { nowNetWorth, target, currentAge, retireAge, yearsLeft, monthsLeft, annualReturn, monthlyInvest, projected, achievementRate, requiredMonthlyInvest, monthlyInvestGap: requiredMonthlyInvest - monthlyInvest, avgExpense, emergencyFund, survivalMonths, status };
}

function buildProfessionalDashboard(data, dashboard, dashboardDetail, monthlySeries) {
  const rebalance = buildProfessionalRebalance(data);
  const risk = buildProfessionalRisk(data);
  const goal = buildProfessionalGoal(data, dashboard, dashboardDetail, monthlySeries);
  const triggers = buildAutoTriggerPlan(risk.rows.map(r=>({ ...r, avgPrice:(data.portfolio||[]).find(p=>p.id===r.id)?.avgPrice, currentPrice:(data.portfolio||[]).find(p=>p.id===r.id)?.currentPrice, qty:(data.portfolio||[]).find(p=>p.id===r.id)?.qty })), data.settings);
  const priorityActions = [];
  if (triggers.all.length) priorityActions.push({ level:"계획", title:"자동 트리거 후보", message:`${triggers.all.length}개 매수·리밸런싱 후보가 있습니다.` });
  if (rebalance.alerts.length) priorityActions.push({ level:"주의", title:"리밸런싱 필요", message:`${rebalance.alerts.length}개 자산군이 목표 비중 허용범위를 벗어났습니다.` });
  if (risk.riskLevel === "높음") priorityActions.push({ level:"위험", title:"위험도 높음", message:`추정 최대낙폭은 약 ${fmtPct(risk.estimatedMddPct*100)}입니다.` });
  if (goal.monthlyInvestGap > 0) priorityActions.push({ level:"계획", title:"목표 투자금 부족", message:`월 ${fmt(goal.monthlyInvestGap)}원 증액이 필요합니다.` });
  if (goal.survivalMonths > 0 && goal.survivalMonths < 6) priorityActions.push({ level:"주의", title:"비상금 부족", message:`현재 비상금은 약 ${goal.survivalMonths.toFixed(1)}개월치입니다.` });
  return { rebalance, risk, goal, triggers, priorityActions };
}

function ProfessionalTab({ data, dashboard, dashboardDetail, monthlySeries }) {
  const pro = useMemo(() => buildProfessionalDashboard(data, dashboard, dashboardDetail, monthlySeries), [data, dashboard, dashboardDetail, monthlySeries]);
  const { rebalance, risk, goal, triggers, priorityActions } = pro;
  const levelClass = (v) => v === "위험" ? "badge-red" : v === "주의" ? "badge-amber" : "badge-accent";
  return (
    <div className="stack">
      <AICoachPanel coach={buildIntegratedCoach({ area:"전문진단", data, dashboard, dashboardDetail, monthlySeries })}/>
      <div className="kpi-grid">
        <KpiCard label="리밸런싱 상태" value={rebalance.alerts.length} unit="건" tone={rebalance.alerts.length ? "red" : "green"}/>
        <KpiCard label="위험 점수" value={risk.riskScore} unit="점" tone={risk.riskLevel === "높음" ? "red" : risk.riskLevel === "중간" ? undefined : "green"}/>
        <KpiCard label="목표 달성률" value={goal.achievementRate * 100} unit="%" accent/>
        <KpiCard label="무소득 생존력" value={goal.survivalMonths} unit="개월" tone={goal.survivalMonths < 6 ? "red" : "green"}/>
      </div>

      <div className="card">
        <div className="card-title"><h3>🧠 전문 진단 요약</h3><span className="badge badge-accent">Top 3 Engine</span></div>
        {priorityActions.length ? priorityActions.map((a,i)=>(
          <div key={i} className="insight-card" style={{marginBottom:10}}>
            <div className="insight-icon" style={{background:a.level === "위험" ? "var(--red-bg)" : a.level === "주의" ? "var(--amber-bg)" : "var(--accent-bg)"}}>{a.level === "위험" ? "🚨" : a.level === "주의" ? "⚠️" : "📌"}</div>
            <div className="insight-body"><h4>{a.title} <span className={`badge ${levelClass(a.level)}`}>{a.level}</span></h4><p>{a.message}</p></div>
          </div>
        )) : <div className="alert alert-ok">현재 입력값 기준으로 즉시 조치가 필요한 항목은 없습니다.</div>}
      </div>

      <div className="g3">
        <div className="card">
          <div className="card-title"><h3>⚖️ 리밸런싱 엔진</h3><span className={`badge ${rebalance.alerts.length ? "badge-amber" : "badge-green"}`}>{rebalance.status}</span></div>
          <div className="stat-row"><span className="stat-label">포트폴리오 평가액</span><span className="stat-value">{fmt(rebalance.total)}원</span></div>
          <div className="stat-row"><span className="stat-label">허용 편차</span><span className="stat-value">±{fmtPct(rebalance.bandPct)}</span></div>
          <div className="hr" />
          {rebalance.rows.map(r=>(
            <div key={r.assetClass} style={{marginBottom:12}}>
              <div className="row-between small"><span className="fw7">{r.assetClass}</span><span className={r.action === "유지" ? "text-green" : r.action === "비중 축소" ? "text-red" : "text-accent"}>{r.action}</span></div>
              <div className="progress" style={{margin:"7px 0"}}><div className="progress-fill pf-accent" style={{width:`${clamp(r.currentWeight*100,0,100)}%`}}/></div>
              <div className="row-between small muted"><span>현재 {fmtPct(r.currentWeight*100)} / 목표 {fmtPct(r.targetWeight*100)}</span><span>{r.gapAmount>=0?"부족":"초과"} {fmt(Math.abs(r.gapAmount))}원</span></div>
            </div>
          ))}
          {rebalance.buyPlan.length > 0 && <div className="alert alert-info" style={{marginTop:12}}>이번달 신규 투자금은 {rebalance.buyPlan.map(p=>`${p.assetClass} ${fmt(p.investAmount)}원`).join(" · ")} 배분을 우선 검토하세요.</div>}
        </div>

        <div className="card">
          <div className="card-title"><h3>🛡️ 리스크 분석</h3><span className={`badge ${risk.riskLevel === "높음" ? "badge-red" : risk.riskLevel === "중간" ? "badge-amber" : "badge-green"}`}>{risk.riskLevel}</span></div>
          <div className="stat-row"><span className="stat-label">연 변동성 추정</span><span className="stat-value">{fmtPct(risk.weightedVolatility*100)}</span></div>
          <div className="stat-row"><span className="stat-label">1개월 VaR 95%</span><span className="stat-value text-red">-{fmt(risk.oneMonthVaR95)}원</span></div>
          <div className="stat-row"><span className="stat-label">추정 최대낙폭</span><span className="stat-value text-red">-{fmtPct(risk.estimatedMddPct*100)} / {fmt(risk.estimatedMddAmount)}원</span></div>
          <div className="stat-row"><span className="stat-label">최대 집중도</span><span className="stat-value">{fmtPct(risk.concentration*100)}</span></div>
          <div className="hr" />
          {risk.rows.slice(0,5).map(r=>(
            <div key={r.id} style={{marginBottom:10}}>
              <div className="row-between small"><span className="fw7">{r.name}</span><span>{fmtPct(r.weight*100)}</span></div>
              <div className="progress" style={{marginTop:6}}><div className="progress-fill pf-amber" style={{width:`${clamp(r.riskContribution*300,0,100)}%`}}/></div>
            </div>
          ))}
          {risk.warnings.length > 0 && <div className="alert alert-warn" style={{marginTop:12}}>{risk.warnings.join(" ")}</div>}
        </div>

        <div className="card">
          <div className="card-title"><h3>🎯 목표 달성·생존력</h3><span className="badge badge-accent">{goal.status}</span></div>
          <GoalGauge value={goal.projected} target={goal.target} title="은퇴 목표 예상 달성률" />
          <div className="hr" />
          <div className="stat-row"><span className="stat-label">현재 순자산</span><span className="stat-value">{fmt(goal.nowNetWorth)}원</span></div>
          <div className="stat-row"><span className="stat-label">은퇴 예상자산</span><span className="stat-value">{fmt(goal.projected)}원</span></div>
          <div className="stat-row"><span className="stat-label">필요 월투자금</span><span className="stat-value">{fmt(goal.requiredMonthlyInvest)}원</span></div>
          <div className="stat-row"><span className="stat-label">현재 대비 차이</span><span className={`stat-value ${goal.monthlyInvestGap>0?"text-red":"text-green"}`}>{goal.monthlyInvestGap>0?"+":""}{fmt(goal.monthlyInvestGap)}원</span></div>
          <div className="stat-row"><span className="stat-label">최근 평균 지출</span><span className="stat-value">{fmt(goal.avgExpense)}원</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><h3>🤖 자동 트리거 후보</h3><span className="badge badge-accent">Manual Execute</span></div>
        <AutoTriggerCard rows={(data.portfolio||[]).map(p=>({ ...p, value:pfPortfolioValue(p), weight:0 }))} settings={data.settings}/>
      </div>

      <div className="alert alert-info">
        이 전문 기능은 현재 입력된 수량·현재가·평단·목표비중·월 투자금·수익률 가정을 바탕으로 계산합니다. 투자 판단의 참고용이며 실제 매수·매도 결정 전에는 계좌와 시장 상황을 다시 확인하세요.
      </div>
    </div>
  );
}

// ─── Step 2 MDD / Risk Tab Integrated ─────────────────────────────────────────
const pct = (v, d = 1) => `${n(v).toFixed(d)}%`;

const DEFAULT_STRESS = [
  {
    key: "dotcom",
    name: "닷컴버블급",
    nasdaq: -0.78,
    dividend: -0.35,
    cash: 0,
    bond: -0.08,
    stock: -0.45,
    etc: -0.25,
    memo: "나스닥·성장주 집중 포트폴리오의 최악 구간 가정",
  },
  {
    key: "gfc",
    name: "금융위기급",
    nasdaq: -0.52,
    dividend: -0.38,
    cash: 0,
    bond: 0.05,
    stock: -0.50,
    etc: -0.30,
    memo: "주식 전반 급락, 현금성 자산 방어 가정",
  },
  {
    key: "covid",
    name: "코로나급 단기급락",
    nasdaq: -0.30,
    dividend: -0.25,
    cash: 0,
    bond: 0.02,
    stock: -0.32,
    etc: -0.20,
    memo: "짧고 강한 급락 후 회복 가능성 가정",
  },
  {
    key: "rate",
    name: "금리충격/성장주 조정",
    nasdaq: -0.35,
    dividend: -0.18,
    cash: 0,
    bond: -0.10,
    stock: -0.25,
    etc: -0.18,
    memo: "고PER 성장주 조정에 더 큰 충격 가정",
  },
];

function classifyAssetClass(row) {
  const raw = `${row.assetClass || ""} ${row.name || ""}`.toLowerCase();

  if (raw.includes("현금") || raw.includes("cash") || raw.includes("kofr") || raw.includes("파킹")) return "cash";
  if (raw.includes("채권") || raw.includes("bond")) return "bond";
  if (raw.includes("배당") || raw.includes("dividend") || raw.includes("dow")) return "dividend";
  if (raw.includes("나스닥") || raw.includes("nasdaq") || raw.includes("qqq")) return "nasdaq";
  if (raw.includes("주식") || raw.includes("stock") || raw.includes("반도체") || raw.includes("ai")) return "stock";
  return "etc";
}

function getValue(row) {
  if (Number.isFinite(Number(row.value))) return n(row.value);
  return n(row.qty) * n(row.currentPrice || row.avgPrice);
}

function normalizeRows(data, financialAnalysis) {
  const sourceRows =
    Array.isArray(financialAnalysis?.rows) && financialAnalysis.rows.length
      ? financialAnalysis.rows
      : Array.isArray(data?.portfolio)
        ? data.portfolio
        : [];

  const rows = sourceRows
    .map((r) => {
      const value = getValue(r);
      const sigma = n(r.riskSigma || r.sigma || 0.22);
      return {
        id: r.id || `${r.name}-${Math.random()}`,
        name: r.name || "미지정",
        assetClass: r.assetClass || classifyAssetClass(r),
        riskKey: classifyAssetClass(r),
        value,
        sigma,
        currentPrice: n(r.currentPrice),
        avgPrice: n(r.avgPrice),
        qty: n(r.qty),
      };
    })
    .filter((r) => r.value > 0);

  const total = rows.reduce((s, r) => s + r.value, 0);

  return rows.map((r) => ({
    ...r,
    weight: total > 0 ? r.value / total : 0,
    loss1y: r.value * r.sigma,
    loss2y: r.value * r.sigma * 2,
  }));
}

function portfolioVolatility(rows) {
  // 단순 상관 가정: 같은 위험자산끼리는 0.65, 현금과 위험자산 0.05, 채권 0.25
  let variance = 0;
  rows.forEach((a, i) => {
    rows.forEach((b, j) => {
      let corr = 0.65;
      if (a.riskKey === "cash" || b.riskKey === "cash") corr = 0.05;
      else if (a.riskKey === "bond" || b.riskKey === "bond") corr = 0.25;
      else if (a.riskKey === b.riskKey) corr = 0.85;
      variance += a.weight * b.weight * a.sigma * b.sigma * corr;
    });
  });
  return Math.sqrt(Math.max(variance, 0));
}

function maxConcentration(rows) {
  if (!rows.length) return { name: "-", weight: 0 };
  return rows.reduce((m, r) => (r.weight > m.weight ? r : m), rows[0]);
}

function stressLoss(rows, scenario) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const loss = rows.reduce((s, r) => {
    const shock = scenario[r.riskKey] ?? scenario.etc ?? -0.25;
    return s + r.value * shock;
  }, 0);
  return {
    scenario: scenario.name,
    memo: scenario.memo,
    lossAmount: loss,
    lossPct: total > 0 ? loss / total : 0,
    afterAmount: total + loss,
  };
}

function makeRiskGrade({ vol, worstMddPct, concentration }) {
  const score =
    (vol >= 0.25 ? 35 : vol >= 0.18 ? 25 : vol >= 0.12 ? 15 : 8) +
    (Math.abs(worstMddPct) >= 0.5 ? 35 : Math.abs(worstMddPct) >= 0.35 ? 25 : Math.abs(worstMddPct) >= 0.2 ? 15 : 5) +
    (concentration >= 0.75 ? 30 : concentration >= 0.55 ? 22 : concentration >= 0.35 ? 14 : 6);

  if (score >= 75) return { label: "매우 높음", color: "red", score };
  if (score >= 55) return { label: "높음", color: "amber", score };
  if (score >= 35) return { label: "보통", color: "accent", score };
  return { label: "낮음", color: "green", score };
}

function calculateMddRisk({ data, financialAnalysis, scenarios = DEFAULT_STRESS } = {}) {
  const rows = normalizeRows(data, financialAnalysis);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const vol = portfolioVolatility(rows);
  const concentration = maxConcentration(rows);
  const stress = scenarios.map((s) => stressLoss(rows, s)).sort((a, b) => a.lossPct - b.lossPct);
  const worst = stress[0] || { scenario: "-", lossAmount: 0, lossPct: 0, afterAmount: total };
  const grade = makeRiskGrade({ vol, worstMddPct: worst.lossPct, concentration: concentration.weight });

  const alerts = [];
  if (concentration.weight >= 0.7) alerts.push(`단일 종목/전략 비중이 ${pct(concentration.weight * 100)}입니다. 집중 위험이 큽니다.`);
  if (vol >= 0.22) alerts.push(`연 변동성 추정치가 ${pct(vol * 100)}로 높습니다.`);
  if (Math.abs(worst.lossPct) >= 0.45) alerts.push(`최악 시나리오에서 ${pct(Math.abs(worst.lossPct) * 100)} 수준의 손실 가능성을 가정합니다.`);
  if (!rows.length) alerts.push("포트폴리오 평가금액이 없어 리스크를 계산할 수 없습니다.");

  return {
    total,
    rows,
    vol,
    concentration,
    stress,
    worst,
    grade,
    alerts,
  };
}

function Badge({ color, children }) {
  const cls =
    color === "red"
      ? "badge badge-red"
      : color === "amber"
        ? "badge badge-amber"
        : color === "green"
          ? "badge badge-green"
          : "badge badge-accent";
  return <span className={cls}>{children}</span>;
}

function MetricCard({ label, value, sub, tone }) {
  const color =
    tone === "red" ? "var(--red)" :
    tone === "amber" ? "var(--amber)" :
    tone === "green" ? "var(--green)" :
    "var(--accent)";
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color, fontSize: 24 }}>{value}</div>
      {sub && <div className="kpi-sub" style={{ color: "var(--text3)" }}>{sub}</div>}
    </div>
  );
}

function ScenarioEditor({ scenarios, setScenarios }) {
  const update = (idx, key, value) => {
    setScenarios((prev) => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };

  return (
    <div className="card">
      <div className="card-title">
        <h3>스트레스 시나리오 수동 조정</h3>
        <button className="btn btn-sm btn-ghost" onClick={() => setScenarios(DEFAULT_STRESS)}>
          기본값 복구
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>시나리오</th>
              <th className="td-right">나스닥</th>
              <th className="td-right">배당</th>
              <th className="td-right">주식</th>
              <th className="td-right">채권</th>
              <th className="td-right">현금</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, idx) => (
              <tr key={s.key}>
                <td className="td-name">{s.name}</td>
                {["nasdaq", "dividend", "stock", "bond", "cash"].map((key) => (
                  <td key={key} className="td-right">
                    <input
                      className="risk-input"
                      value={s[key]}
                      onChange={(e) => update(idx, key, Number(e.target.value))}
                      placeholder="-0.35"
                    />
                  </td>
                ))}
                <td>
                  <input
                    className="risk-input"
                    value={s.memo}
                    onChange={(e) => update(idx, "memo", e.target.value)}
                    placeholder="메모"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="small muted" style={{ marginTop: 10 }}>
        입력값은 -0.35 = -35% 충격을 의미합니다. 이 화면의 값은 현재 화면 계산용이며, 저장 기능을 붙이려면 data.settings에 별도 저장키를 연결하면 됩니다.
      </div>
    </div>
  );
}

function Step2MddRiskPanel({ data, financialAnalysis }) {
  const [showEditor, setShowEditor] = useState(false);
  const [scenarios, setScenarios] = useState(DEFAULT_STRESS);

  const risk = useMemo(
    () => calculateMddRisk({ data, financialAnalysis, scenarios }),
    [data, financialAnalysis, scenarios]
  );

  const riskCoach = useMemo(() => buildIntegratedCoach({ area:"리스크 분석", data, financialAnalysis }), [data, financialAnalysis]);
  const worstTone = Math.abs(risk.worst.lossPct) >= 0.45 ? "red" : Math.abs(risk.worst.lossPct) >= 0.3 ? "amber" : "green";
  const volTone = risk.vol >= 0.22 ? "red" : risk.vol >= 0.15 ? "amber" : "green";
  const concTone = risk.concentration.weight >= 0.7 ? "red" : risk.concentration.weight >= 0.5 ? "amber" : "green";

  return (
    <div className="stack">
      <AICoachPanel coach={riskCoach}/>
      <div className="row-between">
        <div>
          <h2 style={{ fontSize: 22, letterSpacing: "-.03em", marginBottom: 6 }}>🛡️ 2단계 리스크 / MDD 분석</h2>
          <div className="muted small">포트폴리오가 급락장에서 얼마나 흔들릴 수 있는지 계산합니다.</div>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowEditor((v) => !v)}>
          {showEditor ? "시나리오 접기" : "시나리오 조정"}
        </button>
      </div>

      <div className="kpi-grid">
        <MetricCard label="리스크 등급" value={risk.grade.label} sub={`점수 ${Math.round(risk.grade.score)}점`} tone={risk.grade.color} />
        <MetricCard label="연 변동성 추정" value={pct(risk.vol * 100)} sub="포트폴리오 σ 기준" tone={volTone} />
        <MetricCard label="최악 시나리오 MDD" value={`-${pct(Math.abs(risk.worst.lossPct) * 100)}`} sub={risk.worst.scenario} tone={worstTone} />
        <MetricCard label="최대 집중 비중" value={pct(risk.concentration.weight * 100)} sub={risk.concentration.name} tone={concTone} />
      </div>

      {risk.alerts.length > 0 && (
        <div className="card">
          <h3>자동 경고</h3>
          <div className="stack">
            {risk.alerts.map((a, i) => (
              <div key={i} className={i === 0 ? "alert alert-warn" : "alert alert-info"}>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="g2">
        <div className="card">
          <h3>스트레스 테스트 결과</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>시나리오</th>
                  <th className="td-right">손실률</th>
                  <th className="td-right">손실금액</th>
                  <th className="td-right">하락 후 평가액</th>
                  <th>판정</th>
                </tr>
              </thead>
              <tbody>
                {risk.stress.map((s) => {
                  const abs = Math.abs(s.lossPct);
                  const tone = abs >= 0.45 ? "red" : abs >= 0.3 ? "amber" : "green";
                  return (
                    <tr key={s.scenario}>
                      <td className="td-name">{s.scenario}</td>
                      <td className="td-right td-mono text-red">-{pct(abs * 100)}</td>
                      <td className="td-right td-mono text-red">{fmt(Math.abs(s.lossAmount))}원</td>
                      <td className="td-right td-mono">{fmt(s.afterAmount)}원</td>
                      <td><Badge color={tone}>{tone === "red" ? "위험" : tone === "amber" ? "주의" : "방어 가능"}</Badge></td>
                    </tr>
                  );
                })}
                {!risk.stress.length && <tr><td colSpan={5}><div className="empty">포트폴리오 데이터가 없습니다.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>종목별 손실 민감도</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>종목</th>
                  <th>분류</th>
                  <th className="td-right">비중</th>
                  <th className="td-right">-1σ 손실</th>
                  <th className="td-right">-2σ 손실</th>
                </tr>
              </thead>
              <tbody>
                {risk.rows
                  .slice()
                  .sort((a, b) => b.weight - a.weight)
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="td-name">{r.name}</td>
                      <td><span className="badge badge-muted">{r.assetClass || r.riskKey}</span></td>
                      <td className="td-right td-mono">{pct(r.weight * 100)}</td>
                      <td className="td-right td-mono text-red">{fmt(r.loss1y)}원</td>
                      <td className="td-right td-mono text-red">{fmt(r.loss2y)}원</td>
                    </tr>
                  ))}
                {!risk.rows.length && <tr><td colSpan={5}><div className="empty">보유 종목이 없습니다.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditor && <ScenarioEditor scenarios={scenarios} setScenarios={setScenarios} />}

      <div className="card">
        <h3>해석 가이드</h3>
        <div className="g3">
          <div className="alert alert-info">MDD는 실제 미래 예측이 아니라 “이 정도 하락도 감당 가능한가”를 점검하는 방어 지표입니다.</div>
          <div className="alert alert-warn">나스닥 비중이 높으면 장기 기대수익은 커질 수 있지만, 은퇴 직전 급락 리스크도 함께 커집니다.</div>
          <div className="alert alert-ok">목표비중·현금비중·비상금이 함께 관리되면 하락장에서 강제매도 위험을 줄일 수 있습니다.</div>
        </div>
      </div>

      <style>{`
        .risk-input{
          width:100%;
          min-width:72px;
          padding:9px 11px;
          border:1px solid var(--border2);
          border-radius:10px;
          background:var(--surface2);
          color:var(--text);
          font-size:12px;
          outline:none;
          font-family:inherit;
        }
        .risk-input:focus{
          border-color:var(--accent);
          box-shadow:0 0 0 3px var(--accent-bg);
        }
      `}</style>
    </div>
  );
}


// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
const NAV = [
  { section: "메인" },
  { id:"dashboard", icon:"◈", label:"대시보드" },
  { section: "입력" },
  { id:"transactions", icon:"↔", label:"거래내역" },
  { id:"assets", icon:"🏦", label:"자산·부채" },
  { id:"portfolio", icon:"📈", label:"포트폴리오" },
  { id:"budget", icon:"💰", label:"가계부" },
  { id:"planning", icon:"🎯", label:"목표·계획" },
  { section: "분석" },
  { id:"professional", icon:"🧠", label:"전문진단" },
  { id:"risk", icon:"🛡️", label:"리스크" },
  { id:"analysis", icon:"📊", label:"재무분석" },
  { id:"tax", icon:"💸", label:"세금·절세" },
  { id:"simulation", icon:"🔮", label:"미래시뮬레이션" },
  { id:"monthlyReport", icon:"🧾", label:"월간 리포트" },
  { id:"decision", icon:"🧭", label:"의사결정 센터" },
  { id:"goals", icon:"🎯", label:"목표 자금관리" },
  { id:"cfo", icon:"🏛️", label:"CFO 종합판단" },
  { id:"automation", icon:"🤖", label:"자동화 시스템" },
  { section: "관리" },
  { id:"settings", icon:"⚙", label:"설정" },
  { id:"accounts", icon:"🏧", label:"계좌관리" },
  { id:"data", icon:"💾", label:"데이터·백업" },
];

const PAGE_TITLES = { dashboard:"대시보드", transactions:"거래내역", assets:"자산·부채", portfolio:"투자 포트폴리오", budget:"가계부", planning:"목표·계획", professional:"전문진단", risk:"리스크 분석", analysis:"재무분석", tax:"세금·절세", simulation:"미래 시뮬레이션", monthlyReport:"월간 리포트", decision:"의사결정 센터", goals:"목표 자금관리", cfo:"CFO 종합판단", automation:"자동화 시스템", settings:"설정", accounts:"계좌관리", data:"데이터 관리" };

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,setData]=useState(loadData);
  const [tab,setTab]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [syncState,setSyncState]=useState("");
  const [cloudReady,setCloudReady]=useState(false);
  const [showFab,setShowFab]=useState(false);
  const skipCloudSaveRef=useRef(false);

  useEffect(()=>{ saveData(data); },[data]);

  useEffect(()=>{
    if(!supabase){setAuthLoading(false);return;}
    supabase.auth.getSession().then(({data:{session:s}})=>{setSession(s);setAuthLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  },[]);

  const loadCloudData=async()=>{
    if(!supabase||!session?.user)return;
    setSyncState("불러오는 중...");
    const {data:row,error}=await supabase.from(CLOUD_TABLE).select("data").eq("user_id",session.user.id).maybeSingle();
    if(error){setSyncState("불러오기 실패");return;}
    if(row?.data){skipCloudSaveRef.current=true;setData(migrateData(row.data));setSyncState("불러오기 완료");}
    else setSyncState("신규 계정");
    setCloudReady(true);
  };
  const saveCloudData=async(manual=true)=>{
    if(!supabase||!session?.user)return;
    setSyncState("저장 중...");
    const {error}=await supabase.from(CLOUD_TABLE).upsert({user_id:session.user.id,data,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error){setSyncState("저장 실패");return;}
    setSyncState(manual?"수동 저장 완료":"자동 저장 완료");
    setCloudReady(true);
  };
  useEffect(()=>{if(session?.user)loadCloudData();},[session?.user?.id]);
  useEffect(()=>{
    if(!supabase||!session?.user||!cloudReady)return;
    if(skipCloudSaveRef.current){skipCloudSaveRef.current=false;return;}
    const t=setTimeout(()=>saveCloudData(false),900);
    return()=>clearTimeout(t);
  },[data,session?.user?.id,cloudReady]);

  const update=(fn)=>setData(prev=>migrateData(fn(prev)));
  const accountOptions=useMemo(()=>data.accounts.filter(a=>a.active),[data.accounts]);
  const accountNamesIn=useMemo(()=>accountOptions.filter(a=>a.type!=="카드").map(a=>a.name),[accountOptions]);
  const accountNamesOut=useMemo(()=>accountOptions.map(a=>a.name),[accountOptions]);

  const dashboard=useMemo(()=>{
    const month=thisMonthISO();
    let income=0,expense=0;
    data.transactions.forEach(t=>{if(monthOf(t.date)!==month)return;if(t.type==="수입")income+=n(t.amount);if(t.type==="지출")expense+=n(t.amount);});
    const totalAssets=data.assets.filter(a=>a.kind==="자산").reduce((s,a)=>s+n(a.current),0);
    const totalLiabs=data.assets.filter(a=>a.kind==="부채").reduce((s,a)=>s+n(a.current),0);
    const portValue=data.portfolio.reduce((s,p)=>s+n(p.qty)*n(p.currentPrice||p.avgPrice),0);
    return{month,income,expense,net:income-expense,totalAssets,totalLiabs,portValue,netWorth:totalAssets-totalLiabs+portValue};
  },[data]);

  const validations=useMemo(()=>[
    {item:"거래내역 필수값 누락",count:data.transactions.filter(t=>t.type&&(!t.cat1||!t.cat2)).length,where:"거래내역",desc:"구분 선택 시 대분류/소분류 필수"},
    {item:"거래 금액 오류",count:data.transactions.filter(t=>t.amount!==""&&n(t.amount)<=0).length,where:"거래내역",desc:"금액은 0보다 커야 합니다"},
    {item:"수입 계좌 누락",count:data.transactions.filter(t=>t.type==="수입"&&!t.inAccount).length,where:"거래내역",desc:"수입은 입금계좌가 필요합니다"},
    {item:"지출 계좌 누락",count:data.transactions.filter(t=>t.type==="지출"&&!t.outAccount).length,where:"거래내역",desc:"지출은 출금계좌가 필요합니다"},
    {item:"자산이동 계좌 누락",count:data.transactions.filter(t=>t.type==="자산이동"&&(!t.inAccount||!t.outAccount)).length,where:"거래내역",desc:"자산이동은 입출금 계좌 모두 필요"},
    {item:"자산/부채 이름 중복",count:data.assets.length-new Set(data.assets.map(a=>a.name)).size,where:"자산·부채",desc:"같은 이름의 항목이 중복되었습니다"},
    {item:"포트폴리오 현재가 미입력",count:data.portfolio.filter(p=>n(p.qty)>0&&n(p.currentPrice||0)<=0).length,where:"포트폴리오",desc:"보유 수량 있으면 현재가 필요"},
  ],[data]);

  const budgetAnalysis=useMemo(()=>{
    const month=thisMonthISO();
    const totalIncome=data.transactions.filter(t=>monthOf(t.date)===month&&t.type==="수입").reduce((s,t)=>s+n(t.amount),0);
    return data.budgets.map(b=>{
      const spent=data.transactions.filter(t=>monthOf(t.date)===month&&t.type==="지출"&&t.cat1===b.cat1).reduce((s,t)=>s+n(t.amount),0);
      const rate=b.budget>0?(spent/b.budget)*100:0;
      return{...b,spent,rate,status:rate>=100?"초과":rate>=80?"주의":"정상",recommendedBudget:totalIncome*n(b.targetWeight)};
    });
  },[data]);

  const monthlySeries=useMemo(()=>{
    const m=new Map();
    data.transactions.forEach(t=>{const k=monthOf(t.date);if(!k)return;if(!m.has(k))m.set(k,{month:k,income:0,expense:0});const row=m.get(k);if(t.type==="수입")row.income+=n(t.amount);if(t.type==="지출")row.expense+=n(t.amount);});
    return[...m.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(r=>({...r,net:r.income-r.expense}));
  },[data.transactions]);

  const financialAnalysis=useMemo(()=>{
    const rows=data.portfolio.map(p=>({...p,value:n(p.qty)*priceToKRW(p,data.settings),invested:n(p.qty)*investedToKRW(p,data.settings),currency:normalizeCurrency(p.currency)}));
    const total=rows.reduce((s,r)=>s+r.value,0);
    const mapped=rows.map(r=>{const weight=total>0?r.value/total:0,sigma=n(r.riskSigma||0.22);return{...r,weight,sigma,loss1:-r.value*sigma,state:weight>0.3?"쏠림 경고":weight>0.2?"주의":"정상"};});
    const classMap={};mapped.forEach(r=>{classMap[r.assetClass||"기타"]=(classMap[r.assetClass||"기타"]||0)+r.value;});
    return{rows:mapped,total,byClass:classMap};
  },[data.portfolio,data.settings.fxUsdKrw]);

  const taxAnalysis=useMemo(()=>{
    const groups=[
      {name:"ISA",predicate:p=>p.account==="ISA",taxLabel:`비과세 ${fmt(data.settings.isaTaxFreeLimit)} + 초과 ${fmtPct(data.settings.isaTaxRate*100)}`,taxRate:data.settings.isaTaxRate,note:`${data.settings.isaCycleYears}년 주기`},
      {name:"연금저축",predicate:p=>p.account==="연금저축",taxLabel:`세액공제 ${fmtPct(data.settings.pensionTaxCreditRate*100)}`,taxRate:0,note:"연금계좌"},
      {name:"IRP",predicate:p=>p.account==="IRP",taxLabel:`세액공제 ${fmtPct(data.settings.pensionTaxCreditRate*100)}`,taxRate:0,note:"퇴직연금"},
      {name:"일반계좌",predicate:p=>!["ISA","연금저축","IRP"].includes(p.account),taxLabel:`배당 ${fmtPct(data.settings.taxableDividendTaxRate*100)}`,taxRate:data.settings.taxableDividendTaxRate,note:"과세계좌"},
    ];
    return groups.map(g=>{
      const sel=data.portfolio.filter(g.predicate);
      const value=sel.reduce((s,p)=>s+n(p.qty)*priceToKRW(p,data.settings),0);
      const principal=sel.reduce((s,p)=>s+n(p.qty)*investedToKRW(p,data.settings),0);
      const profit=value-principal;
      const estimatedTax=g.name==="ISA"?Math.max(profit-n(data.settings.isaTaxFreeLimit),0)*n(g.taxRate):g.taxRate>0?Math.max(profit,0)*n(g.taxRate):0;
      return{...g,count:sel.length,value,principal,profit,estimatedTax};
    });
  },[data.portfolio,data.settings]);

  const eventAnalysis=useMemo(()=>data.events.map(e=>{
    const shortage=Math.max(n(e.amountNeeded)-n(e.currentPrepared),0);
    return{...e,shortage,monthlyNeed:e.yearsFromNow>0?shortage/(n(e.yearsFromNow)*12):shortage,age:n(data.settings.currentAge)+n(e.yearsFromNow),progress:n(e.amountNeeded)>0?n(e.currentPrepared)/n(e.amountNeeded)*100:0};
  }),[data.events,data.settings.currentAge]);

  const futureSim=useMemo(()=>{
    const rows=[];
    let nasdaq=0,dividend=0,isaBalance=0,isaPrincipalInCycle=0,realizedIsaTaxSavedAcc=0,pensionCreditAcc=0,pensionTransferredAcc=0,taxableOverflowAcc=0,isaRolloverCount=0;
    const years=Math.max(n(data.settings.retireAge)-n(data.settings.currentAge),0);
    const wN=n(data.settings.targetNasdaqWeight)+n(data.settings.targetNasdaqHWeight),wD=n(data.settings.targetDividendWeight);
    const weightedReturn=(n(data.settings.annualReturnNasdaq)*(wN||0))+(n(data.settings.annualReturnDividend)*(wD||0));
    const isaAnnualLimit=Math.max(n(data.settings.isaAnnualLimit),0),isaCycleYears=Math.max(n(data.settings.isaCycleYears),1);
    const isaTaxFreeLimit=Math.max(n(data.settings.isaTaxFreeLimit),0),isaTaxRate=Math.max(n(data.settings.isaTaxRate),0);
    const normalTaxRate=Math.max(n(data.settings.taxableDividendTaxRate),0);
    const pensionTaxCreditRate=Math.max(n(data.settings.pensionTaxCreditRate),0);
    const isaPensionTransferDeductionCap=Math.max(n(data.settings.isaPensionTransferDeduction),0);
    const isaPensionTransferRatio=clamp(n(data.settings.isaPensionTransferRatio||1),0,1);
    const annualPensionContribution=Math.max(n(data.settings.annualPensionContribution),0);
    const pensionAnnualTaxCreditLimit=Math.max(n(data.settings.pensionAnnualTaxCreditLimit),0);
    for(let year=1;year<=years;year++){
      let monthlyInvest=n(data.settings.monthlyInvestStage3);
      if(year<=n(data.settings.stage1Years))monthlyInvest=n(data.settings.monthlyInvestStage1);
      else if(year<=n(data.settings.stage2Years))monthlyInvest=n(data.settings.monthlyInvestStage2);
      const annualInvest=monthlyInvest*12;
      const annualIsaContribution=Math.min(annualInvest,isaAnnualLimit);
      const annualTaxableOverflowInvest=Math.max(annualInvest-annualIsaContribution,0);
      taxableOverflowAcc+=annualTaxableOverflowInvest;
      nasdaq=(nasdaq+annualInvest*wN)*(1+n(data.settings.annualReturnNasdaq));
      dividend=(dividend+annualInvest*wD)*(1+n(data.settings.annualReturnDividend));
      const total=nasdaq+dividend;
      const yearInCycle=((year-1)%isaCycleYears)+1;
      if(yearInCycle===1){isaBalance=0;isaPrincipalInCycle=0;}
      isaPrincipalInCycle+=annualIsaContribution;
      isaBalance=(isaBalance+annualIsaContribution)*(1+weightedReturn);
      const isaProfitInCycle=Math.max(isaBalance-isaPrincipalInCycle,0);
      const normalTaxIfTaxable=isaProfitInCycle*normalTaxRate;
      const isaTax=isaProfitInCycle<=isaTaxFreeLimit?0:(isaProfitInCycle-isaTaxFreeLimit)*isaTaxRate;
      const currentCycleTaxSaved=Math.max(normalTaxIfTaxable-isaTax,0);
      const annualPensionBaseCredit=Math.min(annualPensionContribution,pensionAnnualTaxCreditLimit)*pensionTaxCreditRate;
      pensionCreditAcc+=annualPensionBaseCredit;
      let cycleTransferAmount=0,cyclePensionCredit=0,maturityOccurred=false;
      if(yearInCycle===isaCycleYears){
        maturityOccurred=true;isaRolloverCount+=1;realizedIsaTaxSavedAcc+=currentCycleTaxSaved;
        cycleTransferAmount=isaBalance*isaPensionTransferRatio;
        const transferExtraEligible=Math.min(cycleTransferAmount*0.1,isaPensionTransferDeductionCap);
        cyclePensionCredit=Math.min(cycleTransferAmount,transferExtraEligible)*pensionTaxCreditRate;
        pensionCreditAcc+=cyclePensionCredit;pensionTransferredAcc+=cycleTransferAmount;
        const newIsaSeedAmount=Math.min(isaBalance-cycleTransferAmount,isaAnnualLimit);
        taxableOverflowAcc+=Math.max(isaBalance-cycleTransferAmount-newIsaSeedAmount,0);
      }
      const isaTaxSaved=realizedIsaTaxSavedAcc+(yearInCycle===isaCycleYears?0:currentCycleTaxSaved);
      rows.push({age:n(data.settings.currentAge)+year,year,yearLabel:`${new Date().getFullYear()+year-1}`,monthlyInvest,annualInvest,nasdaq,dividend,isaTaxSaved,pensionCreditAcc,pensionTransferredAcc,cyclePensionCredit,cycleTransferAmount,total,isaBalance,isaPrincipalInCycle,isaProfitInCycle,yearInCycle,maturityOccurred,taxableOverflowAcc,isaRolloverCount});
    }
    return rows;
  },[data.settings]);

  const dashboardDetail=useMemo(()=>{
    const emergencyFund=data.assets.filter(a=>a.kind==="자산"&&a.includeInEmergency).reduce((s,a)=>s+n(a.current),0);
    const liquidAssets=data.assets.filter(a=>a.kind==="자산"&&["현금성","은행예금"].includes(a.category)).reduce((s,a)=>s+n(a.current),0);
    const last6=monthlySeries.slice(-6);
    const avgIncome=last6.length?last6.reduce((s,r)=>s+r.income,0)/last6.length:0;
    const avgExpense=last6.length?last6.reduce((s,r)=>s+r.expense,0)/last6.length:0;
    const avgNet=last6.length?last6.reduce((s,r)=>s+r.net,0)/last6.length:0;
    const accountBalances=data.accounts.filter(a=>a.active).map(a=>({...a,balance:data.assets.find(x=>x.name===a.name)?n(data.assets.find(x=>x.name===a.name).current):0}));
    const assetCategoryBreakdown={};data.assets.filter(a=>a.kind==="자산").forEach(a=>{const c=a.category||"기타";assetCategoryBreakdown[c]=(assetCategoryBreakdown[c]||0)+n(a.current);});
    const over=budgetAnalysis.filter(b=>b.status==="초과").length,warn=budgetAnalysis.filter(b=>b.status==="주의").length;
    const recentTx=[...data.transactions].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8);
    const topExpenseCats=Object.entries(data.transactions.filter(t=>monthOf(t.date)===thisMonthISO()&&t.type==="지출").reduce((m,t)=>{m[t.cat1||"기타"]=(m[t.cat1||"기타"]||0)+n(t.amount);return m;},{})).map(([cat1,amount])=>({cat1,amount})).sort((a,b)=>b.amount-a.amount);
    const totalValidationIssues=validations.reduce((s,v)=>s+n(v.count),0);
    const retirementRow=futureSim.length?futureSim[futureSim.length-1]:null;
    return{emergencyFund,liquidAssets,avgIncome,avgExpense,avgNet,accountBalances,assetCategoryBreakdown,budgetSummary:{over,warn},topExpenseCats,recentTx,totalValidationIssues,retirementRow};
  },[data,monthlySeries,budgetAnalysis,validations,futureSim]);

  const dashboardChartData=useMemo(()=>{
    const assetBuckets=new Map();
    data.assets.filter(a=>a.kind==="자산").forEach(a=>{const l=a.category||"기타자산";assetBuckets.set(l,(assetBuckets.get(l)||0)+n(a.current));});
    if(financialAnalysis.total>0)assetBuckets.set("투자포트폴리오",(assetBuckets.get("투자포트폴리오")||0)+financialAnalysis.total);
    const assetSegments=[...assetBuckets.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,6);
    const totalEventTarget=eventAnalysis.reduce((s,e)=>s+n(e.amountNeeded),0);
    const totalEventPrepared=eventAnalysis.reduce((s,e)=>s+n(e.currentPrepared),0);
    return{monthlyTrend:monthlySeries,assetSegments,retirementTarget:n(data.settings.retirementTargetAmount),retirementProjected:dashboardDetail.retirementRow?.total||0,totalEventTarget,totalEventPrepared};
  },[data.assets,data.settings.retirementTargetAmount,monthlySeries,financialAnalysis.total,eventAnalysis,dashboardDetail.retirementRow]);

  const totalIssues=validations.reduce((s,v)=>s+n(v.count),0);

  return (
    <div className="app">
      <style>{STYLES}</style>
      <div className="shell">
        {/* Sidebar */}
        <nav className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">S</div>
            <div className="logo-copy">
              <div className="logo-text">Season Finance</div>
              <div className="logo-sub">통합 자산관리</div>
            </div>
          </div>
          <button className="sidebar-toggle" type="button" onClick={() => setSidebarOpen((v) => !v)} aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}>
            <span className="toggle-glyph">{sidebarOpen ? "⟨" : "⟩"}</span>
          </button>
          {NAV.map((item,i)=>{
            if(item.section) return <div key={i} className="nav-section">{item.section}</div>;
            return (
              <button key={item.id} className={`nav-item ${tab===item.id?"active":""}`} data-tip={item.label} title={sidebarOpen ? "" : item.label} onClick={()=>setTab(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.id==="data"&&totalIssues>0&&<span className="nav-dot"/>}
              </button>
            );
          })}
        </nav>

        {/* Main */}
        <div className={`main ${sidebarOpen ? "" : "expanded"}`}>
          <AuthBar session={session} syncState={syncState} onLoadCloud={loadCloudData} onSaveCloud={()=>saveCloudData(true)}/>
          <div className="topbar">
            <div className="topbar-title">{PAGE_TITLES[tab]||tab}</div>
            <div className="topbar-right">
              <span style={{fontSize:12,color:"var(--text3)"}}>{thisMonthISO()}</span>
              {dashboard.net!==0&&(
                <span className={`badge ${dashboard.net>=0?"badge-green":"badge-red"}`}>
                  이번달 {dashboard.net>=0?"흑자":"적자"} {fmt(Math.abs(dashboard.net))}원
                </span>
              )}
            </div>
          </div>

          <div className="page">
            {tab==="dashboard"&&<DashboardTab data={data} dashboard={dashboard} dashboardDetail={dashboardDetail} dashboardChartData={dashboardChartData} financialAnalysis={financialAnalysis} budgetAnalysis={budgetAnalysis} monthlySeries={monthlySeries} eventAnalysis={eventAnalysis} taxAnalysis={taxAnalysis} futureSim={futureSim}/>}
            {tab==="goals"&&<GoalFundingTab data={data} update={update} dashboard={dashboard} dashboardDetail={dashboardDetail} futureSim={futureSim}/>}
            {tab==="cfo"&&<CFOCenterTab data={data} dashboard={dashboard} dashboardDetail={dashboardDetail} financialAnalysis={financialAnalysis} budgetAnalysis={budgetAnalysis} taxAnalysis={taxAnalysis} futureSim={futureSim}/>}
            {tab==="automation"&&<AutomationSystemTab data={data} update={update} dashboard={dashboard} dashboardDetail={dashboardDetail} financialAnalysis={financialAnalysis} budgetAnalysis={budgetAnalysis} taxAnalysis={taxAnalysis} futureSim={futureSim}/>}
            {tab==="transactions"&&<TransactionsTab data={data} update={update} accountNamesIn={accountNamesIn} accountNamesOut={accountNamesOut}/>}
            {tab==="assets"&&<AssetsTab data={data} update={update}/>}
            {tab==="portfolio"&&<PortfolioTab data={data} update={update} accountOptions={accountOptions} financialAnalysis={financialAnalysis}/>}
            {tab==="budget"&&<BudgetTab data={data} update={update} budgetAnalysis={budgetAnalysis}/>}
            {tab==="planning"&&<PlanningTab data={data} update={update} eventAnalysis={eventAnalysis} dashboard={dashboard}/>}
            {tab==="professional"&&<ProfessionalTab data={data} dashboard={dashboard} dashboardDetail={dashboardDetail} monthlySeries={monthlySeries}/>}
            {tab==="risk"&&<Step2MddRiskPanel data={data} financialAnalysis={financialAnalysis}/>}
            {tab==="analysis"&&<AnalysisTab data={data} monthlySeries={monthlySeries} budgetAnalysis={budgetAnalysis} financialAnalysis={financialAnalysis} dashboardDetail={dashboardDetail}/>}
            {tab==="tax"&&<TaxTab data={data} update={update} taxAnalysis={taxAnalysis} futureSim={futureSim}/>}
            {tab==="simulation"&&<SimulationTab data={data} futureSim={futureSim}/>}
            {tab==="monthlyReport"&&<MonthlyReportTab data={data} monthlySeries={monthlySeries} budgetAnalysis={budgetAnalysis} financialAnalysis={financialAnalysis} dashboard={dashboard} dashboardDetail={dashboardDetail} taxAnalysis={taxAnalysis}/>}
            {tab==="decision"&&<DecisionCenterTab data={data} dashboard={dashboard} dashboardDetail={dashboardDetail} financialAnalysis={financialAnalysis} budgetAnalysis={budgetAnalysis} taxAnalysis={taxAnalysis} futureSim={futureSim}/>}
            {tab==="settings"&&<SettingsTab data={data} update={update}/>}
            {tab==="accounts"&&<AccountsTab data={data} update={update}/>}
            {tab==="data"&&<DataTab data={data} update={update} validations={validations}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
