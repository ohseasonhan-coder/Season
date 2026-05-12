// seasonCore: shared constants, utilities, storage, charts, tabs, and UI helpers
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
import { STYLES } from "./styles/appStyles.js";

// ─── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "asset-app-final-complete-v1";
const LEGACY_STORAGE_KEYS = ["asset-app-sidebar-premium-season-fixed","asset-app-sidebar-premium-season-stock-server","asset-app-excel-parity-v1"];
const STORAGE_BACKUP_PREFIX = `${STORAGE_KEY}:backup:`;
const STORAGE_TEMP_KEY = `${STORAGE_KEY}:temp`;
const MAX_BACKUPS = 10;
const MARKET_CACHE_KEY = `${STORAGE_KEY}:market-cache`;
const MAX_MARKET_CACHE_AGE_DAYS = 14;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CLOUD_TABLE = "asset_app_profiles";
const AUTH_ID_DOMAIN = "season.local";
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const normalizeLoginId = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
const isValidLoginId = (value) => /^[a-z0-9._-]{3,32}$/.test(normalizeLoginId(value));
const loginIdToAuthEmail = (value) => `${normalizeLoginId(value)}@${AUTH_ID_DOMAIN}`;
const displayAccountName = (user) => {
  const metaId = user?.user_metadata?.login_id || user?.user_metadata?.account_id;
  const email = user?.email || "";
  if (metaId) return metaId;
  if (email.endsWith(`@${AUTH_ID_DOMAIN}`)) return email.replace(`@${AUTH_ID_DOMAIN}`, "");
  return email || "계정";
};

// ─── Utils ───────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0,10);
const thisMonthISO = () => new Date().toISOString().slice(0,7);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const n = (v) => { const x = Number(String(v ?? "").replace(/,/g,"").trim()); return Number.isFinite(x) ? x : 0; };
const fmt = (v) => new Intl.NumberFormat("ko-KR").format(Math.round(n(v)));
const fmtPct = (v, d=1) => `${n(v).toFixed(d)}%`;
const ratioToPercent = (v, d=2) => {
  const x = n(v) * 100;
  return Number.isInteger(x) ? String(x) : String(Number(x.toFixed(d)));
};
const percentToRatio = (v) => n(v) / 100;
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
  fxJpyKrw:0,
  fxEurKrw:0,
  fxCnyKrw:0,
  reportEmail:"",
  marketDataLastUpdated:"",
  marketDataMode:"auto",
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
  x.settings.fxJpyKrw = n(x.settings.fxJpyKrw || 0);
  x.settings.fxEurKrw = n(x.settings.fxEurKrw || 0);
  x.settings.fxCnyKrw = n(x.settings.fxCnyKrw || 0);
  x.settings.fxAsOf = x.settings.fxAsOf || "";
  x.settings.marketDataLastUpdated = x.settings.marketDataLastUpdated || "";
  x.settings.marketDataMode = x.settings.marketDataMode || "auto";
  x.settings.autoUpdateMarketDataOnStart = x.settings.autoUpdateMarketDataOnStart === true;
  x.settings.autoTaxUpdateEnabled = x.settings.autoTaxUpdateEnabled !== false;
  x.settings.taxUpdateLastChecked = x.settings.taxUpdateLastChecked || "";
  x.settings.taxUpdateSummary = x.settings.taxUpdateSummary || "";
  x.settings.taxUpdateStatus = x.settings.taxUpdateStatus || "not_checked";
  x.settings.taxUpdateSource = x.settings.taxUpdateSource || "";
  return x;
}
function safeParseJSON(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isValidAppData(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.transactions)) return false;
  if (!Array.isArray(data.accounts)) return false;
  if (!Array.isArray(data.assets)) return false;
  if (!Array.isArray(data.portfolio)) return false;
  if (!Array.isArray(data.budgets)) return false;
  if (!Array.isArray(data.events)) return false;
  if (!data.settings || typeof data.settings !== "object") return false;
  return true;
}

function cleanupOldBackups() {
  try {
    const backupKeys = Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_BACKUP_PREFIX))
      .sort()
      .reverse();

    backupKeys.slice(MAX_BACKUPS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("백업 정리 실패:", error);
  }
}

function createStorageBackup() {
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    if (!currentRaw) return;

    const currentParsed = safeParseJSON(currentRaw);
    if (!currentParsed) return;

    const backupKey = `${STORAGE_BACKUP_PREFIX}${new Date().toISOString()}`;
    localStorage.setItem(backupKey, currentRaw);
    cleanupOldBackups();
  } catch (error) {
    console.warn("자동 백업 생성 실패:", error);
  }
}

function restoreLatestValidBackup() {
  try {
    const backupKeys = Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_BACKUP_PREFIX))
      .sort()
      .reverse();

    for (const key of backupKeys) {
      const parsed = safeParseJSON(localStorage.getItem(key));
      if (!parsed) continue;

      const restored = migrateData({ ...emptyData(), ...parsed });
      if (isValidAppData(restored)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        console.warn("최신 정상 백업으로 복구 완료:", key);
        return restored;
      }
    }
  } catch (error) {
    console.error("백업 복구 실패:", error);
  }

  return emptyData();
}

function loadData() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = safeParseJSON(raw);
      if (!parsed) {
        console.warn("저장 데이터 손상 감지:", key);
        return restoreLatestValidBackup();
      }

      const migrated = migrateData({ ...emptyData(), ...parsed });
      if (!isValidAppData(migrated)) {
        console.warn("저장 데이터 구조 오류 감지:", key);
        return restoreLatestValidBackup();
      }

      return migrated;
    }

    return emptyData();
  } catch (error) {
    console.error("데이터 불러오기 실패:", error);
    return restoreLatestValidBackup();
  }
}

function saveData(d) {
  try {
    const nextData = migrateData({
      ...emptyData(),
      ...d,
      lastSavedAt: new Date().toISOString(),
    });

    if (!isValidAppData(nextData)) {
      throw new Error("저장 데이터 구조가 올바르지 않습니다.");
    }

    createStorageBackup();

    const serialized = JSON.stringify(nextData);

    try {
      localStorage.setItem(STORAGE_TEMP_KEY, serialized);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.removeItem(STORAGE_TEMP_KEY);
    } catch (storageErr) {
      localStorage.removeItem(STORAGE_TEMP_KEY);
      const isQuota =
        storageErr instanceof DOMException &&
        (storageErr.name === "QuotaExceededError" ||
          storageErr.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
          storageErr.code === 22);
      const sizeKB = Math.round(new Blob([serialized]).size / 1024);
      const errMsg = isQuota
        ? `저장 공간 부족 (현재 데이터 ${sizeKB}KB). 오래된 백업을 삭제하거나 데이터 관리 탭에서 내보내기 후 정리하세요.`
        : storageErr.message || "저장 실패";
      // 앱 상단에 경고 배너 표시
      const bannerId = "__storage_quota_warning";
      if (!document.getElementById(bannerId)) {
        const banner = document.createElement("div");
        banner.id = bannerId;
        banner.style.cssText =
          "position:fixed;top:0;left:0;right:0;z-index:99999;background:#ff5c72;color:#fff;font-size:13px;font-weight:700;padding:10px 20px;text-align:center;";
        banner.innerHTML = `⚠️ ${errMsg} <button onclick="this.parentElement.remove()" style="margin-left:12px;background:rgba(255,255,255,.25);border:none;color:#fff;padding:2px 10px;border-radius:6px;cursor:pointer;font-weight:700">닫기</button>`;
        document.body.prepend(banner);
        setTimeout(() => banner?.remove(), 12000);
      }
      throw new Error(errMsg);
    }

    console.info("데이터 저장 완료:", nextData.lastSavedAt);
    return { ok: true, savedAt: nextData.lastSavedAt };
  } catch (error) {
    console.error("데이터 저장 실패:", error);
    try { localStorage.removeItem(STORAGE_TEMP_KEY); } catch {}
    return {
      ok: false,
      error: error.message || "알 수 없는 저장 오류",
    };
  }
}


function estimateJSONSizeBytes(value) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  const size = n(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getStorageBackupList() {
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_BACKUP_PREFIX))
      .sort()
      .reverse()
      .map((key) => {
        const raw = localStorage.getItem(key);
        const parsed = safeParseJSON(raw);
        const migrated = parsed ? migrateData({ ...emptyData(), ...parsed }) : null;
        const createdAt = key.replace(STORAGE_BACKUP_PREFIX, "");
        return {
          key,
          createdAt,
          sizeBytes: raw ? new Blob([raw]).size : 0,
          valid: !!migrated && isValidAppData(migrated),
          transactionCount: Array.isArray(migrated?.transactions) ? migrated.transactions.length : 0,
          assetCount: Array.isArray(migrated?.assets) ? migrated.assets.length : 0,
          portfolioCount: Array.isArray(migrated?.portfolio) ? migrated.portfolio.length : 0,
          lastSavedAt: migrated?.lastSavedAt || parsed?.lastSavedAt || "",
        };
      });
  } catch (error) {
    console.warn("백업 목록 조회 실패:", error);
    return [];
  }
}

function createManualStorageBackup(data, label = "manual") {
  try {
    const nextData = migrateData({
      ...emptyData(),
      ...data,
      lastManualBackupAt: new Date().toISOString(),
    });
    if (!isValidAppData(nextData)) throw new Error("백업할 데이터 구조가 올바르지 않습니다.");
    const safeLabel = String(label || "manual").replace(/[^a-zA-Z0-9가-힣_-]/g, "").slice(0, 24) || "manual";
    const backupKey = `${STORAGE_BACKUP_PREFIX}${new Date().toISOString()}:${safeLabel}`;
    localStorage.setItem(backupKey, JSON.stringify(nextData));
    cleanupOldBackups();
    return { ok: true, key: backupKey, data: nextData };
  } catch (error) {
    console.error("수동 백업 생성 실패:", error);
    return { ok: false, error: error.message || "백업 생성 실패" };
  }
}

function restoreStorageBackup(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("선택한 백업을 찾을 수 없습니다.");
    const parsed = safeParseJSON(raw);
    if (!parsed) throw new Error("백업 파일이 JSON 형식이 아닙니다.");
    const restored = migrateData({ ...emptyData(), ...parsed, lastRestoredAt: new Date().toISOString() });
    if (!isValidAppData(restored)) throw new Error("백업 데이터 구조가 올바르지 않습니다.");
    createStorageBackup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
    return { ok: true, data: restored };
  } catch (error) {
    console.error("백업 복원 실패:", error);
    return { ok: false, error: error.message || "백업 복원 실패" };
  }
}

function deleteStorageBackup(key) {
  try {
    localStorage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "백업 삭제 실패" };
  }
}

function validateImportedAppData(rawText) {
  const parsed = safeParseJSON(rawText);
  if (!parsed) return { ok: false, error: "JSON 형식이 올바르지 않습니다." };
  const migrated = migrateData({ ...emptyData(), ...parsed });
  if (!isValidAppData(migrated)) return { ok: false, error: "앱 데이터 구조가 올바르지 않습니다." };
  return { ok: true, data: migrated };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const OB_KEY = "season-onboarding-done-v1";
const OB_DISCLAIMER_KEY = "season-disclaimer-agreed-v1";

function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);

  /* 면책 동의 */
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);

  /* Step 1 */
  const [name,         setName]         = useState("");
  const [age,          setAge]          = useState("36");
  const [retireAge,    setRetireAge]    = useState("55");
  const [salary,       setSalary]       = useState("");
  const [spouseOn,     setSpouseOn]     = useState(false);
  const [spouseSal,    setSpouseSal]    = useState("");

  /* Step 2 */
  const [investStyle,  setInvestStyle]  = useState("");
  const [monthlyInv,   setMonthlyInv]   = useState("200");
  const [retireTarget, setRetireTarget] = useState("20");
  const [emergFund,    setEmergFund]    = useState("");

  /* Step 3 */
  const [bankBal,      setBankBal]      = useState("");
  const [isaBal,       setIsaBal]       = useState("");
  const [pensionBal,   setPensionBal]   = useState("");
  const [hasLoan,      setHasLoan]      = useState(false);
  const [loanBal,      setLoanBal]      = useState("");

  const toNum = v => { const x = Number(String(v).replace(/,/g, "")); return isFinite(x) ? x : 0; };

  /* 완료: settings + assets 빌드 후 콜백 */
  const handleComplete = () => {
    const styleMap = {
      "안정형": { nasdaq:0.25, nasdaqH:0.15, dividend:0.60 },
      "균형형": { nasdaq:0.45, nasdaqH:0.45, dividend:0.10 },
      "성장형": { nasdaq:0.60, nasdaqH:0.35, dividend:0.05 },
    };
    const w = styleMap[investStyle] || styleMap["균형형"];
    const mi = toNum(monthlyInv) * 10000;

    const newSettings = {
      currentAge:              toNum(age) || 36,
      retireAge:               toNum(retireAge) || 55,
      monthlySalary1:          toNum(salary) * 10000,
      monthlySalary2:          spouseOn ? toNum(spouseSal) * 10000 : 0,
      spouseEnabled:           spouseOn,
      monthlyInvestDefault:    mi,
      monthlyInvestStage1:     mi,
      monthlyInvestStage2:     Math.round(mi * 1.25),
      monthlyInvestStage3:     Math.round(mi * 2.5),
      triggerMonthlyInvestAmount: mi,
      retirementTargetAmount:  toNum(retireTarget) * 100000000,
      targetNasdaqWeight:      w.nasdaq,
      targetNasdaqHWeight:     w.nasdaqH,
      targetDividendWeight:    w.dividend,
      investmentTargets: [
        { id:"target-nasdaq",   name:"나스닥",   expectedReturn:0.12, targetWeight:w.nasdaq,   memo:"TIGER 나스닥100 포함" },
        { id:"target-nasdaqH",  name:"나스닥(H)", expectedReturn:0.11, targetWeight:w.nasdaqH,  memo:"TIGER 나스닥100(H)" },
        { id:"target-dividend", name:"배당",     expectedReturn:0.08, targetWeight:w.dividend, memo:"배당 ETF" },
      ],
    };

    const newAssets = [];
    if (toNum(bankBal) > 0)    newAssets.push({ id:uid(), kind:"자산", category:"은행예금", name:"은행 잔고",   current:toNum(bankBal)*10000,    previous:0, includeInEmergency:true,  note:"온보딩 입력" });
    if (toNum(isaBal) > 0)     newAssets.push({ id:uid(), kind:"자산", category:"ISA",      name:"ISA 계좌",    current:toNum(isaBal)*10000,     previous:0, includeInEmergency:false, note:"온보딩 입력" });
    if (toNum(pensionBal) > 0) newAssets.push({ id:uid(), kind:"자산", category:"연금",     name:"연금저축/IRP", current:toNum(pensionBal)*10000, previous:0, includeInEmergency:false, note:"온보딩 입력" });
    if (hasLoan && toNum(loanBal) > 0)
                               newAssets.push({ id:uid(), kind:"부채", category:"대출",     name:"대출",         current:toNum(loanBal)*10000,    previous:0, includeInEmergency:false, note:"온보딩 입력" });

    localStorage.setItem(OB_KEY, "1");
    localStorage.setItem(OB_DISCLAIMER_KEY, "1");
    onComplete({ newSettings, newAssets, userName: name.trim() });
  };

  /* 건너뛰기 */
  const handleSkip = () => { localStorage.setItem(OB_KEY, "1"); localStorage.setItem(OB_DISCLAIMER_KEY, "1"); onComplete({}); };

  /* 유효성 */
  const ok1 = toNum(age) >= 18 && toNum(retireAge) > toNum(age);
  const ok2 = !!investStyle;

  /* 스텝 진행 바 */
  const Stepper = () => (
    <div className="ob-stepper">
      {[1,2,3].map((s,i) => (
        <React.Fragment key={s}>
          {i > 0 && <div className={`ob-st-line ${step > s-1 ? "done" : step === s-1 ? "active" : ""}`}/>}
          <div className={`ob-st-dot ${step > s ? "done" : step === s ? "active" : ""}`}>
            {step > s ? "✓" : s}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  /* 태그 버튼 */
  const Tag = ({ val, sel, onClick, children }) => (
    <button type="button" className={`ob-tag ${sel ? "sel" : ""}`} onClick={onClick}>{children}</button>
  );

  /* 순자산 미리보기 */
  const netPreview = (toNum(bankBal) + toNum(isaBal) + toNum(pensionBal) - (hasLoan ? toNum(loanBal) : 0)) * 10000;
  const showPreview = (toNum(bankBal) + toNum(isaBal) + toNum(pensionBal)) > 0;

  return (
    <div className="ob-overlay">
      <div className="ob-card">

        {/* 로고 */}
        <div className="ob-logo-row">
          <div className="ob-logo-mark">S</div>
          <span className="ob-logo-name">Season Finance</span>
        </div>

        <Stepper/>

        {/* ──────── STEP 1: 기본 정보 ──────── */}
        {step === 1 && (
          <>
            <div className="ob-eyebrow">Step 1 · 기본 정보</div>
            <div className="ob-h">안녕하세요 👋<br/>기본 정보를 알려주세요</div>
            <div className="ob-sub">맞춤 재무 계산을 시작합니다. 언제든 설정에서 변경할 수 있어요.</div>

            {/* ── 면책 동의 박스 ── */}
            <div style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(240,180,41,.08)",
              border: "1px solid rgba(240,180,41,.28)",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", marginBottom: 8 }}>
                ⚠️ 이용 전 필수 동의
              </div>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.65, margin: "0 0 12px" }}>
                Season Finance는 <strong>투자자문업 미등록 개인 재무 현황 계산기</strong>입니다.
                제공되는 모든 수치·분석·제안은 사용자가 직접 입력한 데이터를 기반으로 한 <strong>참고용</strong>이며,
                실제 투자·세무 결정의 근거로 사용하지 마세요.
                실제 투자 결정은 반드시 공인 금융전문가 또는 세무사와 상담하시기 바랍니다.
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={disclaimerAgreed}
                  onChange={e => setDisclaimerAgreed(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--accent)", flexShrink: 0 }}
                />
                위 내용을 확인했으며, 이 앱이 참고용 계산기임을 이해합니다.
              </label>
            </div>

            <div className="ob-fstack">
              <div className="ob-f">
                <label>이름 (선택)</label>
                <input placeholder="홍길동" value={name} onChange={e=>setName(e.target.value)} maxLength={20}/>
              </div>

              <div className="ob-row2">
                <div className="ob-f">
                  <label>현재 나이</label>
                  <input type="number" placeholder="36" value={age} onChange={e=>setAge(e.target.value)} min={18} max={80}/>
                  <span className="ob-hint">만 나이</span>
                </div>
                <div className="ob-f">
                  <label>목표 은퇴 나이</label>
                  <input type="number" placeholder="55" value={retireAge} onChange={e=>setRetireAge(e.target.value)} min={30} max={80}/>
                  {!ok1 && toNum(age)>0 && <span className="ob-hint" style={{color:"var(--red)"}}>은퇴 나이는 현재 나이보다 커야 해요</span>}
                </div>
              </div>

              <div className="ob-f">
                <label>월 세후 수입 (만원)</label>
                <input type="number" placeholder="400" value={salary} onChange={e=>setSalary(e.target.value)} min={0}/>
                <span className="ob-hint">세후 실수령액 · 배우자 수입은 아래에 따로 입력</span>
              </div>

              <div className="ob-f">
                <label>배우자 수입 포함</label>
                <div className="ob-tags">
                  <Tag sel={!spouseOn} onClick={()=>setSpouseOn(false)}>해당 없음</Tag>
                  <Tag sel={spouseOn}  onClick={()=>setSpouseOn(true)}>포함할게요</Tag>
                </div>
              </div>
              {spouseOn && (
                <div className="ob-f">
                  <label>배우자 월 수입 (만원)</label>
                  <input type="number" placeholder="350" value={spouseSal} onChange={e=>setSpouseSal(e.target.value)} min={0}/>
                </div>
              )}
            </div>

            <div className="ob-footer">
              <button className="ob-skip" onClick={handleSkip}>나중에 할게요</button>
              <button className="ob-btn primary" onClick={()=>setStep(2)} disabled={!ok1 || !disclaimerAgreed}>
                다음 단계 →
              </button>
            </div>
          </>
        )}

        {/* ──────── STEP 2: 투자 성향 & 목표 ──────── */}
        {step === 2 && (
          <>
            <div className="ob-eyebrow">Step 2 · 투자 목표</div>
            <div className="ob-h">투자 성향과<br/>목표를 알려주세요</div>
            <div className="ob-sub">시뮬레이션과 목표비중 계산에 바로 반영됩니다.</div>

            <div className="ob-fstack">
              <div className="ob-f">
                <label>투자 성향</label>
                <div className="ob-tags">
                  {[
                    ["안정형",  "배당 비중 높게"],
                    ["균형형",  "나스닥+배당 Mix"],
                    ["성장형",  "나스닥 집중"],
                  ].map(([v, d]) => (
                    <div key={v} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <Tag val={v} sel={investStyle===v} onClick={()=>setInvestStyle(v)}>{v}</Tag>
                      <span style={{fontSize:10,color:"var(--text3)",textAlign:"center"}}>{d}</span>
                    </div>
                  ))}
                </div>
                {!ok2 && <span className="ob-hint" style={{color:"var(--amber)"}}>투자 성향을 하나 선택해주세요</span>}
              </div>

              <div className="ob-row2">
                <div className="ob-f">
                  <label>월 투자금 (만원)</label>
                  <input type="number" placeholder="200" value={monthlyInv} onChange={e=>setMonthlyInv(e.target.value)} min={0}/>
                  <span className="ob-hint">현재 여력 기준</span>
                </div>
                <div className="ob-f">
                  <label>은퇴 목표자산 (억원)</label>
                  <input type="number" placeholder="20" value={retireTarget} onChange={e=>setRetireTarget(e.target.value)} min={1}/>
                  <span className="ob-hint">예: 20억 → 20 입력</span>
                </div>
              </div>

              <div className="ob-f">
                <label>현재 비상금 (만원)</label>
                <input type="number" placeholder="1000" value={emergFund} onChange={e=>setEmergFund(e.target.value)} min={0}/>
                <span className="ob-hint">파킹통장·CMA 등 즉시 인출 가능한 금액. 월 지출 3~6개월치가 권장이에요.</span>
              </div>
            </div>

            <div className="ob-footer">
              <button className="ob-btn ghost" onClick={()=>setStep(1)}>← 이전</button>
              <button className="ob-btn primary" onClick={()=>setStep(3)} disabled={!ok2}>
                다음 단계 →
              </button>
            </div>
          </>
        )}

        {/* ──────── STEP 3: 첫 자산 입력 ──────── */}
        {step === 3 && (
          <>
            <div className="ob-eyebrow">Step 3 · 자산 입력</div>
            <div className="ob-h">주요 자산을<br/>입력해주세요</div>
            <div className="ob-sub">대략적인 금액도 괜찮아요. 나중에 자산 탭에서 수정할 수 있어요.</div>

            <div className="ob-fstack">
              <div className="ob-row2">
                <div className="ob-f">
                  <label>은행 잔고 (만원)</label>
                  <input type="number" placeholder="3000" value={bankBal} onChange={e=>setBankBal(e.target.value)} min={0}/>
                </div>
                <div className="ob-f">
                  <label>ISA 계좌 (만원)</label>
                  <input type="number" placeholder="1500" value={isaBal} onChange={e=>setIsaBal(e.target.value)} min={0}/>
                </div>
              </div>

              <div className="ob-row2">
                <div className="ob-f">
                  <label>연금저축 / IRP (만원)</label>
                  <input type="number" placeholder="800" value={pensionBal} onChange={e=>setPensionBal(e.target.value)} min={0}/>
                </div>
                <div className="ob-f">
                  <label>대출 여부</label>
                  <div className="ob-tags" style={{marginTop:2}}>
                    <Tag sel={!hasLoan} onClick={()=>setHasLoan(false)}>없음</Tag>
                    <Tag sel={hasLoan}  onClick={()=>setHasLoan(true)}>있음</Tag>
                  </div>
                </div>
              </div>

              {hasLoan && (
                <div className="ob-f">
                  <label>대출 잔액 (만원)</label>
                  <input type="number" placeholder="5000" value={loanBal} onChange={e=>setLoanBal(e.target.value)} min={0}/>
                </div>
              )}

              {showPreview && (
                <div className="ob-preview">
                  <div className="ob-preview-label">입력 중인 순자산</div>
                  <div className="ob-preview-val">
                    {new Intl.NumberFormat("ko-KR").format(netPreview)}원
                  </div>
                  <div className="ob-preview-sub">
                    포트폴리오·거래 내역 입력 후 더 정확해집니다
                  </div>
                </div>
              )}
            </div>

            <div className="ob-footer">
              <button className="ob-btn ghost" onClick={()=>setStep(2)}>← 이전</button>
              <button className="ob-btn primary" onClick={handleComplete}>
                🚀 시작하기
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

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

function AnimatedScoreBar({ value }) {
  const score = clamp(n(value), 0, 100);
  const color = score >= 70 ? "#34d58a" : score >= 50 ? "#6c7dff" : score >= 35 ? "#f0b429" : "#ff5c72";
  const label = score >= 70 ? "안정권" : score >= 50 ? "관리 필요" : score >= 35 ? "주의 구간" : "위험 구간";

  return (
    <div className="animated-score-wrap">
      <div className="animated-score-top">
        <span>{label}</span>
        <b>{Math.round(score)}%</b>
      </div>
      <div className="animated-score-track">
        <div className="animated-score-fill" style={{ width: `${score}%`, background: color }} />
        <div className="animated-score-glow" style={{ left: `${score}%`, background: color }} />
      </div>
      <div className="animated-score-scale">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

function GoalGauge({ value, target, title }) {
  const score = Math.min((Math.max(n(value), 0) / Math.max(n(target), 1)) * 100, 100);
  const color = score >= 70 ? "#34d58a" : score >= 50 ? "#6c7dff" : score >= 35 ? "#f0b429" : "#ff5c72";
  return (
    <div className="goal-gauge-compact">
      <div className="row-between" style={{marginBottom:8}}>
        <span className="kpi-label">{title}</span>
        <strong style={{color, fontSize:14}}>{fmtPct(score,0)}</strong>
      </div>
      <div className="animated-score-track">
        <div className="animated-score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <div className="row-between" style={{marginTop:8,fontSize:11,color:"var(--text3)"}}>
        <span>현재 {fmt(value)}</span>
        <span>목표 {fmt(target)}</span>
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
            <div style={{fontSize:11,fontWeight:800,color:"var(--accent2)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>재무 현황 요약</div>
            <h3 style={{fontSize:20,marginBottom:6,letterSpacing:"-.03em"}}>{coach.title}</h3>
            <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,whiteSpace:"pre-line"}}>{coach.summary}</p>
          </div>
        </div>
        <div style={{textAlign:"right",minWidth:90}}>
          <div style={{fontSize:34,fontWeight:900,letterSpacing:"-.05em",lineHeight:1}}>{coach.score}<span style={{fontSize:13,color:"var(--text3)",marginLeft:2}}>점</span></div>
          <span className={`badge ${badgeClass}`} style={{marginTop:7}}>참고 분석</span>
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
    actions.push({ label: "목표비중 설정 확인", tag: "설정" });
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
    actions.push({ label: "목표비중 현황 확인", tag: "리밸런싱" });
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
  const [accountId,setAccountId]=useState("");
  const [pw,setPw]=useState("");
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");
  const [msgOk,setMsgOk]=useState(false);
  const [showMobileLogin, setShowMobileLogin]=useState(false);

  const accountLabel = session?.user ? displayAccountName(session.user) : "";

  const runAuth=async(mode)=>{
    if(!supabase){setMsg("Supabase 미설정");setMsgOk(false);return}
    const loginId = normalizeLoginId(accountId);
    if(!loginId||!pw){setMsg("아이디와 비밀번호를 입력해주세요");setMsgOk(false);return}
    if(!isValidLoginId(loginId)){setMsg("아이디는 영문 소문자·숫자·._- 조합 3~32자로 입력해주세요");setMsgOk(false);return}
    if(pw.length<6){setMsg("비밀번호는 6자 이상 입력해주세요");setMsgOk(false);return}
    const authEmail = loginIdToAuthEmail(loginId);
    setBusy(true);setMsg("");
    try{
      if(mode==="signup"){
        const { error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: pw,
          options: { data: { login_id: loginId, account_id: loginId, display_name: loginId } }
        });
        if(signUpError) throw signUpError;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password: pw });
        if(signInError) {
          setMsg("계정은 생성됐지만 Supabase 이메일 확인 설정이 켜져 있어 바로 로그인할 수 없습니다. Supabase Auth의 Confirm email을 꺼주세요.");
          setMsgOk(false);
          return;
        }
        setMsg("🎉 계정 생성 및 로그인 완료");setMsgOk(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: pw });
        if(error) throw error;
        setMsg("✓ 로그인 완료");setMsgOk(true);
      }
      setTimeout(()=>setShowMobileLogin(false),800);
    }catch(e){
      const raw = e.message || "오류가 발생했습니다";
      const friendly = raw.includes("Invalid login credentials") ? "아이디 또는 비밀번호가 맞지 않습니다" : raw;
      setMsg(friendly);setMsgOk(false)
    }finally{setBusy(false)}
  };

  const syncLabel = syncState || "";
  const syncClass = syncLabel.includes("완료")?"":"syncing";

  let pcBar = null;

  if(!supabase) {
    pcBar = (
      <div className="season-login-panel auth-bar-login-required">
        <div className="season-login-panel-logo-row"><div className="season-login-panel-logo">S</div><span className="season-login-panel-brand">계정 동기화</span></div>
        <div className="row" style={{gap:8,flexWrap:"wrap"}}>
          <input className="auth-input" type="text" placeholder="아이디" value={accountId} onChange={e=>setAccountId(e.target.value)} autoComplete="username" inputMode="text" />
          <input className="auth-input" type="password" placeholder="비밀번호" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="current-password" />
          <button className="btn btn-sm btn-primary" onClick={()=>setMsg("Supabase 연결값이 없어 아직 계정 동기화를 시작할 수 없습니다. Vercel 환경변수 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 먼저 등록해주세요.")} type="button">로그인</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>setMsg("Supabase 연결값이 없어 아직 계정 생성이 비활성화되어 있습니다.")} type="button">계정 만들기</button>
          <span style={{fontSize:11,color:"var(--amber)",fontWeight:700}}>⚠ 동기화 설정 필요</span>
          {msg&&<span style={{fontSize:11,color:"var(--amber)"}}>{msg}</span>}
        </div>
      </div>
    );
  } else if(session?.user) {
    pcBar = (
      <div className="season-login-panel">
        <div className="season-login-panel-logo-row"><div className="season-login-panel-logo">S</div><span className="season-login-panel-brand">Season Finance</span></div>
        <div className="row" style={{gap:8}}>
          {syncLabel&&<span className={`auth-bar-sync ${syncClass}`}>⟳ {syncLabel}</span>}
          <span style={{fontSize:11,color:"var(--text3)"}}>👤 {accountLabel}</span>
          <button className="btn btn-sm btn-ghost" onClick={onLoadCloud}>불러오기</button>
          <button className="btn btn-sm btn-ghost" onClick={onSaveCloud}>저장</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>supabase.auth.signOut()}>로그아웃</button>
        </div>
      </div>
    );
  } else {
    pcBar = (
      <div className="season-login-panel">
        <div className="season-login-panel-logo-row"><div className="season-login-panel-logo">S</div><span className="season-login-panel-brand">계정 동기화</span></div>
        <div className="row" style={{gap:8}}>
          <input
            className="auth-input"
            type="text"
            placeholder="아이디"
            value={accountId}
            onChange={e=>setAccountId(e.target.value)}
            autoComplete="username"
            inputMode="text"
          />
          <input
            className="auth-input"
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&runAuth("signin")}
            autoComplete="current-password"
          />
          <button className="btn btn-sm btn-primary" onClick={()=>runAuth("signin")} disabled={busy}>{busy?"처리 중...":"로그인"}</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>runAuth("signup")} disabled={busy}>계정 만들기</button>
          {msg&&<span style={{fontSize:11,color:msgOk?"var(--green)":"var(--red)"}}>{msg}</span>}
        </div>
      </div>
    );
  }

  return (
    <>
      {pcBar}

      {showMobileLogin&&(
        <>
          <div className="mobile-login-modal-overlay" onClick={()=>setShowMobileLogin(false)}/>
          <div className="mobile-login-sheet" onClick={e=>e.stopPropagation()}>
            <div className="mlo-header">
              <div className="mlo-glow"/>
              <div className="mlo-handle"/>
              <div className="mlo-logo-row">
                <div className="mlo-logo-mark">S</div>
                <div><div className="mlo-logo-text">Season CFO</div><div className="mlo-logo-sub">개인 자산관리</div></div>
              </div>
              {!session?.user&&<><div className="mlo-headline">로그인하고<br/>안전하게 동기화</div><div className="mlo-sub">아이디와 비밀번호로 여러 기기에서<br/>자산 데이터를 이어서 관리할 수 있어요.</div>{!supabase&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:14,border:"1px solid rgba(255,190,90,.28)",background:"rgba(255,190,90,.10)",color:"var(--amber)",fontSize:12,fontWeight:800}}>Supabase 환경변수 등록 전이라 로그인은 아직 비활성화 상태입니다.</div>}</>}
              {session?.user&&<><div className="mlo-headline">연결되었어요 ✓</div><div className="mlo-sub">클라우드에 자동으로 동기화 중입니다.</div></>}
            </div>
            <div className="mlo-body">
              {session?.user ? (
                <>
                  <div className="mlo-session-bar">
                    <div className="mlo-session-avatar">{accountLabel[0]?.toUpperCase()||"S"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="mlo-session-email">{accountLabel}</div>
                      <div className="mlo-session-status">● 연결됨 {syncLabel&&`· ${syncLabel}`}</div>
                    </div>
                  </div>
                  <div className="mlo-action-row">
                    <button className="mlo-action-btn" onClick={()=>{onLoadCloud();setShowMobileLogin(false)}}>📥 불러오기</button>
                    <button className="mlo-action-btn" onClick={()=>{onSaveCloud();setShowMobileLogin(false)}}>☁️ 저장</button>
                    <button className="mlo-action-btn danger" onClick={()=>{supabase.auth.signOut();setShowMobileLogin(false)}}>로그아웃</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mlo-field">
                    <label>아이디</label>
                    <div className="mlo-input-wrap">
                      <span className="mlo-input-icon">👤</span>
                      <input
                        className="mlo-input"
                        type="text"
                        placeholder="예: season123"
                        value={accountId}
                        onChange={e=>setAccountId(e.target.value)}
                        autoComplete="username"
                        inputMode="text"
                      />
                    </div>
                  </div>
                  <div className="mlo-field">
                    <label>비밀번호</label>
                    <div className="mlo-input-wrap">
                      <span className="mlo-input-icon">🔒</span>
                      <input
                        className="mlo-input"
                        type="password"
                        placeholder="6자 이상"
                        value={pw}
                        onChange={e=>setPw(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&runAuth("signin")}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  {msg&&<div className={`mlo-msg ${msgOk?"ok":""}`}>{msg}</div>}
                  <div className="mlo-btn-row">
                    <button className="mlo-btn-primary" onClick={()=>runAuth("signin")} disabled={busy}>{busy?"로그인 중...":"로그인"}</button>
                    <button className="mlo-btn-secondary" onClick={()=>runAuth("signup")} disabled={busy}>{busy?"처리 중...":"계정 만들기"}</button>
                  </div>
                  <div className="mlo-divider">또는</div>
                  <button className="mlo-local-chip" onClick={()=>setShowMobileLogin(false)}>
                    <div className="mlo-local-icon">📱</div>
                    <div><div style={{fontSize:12,fontWeight:700,color:"var(--text2)"}}>로그인 없이 둘러보기</div><div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>이 기기에만 저장됩니다</div></div>
                  </button>
                </>
              )}
            </div>
            <div style={{height:16}}/>
          </div>
        </>
      )}

      {/* 모바일 동기화 버튼은 mobile-header에 주입 (데이터만 노출) */}
      <div id="__authbar_mobile_state" data-session={accountLabel||""} data-sync={syncLabel} data-show-login={String(showMobileLogin)} style={{display:"none"}} onClick={()=>setShowMobileLogin(v=>!v)}/>
    </>
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


// ─── 개인 CFO 판단 로직: 점수 → 이유 → 행동 → 점수상승 시뮬레이션 ────────────────────────────────
function normalizeReturnRate(v, fallback=0.08) {
  const x = n(v);
  if (!Number.isFinite(x) || x === 0) return fallback;
  return x > 1 ? x / 100 : x;
}

function calcCFOScoreFromMetrics({ income=0, expense=0, net=0, emergencyFund=0, investmentAssets=0, totalAssetsBase=0, retireTarget=0, retirementProgressPct=0, overBudgetCount=0 }) {
  const emergencyMonths = expense > 0 ? emergencyFund / expense : 0;
  const investmentRatioPct = totalAssetsBase > 0 ? investmentAssets / totalAssetsBase * 100 : 0;
  const savingsRatePct = income > 0 ? net / income * 100 : 0;

  let scoreConsumption = 0;
  if (income <= 0 && expense <= 0) scoreConsumption = 12;
  else if (savingsRatePct >= 50) scoreConsumption = 25;
  else if (savingsRatePct >= 30) scoreConsumption = 21;
  else if (savingsRatePct >= 20) scoreConsumption = 17;
  else if (savingsRatePct >= 10) scoreConsumption = 11;
  else if (savingsRatePct >= 0) scoreConsumption = 7;
  else scoreConsumption = 3;
  scoreConsumption = Math.max(0, scoreConsumption - overBudgetCount * 2);

  let scoreInvestment = 0;
  if (investmentRatioPct >= 70) scoreInvestment = 30;
  else if (investmentRatioPct >= 50) scoreInvestment = 25;
  else if (investmentRatioPct >= 30) scoreInvestment = 18;
  else if (investmentRatioPct >= 10) scoreInvestment = 10;
  else scoreInvestment = investmentAssets > 0 ? 6 : 3;

  let scoreEmergency = 0;
  if (emergencyMonths >= 6) scoreEmergency = 20;
  else if (emergencyMonths >= 3) scoreEmergency = 15;
  else if (emergencyMonths >= 1) scoreEmergency = 8;
  else scoreEmergency = 2;

  const scoreRetirement = retireTarget > 0 ? Math.round(clamp(retirementProgressPct / 100 * 25, 0, 25)) : 10;
  const totalScore = clamp(Math.round(scoreConsumption + scoreInvestment + scoreEmergency + scoreRetirement), 0, 100);

  return { totalScore, scoreConsumption, scoreInvestment, scoreEmergency, scoreRetirement, savingsRatePct, emergencyMonths, investmentRatioPct, retirementProgressPct };
}

function buildCFOScoreSimulation({ data={}, dashboard={}, dashboardDetail={}, financialAnalysis={}, baseMetrics={}, months=24 }) {
  const settings = data.settings || {};
  const monthlyInvest = Math.max(n(settings.triggerMonthlyInvestAmount || settings.monthlyInvestDefault || settings.monthlyInvestStage1 || 0), 0);
  const annualReturn = normalizeReturnRate(settings.annualReturnNasdaq || settings.annualReturnDividend || 0.08, 0.08);
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const expense = n(baseMetrics.expense);
  const income = n(baseMetrics.income);
  const retireTarget = n(baseMetrics.retireTarget);
  const overBudgetCount = n(baseMetrics.overBudgetCount);

  let emergencyFund = n(baseMetrics.emergencyFund);
  let investmentAssets = n(baseMetrics.investmentAssets);
  let totalAssetsBase = Math.max(n(baseMetrics.totalAssetsBase), emergencyFund + investmentAssets);
  const rows = [];

  for (let m = 1; m <= months; m++) {
    const emergencyMonths = expense > 0 ? emergencyFund / expense : 0;
    let toEmergency = 0;
    let toInvestment = monthlyInvest;

    // 3개월 미만은 비상금 우선, 3~6개월은 일부 보강, 6개월 이상은 투자 중심
    if (expense > 0 && emergencyMonths < 3) {
      toEmergency = monthlyInvest * 0.7;
      toInvestment = monthlyInvest * 0.3;
    } else if (expense > 0 && emergencyMonths < 6) {
      toEmergency = monthlyInvest * 0.35;
      toInvestment = monthlyInvest * 0.65;
    }

    emergencyFund += toEmergency;
    investmentAssets = investmentAssets * (1 + monthlyReturn) + toInvestment;
    totalAssetsBase += toEmergency + toInvestment + Math.max(investmentAssets * monthlyReturn, 0);
    const retirementProgressPct = retireTarget > 0 ? totalAssetsBase / retireTarget * 100 : n(baseMetrics.retirementProgressPct);
    const score = calcCFOScoreFromMetrics({ income, expense, net:n(baseMetrics.net), emergencyFund, investmentAssets, totalAssetsBase, retireTarget, retirementProgressPct, overBudgetCount });

    rows.push({
      month:m,
      score:score.totalScore,
      emergencyMonths:score.emergencyMonths,
      investmentAssets,
      totalAssetsBase,
      toEmergency,
      toInvestment,
    });
  }

  const pick = (m) => rows.find((r)=>r.month===m) || rows[rows.length-1] || null;
  const monthsTo70 = rows.find((r)=>r.score >= 70)?.month || null;
  const monthsTo85 = rows.find((r)=>r.score >= 85)?.month || null;

  return {
    monthlyInvest,
    annualReturn,
    rows,
    checkpoints:[pick(3), pick(6), pick(12), pick(24)].filter(Boolean),
    monthsTo70,
    monthsTo85,
  };
}

function modelSafeScore(v){ return clamp(Math.round(n(v)),0,100); }

function buildCFODecisionModel({ data={}, dashboard={}, dashboardDetail={}, financialAnalysis={}, budgetAnalysis=[], futureSim=[] }) {
  const settings = data.settings || {};
  const income = n(dashboard.income);
  const expense = n(dashboard.expense);
  const net = n(dashboard.net);
  const emergencyFund = n(dashboardDetail.emergencyFund);
  const investmentAssets = n(financialAnalysis.total);
  const totalAssetsBase = Math.max(n(dashboard.totalAssets) + investmentAssets, n(dashboard.netWorth) + n(dashboard.totalLiabs), investmentAssets, emergencyFund);
  const lastFuture = Array.isArray(futureSim) && futureSim.length ? futureSim[futureSim.length - 1] : null;
  const retireTarget = n(data?.settings?.retirementTargetAmount);
  const retireProjected = n(lastFuture?.total || dashboardDetail?.retirementRow?.total || 0);
  const retirementProgressPct = retireTarget > 0 ? (retireProjected || totalAssetsBase) / retireTarget * 100 : 0;
  const overBudget = (budgetAnalysis || []).filter((b) => b.status === "초과");
  const warnBudget = (budgetAnalysis || []).filter((b) => b.status === "주의");

  const score = calcCFOScoreFromMetrics({ income, expense, net, emergencyFund, investmentAssets, totalAssetsBase, retireTarget, retirementProgressPct, overBudgetCount:overBudget.length });
  const { totalScore, scoreConsumption, scoreInvestment, scoreEmergency, scoreRetirement, savingsRatePct, emergencyMonths, investmentRatioPct } = score;

  const status = totalScore >= 85 ? "매우 우수" : totalScore >= 70 ? "양호" : totalScore >= 50 ? "주의 필요" : "위험";
  const tone = totalScore >= 85 ? "green" : totalScore >= 70 ? "accent" : totalScore >= 50 ? "amber" : "red";
  const toneColor = tone === "green" ? "var(--green)" : tone === "accent" ? "var(--accent)" : tone === "amber" ? "var(--amber)" : "var(--red)";
  const toneBg = tone === "green" ? "var(--green-bg)" : tone === "accent" ? "var(--accent-bg)" : tone === "amber" ? "var(--amber-bg)" : "var(--red-bg)";

  const scoreItems = [
    {
      key:"consumption", label:"소비 관리", score:scoreConsumption, max:25,
      desc:`저축률 ${fmtPct(savingsRatePct)}`,
      reason: savingsRatePct >= 30 ? "월 현금흐름이 안정적인 편입니다." : savingsRatePct >= 10 ? "저축은 되고 있지만 안정권까지는 보강이 필요합니다." : net < 0 ? "월 지출이 수입보다 커서 현금흐름이 적자입니다." : "저축률이 낮아 자산 증가 속도가 제한됩니다.",
      improve:`월 지출을 ${fmt(Math.max(expense*0.1,0))}원 줄이면 점수 개선에 도움이 됩니다.`,
    },
    {
      key:"investment", label:"투자 전략", score:scoreInvestment, max:30,
      desc:`투자비중 ${fmtPct(investmentRatioPct)}`,
      reason: investmentRatioPct >= 50 ? "성장자산 비중이 충분한 편입니다." : investmentRatioPct >= 30 ? "투자 비중은 있으나 장기 성장성은 더 높일 수 있습니다." : "총자산 대비 투자자산 비중이 낮아 장기 복리 효과가 제한됩니다.",
      improve:"비상금 확보 후 월 자동투자 금액을 유지하거나 단계적으로 늘리세요.",
    },
    {
      key:"emergency", label:"비상금", score:scoreEmergency, max:20,
      desc:`${emergencyMonths.toFixed(1)}개월치`,
      reason: emergencyMonths >= 6 ? "비상금이 안정권입니다." : emergencyMonths >= 3 ? "최소 방어선은 확보했지만 6개월치까지 보강하면 좋습니다." : "월 지출 대비 비상금이 부족해 예기치 못한 지출에 취약합니다.",
      improve:`최소 3개월치까지 ${fmt(Math.max(expense*3-emergencyFund,0))}원, 안정권 6개월치까지 ${fmt(Math.max(expense*6-emergencyFund,0))}원이 필요합니다.`,
    },
    {
      key:"retirement", label:"은퇴 준비", score:scoreRetirement, max:25,
      desc:`목표대비 ${fmtPct(retirementProgressPct)}`,
      reason: retirementProgressPct >= 80 ? "은퇴 목표 달성 가능성이 높은 편입니다." : retirementProgressPct >= 50 ? "은퇴 목표에 접근 중이나 가정 점검이 필요합니다." : "은퇴 목표 대비 현재 진행률이 낮아 장기 납입 계획이 중요합니다.",
      improve:"월 투자금·은퇴나이·기대수익률 가정을 바꿔 목표 도달 시점을 비교하세요.",
    },
  ];

  const problems = [];
  const actions = [];
  const pushProblem = (title, desc, priority="mid", impact=0) => problems.push({ title, desc, priority, impact });
  const pushAction = (title, desc, priority="mid", expectedScore=0, meta={}) => actions.push({ title, desc, priority, expectedScore, ...meta });

  // ─── Season 개인 재무 구조 기준 CFO 행동 지시 룰셋 ────────────────────────────
  // 기준: 비상금 1차 1,500만원 → 최종 3,000만원, 월 투자 100/150/200만원 단계 전환,
  // ISA 연 2,000만원, 포트폴리오 나스닥100 90%(H 45% + 비H 45%) / 배당다우존스 10%.
  const PERSONAL_CFO_RULESET = {
    emergencyFloor: 15000000,
    emergencyTarget: 30000000,
    stage1EmergencyMonthly: 2000000,
    stage1InvestMonthly: 1000000,
    stage2EmergencyMonthly: 500000,
    stage2InvestMonthly: 1500000,
    stage3InvestMonthly: 2000000,
    isaAnnualLimit: n(settings.isaAnnualLimit || 20000000),
    nasdaqTarget: 0.90,
    nasdaqHSubTarget: 0.45,
    nasdaqUnhedgedSubTarget: 0.45,
    dividendTarget: 0.10,
    rebalanceBand: n(settings.rebalanceBandPct || 5) / 100,
  };
  const currentYear = new Date().getFullYear();
  const txThisYear = (data.transactions || []).filter(t => String(t.date || "").startsWith(String(currentYear)));
  const isaContributed = txThisYear
    .filter(t => `${t.account || ""} ${t.fromAccount || ""} ${t.toAccount || ""} ${t.memo || ""}`.includes("ISA"))
    .reduce((sum, t) => sum + n(t.amount), 0);
  const isaRemaining = Math.max(PERSONAL_CFO_RULESET.isaAnnualLimit - isaContributed, 0);
  const monthsLeft = Math.max(12 - new Date().getMonth(), 1);
  const isaMonthlyNeed = Math.ceil(isaRemaining / monthsLeft / 10000) * 10000;
  const portfolioRows = data.portfolio || [];
  const positionValue = (p) => n(p.qty) * n(p.currentPrice || p.price || p.avgPrice);
  const portfolioMarketValue = portfolioRows.reduce((sum, p) => sum + positionValue(p), 0);
  const classValue = (keyword) => portfolioRows.filter(p => `${p.name || ""} ${p.assetClass || ""}`.includes(keyword)).reduce((sum, p) => sum + positionValue(p), 0);
  const nasdaqValue = portfolioRows.filter(p => `${p.name || ""} ${p.assetClass || ""}`.includes("나스닥")).reduce((sum, p) => sum + positionValue(p), 0);
  const nasdaqHValue = portfolioRows.filter(p => `${p.name || ""}`.includes("나스닥100(H)") || `${p.name || ""}`.includes("Nasdaq100(H)")).reduce((sum, p) => sum + positionValue(p), 0);
  const nasdaqUnhedgedValue = Math.max(nasdaqValue - nasdaqHValue, 0);
  const dividendValue = classValue("배당");
  const investBase = Math.max(portfolioMarketValue, investmentAssets, 1);
  const nasdaqWeight = nasdaqValue / investBase;
  const dividendWeight = dividendValue / investBase;
  const nasdaqHWeight = nasdaqHValue / investBase;
  const nasdaqUnhedgedWeight = nasdaqUnhedgedValue / investBase;

  if (emergencyFund < PERSONAL_CFO_RULESET.emergencyFloor) {
    const needToFloor = Math.max(PERSONAL_CFO_RULESET.emergencyFloor - emergencyFund, 0);
    const emergencyNow = Math.min(PERSONAL_CFO_RULESET.stage1EmergencyMonthly, needToFloor);
    pushProblem("비상금 1차 기준 미달", `현재 비상금 ${fmt(emergencyFund)}원 / 1차 기준 1,500만원입니다. 1차 기준까지 ${fmt(needToFloor)}원이 부족합니다.`, "high", 10);
    pushAction("비상금 목표 대비 현황 (참고)", `비상금 목표까지 ${fmt(emergencyNow)}원 부족한 상황입니다. 비상금 배분은 직접 판단하세요.`, "high", 9, { recommendedAmount: emergencyNow, ruleId:"season-emergency-stage1" });
  } else if (emergencyFund < PERSONAL_CFO_RULESET.emergencyTarget) {
    const needToTarget = Math.max(PERSONAL_CFO_RULESET.emergencyTarget - emergencyFund, 0);
    pushProblem("비상금 최종 목표 미달", `현재 비상금 ${fmt(emergencyFund)}원 / 최종 목표 3,000만원입니다. 목표까지 ${fmt(needToTarget)}원이 남았습니다.`, "mid", 6);
    pushAction("비상금·투자 배분 기준 참고", `비상금과 투자 배분 기준 참고값입니다. 실제 배분은 직접 판단하세요.`, "mid", 7, { recommendedAmount: PERSONAL_CFO_RULESET.stage2InvestMonthly, ruleId:"season-stage2-invest" });
  } else {
    pushAction("사용자 설정 월 투자 기준 200만원 (참고)", `비상금 3,000만원 기준을 충족했으므로 월 투자 기준 참고값입니다. 실제 실행은 직접 판단하세요.`, "high", 6, { recommendedAmount: PERSONAL_CFO_RULESET.stage3InvestMonthly, ruleId:"season-full-invest" });
  }
  if (PERSONAL_CFO_RULESET.isaAnnualLimit > 0 && isaRemaining > 0) {
    const priority = isaMonthlyNeed > PERSONAL_CFO_RULESET.stage3InvestMonthly ? "high" : "mid";
    pushAction("ISA 납입 잔여 한도 현황", `${currentYear}년 ISA 추정 납입액은 ${fmt(isaContributed)}원, 잔여 한도는 ${fmt(isaRemaining)}원입니다. 남은 ${monthsLeft}개월 기준 월 ${fmt(isaMonthlyNeed)}원이 ISA 납입 잔여 한도 참고값입니다.`, priority, 5, { recommendedAmount: isaMonthlyNeed, ruleId:"season-isa-limit" });
  }
  if (portfolioMarketValue > 0) {
    if (nasdaqWeight < PERSONAL_CFO_RULESET.nasdaqTarget - PERSONAL_CFO_RULESET.rebalanceBand) {
      const need = Math.round((PERSONAL_CFO_RULESET.nasdaqTarget * investBase - nasdaqValue) / 10000) * 10000;
      pushAction("목표비중 대비 나스닥100 현황 (참고)", `현재 나스닥 비중은 ${fmtPct(nasdaqWeight * 100)}입니다. 목표 90%까지 약 ${fmt(Math.max(need, 0))}원 부족하므로 나스닥100 목표비중 현황을 참고하여 직접 판단하세요.`, "high", 6, { recommendedAmount: Math.max(need, 0), ruleId:"season-nasdaq-under" });
    } else if (nasdaqWeight > PERSONAL_CFO_RULESET.nasdaqTarget + PERSONAL_CFO_RULESET.rebalanceBand) {
      const excess = Math.round((nasdaqValue - PERSONAL_CFO_RULESET.nasdaqTarget * investBase) / 10000) * 10000;
      pushAction("나스닥100 목표비중 초과 현황 (참고)", `현재 나스닥 비중은 ${fmtPct(nasdaqWeight * 100)}로 목표 90%보다 높습니다. 약 ${fmt(Math.max(excess, 0))}원은 목표비중 초과 현황입니다. 비중 조정은 직접 판단하세요.`, "mid", 5, { recommendedAmount: Math.max(excess, 0), ruleId:"season-nasdaq-over" });
    }
    if (dividendWeight < PERSONAL_CFO_RULESET.dividendTarget - PERSONAL_CFO_RULESET.rebalanceBand) {
      const need = Math.round((PERSONAL_CFO_RULESET.dividendTarget * investBase - dividendValue) / 10000) * 10000;
      pushAction("목표비중 대비 배당 ETF 현황 (참고)", `현재 배당 비중은 ${fmtPct(dividendWeight * 100)}입니다. 목표 10%까지 약 ${fmt(Math.max(need, 0))}원 부족하므로 TIGER 미국배당다우존스 계열을 우선 보강하세요.`, "mid", 5, { recommendedAmount: Math.max(need, 0), ruleId:"season-dividend-under" });
    }
    const hedgeGap = nasdaqHWeight - PERSONAL_CFO_RULESET.nasdaqHSubTarget;
    const unhedgedGap = nasdaqUnhedgedWeight - PERSONAL_CFO_RULESET.nasdaqUnhedgedSubTarget;
    if (Math.abs(hedgeGap) > PERSONAL_CFO_RULESET.rebalanceBand || Math.abs(unhedgedGap) > PERSONAL_CFO_RULESET.rebalanceBand) {
      const buyTarget = nasdaqHWeight < nasdaqUnhedgedWeight ? "환헤지형 나스닥100(H)" : "비환헤지형 나스닥100";
      pushAction("환헤지/비헤지 비중 현황 참고", `나스닥 내부 비중은 H ${fmtPct(nasdaqHWeight * 100)} / 비H ${fmtPct(nasdaqUnhedgedWeight * 100)}입니다. 현재 비중 현황을 참고하여 직접 판단하세요.`, "mid", 4, { recommendedAmount: n(settings.triggerMonthlyInvestAmount || 2000000), ruleId:"season-hedge-balance" });
    }
  } else {
    pushAction("초기 포트폴리오 기준금액 입력", "보유수량과 현재가를 입력해야 나스닥 90% / 배당 10% 리밸런싱 지시가 정확해집니다.", "high", 4, { ruleId:"season-portfolio-data" });
  }

  if (net < 0) {
    pushProblem("월 현금흐름 적자", `이번 달 순수입이 ${fmt(net)}원입니다. 지출 구조를 먼저 확인해야 합니다.`, "high", 25-scoreConsumption);
    pushAction("이번 달 지출 TOP 3부터 줄이기", "식비·구독·카드 지출처럼 바로 조정 가능한 항목부터 확인하세요.", "high", 6);
  } else if (scoreConsumption < 15) {
    pushProblem("저축률 부족", `현재 저축률은 ${fmtPct(savingsRatePct)}입니다. 최소 20~30% 이상을 목표로 잡는 것이 좋습니다.`, "mid", 25-scoreConsumption);
    pushAction("지출 10% 절감 목표 설정", `현재 월 지출 ${fmt(expense)}원 기준으로 약 ${fmt(expense * 0.1)}원 절감을 우선 검토하세요.`, "mid", 4);
  }

  if (emergencyMonths < 3 && expense > 0) {
    const need = Math.max(expense * 3 - emergencyFund, 0);
    pushProblem("비상금 부족", `현재 비상금은 ${emergencyMonths.toFixed(1)}개월치입니다. 최소 3개월치까지 ${fmt(need)}원이 부족합니다.`, "high", 20-scoreEmergency);
    pushAction("투자 증액보다 비상금 우선 확보", `우선 ${fmt(need)}원을 비상금 목표로 분리하세요.`, "high", 8);
  } else if (emergencyMonths < 6 && expense > 0) {
    const need = Math.max(expense * 6 - emergencyFund, 0);
    pushProblem("비상금 보강 필요", `현재 비상금은 ${emergencyMonths.toFixed(1)}개월치입니다. 안정권인 6개월치까지 ${fmt(need)}원이 필요합니다.`, "mid", 20-scoreEmergency);
    pushAction("비상금 6개월치까지 단계 보강", "월 투자금 일부를 비상금 계좌로 나누는 방식을 검토하세요.", "mid", 5);
  }

  if (scoreInvestment < 15) {
    pushProblem("성장자산 비중 부족", `투자자산 비중이 ${fmtPct(investmentRatioPct)}로 낮습니다. 장기 목표 대비 성장성이 약할 수 있습니다.`, "mid", 30-scoreInvestment);
    pushAction("월 자동투자 비중 재설정", "비상금 확보 후 ETF 중심의 정기 투자 비중을 높이는 방향을 검토하세요.", "mid", 5);
  }

  if (retireTarget > 0 && retirementProgressPct < 50) {
    pushProblem("은퇴 목표 달성률 낮음", `현재 가정 기준 은퇴 목표 달성률은 ${fmtPct(retirementProgressPct)}입니다.`, "mid", 25-scoreRetirement);
    pushAction("월 투자금·은퇴나이·수익률 가정 재점검", "은퇴 시뮬레이션에서 월 투자금 10~20% 증액 시나리오를 비교하세요.", "mid", 4);
  }

  if (overBudget.length > 0) {
    pushProblem("예산 초과 발생", `${overBudget.slice(0, 3).map((b) => b.cat1).join("·")} 항목이 예산을 초과했습니다.`, "mid", overBudget.length*2);
    pushAction("예산 초과 항목 재분류", "초과 지출이 일회성인지 반복 지출인지 구분하세요.", "mid", 3);
  } else if (warnBudget.length > 0) {
    pushProblem("예산 주의 항목 존재", `${warnBudget.slice(0, 3).map((b) => b.cat1).join("·")} 항목이 예산 주의 구간입니다.`, "low", 1);
  }

  if (!problems.length) {
    pushProblem("큰 위험 신호 없음", "현재 입력된 데이터 기준으로 치명적인 재무 오류는 보이지 않습니다.", "low", 0);
    pushAction("현재 전략 유지 + 월 1회 점검", "급하게 바꾸기보다 월말마다 현금흐름과 투자 비중을 확인하세요.", "low", 2);
  }

  const sortedPriority = { high: 3, mid: 2, low: 1 };
  problems.sort((a,b)=>sortedPriority[b.priority]-sortedPriority[a.priority] || n(b.impact)-n(a.impact));
  actions.sort((a,b)=>sortedPriority[b.priority]-sortedPriority[a.priority] || n(b.expectedScore)-n(a.expectedScore));

  const scoreLosses = scoreItems
    .map((item)=>({ label:item.label, lost:Math.max(item.max-item.score,0), reason:item.reason }))
    .filter((x)=>x.lost>0)
    .sort((a,b)=>b.lost-a.lost)
    .slice(0,3);

  const baseMetrics = { income, expense, net, emergencyFund, investmentAssets, totalAssetsBase, retireTarget, retirementProgressPct, overBudgetCount:overBudget.length };
  const simulation = buildCFOScoreSimulation({ data, dashboard, dashboardDetail, financialAnalysis, baseMetrics, months:24 });

  const targetWeightSum = (data.settings?.investmentTargets||[]).reduce((sum,t)=>sum+n(t.targetWeight),0);

  const message = totalScore >= 85
    ? "현재 재무 구조는 매우 안정적입니다. 큰 방향은 유지하되, 월 1회 점검과 리밸런싱만 해도 충분합니다."
    : totalScore >= 70
      ? "현재 방향은 좋습니다. 다만 비상금·예산·은퇴 목표 중 낮은 항목을 보강하면 안정성이 더 올라갑니다."
      : totalScore >= 50
        ? "재무 구조에 관리가 필요한 구간입니다. 모든 기능을 보려 하기보다 가장 위험한 문제 1개부터 해결하는 것이 좋습니다."
        : "현재는 재무 위험 신호가 강합니다. 투자 확대보다 현금흐름과 비상금 안정화가 먼저입니다.";

  const detailedDiagnosis = [
    { label:"현금흐름", value:`월 순수입 ${fmt(net)}원`, text: income>0 ? `수입 ${fmt(income)}원 대비 지출 ${fmt(expense)}원, 저축률 ${fmtPct(savingsRatePct)}입니다.` : "수입 데이터가 부족해 현금흐름 판단 정확도가 낮습니다." },
    { label:"안전성", value:`비상금 ${emergencyMonths.toFixed(1)}개월`, text: expense>0 ? `최소 3개월, 안정권 6개월 기준으로 ${emergencyMonths<3?"위험 구간":emergencyMonths<6?"보강 구간":"안정 구간"}입니다.` : "월 지출 데이터가 있어야 비상금 개월 수를 판단할 수 있습니다." },
    { label:"성장성", value:`투자비중 ${fmtPct(investmentRatioPct)}`, text: `투자자산 ${fmt(investmentAssets)}원 / 판단 기준 총자산 ${fmt(totalAssetsBase)}원으로 계산했습니다.` },
    { label:"장기목표", value:`은퇴 ${fmtPct(retirementProgressPct)}`, text: retireTarget>0 ? `은퇴목표 ${fmt(retireTarget)}원 대비 현재/예상 진행률입니다.` : "은퇴 목표금액을 입력하면 장기 목표 달성률이 더 정확해집니다." },
  ];
  const nextPlan = [
    { month:"1개월", title: actions[0]?.title || "데이터 입력 정리", score:modelSafeScore(totalScore + (actions[0]?.expectedScore||2)), text: actions[0]?.desc || "거래·자산·포트폴리오 입력값을 먼저 정리합니다." },
    { month:"3개월", title: emergencyMonths<3?"비상금 3개월치 접근":"예산 초과 항목 안정화", score: simulation.checkpoints.find(r=>r.month===3)?.score || totalScore, text: "저축/투자 루틴이 유지되는지 확인하는 구간입니다." },
    { month:"6개월", title: "CFO 점수 재평가", score: simulation.checkpoints.find(r=>r.month===6)?.score || totalScore, text: "비상금·투자비중·은퇴 목표를 다시 계산합니다." },
  ];
  const guardSummary = {
    targetWeightSum,
    legacyWeightSum:n(data.settings?.targetNasdaqWeight)+n(data.settings?.targetNasdaqHWeight)+n(data.settings?.targetDividendWeight),
    usdHoldingsNeedFx:(data.portfolio||[]).some(p=>normalizeCurrency(p.currency)==="USD") && n(data.settings?.fxUsdKrw)<=0,
  };
  return { totalScore, status, tone, toneColor, toneBg, message, scoreItems, scoreLosses, problems: problems.slice(0, 4), actions: actions.slice(0, 4), simulation, detailedDiagnosis, nextPlan, guardSummary, sourceData:data };
}



function getEmergencyFundFromCFOData(data={}) {
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const included = assets.filter(a => a.kind !== "부채" && (a.includeInEmergency || `${a.category||""} ${a.name||""}`.includes("현금") || `${a.name||""}`.includes("파킹") || `${a.name||""}`.includes("비상")));
  const sum = included.reduce((total, a) => total + n(a.current), 0);
  if (sum > 0) return sum;
  return assets.filter(a=>a.kind !== "부채").reduce((total,a)=>total+n(a.current),0);
}

function getYearlyIsaContributionFromCFOData(data={}) {
  const currentYear = new Date().getFullYear();
  const txSum = (data.transactions || [])
    .filter(t => String(t.date || "").startsWith(String(currentYear)))
    .filter(t => `${t.account || ""} ${t.fromAccount || ""} ${t.toAccount || ""} ${t.memo || ""}`.includes("ISA"))
    .reduce((sum, t) => sum + n(t.amount), 0);
  return Math.max(txSum, n(data.settings?.annualIsaContributionCurrent));
}

function buildNextCFOFlowAction(data={}, completedAction=null) {
  const settings = data.settings || {};
  const emergencyFund = getEmergencyFundFromCFOData(data);
  const emergencyFloor = 15000000;
  const emergencyTarget = 30000000;
  const isaAnnualLimit = n(settings.isaAnnualLimit || 20000000);
  const isaContributed = getYearlyIsaContributionFromCFOData(data);
  const isaRemaining = Math.max(isaAnnualLimit - isaContributed, 0);
  const monthsLeft = Math.max(12 - new Date().getMonth(), 1);
  const isaMonthlyNeed = Math.ceil(isaRemaining / monthsLeft / 10000) * 10000;
  const completedKind = completedAction ? detectCFOActionKind(completedAction) : "";

  const withFlow = (action, stepNumber, nextLabel) => ({
    ...action,
    flowStepNumber: stepNumber,
    flowNextLabel: nextLabel || "다음 단계",
    flowGenerated: true,
  });

  if (emergencyFund < emergencyFloor) {
    const need = Math.max(emergencyFloor - emergencyFund, 0);
    return withFlow({
      title:"비상금 1차 기준까지 추가 저축",
      desc:`비상금 1차 기준 1,500만원까지 ${fmt(need)}원이 남았습니다. 이 금액을 채운 뒤 ISA 납입 단계로 넘어갑니다.`,
      priority:"high",
      expectedScore:8,
      recommendedAmount:Math.min(2000000, need),
      ruleId:"flow-emergency-floor",
    }, 1, "비상금 1차 확보 후 ISA 납입");
  }

  if (isaRemaining > 0 && completedKind !== "investment") {
    return withFlow({
      title:"ISA 납입 잔여 한도 현황",
      desc:`비상금 1차 기준은 충족했습니다. ISA 잔여 한도 ${fmt(isaRemaining)}원을 남은 ${monthsLeft}개월에 나눠 월 ${fmt(isaMonthlyNeed)}원이 ISA 납입 잔여 한도 참고값입니다.`,
      priority:"high",
      expectedScore:6,
      recommendedAmount:isaMonthlyNeed,
      ruleId:"flow-isa-after-emergency",
    }, 2, "ISA 납입 후 비중 현황 확인");
  }

  if (emergencyFund < emergencyTarget) {
    const need = Math.max(emergencyTarget - emergencyFund, 0);
    return withFlow({
      title:"비상금 최종 3,000만원까지 병행 보강",
      desc:`ISA 납입을 반영했습니다. 이제 비상금 최종 목표 3,000만원까지 ${fmt(need)}원을 월 50만원 단위로 보강하세요.`,
      priority:"mid",
      expectedScore:5,
      recommendedAmount:Math.min(500000, need),
      ruleId:"flow-emergency-target",
    }, 3, "최종 비상금 확보 후 월 200만원 투자");
  }

  return withFlow({
    title:"월 200만원 전액 투자 루틴 유지",
    desc:"비상금과 ISA 납입 흐름이 안정권입니다. 다음 실행은 나스닥100 90% / 배당 10% 기준으로 월 투자 루틴을 유지하는 단계입니다.",
    priority:"mid",
    expectedScore:4,
    recommendedAmount:n(settings.monthlyInvestDefault || settings.triggerMonthlyInvestAmount || 2000000),
    ruleId:"flow-full-invest-routine",
  }, 4, "월말 리밸런싱 점검");
}

function CFOFlowStrip({ currentAction, nextAction, completedAction }) {
  return (
    <div className="cfo-flow-strip">
      <div className={`cfo-flow-step ${completedAction ? "done" : ""}`}>
        <div className="cfo-flow-no">{completedAction ? "✓" : (currentAction?.flowStepNumber || 1)}</div>
        <div className="cfo-flow-copy">
          <span>{completedAction ? "완료한 행동" : "현재 단계"}</span>
          <strong>{completedAction?.title || currentAction?.title || "현재 행동"}</strong>
          <p>{completedAction ? "입력한 금액 기준으로 반영 완료" : (currentAction?.flowNextLabel || "실행 후 다음 단계로 이동")}</p>
        </div>
      </div>
      <div className="cfo-flow-arrow">→</div>
      <div className="cfo-flow-step">
        <div className="cfo-flow-no">{nextAction?.flowStepNumber || ((currentAction?.flowStepNumber || 1) + 1)}</div>
        <div className="cfo-flow-copy">
          <span>다음 예정 행동</span>
          <strong>{nextAction?.title || "실행 후 자동 계산"}</strong>
          <p>{nextAction?.desc || "이번 실행 결과를 반영한 뒤 다음 행동을 보여줍니다."}</p>
        </div>
      </div>
    </div>
  );
}

function buildCFOActionPreview(model, action, form=null) {
  const currentScore = n(model?.totalScore);
  const baseExpected = n(action?.expectedScore);
  const title = String(action?.title || "");
  const desc = String(action?.desc || "");
  const text = `${title} ${desc}`;
  const kind = form?.kind || detectCFOActionKind(action);
  const amount = Math.max(n(form?.kind === "compound" ? (n(form?.emergencyAmount) + n(form?.isaAmount)) : (form?.actualDepositAmount ?? form?.amount)), 0);
  const data = model?.sourceData || {};

  let amountFactor = 1;
  if (amount > 0) {
    if (kind === "emergency") {
      const monthlyExpense = Math.max(
        (data.transactions || [])
          .filter(t=>monthOf(t.date)===thisMonthISO() && t.type==="지출")
          .reduce((sum,t)=>sum+n(t.amount),0),
        n(data.settings?.retirementMonthlyExpense),
        1
      );
      const target = monthlyExpense * 3;
      amountFactor = clamp(amount / Math.max(target, 1), 0.2, 1.5);
    } else if (kind === "budget") {
      const selectedBudget = (data.budgets || []).find(b=>b.cat1 === form?.budgetCategory);
      const target = Math.max(n(selectedBudget?.budget) * 0.1, 100000);
      amountFactor = clamp(amount / target, 0.2, 1.5);
    } else if (kind === "investment" || kind === "retirement" || kind === "compound") {
      const monthlyInvest = Math.max(n(data.settings?.monthlyInvestDefault), n(data.settings?.triggerMonthlyInvestAmount), 100000);
      amountFactor = clamp(amount / monthlyInvest, 0.2, 1.5);
    }
  }

  const expected = Math.max(0, Math.round(baseExpected * amountFactor));
  const nextScore = clamp(currentScore + expected, 0, 100);

  let target = "재무 구조";
  let before = "현재 상태 유지";
  let after = "개선안 반영";
  let effect = expected > 0 ? `입력 금액 기준 CFO 점수 +${expected}점 예상` : "점수 변동은 작지만 관리 기준이 정리됩니다.";

  if (kind === "compound") {
    target = "비상금 + ISA 복합 실행";
    before = "비상금 저축과 투자 실행이 분리되지 않음";
    after = amount > 0 ? `비상금 ${fmt(form?.emergencyAmount)}원 + ISA ${fmt(form?.isaAmount)}원을 분리 반영` : "비상금/ISA 실행 금액을 분리 입력";
  } else if (kind === "emergency" || text.includes("비상금")) {
    target = "비상금 목표";
    before = "비상금 부족/보강 필요";
    after = amount > 0 ? `${fmt(amount)}원을 비상금 이체 거래로 반영` : "비상금 목표를 생성하고 현금 우선 배분 기준을 설정";
  } else if (kind === "budget" || text.includes("지출") || text.includes("예산")) {
    target = "월 예산";
    before = "현재 예산 유지";
    after = amount > 0 ? `${form?.budgetCategory || "선택 항목"} 예산을 ${fmt(amount)}원 절감` : "예산 절감 기준을 설정";
  } else if (kind === "investment" || text.includes("자동투자") || text.includes("투자금") || text.includes("투자")) {
    target = "투자 루틴";
    before = "투자 실행 기준 미정";
    after = amount > 0 ? `${fmt(amount)}원을 투자 거래/월 투자 기준으로 반영` : "자동 투자 트리거와 월 투자 기준값 활성화";
  } else if (kind === "retirement" || text.includes("은퇴")) {
    target = "은퇴 계획";
    before = "기존 은퇴 가정 유지";
    after = amount > 0 ? `월 투자 기준을 ${fmt(amount)}원 이상으로 보강` : "월 투자금 기준을 보강하고 은퇴 시뮬레이션 재점검";
  }

  return { currentScore, expected, nextScore, target, before, after, effect, amountFactor };
}


function CountUpNumber({ value, duration=650 }) {
  const [display, setDisplay] = useState(0);
  useEffect(()=>{
    const end = Math.round(n(value));
    let frame = 0;
    const frames = Math.max(Math.round(duration / 16), 1);
    const timer = setInterval(()=>{
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / frames, 3);
      setDisplay(Math.round(end * progress));
      if (frame >= frames) {
        setDisplay(end);
        clearInterval(timer);
      }
    }, 16);
    return ()=>clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
}

function CFODecisionDashboard({ model, data, onExecuteAction, onUndoAction, undoState, onRollbackHistory }) {
  if (!model) return null;
  const [executedAction, setExecutedAction] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [showWhy, setShowWhy] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [flowNextAction, setFlowNextAction] = useState(null);
  const [flowCompletedAction, setFlowCompletedAction] = useState(null);

  const priorityLabel = { high:"최우선", mid:"중요", low:"관리" };
  const baseTopAction = model.actions?.[0];
  const topAction = flowNextAction || baseTopAction;
  const otherActions = (model.actions || []).filter(a => getCFOActionRuleKey(a) !== getCFOActionRuleKey(topAction)).slice(0, 3);
  const cfoHistory = Array.isArray(data?.cfoActionHistory) ? data.cfoActionHistory.slice(0, 8) : [];
  const mainReason = model.scoreLosses?.[0];
  const statusEmoji = model.tone === "green" ? "🟢" : model.tone === "accent" ? "🔵" : model.tone === "amber" ? "🟡" : "🔴";
  const toneClass = model.tone === "green" ? "ok" : model.tone === "accent" ? "info" : model.tone === "amber" ? "warn" : "danger";

  const headline = model.status === "위험"
    ? "지금은 투자보다 재무 안전장치가 먼저입니다"
    : model.status === "주의 필요"
      ? "지금은 현금흐름을 먼저 정리해야 합니다"
      : model.status === "양호"
        ? "좋은 흐름입니다. 낮은 항목만 보강하세요"
        : "현재 재무 구조는 안정권입니다";

  const handleConfirmExecute = (action, form) => {
    if (!action) return;
    const preview = buildCFOActionPreview(model, action, form);
    const currentData = model.sourceData || data;
    const simulatedAfter = applyCFOActionToData(currentData, action, { ...form, forceRun:true, __previewOnly:true });
    const nextAction = buildNextCFOFlowAction(simulatedAfter, action);
    onExecuteAction?.(action, form);
    setExecutedAction({
      id: uid(),
      title: action.title,
      preview,
      nextAction,
      executedAt: new Date().toLocaleString("ko-KR"),
    });
    setFlowCompletedAction(action);
    setFlowNextAction(nextAction);
    setPendingAction(null);
  };

  const topPreview = topAction ? buildCFOActionPreview(model, topAction) : null;
  const previewNextAction = flowNextAction || (topAction ? buildNextCFOFlowAction(model.sourceData || data, null) : null);

  return (
    <section className={`cfo-app-screen ${toneClass}`}>
      <div className="cfo-app-status-card">
        <div className="cfo-app-status-left">
          <span className="cfo-app-kicker">이번 달 재무 현황 참고</span>
          <h2>재무 상태: {model.status} {statusEmoji}</h2>
          <p>{headline}</p>
        </div>

        <div className="cfo-app-score-card">
          <div className="cfo-app-score">
            <CountUpNumber value={model.totalScore} />
            <span>/100</span>
          </div>
          <AnimatedScoreBar value={model.totalScore} />
        </div>
      </div>

      <div className="cfo-app-conclusion">
        <span>핵심 결론</span>
        <strong>{headline}</strong>
        <p>{mainReason ? `${mainReason.label}에서 ${mainReason.lost}점 감점되었습니다. ${mainReason.reason}` : "현재 입력된 데이터 기준으로 큰 감점 요인이 없습니다."}</p>
      </div>

      {topAction ? (
        <div className="cfo-app-action-card">
          <div className="cfo-app-action-main">
            <div className="cfo-app-action-badge">1</div>
            <div className="cfo-app-action-copy">
              <div className="row-between">
                <span className="cfo-app-section-label">이번 달 점검 항목 (참고)</span>
                <span className={`badge ${topAction.priority==="high"?"badge-red":topAction.priority==="mid"?"badge-amber":"badge-accent"}`}>
                  {priorityLabel[topAction.priority] || "관리"}
                </span>
              </div>
              <h3>{topAction.title}</h3>
              <p>{topAction.desc}</p>
            </div>
          </div>

          <CFOFlowStrip currentAction={topAction} nextAction={previewNextAction} completedAction={flowCompletedAction} />

          <div className="cfo-app-preview-strip">
            <div>
              <span>현재</span>
              <strong>{topPreview?.currentScore ?? model.totalScore}</strong>
            </div>
            <em>→</em>
            <div>
              <span>예상</span>
              <strong className="after">{topPreview?.nextScore ?? model.totalScore}</strong>
            </div>
            <div className="cfo-app-preview-note">
              +{topAction.expectedScore || 0}점 개선 예상
            </div>
          </div>

          <button className="cfo-app-primary-btn" onClick={()=>setPendingAction(topAction)}>
            {flowNextAction ? "다음 항목 확인하기" : "입력값 기록하기"}
          </button>
        </div>
      ) : (
        <div className="card empty">추천 행동이 없습니다.</div>
      )}

      {executedAction && (
        <div className="cfo-app-result-card">
          <div className="cfo-app-result-icon">✓</div>
          <div>
            <strong>입력 완료</strong>
            <p>{executedAction.title}</p>
            <span>{executedAction.preview.currentScore} → {executedAction.preview.nextScore} 예상</span>
          </div>
        </div>
      )}

      {executedAction?.nextAction && (
        <div className="cfo-next-action-panel">
          <div>
            <small>NEXT ACTION</small>
            <strong>{executedAction.nextAction.title}</strong>
            <p>{executedAction.nextAction.desc}</p>
          </div>
          <button className="btn btn-success" onClick={()=>setPendingAction(executedAction.nextAction)}>
            확인하기
          </button>
        </div>
      )}

      <div className="cfo-app-accordion">
        <button onClick={()=>setShowWhy(v=>!v)}>
          왜 이걸 추천했나요? <span>{showWhy ? "접기" : "보기"}</span>
        </button>
        {showWhy && (
          <div className="cfo-app-accordion-body">
            <div className="cfo-app-score-grid">
              {(model.scoreItems || []).map((item, idx)=>{
                const rate = item.max > 0 ? item.score / item.max * 100 : 0;
                const color = rate >= 80 ? "var(--green)" : rate >= 55 ? "var(--accent)" : rate >= 35 ? "var(--amber)" : "var(--red)";
                return (
                  <div key={idx} className="cfo-app-score-item">
                    <div className="row-between">
                      <b>{item.label}</b>
                      <span style={{color}}>{item.score}/{item.max}</span>
                    </div>
                    <div className="progress"><div className="progress-fill" style={{width:`${clamp(rate,0,100)}%`,background:color}} /></div>
                    <p>{item.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={()=>setShowMoreActions(v=>!v)}>
          다른 행동 보기 <span>{showMoreActions ? "접기" : "보기"}</span>
        </button>
        {showMoreActions && showMoreActions !== "history" && (
          <div className="cfo-app-accordion-body">
            {otherActions.length ? otherActions.map((a, i)=>(
              <div key={i} className="cfo-app-secondary-action">
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.desc}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPendingAction(a)}>실행</button>
              </div>
            )) : <div className="empty">추가 행동이 없습니다.</div>}
          </div>
        )}

        <button onClick={()=>setShowMoreActions(v=>v === "history" ? false : "history")}>
          실행 기록 보기 <span>{showMoreActions === "history" ? "접기" : "보기"}</span>
        </button>
        {showMoreActions === "history" && (
          <div className="cfo-app-accordion-body">
            <CFOExecutionHistoryPanel history={cfoHistory} onRollback={onRollbackHistory} />
          </div>
        )}

      </div>

      {pendingAction && (
        <CFOActionInputModal
          action={pendingAction}
          model={model}
          data={model.sourceData}
          onClose={()=>setPendingAction(null)}
          onConfirm={(form)=>handleConfirmExecute(pendingAction, form)}
        />
      )}

      {undoState?.available && (
        <CFOUndoToast title={undoState.title} onUndo={onUndoAction} />
      )}
    </section>
  );
}


function CFOExecutionHistoryPanel({ history=[], onRollback }) {
  if (!history.length) return <div className="empty">아직 CFO 실행 기록이 없습니다.</div>;
  return (
    <div className="cfo-history-panel">
      <div className="cfo-history-head">
        <strong>최근 CFO 실행 기록</strong>
        <span>개별 실행만 되돌릴 수 있습니다</span>
      </div>
      <div className="cfo-history-list">
        {history.map((h)=>{
          const amount = n(h.actualDepositAmount ?? h.amount);
          const dateLabel = h.executedDate || (h.executedAt ? String(h.executedAt).slice(0,10) : "-");
          return (
            <div className="cfo-history-item" key={h.id || h.executionId || h.executionKey}>
              <div>
                <h4>{h.title || "CFO 실행"}</h4>
                <p>{dateLabel} · {h.fromAccount || "출금계좌"} → {h.toAccount || "반영계좌"}</p>
                <div className="cfo-history-tags">
                  <span className="cfo-history-tag">{h.kind || "action"}</span>
                  <span className="cfo-history-tag">{fmt(amount)}원</span>
                  {h.forcedDuplicate ? <span className="cfo-history-tag">강제 재실행</span> : null}
                  {h.executionMonth ? <span className="cfo-history-tag">{h.executionMonth}</span> : null}
                </div>
              </div>
              <button className="cfo-history-rollback" onClick={()=>onRollback?.(h.id || h.executionId)}>
                이 실행 되돌리기
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function detectCFOActionKind(action) {
  const text = `${action?.title || ""} ${action?.desc || ""}`;
  const hasEmergency = text.includes("비상금");
  const hasInvestment = text.includes("ISA") || text.includes("ETF") || text.includes("납입") || text.includes("매수") || text.includes("리밸런싱") || text.includes("포트폴리오") || text.includes("투자") || text.includes("자동투자") || text.includes("투자금");
  // 복합 행동은 단일 ISA 입력이 아니라 비상금/ISA를 분리 입력하도록 처리합니다.
  if (hasEmergency && hasInvestment) return "compound";
  if (hasInvestment) return "investment";
  if (hasEmergency) return "emergency";
  if (text.includes("지출") || text.includes("예산") || text.includes("절감")) return "budget";
  if (text.includes("은퇴")) return "retirement";
  return "memo";
}

function defaultCFOActionForm({ action, model, data }) {
  const kind = detectCFOActionKind(action);
  const accounts = (data?.accounts || []).filter(a=>a.active);
  const defaultFrom = accounts.find(a=>a.defaultIn)?.name || accounts[0]?.name || "";
  const defaultInvestmentTo = accounts.find(a=>String(a.name||"").includes("ISA"))?.name || accounts.find(a=>String(a.type||"").includes("증권"))?.name || accounts[1]?.name || "";
  const emergencyAccount = accounts.find(a=>String(a.name||"").includes("비상") || String(a.name||"").includes("파킹") || String(a.name||"").includes("카카오") || String(a.name||"").includes("KOFR"))?.name || accounts.find(a=>String(a.category||"").includes("현금"))?.name || defaultFrom;
  const monthlyExpense = Math.max(n(model?.detailedDiagnosis?.[0]?.expense), n(data?.settings?.retirementMonthlyExpense), 0);
  const actionAmount = n(action?.recommendedAmount || action?.amount || 0);
  const baseAmount = actionAmount > 0
    ? actionAmount
    : kind === "budget" ? 100000 : (kind === "investment" || kind === "compound") ? n(data?.settings?.monthlyInvestDefault || data?.settings?.triggerMonthlyInvestAmount || 100000) : kind === "emergency" ? Math.max(Math.round(monthlyExpense || 3000000), 100000) : 0;

  const compoundEmergencyAmount = kind === "compound" ? n(action?.emergencyAmount || 500000) : 0;
  const compoundIsaAmount = kind === "compound" ? Math.max(baseAmount - compoundEmergencyAmount, 0) : 0;

  return {
    kind,
    date: todayISO(),
    recommendedAmount: baseAmount,
    amount: baseAmount,
    actualDepositAmount: baseAmount,
    emergencyAmount: kind === "compound" ? compoundEmergencyAmount : baseAmount,
    isaAmount: kind === "compound" ? compoundIsaAmount : baseAmount,
    fromAccount: defaultFrom,
    toAccount: kind === "emergency" ? emergencyAccount : defaultInvestmentTo,
    emergencyAccount,
    investmentAccount: defaultInvestmentTo,
    budgetCategory: "식비",
    applyScope: "이번 달",
    memo: `CFO 실행 - ${action?.title || ""}`,
  };
}

function getCFOActionRuleKey(action, form={}) {
  const raw = action?.ruleId || action?.id || action?.title || "cfo-action";
  return String(raw).toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9가-힣_-]/g,"").slice(0,80) || "cfo-action";
}

function getCFOExecutionKey(action, form={}) {
  const month = monthOf(form.date || todayISO());
  const kind = form.kind || detectCFOActionKind(action);
  const ruleKey = getCFOActionRuleKey(action, form);
  const to = String(form.toAccount || "").trim();
  return `${month}:${kind}:${ruleKey}:${to}`;
}

function getCFOExecutionDuplicateInfo(data, action, form={}) {
  const executionKey = getCFOExecutionKey(action, form);
  const executionMonth = monthOf(form.date || todayISO());
  const kind = form.kind || detectCFOActionKind(action);
  const ruleKey = getCFOActionRuleKey(action, form);
  const history = Array.isArray(data?.cfoActionHistory) ? data.cfoActionHistory : [];
  const matched = history.find((h)=>{
    if (h.executionKey && h.executionKey === executionKey) return true;
    return monthOf(h.executedDate || h.executedAt) === executionMonth && (h.kind || "") === kind && (h.ruleKey || getCFOActionRuleKey({ title:h.title }, h)) === ruleKey;
  });
  return {
    isDuplicate: !!matched,
    executionKey,
    executionMonth,
    ruleKey,
    matched,
    message: matched ? `${executionMonth}에 같은 CFO 실행이 이미 반영되었습니다. 중복 반영하면 현금·포트폴리오·ISA 납입액이 한 번 더 바뀝니다.` : "",
  };
}

function getAccountAssetCurrent(data, accountName="") {
  const idx = findAssetIndexByAccountName(data?.assets || [], accountName);
  return idx >= 0 ? n(data.assets[idx].current) : 0;
}

function getPortfolioMarketValue(data) {
  return (data?.portfolio || []).reduce((sum,p)=>{
    const qty = n(p.qty);
    const price = n(p.currentPrice || p.avgPrice);
    const fallback = n(p.targetAmount);
    return sum + (qty > 0 && price > 0 ? qty * price : fallback);
  },0);
}

function buildCFOExecutionVerification(data, action, form={}) {
  const before = migrateData({ ...data });
  const after = applyCFOActionToData(before, action, { ...form, forceRun:true, __previewOnly:true });
  const kind = form.kind || detectCFOActionKind(action);
  const from = form.fromAccount || "출금계좌";
  const to = form.toAccount || "입금계좌";
  const rows = [];
  const add = (label, beforeValue, afterValue) => rows.push({ label, before: beforeValue, after: afterValue });

  if (["investment","retirement","emergency","compound"].includes(kind)) {
    add(`${from} 현금`, `${fmt(getAccountAssetCurrent(before, from))}원`, `${fmt(getAccountAssetCurrent(after, from))}원`);
    if (kind === "emergency") {
      add(`${to} 비상금`, `${fmt(getAccountAssetCurrent(before, to))}원`, `${fmt(getAccountAssetCurrent(after, to))}원`);
    }
    if (kind === "compound") {
      const emergencyTo = form.emergencyAccount || "비상금계좌";
      add(`${emergencyTo} 비상금`, `${fmt(getAccountAssetCurrent(before, emergencyTo))}원`, `${fmt(getAccountAssetCurrent(after, emergencyTo))}원`);
    }
  }
  if (["investment","retirement","compound"].includes(kind)) {
    const investTo = kind === "compound" ? (form.investmentAccount || to) : to;
    add(`${investTo} 계좌금액`, `${fmt(getAccountAssetCurrent(before, investTo))}원`, `${fmt(getAccountAssetCurrent(after, investTo))}원`);
    add("포트폴리오 반영액", `${fmt(getPortfolioMarketValue(before))}원`, `${fmt(getPortfolioMarketValue(after))}원`);
    add("ISA 연간 납입액", `${fmt(before.settings?.annualIsaContributionCurrent)}원`, `${fmt(after.settings?.annualIsaContributionCurrent)}원`);
  }
  if (kind === "budget") {
    const cat = form.budgetCategory || "예산";
    const b0 = (before.budgets || []).find(b=>b.cat1===cat);
    const b1 = (after.budgets || []).find(b=>b.cat1===cat);
    add(`${cat} 예산`, `${fmt(b0?.budget)}원`, `${fmt(b1?.budget)}원`);
  }
  add("거래내역", `${(before.transactions || []).length}건`, `${(after.transactions || []).length}건`);
  add("CFO 실행기록", `${(before.cfoActionHistory || []).length}건`, `${(after.cfoActionHistory || []).length}건`);
  return { rows, before, after };
}

function CFOActionInputModal({ action, model, data, onClose, onConfirm }) {
  const [form, setForm] = useState(()=>defaultCFOActionForm({ action, model, data }));
  const preview = buildCFOActionPreview(model, action, form);
  const duplicateInfo = getCFOExecutionDuplicateInfo(data, action, form);
  const verification = buildCFOExecutionVerification(data, action, form);
  const accounts = (data?.accounts || []).filter(a=>a.active);
  const updateForm = (patch) => setForm(prev=>({ ...prev, ...patch }));
  const isCompound = form.kind === "compound";
  const actualTotal = isCompound ? n(form.emergencyAmount) + n(form.isaAmount) : n(form.kind === "investment" ? (form.actualDepositAmount ?? form.amount) : form.amount);
  const amountLabel = form.kind === "budget" ? "절감 목표 금액" : form.kind === "investment" ? "실제 ISA 입금/투자금액" : form.kind === "emergency" ? "비상금 이체 금액" : "실제 실행금액";
  const confirmLabel = isCompound ? "비상금·ISA 분리 반영" : form.kind === "budget" ? "예산에 반영" : form.kind === "investment" ? "자산까지 자동 반영" : form.kind === "emergency" ? "거래내역에 비상금 반영" : "입력 반영";
  const amountError = form.kind !== "memo" && actualTotal <= 0;
  const accountError = isCompound
    ? (!form.fromAccount || (n(form.emergencyAmount) > 0 && !form.emergencyAccount) || (n(form.isaAmount) > 0 && !form.investmentAccount))
    : ["emergency","investment"].includes(form.kind) && (!form.fromAccount || !form.toAccount);

  return (
    <div className="apple-cfo-modal-overlay" role="dialog" aria-modal="true">
      <div className="apple-cfo-modal cfo-input-modal">
        <div className="apple-cfo-modal-handle" />
        <div className="apple-cfo-modal-head">
          <div>
            <span>실행 전 입력</span>
            <h3>{action.title}</h3>
          </div>
          <button className="apple-cfo-close" onClick={onClose}>×</button>
        </div>

        <p className="apple-cfo-modal-desc">{action.desc}</p>

        <div className="cfo-input-preview cfo-input-preview-live">
          <div>
            <small>반영 위치</small>
            <b>{isCompound ? "비상금계좌 + ISA + 포트폴리오" : form.kind === "budget" ? "예산/지출 관리" : form.kind === "investment" ? "거래내역 + 포트폴리오 + 현금자산" : form.kind === "emergency" ? "거래내역 + 비상금 목표" : "CFO 실행 기록"}</b>
          </div>
          <div>
            <small>예상 점수</small>
            <b>{preview.currentScore} → {preview.nextScore}</b>
          </div>
          <div className="cfo-live-wide">
            <small>입력값 반영 결과</small>
            <b>{preview.after}</b>
            <em>{preview.effect}</em>
          </div>
          {isCompound && n(form.isaAmount) > 0 && (
            <div className="cfo-live-wide">
              <small>ISA 투자 배분</small>
              <b>{buildCFOInvestmentAllocation(form.isaAmount).map(a=>`${a.name} ${fmt(a.buyAmount)}원`).join(" / ")}</b>
              <em>출금계좌에서 총 {fmt(n(form.emergencyAmount)+n(form.isaAmount))}원 차감 → 비상금 {fmt(form.emergencyAmount)}원 / ISA {fmt(form.isaAmount)}원 분리 반영</em>
            </div>
          )}
          {form.kind === "investment" && n(form.actualDepositAmount ?? form.amount) > 0 && (
            <div className="cfo-live-wide">
              <small>목표비중 부족분</small>
              <b>{buildCFOInvestmentAllocation(form.actualDepositAmount ?? form.amount).map(a=>`${a.name} ${fmt(a.buyAmount)}원`).join(" / ")}</b>
              <em>현금성 자산 차감 → ISA 계좌금액 증가 → 포트폴리오 수량/평균단가 증가 → 거래내역 2건 기록</em>
            </div>
          )}
        </div>

        <div className="cfo-input-grid">
          <div className="field">
            <label>날짜</label>
            <input type="date" value={form.date} onChange={(e)=>updateForm({date:e.target.value})} />
          </div>

          {isCompound && (
            <>
              <div className="field">
                <label>CFO 추천 총액</label>
                <input type="number" value={form.recommendedAmount ?? actualTotal} onChange={(e)=>updateForm({recommendedAmount:e.target.value})} placeholder="추천 총액" />
                <div className="field-hint">추천값은 참고용입니다. 아래 비상금/ISA 금액이 실제 반영 기준입니다.</div>
              </div>
              <div className={`field ${n(form.emergencyAmount) < 0 ? "field-has-error" : ""}`}>
                <label>비상금 저축금액</label>
                <input type="number" value={form.emergencyAmount} onChange={(e)=>updateForm({emergencyAmount:e.target.value})} placeholder="비상금으로 따로 넣을 금액" />
              </div>
              <div className={`field ${n(form.isaAmount) < 0 ? "field-has-error" : ""}`}>
                <label>ISA 입금/투자금액</label>
                <input type="number" value={form.isaAmount} onChange={(e)=>updateForm({isaAmount:e.target.value, actualDepositAmount:e.target.value})} placeholder="ISA에 따로 넣을 금액" />
              </div>
              <div className={`field ${accountError ? "field-has-error" : ""}`}>
                <label>출금계좌</label>
                <select value={form.fromAccount} onChange={(e)=>updateForm({fromAccount:e.target.value})}>
                  <option value="">선택</option>
                  {accounts.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className={`field ${accountError ? "field-has-error" : ""}`}>
                <label>비상금 입금계좌</label>
                <select value={form.emergencyAccount} onChange={(e)=>updateForm({emergencyAccount:e.target.value})}>
                  <option value="">선택</option>
                  {accounts.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className={`field ${accountError ? "field-has-error" : ""}`}>
                <label>ISA 투자계좌</label>
                <select value={form.investmentAccount} onChange={(e)=>updateForm({investmentAccount:e.target.value, toAccount:e.target.value})}>
                  <option value="">선택</option>
                  {accounts.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
            </>
          )}

          {!isCompound && form.kind === "investment" && (
            <>
              <div className="field">
                <label>CFO 추천금액</label>
                <input type="number" value={form.recommendedAmount ?? form.amount} onChange={(e)=>updateForm({recommendedAmount:e.target.value})} placeholder="추천 금액" />
                <div className="field-hint">추천금액도 수정 가능하지만, 실제 반영은 아래 실제 입금/투자금액을 기준으로 처리됩니다.</div>
              </div>
              <div className={`field ${amountError ? "field-has-error" : ""}`}>
                <label>실제 ISA 입금/투자금액</label>
                <input type="number" value={form.actualDepositAmount ?? form.amount} onChange={(e)=>updateForm({actualDepositAmount:e.target.value, amount:e.target.value})} placeholder="실제로 ISA에 넣을 금액을 입력" />
                <div className="field-hint">이 금액을 기준으로 점수·검증·거래내역·ISA 계좌금액·포트폴리오가 다시 계산됩니다.</div>
              </div>
            </>
          )}

          {!isCompound && form.kind !== "investment" && (
            <>
              <div className="field">
                <label>CFO 추천금액</label>
                <input type="number" value={form.recommendedAmount ?? form.amount} onChange={(e)=>updateForm({recommendedAmount:e.target.value})} placeholder="추천 금액" />
                <div className="field-hint">추천금액은 참고용입니다. 실제 반영은 아래 실제 실행금액 기준으로 처리됩니다.</div>
              </div>
              <div className={`field ${amountError ? "field-has-error" : ""}`}>
                <label>{form.kind === "memo" ? "실제 실행금액" : amountLabel}</label>
                <input type="number" value={form.amount} onChange={(e)=>updateForm({amount:e.target.value, actualDepositAmount:e.target.value})} placeholder="실제로 반영할 금액" />
              </div>
            </>
          )}

          {!isCompound && ["emergency","investment"].includes(form.kind) && (
            <>
              <div className={`field ${accountError ? "field-has-error" : ""}`}>
                <label>출금계좌</label>
                <select value={form.fromAccount} onChange={(e)=>updateForm({fromAccount:e.target.value})}>
                  <option value="">선택</option>
                  {accounts.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className={`field ${accountError ? "field-has-error" : ""}`}>
                <label>{form.kind === "investment" ? "투자계좌" : "입금계좌"}</label>
                <select value={form.toAccount} onChange={(e)=>updateForm({toAccount:e.target.value})}>
                  <option value="">선택</option>
                  {accounts.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
            </>
          )}

          {form.kind === "budget" && (
            <>
              <div className="field">
                <label>절감 항목</label>
                <select value={form.budgetCategory} onChange={(e)=>updateForm({budgetCategory:e.target.value})}>
                  {(data?.budgets || []).map(b=><option key={b.id} value={b.cat1}>{b.cat1}</option>)}
                </select>
              </div>
              <div className="field">
                <label>적용 방식</label>
                <select value={form.applyScope} onChange={(e)=>updateForm({applyScope:e.target.value})}>
                  <option value="이번 달">이번 달 예산만 줄이기</option>
                  <option value="다음 달부터">다음 달부터 기준 예산 줄이기</option>
                </select>
              </div>
            </>
          )}

          <div className="field cfo-input-full">
            <label>메모</label>
            <input value={form.memo} onChange={(e)=>updateForm({memo:e.target.value})} placeholder="메모 입력" />
          </div>
        </div>

        <div className="cfo-verification-panel">
          <div className="row-between">
            <div>
              <strong>실행 검증</strong>
              <p>버튼을 누르면 아래 항목이 동시에 바뀝니다.</p>
            </div>
            <span className={`badge ${duplicateInfo.isDuplicate ? "badge-amber" : "badge-green"}`}>{duplicateInfo.isDuplicate ? "중복 감지" : "실행 가능"}</span>
          </div>
          <div className="cfo-verification-grid">
            {verification.rows.map((row)=> (
              <div className="cfo-verification-row" key={row.label}>
                <span>{row.label}</span>
                <b>{row.before}</b>
                <em>→</em>
                <b>{row.after}</b>
              </div>
            ))}
          </div>
          {duplicateInfo.isDuplicate && (
            <div className="alert alert-warn" style={{marginTop:12}}>
              {duplicateInfo.message}
              <label className="cfo-force-run">
                <input type="checkbox" checked={!!form.forceRun} onChange={(e)=>updateForm({forceRun:e.target.checked})} />
                그래도 이번 달에 한 번 더 반영하기
              </label>
            </div>
          )}
        </div>

        {(amountError || accountError) && (
          <div className="alert alert-danger" style={{marginTop:12}}>
            금액과 계좌를 확인해야 실행할 수 있습니다.
          </div>
        )}

        <div className="apple-cfo-modal-note">
          {isCompound ? "비상금과 ISA를 각각 입력한 금액으로 분리 반영합니다. 출금계좌에서는 두 금액의 합계가 차감되고, 거래내역은 비상금 저축·ISA 입금·ETF 매수로 나뉘어 기록됩니다." : "입력한 실제 금액으로 거래내역·ISA 계좌금액·포트폴리오·현금성 자산·예산이 동시에 반영됩니다."} 같은 달 동일 실행은 기본 차단되며, 입력 후 <b>되돌리기</b>로 바로 복구할 수 있습니다. <b>이 앱은 실제 증권사 주문·이체를 실행하지 않습니다.</b> 실제 매수·이체는 증권사 앱에서 직접 진행하세요.
        </div>

        <div className="apple-cfo-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button
            className="apple-cfo-confirm-btn"
            disabled={amountError || accountError || (duplicateInfo.isDuplicate && !form.forceRun)}
            onClick={()=>onConfirm({ ...form, duplicateInfo, verification, amount: actualTotal, actualDepositAmount: isCompound ? n(form.isaAmount) : (form.actualDepositAmount ?? form.amount) })}
            style={{opacity:(amountError || accountError || (duplicateInfo.isDuplicate && !form.forceRun))?0.45:1}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CFOUndoToast({ title, onUndo }) {
  return (
    <div className="apple-cfo-undo-toast">
      <span>입력됨: {title}</span>
      <button onClick={onUndo}>되돌리기</button>
    </div>
  );
}


function findAssetIndexByAccountName(assets=[], accountName="") {
  const key = String(accountName || "").trim();
  if (!key) return -1;
  let idx = assets.findIndex(a => String(a.name || "").trim() === key);
  if (idx >= 0) return idx;
  idx = assets.findIndex(a => key.includes(String(a.name || "").trim()) || String(a.name || "").trim().includes(key));
  return idx;
}

function ensureAssetRow(next, { name, category="은행예금", includeInEmergency=false }) {
  const key = String(name || "").trim();
  if (!key) return -1;
  let idx = findAssetIndexByAccountName(next.assets || [], key);
  if (idx >= 0) return idx;
  next.assets = [
    ...(next.assets || []),
    { id: uid(), kind:"자산", category, name:key, current:0, previous:0, includeInEmergency, note:"CFO 자동 실행으로 생성" },
  ];
  return next.assets.length - 1;
}

function addToAssetCurrent(next, accountName, delta, options={}) {
  const idx = ensureAssetRow(next, { name: accountName, category: options.category || "은행예금", includeInEmergency: options.includeInEmergency === true });
  if (idx < 0) return;
  const prev = n(next.assets[idx].current);
  next.assets[idx] = { ...next.assets[idx], current: Math.max(prev + n(delta), 0) };
}

function buildCFOInvestmentAllocation(amount=0) {
  const total = Math.max(n(amount), 0);
  const rows = [
    { name:"TIGER 나스닥100", assetClass:"나스닥", weight:0.45, code:"133690", symbol:"133690.KS", market:"KRX ETF", currency:"KRW" },
    { name:"TIGER 나스닥100(H)", assetClass:"나스닥", weight:0.45, code:"448300", symbol:"448300.KS", market:"KRX ETF", currency:"KRW" },
    { name:"TIGER 배당다우존스", assetClass:"배당", weight:0.10, code:"458730", symbol:"458730.KS", market:"KRX ETF", currency:"KRW" },
  ];
  let used = 0;
  return rows.map((r, idx) => {
    const buyAmount = idx === rows.length - 1 ? total - used : Math.round(total * r.weight / 1000) * 1000;
    used += buyAmount;
    return { ...r, buyAmount: Math.max(buyAmount, 0) };
  }).filter(r => r.buyAmount > 0);
}

function applyPortfolioBuy(next, { accountName="ISA", allocation=[], memo="" }) {
  const rows = Array.isArray(allocation) ? allocation : [];
  rows.forEach(item => {
    const buyAmount = n(item.buyAmount);
    if (buyAmount <= 0) return;
    let idx = (next.portfolio || []).findIndex(p => String(p.name || "").trim() === item.name);
    if (idx < 0) {
      next.portfolio = [
        ...(next.portfolio || []),
        { id: uid(), account: accountName || "ISA", name:item.name, code:item.code || "", symbol:item.symbol || "", ticker:item.code || "", market:item.market || "KRX ETF", currency:item.currency || "KRW", qty:0, avgPrice:0, currentPrice:0, targetAmount:0, riskSigma:item.assetClass === "배당" ? 0.15 : 0.22, assetClass:item.assetClass || "기타", memo:"CFO 목표비중 기반으로 추가됨" },
      ];
      idx = next.portfolio.length - 1;
    }
    const row = next.portfolio[idx];
    const price = n(row.currentPrice || row.avgPrice);
    const effectivePrice = price > 0 ? price : 1;
    const prevQty = n(row.qty);
    const prevAvg = n(row.avgPrice || row.currentPrice || effectivePrice);
    const addQty = buyAmount / effectivePrice;
    const nextQty = prevQty + addQty;
    const investedBefore = prevQty * prevAvg;
    const nextAvg = nextQty > 0 ? (investedBefore + buyAmount) / nextQty : prevAvg;
    next.portfolio[idx] = {
      ...row,
      account: accountName || row.account || "ISA",
      qty: Number(nextQty.toFixed(6)),
      avgPrice: Math.round(nextAvg),
      currentPrice: price > 0 ? row.currentPrice : 1,
      targetAmount: n(row.targetAmount) + buyAmount,
      assetClass: row.assetClass || item.assetClass || "기타",
      memo: [row.memo, memo ? `CFO 자동매수 ${fmt(buyAmount)}원` : ""].filter(Boolean).join(" / "),
      lastCfoBuyAt: new Date().toISOString(),
    };
  });
}


function applyCFOActionToData(data, action, form={}) {
  if (!action) return data;
  const now = form.date || todayISO();
  const title = String(action.title || "");
  const desc = String(action.desc || "");
  const executedAt = new Date().toISOString();
  const executionId = form.executionId || uid();
  const kind = form.kind || detectCFOActionKind(action);
  const emergencyAmount = Math.max(n(form.emergencyAmount), 0);
  const isaAmount = Math.max(n(form.isaAmount ?? form.actualDepositAmount ?? form.amount), 0);
  const amount = Math.max(n(kind === "compound" ? emergencyAmount + isaAmount : (kind === "investment" || kind === "retirement" ? (form.actualDepositAmount ?? form.amount) : form.amount)), 0);
  const next = migrateData({ ...data });
  const allocation = kind === "compound" ? buildCFOInvestmentAllocation(isaAmount) : (kind === "investment" || kind === "retirement" ? buildCFOInvestmentAllocation(amount) : []);

  const duplicateInfo = getCFOExecutionDuplicateInfo(data, action, form);
  if (duplicateInfo.isDuplicate && !form.forceRun && !form.__previewOnly) {
    return data;
  }

  next.cfoActionHistory = [
    { id: executionId, executionId, title, desc, executedAt, executedDate: now, executionMonth: duplicateInfo.executionMonth, executionKey: duplicateInfo.executionKey, ruleKey: duplicateInfo.ruleKey, forcedDuplicate: !!form.forceRun, expectedScore: n(action.expectedScore), priority: action.priority || "mid", kind, recommendedAmount: n(form.recommendedAmount), actualDepositAmount: kind === "compound" ? isaAmount : amount, emergencyAmount, isaAmount, amount, fromAccount: form.fromAccount || "", toAccount: kind === "compound" ? (form.investmentAccount || form.toAccount || "ISA") : (form.toAccount || ""), emergencyAccount: form.emergencyAccount || "", investmentAccount: form.investmentAccount || "", allocation, memo: form.memo || "", verificationRows: form.verification?.rows || [], rollbackPatch: { kind, amount, emergencyAmount, isaAmount, fromAccount: form.fromAccount || "", toAccount: kind === "compound" ? (form.investmentAccount || form.toAccount || "ISA") : (form.toAccount || ""), emergencyAccount: form.emergencyAccount || "", investmentAccount: form.investmentAccount || "", allocation, budgetCategory: form.budgetCategory || "", date: now } },
    ...((next.cfoActionHistory || []).slice(0, 29)),
  ];

  const addSystemEvent = (name, amountNeeded=0, priority="중간") => {
    const exists = (next.events || []).some(e => String(e.name || "").includes(name));
    if (!exists) next.events = [...(next.events || []), { id: uid(), name, yearsFromNow: 1, amountNeeded, currentPrepared: 0, priority }];
  };
  const addTx = (tx) => { next.transactions = [{ id: uid(), date: now, executionId, ...tx }, ...(next.transactions || [])]; };

  if (kind === "compound") {
    const emergencyAccount = form.emergencyAccount || form.toAccount || "비상금";
    const investmentAccount = form.investmentAccount || form.toAccount || "ISA";
    const totalOut = emergencyAmount + isaAmount;
    addSystemEvent("🛡️ 비상금 3개월치 확보", emergencyAmount || 3000000, "높음");
    addToAssetCurrent(next, form.fromAccount, -totalOut, { category:"은행예금" });
    if (emergencyAmount > 0) {
      addToAssetCurrent(next, emergencyAccount, emergencyAmount, { category:"현금성", includeInEmergency:true });
      addTx({ type:"자산이동", cat1:"계좌이체", cat2:"내계좌간이체", amount:emergencyAmount, fromAccount:form.fromAccount || "", toAccount:emergencyAccount, memo:form.memo || `CFO 자동실행 - 비상금 저축 ${fmt(emergencyAmount)}원`, source:"CFO_COMPOUND_EMERGENCY", editable:true });
    }
    if (isaAmount > 0) {
      addToAssetCurrent(next, investmentAccount, isaAmount, { category:"주식계좌", includeInEmergency:false });
      applyPortfolioBuy(next, { accountName: investmentAccount, allocation, memo: form.memo || `CFO 자동실행 - ETF 자동매수` });
      next.settings = {
        ...next.settings,
        autoTriggerEnabled:true,
        autoBuyTriggerEnabled:true,
        triggerMonthlyInvestAmount: Math.max(n(next.settings?.triggerMonthlyInvestAmount), isaAmount, n(next.settings?.monthlyInvestDefault)),
        monthlyInvestDefault: Math.max(n(next.settings?.monthlyInvestDefault), isaAmount),
        annualIsaContributionCurrent: String(investmentAccount || "").includes("ISA") ? Math.min(n(next.settings?.isaAnnualLimit || 20000000), n(next.settings?.annualIsaContributionCurrent) + isaAmount) : n(next.settings?.annualIsaContributionCurrent),
      };
      addTx({ type:"자산이동", cat1:"계좌이체", cat2:"내계좌간이체", amount:isaAmount, fromAccount:form.fromAccount || "", toAccount:investmentAccount, memo:form.memo || `CFO 자동실행 - ${investmentAccount} 입금 ${fmt(isaAmount)}원`, source:"CFO_COMPOUND_ISA", editable:true });
      addTx({ type:"자산이동", cat1:"투자", cat2:"ETF매수", amount:isaAmount, fromAccount:investmentAccount, toAccount:investmentAccount, memo:form.memo || `CFO 자동실행 - ETF 매수 ${allocation.map(a=>`${a.name} ${fmt(a.buyAmount)}원`).join(" / ")}`, source:"CFO_COMPOUND_ISA", editable:true });
    }
  } else if (kind === "emergency") {
    addSystemEvent("🛡️ 비상금 3개월치 확보", amount || 3000000, "높음");
    addToAssetCurrent(next, form.fromAccount, -amount, { category:"은행예금" });
    addToAssetCurrent(next, form.toAccount, amount, { category:"현금성", includeInEmergency:true });
    next.settings = { ...next.settings, triggerCashAvailable: Math.max(n(next.settings?.triggerCashAvailable), amount) };
    addTx({ type:"자산이동", cat1:"계좌이체", cat2:"내계좌간이체", amount, fromAccount:form.fromAccount || "", toAccount:form.toAccount || "", memo:form.memo || `CFO 자동실행 - 비상금 ${fmt(amount)}원 이체` });
  } else if (kind === "investment" || kind === "retirement") {
    const investmentAccount = form.toAccount || "ISA";
    addToAssetCurrent(next, form.fromAccount, -amount, { category:"은행예금" });
    // 사용자가 요청한 핵심: CFO 실행 시 ISA/투자계좌의 자산 금액도 함께 증가시킵니다.
    addToAssetCurrent(next, investmentAccount, amount, { category:"주식계좌", includeInEmergency:false });
    applyPortfolioBuy(next, { accountName: investmentAccount, allocation, memo: form.memo || `CFO 자동실행 - ETF 자동매수` });
    next.settings = {
      ...next.settings,
      autoTriggerEnabled:true,
      autoBuyTriggerEnabled:true,
      triggerMonthlyInvestAmount: Math.max(n(next.settings?.triggerMonthlyInvestAmount), amount, n(next.settings?.monthlyInvestDefault)),
      monthlyInvestDefault: Math.max(n(next.settings?.monthlyInvestDefault), amount),
      annualIsaContributionCurrent: String(investmentAccount || "").includes("ISA") ? Math.min(n(next.settings?.isaAnnualLimit || 20000000), n(next.settings?.annualIsaContributionCurrent) + amount) : n(next.settings?.annualIsaContributionCurrent),
    };
    addTx({ type:"자산이동", cat1:"계좌이체", cat2:"내계좌간이체", amount, fromAccount:form.fromAccount || "", toAccount:investmentAccount, memo:form.memo || `CFO 자동실행 - ${investmentAccount} 실제 입금 ${fmt(amount)}원`, source:"CFO_AUTO_INVEST", editable:true });
    addTx({ type:"자산이동", cat1:"투자", cat2:"ETF매수", amount, fromAccount:investmentAccount, toAccount:investmentAccount, memo:form.memo || `CFO 자동실행 - ETF 매수 ${allocation.map(a=>`${a.name} ${fmt(a.buyAmount)}원`).join(" / ")}`, source:"CFO_AUTO_INVEST", editable:true });
  } else if (kind === "budget") {
    const targetCat = form.budgetCategory || "";
    next.budgets = (next.budgets || []).map(b => targetCat && b.cat1 !== targetCat ? b : { ...b, budget: Math.max(n(b.budget) - amount, 0) });
    addTx({ type:"지출", cat1:targetCat || "기타지출", cat2:"기타", amount:0, fromAccount:"", toAccount:"", memo:form.memo || `CFO 자동실행 - ${targetCat || "예산"} ${fmt(amount)}원 절감 목표` });
  } else {
    addTx({ type:"자산이동", cat1:"계좌이체", cat2:"내계좌간이체", amount:0, fromAccount:"", toAccount:"", memo:form.memo || `CFO 입력 반영 완료: ${title}` });
  }

  next.lastCfoActionAt = executedAt;
  return next;
}


function undoPortfolioBuy(next, allocation=[]) {
  (Array.isArray(allocation) ? allocation : []).forEach(item => {
    const idx = (next.portfolio || []).findIndex(p => String(p.name || "").trim() === String(item.name || "").trim());
    if (idx < 0) return;
    const row = next.portfolio[idx];
    const buyAmount = n(item.buyAmount);
    const price = n(row.currentPrice || row.avgPrice) || 1;
    const removeQty = buyAmount / price;
    next.portfolio[idx] = {
      ...row,
      qty: Math.max(n(row.qty) - removeQty, 0),
      targetAmount: Math.max(n(row.targetAmount) - buyAmount, 0),
      memo: [row.memo, `CFO 실행 되돌리기 -${fmt(buyAmount)}원`].filter(Boolean).join(" / "),
      lastCfoRollbackAt: new Date().toISOString(),
    };
  });
}

function rollbackCFOActionFromData(data, historyId) {
  const next = migrateData({ ...data });
  const history = Array.isArray(next.cfoActionHistory) ? next.cfoActionHistory : [];
  const target = history.find(h => String(h.id || h.executionId) === String(historyId));
  if (!target) return next;

  const patch = target.rollbackPatch || target;
  const kind = patch.kind || target.kind || "memo";
  const amount = Math.max(n(patch.amount ?? target.actualDepositAmount ?? target.amount), 0);
  const fromAccount = patch.fromAccount || target.fromAccount || "";
  const toAccount = patch.toAccount || target.toAccount || "";
  const allocation = patch.allocation || target.allocation || [];

  if (kind === "compound") {
    const emergencyAmount = Math.max(n(patch.emergencyAmount ?? target.emergencyAmount), 0);
    const isaAmount = Math.max(n(patch.isaAmount ?? target.isaAmount ?? target.actualDepositAmount), 0);
    const emergencyAccount = patch.emergencyAccount || target.emergencyAccount || "";
    const investmentAccount = patch.investmentAccount || patch.toAccount || target.investmentAccount || target.toAccount || "ISA";
    addToAssetCurrent(next, fromAccount, emergencyAmount + isaAmount, { category:"은행예금" });
    addToAssetCurrent(next, emergencyAccount, -emergencyAmount, { category:"현금성", includeInEmergency:true });
    addToAssetCurrent(next, investmentAccount, -isaAmount, { category:"주식계좌" });
    undoPortfolioBuy(next, allocation);
    next.settings = {
      ...next.settings,
      annualIsaContributionCurrent: String(investmentAccount || "").includes("ISA")
        ? Math.max(n(next.settings?.annualIsaContributionCurrent) - isaAmount, 0)
        : n(next.settings?.annualIsaContributionCurrent),
    };
  } else if (kind === "emergency") {
    addToAssetCurrent(next, fromAccount, amount, { category:"은행예금" });
    addToAssetCurrent(next, toAccount, -amount, { category:"현금성", includeInEmergency:true });
  } else if (kind === "investment" || kind === "retirement") {
    addToAssetCurrent(next, fromAccount, amount, { category:"은행예금" });
    addToAssetCurrent(next, toAccount, -amount, { category:"주식계좌" });
    undoPortfolioBuy(next, allocation);
    next.settings = {
      ...next.settings,
      annualIsaContributionCurrent: String(toAccount || "").includes("ISA")
        ? Math.max(n(next.settings?.annualIsaContributionCurrent) - amount, 0)
        : n(next.settings?.annualIsaContributionCurrent),
    };
  } else if (kind === "budget") {
    const cat = patch.budgetCategory || target.budgetCategory || "";
    next.budgets = (next.budgets || []).map(b => cat && b.cat1 !== cat ? b : { ...b, budget: n(b.budget) + amount });
  }

  const executionId = target.executionId || target.id;
  next.transactions = (next.transactions || []).filter(t => String(t.executionId || "") !== String(executionId));
  next.cfoActionHistory = history.filter(h => String(h.id || h.executionId) !== String(historyId));
  next.lastCfoRollbackAt = new Date().toISOString();
  next.cfoRollbackHistory = [
    { id: uid(), rolledBackHistoryId: historyId, title: target.title || "CFO 실행", amount, kind, rolledBackAt: next.lastCfoRollbackAt },
    ...((next.cfoRollbackHistory || []).slice(0, 29)),
  ];
  return next;
}


// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardQuickEntryPanel({ data, update }) {
  const [quickModal, setQuickModal] = useState(null);
  const activeAccounts = (data?.accounts || []).filter(a => a.active !== false).map(a => a.name).filter(Boolean);
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const thisMonth = todayISO().slice(0, 7);
  const monthRows = transactions.filter(t => String(t.date || "").slice(0, 7) === thisMonth);
  const monthExpense = monthRows.filter(t => t.type === "지출").reduce((sum, t) => sum + n(t.amount), 0);
  const monthIncome = monthRows.filter(t => t.type === "수입").reduce((sum, t) => sum + n(t.amount), 0);
  const recentRows = transactions.slice(-3).reverse();

  const openQuick = (config) => setQuickModal(config);

  return (
    <>
      <div className="dashboard-quick-entry card compact">
        <div className="dq-head">
          <div>
            <span className="dq-eyebrow">빠른 입력</span>
            <h3>메인에서 바로 기록하고, 상세 입력은 터치로 열기</h3>
            <p>자주 쓰는 입력은 한 번에 열고, 세부 분류·계좌·분배 내역은 전용 입력창에서 확인 후 저장합니다.</p>
          </div>
          <button className="dq-all-btn" onClick={() => openQuick({ mode:"split" })}>전체 입력 열기</button>
        </div>

        <div className="dq-action-grid">
          <button className="dq-action-card expense" onClick={() => openQuick({ mode:"normal", type:"지출" })}>
            <span className="dq-action-icon">💳</span>
            <strong>지출 입력</strong>
            <em>식비·쇼핑·카드 사용</em>
            <b>이번 달 {fmt(monthExpense)}원</b>
          </button>
          <button className="dq-action-card income" onClick={() => openQuick({ mode:"normal", type:"수입" })}>
            <span className="dq-action-icon">💰</span>
            <strong>수입 입력</strong>
            <em>급여·배당·환급</em>
            <b>이번 달 {fmt(monthIncome)}원</b>
          </button>
          <button className="dq-action-card split" onClick={() => openQuick({ mode:"split" })}>
            <span className="dq-action-icon">🧩</span>
            <strong>비상금·투자 분배</strong>
            <em>비상금 / ISA / 연금 / 생활비</em>
            <b>분리 저장</b>
          </button>
        </div>

        <div className="dq-mini-footer">
          <div>
            <span>최근 입력</span>
            {recentRows.length === 0 ? (
              <p>아직 입력된 거래가 없습니다.</p>
            ) : (
              <p>{recentRows.map(t => `${t.type || "거래"} ${fmt(t.amount)}원`).join(" · ")}</p>
            )}
          </div>
          <button className="dq-detail-link" onClick={() => openQuick({ mode:"guide" })}>입력 검증 기준 보기</button>
        </div>
      </div>

      {quickModal && (
        <QuickAddModal
          data={data}
          update={update}
          accountNamesIn={activeAccounts}
          accountNamesOut={activeAccounts}
          initialMode={quickModal.mode || "split"}
          initialType={quickModal.type || "지출"}
          onClose={() => setQuickModal(null)}
        />
      )}
    </>
  );
}

function DashboardTab({ data, update, dashboard, dashboardDetail, dashboardChartData, financialAnalysis, budgetAnalysis, monthlySeries, eventAnalysis, taxAnalysis, futureSim, anomalyAlerts }) {
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
    if(anomalyAlerts&&anomalyAlerts.length>0){
      anomalyAlerts.slice(0,3).forEach(a=>{
        issueCards.push({icon:a.level==="danger"?"🚨":"⚠️",title:`${a.cat} 이상 지출`,text:a.msg,tone:a.level==="danger"?"red":"warn"});
      });
    }
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

  const cfoDecisionModel = useMemo(
    () => buildCFODecisionModel({ data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, futureSim }),
    [data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, futureSim]
  );

  const [cfoUndoState, setCfoUndoState] = useState(null);
  const handleCFOExecuteAction = (action, form) => {
    if (!action || !update) return;
    const previousData = JSON.parse(JSON.stringify(data));
    update(d=>applyCFOActionToData(d, action, form));
    setCfoUndoState({
      available: true,
      title: action.title,
      previousData,
      createdAt: Date.now(),
    });
  };
  const handleCFOUndoAction = () => {
    if (!cfoUndoState?.previousData || !update) return;
    update(()=>cfoUndoState.previousData);
    setCfoUndoState(null);
  };

  const handleCFORollbackHistory = (historyId) => {
    if (!historyId || !update) return;
    const previousData = JSON.parse(JSON.stringify(data));
    const target = (data.cfoActionHistory || []).find(h => String(h.id || h.executionId) === String(historyId));
    update(d=>rollbackCFOActionFromData(d, historyId));
    setCfoUndoState({
      available: true,
      title: `${target?.title || "CFO 실행"} 되돌림`,
      previousData,
      createdAt: Date.now(),
    });
  };


  const healthColor=advanced.tone==="green"?"var(--green)":advanced.tone==="accent"?"var(--accent)":advanced.tone==="amber"?"var(--amber)":"var(--red)";
  const healthBg=advanced.tone==="green"?"var(--green-bg)":advanced.tone==="accent"?"var(--accent-bg)":advanced.tone==="amber"?"var(--amber-bg)":"var(--red-bg)";

  return (
    <div className="stack dashboard-pro">
      <DashboardAdvicePanel nlp={dashboardNLP} />
      <CFODecisionDashboard model={cfoDecisionModel} data={data} onExecuteAction={handleCFOExecuteAction} onUndoAction={handleCFOUndoAction} undoState={cfoUndoState} onRollbackHistory={handleCFORollbackHistory} />
      <AICoachPanel coach={buildIntegratedCoach({ area:"대시보드", data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim, eventAnalysis, monthlySeries })}/>
      <DashboardQuickEntryPanel data={data} update={update} />

      <div className="dashboard-hero">
        <div className="health-card">
          <div className="row-between">
            <div>
              <div className="kpi-label">재무 건강도 (참고)</div>
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
// ─── Toast 알림 시스템 (alert() 대체) ────────────────────────────────────────
const ToastContext = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const showToast = React.useCallback((msg, type="info", duration=3200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none"}}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding:"11px 20px",borderRadius:99,fontSize:13,fontWeight:600,
            background:t.type==="error"?"var(--red)":t.type==="success"?"var(--green)":t.type==="warn"?"var(--amber)":"var(--surface3)",
            color:t.type==="error"||t.type==="success"?"#fff":t.type==="warn"?"#1a1400":"var(--text)",
            boxShadow:"0 4px 20px rgba(0,0,0,.35)",
            animation:"qa-toast-in .25s cubic-bezier(.2,.8,.2,1) forwards",
            whiteSpace:"nowrap",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis",
            pointerEvents:"none",
          }}>
            {t.type==="error"?"⚠ ":t.type==="success"?"✓ ":t.type==="warn"?"💡 ":"ℹ "}{t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
function useToast() { return React.useContext(ToastContext); }
// confirm 대체: Promise 기반 모달
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)"}} onClick={onCancel}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:8001,background:"var(--surface)",borderRadius:20,padding:"28px 28px 20px",maxWidth:360,width:"90vw",boxShadow:"0 16px 48px rgba(0,0,0,.5)"}}>
        <div style={{fontSize:15,fontWeight:600,color:"var(--text)",marginBottom:20,lineHeight:1.5}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button className="btn btn-danger" onClick={onConfirm}>확인</button>
        </div>
      </div>
    </>
  );
}
function useConfirm() {
  const [state, setState] = React.useState(null);
  const showConfirm = (message) => new Promise(resolve => {
    setState({ message, resolve });
  });
  const handleConfirm = () => { state?.resolve(true); setState(null); };
  const handleCancel = () => { state?.resolve(false); setState(null); };
  const ConfirmPortal = state ? <ConfirmModal message={state.message} onConfirm={handleConfirm} onCancel={handleCancel}/> : null;
  return { showConfirm, ConfirmPortal };
}



// ─── 개인정보처리방침 모달 ────────────────────────────────────────────────────
function PrivacyModal({ onClose }) {
  return (
    <>
      <div className="qa-overlay" onClick={onClose}/>
      <div className="qa-sheet" onClick={e=>e.stopPropagation()} style={{maxHeight:"85vh"}}>
        <div className="qa-handle"/>
        <div className="qa-header">
          <span className="qa-title">개인정보처리방침</span>
          <button className="qa-close" onClick={onClose}>✕</button>
        </div>
        <div className="qa-body" style={{fontSize:13,lineHeight:1.8,color:"var(--text2)"}}>
          <p><strong style={{color:"var(--text)"}}>1. 수집하는 개인정보</strong><br/>
          이 앱은 이메일 주소(클라우드 동기화 선택 시), 사용자가 직접 입력한 재무 데이터(거래내역·자산·포트폴리오)를 수집합니다.</p>
          <p><strong style={{color:"var(--text)"}}>2. 이용 목적</strong><br/>
          수집된 정보는 개인 재무 현황 계산 및 클라우드 동기화 목적으로만 사용되며, 제3자에게 제공하지 않습니다.</p>
          <p><strong style={{color:"var(--text)"}}>3. 보관 기간</strong><br/>
          클라우드 데이터는 회원 탈퇴 또는 삭제 요청 시 즉시 파기합니다. 로컬 데이터는 사용자가 직접 관리합니다.</p>
          <p><strong style={{color:"var(--text)"}}>4. 제3자 제공</strong><br/>
          재무 데이터는 어떠한 제3자(광고주, 금융기관 등)에게도 제공하지 않습니다.</p>
          <p><strong style={{color:"var(--text)"}}>5. 권리 행사</strong><br/>
          개인정보 열람·수정·삭제는 '데이터 관리' 탭에서 직접 처리하거나, 앱 내 데이터 초기화로 삭제할 수 있습니다.</p>
          <p><strong style={{color:"var(--text)"}}>6. 면책 사항</strong><br/>
          이 앱은 투자자문업 등록을 하지 않은 개인 재무 계산기입니다. 제공되는 모든 수치와 분석은 참고용이며, 실제 투자·세무 결정에 활용하지 마세요.</p>
          <p style={{fontSize:11,color:"var(--text3)",marginTop:16}}>시행일: 2025년 1월 1일</p>
        </div>
      </div>
    </>
  );
}

// ─── 면책 고지 배너 ───────────────────────────────────────────────────────────
function DisclaimerBanner({ context="general" }) {
  const msgs = {
    investment: "이 앱은 목표비중·수익률 등 사용자가 직접 설정한 값을 기반으로 현황을 계산하는 참고용 도구입니다. 투자 결정 전 반드시 공인 금융전문가와 상담하세요. 실제 매수·매도는 증권사 앱에서 직접 실행하세요.",
    tax: "세금 계산은 일반적인 사례를 바탕으로 한 참고용입니다. 실제 신고·납부 전에는 국세청(hometax.go.kr) 또는 세무사에게 확인하세요.",
    simulation: "시뮬레이션 결과는 사용자가 입력한 가정을 기반으로 한 참고용 추정치입니다. 과거 수익률이 미래를 보장하지 않으며, 실제 결과와 다를 수 있습니다.",
    portfolio: "종목 현황·비중·수익률은 사용자 입력 데이터 기반 참고 계산값입니다. 이 앱은 투자자문업 미등록 계산기이며, 실제 매수·매도는 증권사 앱에서 직접 실행하세요.",
    decision: "제시된 항목은 입력 데이터 기반 참고 정보입니다. 투자 결정은 사용자의 판단과 책임 하에 이루어져야 하며, 이 앱은 투자 조언을 제공하지 않습니다.",
    cfo: "이 앱은 투자자문업 미등록 개인 재무 현황 계산기입니다. 제시된 수치와 항목은 모두 참고용이며 투자 결정의 근거로 사용하지 마세요.",
    general: "이 앱은 개인 재무 현황을 정리하는 참고용 계산기입니다. 금융·세무 조언을 제공하지 않습니다.",
  };
  return (
    <div className="disclaimer-banner">
      <strong>⚠ 참고용</strong>
      <span>{msgs[context] || msgs.general}</span>
    </div>
  );
}

// ─── 전역 법적 푸터 ───────────────────────────────────────────────────────────
function LegalFooter() {
  return (
    <div className="legal-footer">
      이 서비스는 투자자문업 등록을 하지 않은 개인 재무 현황 계산기입니다. 제공되는 모든 수치·분석·제안은 참고용이며, 투자 결정의 근거로 사용하지 마세요.
      실제 투자·세무 결정은 공인 금융전문가 또는 세무사와 상담하시기 바랍니다.
    </div>
  );
}

// ─── 글로벌 간편입력 모달 v2: 일반거래 + 분배입력 + 저장 전 확인 ────────────────
function getAccountByKeyword(accounts = [], keywords = []) {
  const active = (accounts || []).filter(a => a.active !== false);
  const words = Array.isArray(keywords) ? keywords : [keywords];
  return active.find(a => words.some(k => String(a.name || "").includes(k) || String(a.type || "").includes(k)))?.name
    || active[0]?.name
    || "";
}

function getIsaUsedThisYear(transactions = [], year = new Date().getFullYear()) {
  return (transactions || [])
    .filter(t => String(t.date || "").slice(0, 4) === String(year))
    .filter(t => /ISA|개인종합자산관리|isa/i.test(`${t.inAccount || ""} ${t.outAccount || ""} ${t.cat1 || ""} ${t.cat2 || ""} ${t.content || ""} ${t.memo || ""}`))
    .filter(t => t.type === "자산이동" || t.type === "지출")
    .reduce((sum, t) => sum + n(t.amount), 0);
}

function validateTransactionRows(rows = [], data = {}) {
  const issues = [];
  const accounts = new Set((data.accounts || []).map(a => a.name).filter(Boolean));
  rows.forEach((r, idx) => {
    const label = r.content || r.cat2 || `#${idx + 1}`;
    if (!r.date) issues.push({ level:"error", text:`${label}: 날짜가 없습니다.` });
    if (!r.type) issues.push({ level:"error", text:`${label}: 거래유형이 없습니다.` });
    if (n(r.amount) <= 0) issues.push({ level:"error", text:`${label}: 금액은 0원보다 커야 합니다.` });
    if (r.type === "수입" && !r.inAccount) issues.push({ level:"error", text:`${label}: 입금계좌가 필요합니다.` });
    if (r.type === "지출" && !r.outAccount) issues.push({ level:"error", text:`${label}: 출금계좌가 필요합니다.` });
    if (r.type === "자산이동") {
      if (!r.inAccount || !r.outAccount) issues.push({ level:"error", text:`${label}: 입금계좌와 출금계좌가 모두 필요합니다.` });
      if (r.inAccount && r.outAccount && r.inAccount === r.outAccount) issues.push({ level:"error", text:`${label}: 입금계좌와 출금계좌가 같습니다.` });
    }
    if (r.inAccount && accounts.size && !accounts.has(r.inAccount)) issues.push({ level:"warn", text:`${label}: 입금계좌가 계좌 목록에 없습니다.` });
    if (r.outAccount && accounts.size && !accounts.has(r.outAccount)) issues.push({ level:"warn", text:`${label}: 출금계좌가 계좌 목록에 없습니다.` });
  });

  const year = new Date().getFullYear();
  const isaRows = rows.filter(r => /ISA|isa/i.test(`${r.inAccount || ""} ${r.cat1 || ""} ${r.cat2 || ""} ${r.content || ""}`));
  const isaNew = isaRows.reduce((sum, r) => sum + n(r.amount), 0);
  const isaLimit = n(data.settings?.isaAnnualLimit || 0);
  const isaUsed = getIsaUsedThisYear(data.transactions || [], year);
  if (isaLimit > 0 && isaUsed + isaNew > isaLimit) {
    issues.push({ level:"error", text:`ISA 연간 한도 초과: 기존 ${fmt(isaUsed)}원 + 신규 ${fmt(isaNew)}원 > 한도 ${fmt(isaLimit)}원` });
  } else if (isaLimit > 0 && isaNew > 0) {
    issues.push({ level:"ok", text:`ISA 한도 확인: 저장 후 잔여 ${fmt(Math.max(isaLimit - isaUsed - isaNew, 0))}원` });
  }

  if (!issues.some(i => i.level === "error" || i.level === "warn")) {
    issues.push({ level:"ok", text:"필수 입력값과 계좌 규칙이 정상입니다." });
  }
  return issues;
}

function buildSplitTransactions({ split, data, accountNamesIn = [], accountNamesOut = [] }) {
  const date = split.date || todayISO();
  const source = split.outAccount || getAccountByKeyword(data.accounts, ["급여", "은행", "카카오"]);
  const isaAccount = split.isaAccount || getAccountByKeyword(data.accounts, ["ISA"]);
  const pensionAccount = split.pensionAccount || getAccountByKeyword(data.accounts, ["연금저축", "연금"]);
  const irpAccount = split.irpAccount || getAccountByKeyword(data.accounts, ["IRP"]);
  const emergencyAccount = split.emergencyAccount || getAccountByKeyword(data.accounts, ["KOFR", "파킹", "카카오", "현금"]);
  const taxableAccount = split.taxableAccount || getAccountByKeyword(data.accounts, ["증권", "일반", "투자"]);
  const livingAccount = split.livingAccount || getAccountByKeyword(data.accounts, ["카드", "생활", "급여"]);
  const mk = (amount, inAccount, cat2, content, memo) => n(amount) > 0 ? {
    id: uid(), date, type:"자산이동", cat1:"투자", cat2, amount:n(amount),
    inAccount, outAccount:source, content, memo,
    planGroupId: split.planGroupId, createdBy:"split-quick-add-v2",
  } : null;
  return [
    mk(split.emergencyAmount, emergencyAccount, "비상금적립", "비상금 분리 적립", "분배입력: 안전자금"),
    mk(split.isaAmount, isaAccount, "ISA납입", "ISA 투자금 분리 납입", "분배입력: ISA 연간 한도 반영"),
    mk(split.pensionAmount, pensionAccount, "연금저축납입", "연금저축 납입", "분배입력: 세액공제 계좌"),
    mk(split.irpAmount, irpAccount, "IRP납입", "IRP 납입", "분배입력: 세액공제 계좌"),
    mk(split.taxableInvestAmount, taxableAccount, "일반투자", "일반 투자금 분리", "분배입력: 일반계좌"),
    mk(split.livingAmount, livingAccount, "생활비분리", "생활비 계좌 분리", "분배입력: 소비예산"),
  ].filter(Boolean);
}

function QuickAddModal({ data, update, accountNamesIn, accountNamesOut, onClose, initialMode="split", initialType="지출" }) {
  const EMPTY = { id:"", date:todayISO(), type:"지출", cat1:"", cat2:"", amount:"", inAccount:"", outAccount:"", content:"", memo:"" };
  const DEFAULT_SPLIT = {
    date: todayISO(), totalAmount: 2000000,
    emergencyAmount: 500000, isaAmount: 1500000, pensionAmount: 0, irpAmount: 0, taxableInvestAmount: 0, livingAmount: 0,
    outAccount: getAccountByKeyword(data.accounts, ["급여", "우리", "은행"]),
    emergencyAccount: getAccountByKeyword(data.accounts, ["KOFR", "파킹", "카카오", "현금"]),
    isaAccount: getAccountByKeyword(data.accounts, ["ISA"]),
    pensionAccount: getAccountByKeyword(data.accounts, ["연금저축", "연금"]),
    irpAccount: getAccountByKeyword(data.accounts, ["IRP"]),
    taxableAccount: getAccountByKeyword(data.accounts, ["증권", "일반"]),
    livingAccount: getAccountByKeyword(data.accounts, ["카드", "생활"]),
    planGroupId: uid(),
  };

  const initialCat1 = Object.keys(data.categories?.[initialType || "지출"] || {})[0] || "";
  const initialCat2 = ((data.categories?.[initialType || "지출"] || {})[initialCat1] || [""])[0] || "";
  const [mode, setMode] = useState(initialMode || "split");
  const [form, setForm] = useState({ ...EMPTY, type: initialType || "지출", cat1: initialCat1, cat2: initialCat2 });
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [pendingRows, setPendingRows] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const txTemplates = Array.isArray(data.settings?.transactionTemplates) ? data.settings.transactionTemplates : [];
  const cat1Opts = Object.keys(data.categories[form.type] || {});
  const cat2Opts = (data.categories[form.type] || {})[form.cat1] || [];
  const activeAccounts = (data.accounts || []).filter(a => a.active !== false).map(a => a.name).filter(Boolean);
  const incomeAccounts = accountNamesIn?.length ? accountNamesIn : activeAccounts;
  const outAccounts = accountNamesOut?.length ? accountNamesOut : activeAccounts;

  const splitAllocated = n(split.emergencyAmount) + n(split.isaAmount) + n(split.pensionAmount) + n(split.irpAmount) + n(split.taxableInvestAmount) + n(split.livingAmount);
  const splitDiff = n(split.totalAmount) - splitAllocated;
  const splitRows = useMemo(() => buildSplitTransactions({ split, data, accountNamesIn:incomeAccounts, accountNamesOut:outAccounts }), [split, data, incomeAccounts, outAccounts]);
  const rowsToValidate = mode === "split" ? splitRows : [{ ...form, amount:n(form.amount), id:form.id || uid() }];
  const validationIssues = validateTransactionRows(rowsToValidate, data);
  const hasError = validationIssues.some(i => i.level === "error") || (mode === "split" && splitDiff !== 0);

  const normalizedForm = { ...form, amount: n(form.amount) };
  const canSaveNormal = (() => {
    const f = normalizedForm;
    if (!f.date || !f.type || !f.cat1 || !f.cat2 || f.amount <= 0) return false;
    if (f.type === "수입" && !f.inAccount) return false;
    if (f.type === "지출" && !f.outAccount) return false;
    if (f.type === "자산이동" && (!f.inAccount || !f.outAccount || f.inAccount === f.outAccount)) return false;
    return !validateTransactionRows([{ ...f, id:uid() }], data).some(i => i.level === "error");
  })();
  const canSaveSplit = splitRows.length > 0 && splitDiff === 0 && !hasError;

  const smartSuggestions = useMemo(() => {
    const tx = (data.transactions || []).filter(t => t.type === form.type);
    const sameCat1 = tx.filter(t => !form.cat1 || t.cat1 === form.cat1);
    const sameCat2 = sameCat1.filter(t => !form.cat2 || t.cat2 === form.cat2);
    const pickTop = (arr, key, limit=4) => {
      const map = new Map();
      arr.forEach(t => { const v = String(t[key]||"").trim(); if(v) map.set(v, (map.get(v)||0)+1); });
      return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([value])=>value);
    };
    return {
      cat1: pickTop(tx, "cat1"),
      cat2: pickTop(sameCat1.length ? sameCat1 : tx, "cat2"),
      content: pickTop(sameCat2.length ? sameCat2 : sameCat1.length ? sameCat1 : tx, "content", 5),
      amount: (() => {
        const vals = (sameCat2.length ? sameCat2 : sameCat1).map(t => n(t.amount)).filter(v=>v>0);
        if (!vals.length) return [];
        const map = new Map();
        vals.forEach(v => map.set(v, (map.get(v)||0)+1));
        return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([v])=>v);
      })(),
    };
  }, [data.transactions, form.type, form.cat1, form.cat2]);

  const QUICK_AMOUNTS = form.type === "수입" ? [300000, 1000000, 3000000, 5000000] : [10000, 30000, 50000, 100000, 300000];
  const updateSplit = (key, value) => setSplit(prev => ({ ...prev, [key]: value }));

  const applyTemplate = (tpl) => {
    setMode("normal");
    setForm({ ...EMPTY, date: todayISO(), type: tpl.type||"지출", cat1: tpl.cat1||"", cat2: tpl.cat2||"", amount: tpl.amount||"", inAccount: tpl.inAccount||"", outAccount: tpl.outAccount||"", content: tpl.content||tpl.name||"", memo: tpl.memo||"" });
  };

  const openConfirm = () => {
    const rows = mode === "split" ? splitRows : [{ ...form, amount:n(form.amount), id:uid() }];
    const bad = validateTransactionRows(rows, data).some(i => i.level === "error");
    if (bad || (mode === "split" && splitDiff !== 0)) return;
    setPendingRows(rows);
    setConfirmOpen(true);
  };

  const commitRows = () => {
    if (!pendingRows.length) return;
    update(d => ({ ...d, transactions: [...(d.transactions || []), ...pendingRows.map(r => ({ ...r, id:r.id || uid() }))] }));
    setConfirmOpen(false);
    setPendingRows([]);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      if (mode === "normal") setForm({ ...EMPTY, type: form.type });
      if (mode === "split") setSplit(prev => ({ ...prev, planGroupId: uid() }));
    }, 900);
  };

  const typeClass = form.type === "수입" ? "income" : form.type === "지출" ? "expense" : "transfer";
  const typeBtnClass = (t) => form.type !== t ? "" : t === "수입" ? "active-income" : t === "지출" ? "active-expense" : "active-transfer";
  const previewRows = confirmOpen ? pendingRows : (mode === "split" ? splitRows : (canSaveNormal ? [{ ...form, amount:n(form.amount), id:"preview" }] : []));

  return (
    <>
      <div className="qa-overlay" onClick={onClose}/>
      <div className="qa-sheet" onClick={e=>e.stopPropagation()}>
        <div className="qa-handle"/>
        <div className="qa-header">
          <span className="qa-title">간편 입력 v2</span>
          <button className="qa-close" onClick={onClose}>✕</button>
        </div>
        <div className="qa-body">
          <div className="qa-mode-row">
            <button className={`qa-mode-btn ${mode === "split" ? "active" : ""}`} onClick={()=>setMode("split")}>🧩 분배입력</button>
            <button className={`qa-mode-btn ${mode === "normal" ? "active" : ""}`} onClick={()=>setMode("normal")}>✍️ 일반거래</button>
            <button className={`qa-mode-btn ${mode === "guide" ? "active" : ""}`} onClick={()=>setMode("guide")}>🛡️ 검증안내</button>
          </div>

          {mode === "guide" && (
            <div className="qa-confirm-box">
              <h4>저장 전 검증 기준</h4>
              <p>금액 0원 초과, 계좌 누락, 입출금 동일 계좌, ISA 연간 한도, 분배 합계 불일치를 저장 전에 막습니다. SMS 자동인식도 바로 저장하지 말고 가져오기 화면의 미리보기에서 확인 후 반영하는 구조로 사용하세요.</p>
              <div className="qa-validation-list">
                <div className="qa-validation-item ok">비상금·ISA·연금·생활비를 각각 별도 거래로 저장</div>
                <div className="qa-validation-item ok">저장 직전 미리보기 확인 후 반영</div>
                <div className="qa-validation-item warn">세금·투자 추천은 참고용이며 실제 판단은 별도 확인 필요</div>
              </div>
            </div>
          )}

          {mode === "split" && (
            <>
              <div className="qa-confirm-box">
                <h4>이번 달 저축/투자 분배</h4>
                <p>예: 총 200만원을 비상금 50만원, ISA 150만원으로 나누면 각각 별도 거래로 저장되고 CFO 점수·비상금·ISA 한도 계산에 따로 반영됩니다.</p>
              </div>
              <div className="qa-form-grid">
                <div className="qa-field"><label className="qa-label">날짜</label><input className="qa-input" type="date" value={split.date} onChange={e=>updateSplit("date", e.target.value)}/></div>
                <div className="qa-field"><label className="qa-label">출금계좌</label><select className="qa-select" value={split.outAccount} onChange={e=>updateSplit("outAccount", e.target.value)}><option value="">선택</option>{outAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
              </div>
              <div className="qa-amount-wrap">
                <input className="qa-amount-input" type="number" inputMode="numeric" value={split.totalAmount} onChange={e=>updateSplit("totalAmount", e.target.value)} placeholder="총 분배금액" />
                <span className="qa-amount-unit">원</span>
              </div>
              <div className="qa-split-summary">
                <div className="qa-split-metric">총 금액<strong>{fmt(split.totalAmount)}원</strong></div>
                <div className="qa-split-metric">배분 합계<strong>{fmt(splitAllocated)}원</strong></div>
                <div className="qa-split-metric">차액<strong className={splitDiff === 0 ? "text-green" : "text-red"}>{fmt(splitDiff)}원</strong></div>
              </div>
              <div className="qa-split-panel">
                <div className="qa-form-grid">
                  <div className="qa-field"><label className="qa-label">비상금</label><input className="qa-input" type="number" value={split.emergencyAmount} onChange={e=>updateSplit("emergencyAmount", e.target.value)}/></div>
                  <div className="qa-field"><label className="qa-label">비상금 계좌</label><select className="qa-select" value={split.emergencyAccount} onChange={e=>updateSplit("emergencyAccount", e.target.value)}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
                  <div className="qa-field"><label className="qa-label">ISA</label><input className="qa-input" type="number" value={split.isaAmount} onChange={e=>updateSplit("isaAmount", e.target.value)}/></div>
                  <div className="qa-field"><label className="qa-label">ISA 계좌</label><select className="qa-select" value={split.isaAccount} onChange={e=>updateSplit("isaAccount", e.target.value)}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
                  <div className="qa-field"><label className="qa-label">연금저축</label><input className="qa-input" type="number" value={split.pensionAmount} onChange={e=>updateSplit("pensionAmount", e.target.value)}/></div>
                  <div className="qa-field"><label className="qa-label">연금저축 계좌</label><select className="qa-select" value={split.pensionAccount} onChange={e=>updateSplit("pensionAccount", e.target.value)}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
                  <div className="qa-field"><label className="qa-label">IRP</label><input className="qa-input" type="number" value={split.irpAmount} onChange={e=>updateSplit("irpAmount", e.target.value)}/></div>
                  <div className="qa-field"><label className="qa-label">IRP 계좌</label><select className="qa-select" value={split.irpAccount} onChange={e=>updateSplit("irpAccount", e.target.value)}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
                  <div className="qa-field"><label className="qa-label">일반투자</label><input className="qa-input" type="number" value={split.taxableInvestAmount} onChange={e=>updateSplit("taxableInvestAmount", e.target.value)}/></div>
                  <div className="qa-field"><label className="qa-label">일반투자 계좌</label><select className="qa-select" value={split.taxableAccount} onChange={e=>updateSplit("taxableAccount", e.target.value)}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
                  <div className="qa-field"><label className="qa-label">생활비</label><input className="qa-input" type="number" value={split.livingAmount} onChange={e=>updateSplit("livingAmount", e.target.value)}/></div>
                  <div className="qa-field"><label className="qa-label">생활비 계좌</label><select className="qa-select" value={split.livingAccount} onChange={e=>updateSplit("livingAccount", e.target.value)}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>
                </div>
              </div>
            </>
          )}

          {mode === "normal" && (
            <>
              {txTemplates.length > 0 && <div className="qa-template-section"><div className="qa-template-title">템플릿</div><div className="qa-template-list">{txTemplates.map(t => <button key={t.id} className="qa-template-chip" onClick={() => applyTemplate(t)}>{t.name}</button>)}</div></div>}
              <div className="qa-type-row">{["지출","수입","자산이동"].map(t => <button key={t} className={`qa-type-btn ${typeBtnClass(t)}`} onClick={() => setForm({...form, type:t, cat1:"", cat2:""})}>{t === "지출" ? "💳 지출" : t === "수입" ? "💰 수입" : "🔄 이동"}</button>)}</div>
              <div className="qa-amount-wrap"><input className="qa-amount-input" type="number" inputMode="numeric" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} autoFocus/><span className="qa-amount-unit">원</span></div>
              <div className="qa-quick-amounts">{(smartSuggestions.amount.length > 0 ? smartSuggestions.amount : QUICK_AMOUNTS).map(v => <button key={v} className="qa-quick-amount" onClick={() => setForm({...form, amount:v})}>{fmt(v)}</button>)}</div>
              <div className="qa-form-grid"><div className="qa-field"><label className="qa-label">날짜</label><input className="qa-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="qa-field"><label className="qa-label">내용</label><input className="qa-input" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="무엇에 썼나요?"/>{smartSuggestions.content.length > 0 && <div className="qa-suggestion-row">{smartSuggestions.content.map(v => <button key={v} className="qa-suggestion-chip" onClick={() => setForm({...form,content:v})}>{v}</button>)}</div>}</div></div>
              <div className="qa-form-grid"><div className="qa-field"><label className="qa-label">대분류</label><select className="qa-select" value={form.cat1} onChange={e=>setForm({...form,cat1:e.target.value,cat2:""})}><option value="">선택</option>{cat1Opts.map(x=><option key={x}>{x}</option>)}</select>{smartSuggestions.cat1.length > 0 && <div className="qa-suggestion-row">{smartSuggestions.cat1.map(v => <button key={v} className="qa-suggestion-chip" onClick={()=>setForm({...form,cat1:v,cat2:""})}>{v}</button>)}</div>}</div><div className="qa-field"><label className="qa-label">소분류</label><select className="qa-select" value={form.cat2} onChange={e=>setForm({...form,cat2:e.target.value})} disabled={!form.cat1}><option value="">선택</option>{cat2Opts.map(x=><option key={x}>{x}</option>)}</select>{smartSuggestions.cat2.length > 0 && <div className="qa-suggestion-row">{smartSuggestions.cat2.map(v => <button key={v} className="qa-suggestion-chip" onClick={()=>setForm({...form,cat2:v})}>{v}</button>)}</div>}</div></div>
              <div className="qa-form-grid">{(form.type === "수입" || form.type === "자산이동") && <div className="qa-field"><label className="qa-label">입금계좌</label><select className="qa-select" value={form.inAccount} onChange={e=>setForm({...form,inAccount:e.target.value})}><option value="">선택</option>{incomeAccounts.map(x=><option key={x}>{x}</option>)}</select></div>}{(form.type === "지출" || form.type === "자산이동") && <div className="qa-field"><label className="qa-label">출금계좌</label><select className="qa-select" value={form.outAccount} onChange={e=>setForm({...form,outAccount:e.target.value})}><option value="">선택</option>{outAccounts.map(x=><option key={x}>{x}</option>)}</select></div>}</div>
            </>
          )}

          {mode !== "guide" && (
            <>
              <div className="qa-validation-list">
                {mode === "split" && splitDiff !== 0 && <div className="qa-validation-item error">총 금액과 배분 합계가 맞지 않습니다. 차액 {fmt(splitDiff)}원</div>}
                {validationIssues.map((v, i) => <div key={i} className={`qa-validation-item ${v.level}`}>{v.text}</div>)}
              </div>
              {previewRows.length > 0 && <div className="qa-preview-list">{previewRows.map((r, i)=><div key={i} className="qa-preview-row"><div><strong>{r.content || r.cat2}</strong><br/><span>{r.date} · {r.type} · {r.cat1}/{r.cat2} · {r.outAccount || "-"} → {r.inAccount || "-"}</span></div><strong>{fmt(r.amount)}원</strong></div>)}</div>}
              <button className={`qa-save-btn ${mode === "normal" ? typeClass : "transfer"}`} onClick={openConfirm} disabled={mode === "split" ? !canSaveSplit : !canSaveNormal}>{mode === "split" ? "🧩 분배 내역 확인 후 저장" : "저장 전 확인"}</button>
            </>
          )}
        </div>
      </div>

      {confirmOpen && (
        <>
          <div className="qa-overlay" onClick={()=>setConfirmOpen(false)} />
          <div className="qa-sheet" onClick={e=>e.stopPropagation()} style={{zIndex:260}}>
            <div className="qa-handle"/>
            <div className="qa-header"><span className="qa-title">저장 전 최종 확인</span><button className="qa-close" onClick={()=>setConfirmOpen(false)}>✕</button></div>
            <div className="qa-body">
              <div className="qa-confirm-box"><h4>아래 {pendingRows.length}건을 거래내역에 반영합니다.</h4><p>저장 후 대시보드, CFO 점수, 비상금, ISA 한도 계산이 함께 갱신됩니다.</p></div>
              <div className="qa-preview-list">{pendingRows.map((r, i)=><div key={i} className="qa-preview-row"><div><strong>{r.content || r.cat2}</strong><br/><span>{r.date} · {r.type} · {r.cat1}/{r.cat2} · {r.outAccount || "-"} → {r.inAccount || "-"}</span></div><strong>{fmt(r.amount)}원</strong></div>)}</div>
              <button className="qa-save-btn transfer" onClick={commitRows}>확인하고 저장</button>
              <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setConfirmOpen(false)}>다시 수정</button>
            </div>
          </div>
        </>
      )}

      {showSuccess && <div className="qa-success-toast">✓ 저장되었어요!</div>}
    </>
  );
}


// ─── 한국 금융기관 통합 SMS 자동기입 엔진 ─────────────────────────────────────
const KOREAN_FINANCIAL_INSTITUTIONS = [
  "KB국민은행","국민은행","국민","KB국민카드","국민카드","신한은행","신한","신한카드","우리은행","우리","우리카드",
  "하나은행","하나","하나카드","NH농협은행","농협은행","농협","농협카드","NH카드","IBK기업은행","기업은행","기업","IBK카드",
  "SC제일은행","씨티은행","부산은행","대구은행","광주은행","전북은행","경남은행","제주은행",
  "수협은행","새마을금고","신협","우체국","케이뱅크","카카오뱅크","토스뱅크",
  "삼성카드","현대카드","롯데카드","BC카드","비씨카드","카카오페이","네이버페이","토스","페이코","쿠팡페이","제로페이"
];
const CARD_INSTITUTION_HINTS = ["카드","페이","토스","PAY","pay","Pay","삼성","현대","롯데","BC","비씨"];
const SMS_CATEGORY_RULE_STORAGE_KEY = "asset-app-sms-category-rules-v1";
const SMS_PATTERN_RULE_STORAGE_KEY = "asset-app-sms-pattern-rules-v1";

function loadUserSmsCategoryRules() {
  try {
    const rows = JSON.parse(localStorage.getItem(SMS_CATEGORY_RULE_STORAGE_KEY) || "[]");
    return Array.isArray(rows) ? rows.filter(r => r && r.pattern && r.cat1) : [];
  } catch {
    return [];
  }
}
function loadUserSmsPatternRules() {
  try {
    const rows = JSON.parse(localStorage.getItem(SMS_PATTERN_RULE_STORAGE_KEY) || "[]");
    return Array.isArray(rows) ? rows.filter(r => r && r.pattern) : [];
  } catch {
    return [];
  }
}
function normalizeSmsLine(line) {
  return String(line || "")
    .replace(/[\u200b\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[￦₩]/g, "원")
    .trim();
}
function detectSmsInstitution(line) {
  const normalized = normalizeSmsLine(line);
  return KOREAN_FINANCIAL_INSTITUTIONS.find(name => normalized.includes(name))
    || (normalized.match(/\[([^\]]{2,14})\]/)?.[1] || "금융알림");
}
function parseSmsDate(line) {
  const now = new Date();
  const y = now.getFullYear();
  const m1 = line.match(/(20\d{2})[.\/\-년\s]+(\d{1,2})[.\/\-월\s]+(\d{1,2})/);
  if (m1) return `${m1[1]}-${String(m1[2]).padStart(2,"0")}-${String(m1[3]).padStart(2,"0")}`;
  const m2 = line.match(/(\d{1,2})[.\/월\-\s]+(\d{1,2})\s*(?:일)?\s*(?:\d{1,2}:\d{2})?/);
  if (m2) return `${y}-${String(m2[1]).padStart(2,"0")}-${String(m2[2]).padStart(2,"0")}`;
  return todayISO();
}
function extractSmsAmount(line) {
  const matches = [...String(line).matchAll(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*(?:원|KRW|₩)/gi)]
    .map(m => Number(String(m[1]).replace(/,/g, "")))
    .filter(v => Number.isFinite(v) && v > 0 && v < 1000000000);
  if (!matches.length) return 0;
  // 대부분 첫 금액이 거래금액, 마지막 금액은 잔액인 경우가 많음
  return matches[0];
}
function detectSmsType(line, institution="") {
  const s = normalizeSmsLine(line);
  if (/(취소|승인취소|결제취소|매출취소|환불|환급|캐시백)/.test(s)) return { type:"수입", cat1:"기타수입", cat2:"환급", direction:"refund" };
  if (/(입금|받으셨|입금완료|급여|월급|이자|배당|환급)/.test(s) && !/(출금|결제|승인|사용|인출|납부)/.test(s)) return { type:"수입", cat1:"기타수입", cat2:/(급여|월급)/.test(s)?"월급":/(이자|배당)/.test(s)?"이자":"기타", direction:"in" };
  if (/(체크카드|카드|승인|결제|사용|매입|일시불|할부|페이|PAY|pay|Pay)/.test(s) || CARD_INSTITUTION_HINTS.some(x => institution.includes(x))) return { type:"지출", cat1:"기타지출", cat2:"기타", direction:"card" };
  if (/(출금|인출|이체|송금|자동이체|납부|CMS|공과금|수수료)/.test(s)) return { type:"지출", cat1:"기타지출", cat2:"기타", direction:"out" };
  return { type:"지출", cat1:"기타지출", cat2:"기타", direction:"unknown" };
}
function extractSmsContent(line, institution="") {
  const original = normalizeSmsLine(line);
  const bracket = original.match(/[\(\[（]([^\)\]）]{2,40})[\)\]）]/)?.[1];
  if (bracket && !/카드|은행|승인|출금|입금|잔액|누적|한도/.test(bracket)) return bracket.trim();

  const slashParts = original.split(/[\/|]/).map(x => x.trim()).filter(Boolean);
  const candidateFromSlash = slashParts.find(p =>
    /[가-힣A-Za-z]/.test(p) &&
    !/[0-9,]+\s*원/.test(p) &&
    !/(잔액|누적|한도|승인|결제|출금|입금|사용|일시불|체크|카드|은행|가능|후불)/.test(p)
  );
  if (candidateFromSlash) return candidateFromSlash.slice(0, 40);

  let cleaned = original
    .replace(new RegExp(KOREAN_FINANCIAL_INSTITUTIONS.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g"), " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/20\d{2}[.\/\-년\s]+\d{1,2}[.\/\-월\s]+\d{1,2}\s*(?:일)?/g, " ")
    .replace(/\d{1,2}[.\/월\-\s]+\d{1,2}\s*(?:일)?\s*(?:\d{1,2}:\d{2})?/g, " ")
    .replace(/[0-9]{1,3}(?:,[0-9]{3})+\s*(?:원|KRW)|[0-9]+\s*(?:원|KRW)/gi, " ")
    .replace(/(승인취소|결제취소|승인|결제|출금|입금|사용|체크카드|일시불|할부|잔액|누적|한도|가능|알림|완료|이체|송금|납부|인출|후불|교통)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 40) || "금융거래";
}
function findMatchedAccount(names=[], institution="", fallbackKeyword="") {
  const cleanInst = String(institution || "").replace(/은행|카드|페이|뱅크|금고/g, "");
  return names.find(a => a.includes(institution))
    || names.find(a => cleanInst && a.includes(cleanInst))
    || names.find(a => fallbackKeyword && a.includes(fallbackKeyword))
    || names[0]
    || "";
}
function applyUserSmsPatternRules(text, accountNamesIn=[], accountNamesOut=[]) {
  const rows = [];
  const rules = loadUserSmsPatternRules();
  for (const rule of rules) {
    try {
      const re = new RegExp(rule.pattern, rule.flags || "g");
      let m;
      while ((m = re.exec(text)) !== null) {
        const amount = Number(String(m[Number(rule.amountGroup || 1)] || "").replace(/,/g,""));
        if (!amount) continue;
        const content = String(m[Number(rule.contentGroup || 2)] || rule.content || "금융거래").trim().slice(0,40);
        const date = rule.dateGroup ? parseSmsDate(String(m[Number(rule.dateGroup)] || todayISO())) : todayISO();
        const type = rule.type || "지출";
        const cat1 = rule.cat1 || guessCategory(content);
        const cat2 = rule.cat2 || guessSubcategory(content, cat1);
        rows.push({
          id: uid(), date, type, cat1, cat2, amount,
          inAccount: type === "수입" ? findMatchedAccount(accountNamesIn, rule.institution || "") : "",
          outAccount: type === "지출" ? findMatchedAccount(accountNamesOut, rule.institution || "", "카드") : "",
          content, memo: `사용자 SMS 패턴: ${rule.name || rule.institution || "직접등록"}`,
        });
      }
    } catch (error) {
      console.warn("사용자 SMS 패턴 오류:", rule, error);
    }
  }
  return rows;
}
function parseSmsText(text, accountNamesInOrOut=[], maybeOut=[]) {
  const accountNamesIn = maybeOut.length ? accountNamesInOrOut : [];
  const accountNamesOut = maybeOut.length ? maybeOut : accountNamesInOrOut;
  const rawText = String(text || "");
  const userPatternRows = applyUserSmsPatternRules(rawText, accountNamesIn, accountNamesOut);
  const lines = rawText
    .split(/\r?\n|(?=\[[^\]]+(?:은행|카드|페이|뱅크|PAY|pay|Pay)\])|(?=(?:KB|NH|IBK|신한|우리|하나|농협|기업|카카오|토스|네이버|페이코|삼성|현대|롯데|BC|비씨))/)
    .map(normalizeSmsLine)
    .filter(line => line && /[0-9,]+\s*(?:원|KRW|₩)/i.test(line));

  const results = [...userPatternRows];
  for (const line of lines) {
    const amount = extractSmsAmount(line);
    if (!amount) continue;
    const institution = detectSmsInstitution(line);
    const date = parseSmsDate(line);
    const detected = detectSmsType(line, institution);
    const content = extractSmsContent(line, institution);
    const cat1 = detected.cat1 === "기타지출" || detected.cat1 === "기타수입" ? guessCategory(content) : detected.cat1;
    const cat2 = detected.cat2 === "기타" ? guessSubcategory(content, cat1) : detected.cat2;
    const isIncome = detected.type === "수입";
    results.push({
      id: uid(),
      date,
      type: detected.type,
      cat1,
      cat2,
      amount,
      inAccount: isIncome ? findMatchedAccount(accountNamesIn, institution) : "",
      outAccount: !isIncome ? findMatchedAccount(accountNamesOut, institution, detected.direction === "card" ? "카드" : "") : "",
      content,
      memo: `SMS 자동인식: ${institution} · ${detected.direction}`,
      smsSource: institution,
      smsRaw: line.slice(0, 160),
    });
  }

  const seen = new Set();
  return results.filter(r => {
    const key = `${r.date}|${r.type}|${r.amount}|${r.content}|${r.smsSource || r.memo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function guessCategory(content) {
  const c = String(content || "").toLowerCase();
  for (const rule of loadUserSmsCategoryRules()) {
    try {
      if (new RegExp(rule.pattern, "i").test(content)) return rule.cat1 || "기타지출";
    } catch {}
  }
  if (/스타벅스|커피|카페|투썸|이디야|메가|할리스|컴포즈|빽다방|폴바셋/.test(c)) return "식비";
  if (/배달의민족|요기요|쿠팡이츠|배민|맥도날드|버거킹|롯데리아|파리바게뜨|뚜레쥬르|피자헛|도미노|치킨|피자|식당|음식|한식|중식|일식/.test(c)) return "식비";
  if (/마트|이마트|홈플러스|롯데마트|코스트코|gs25|cu|세븐|편의점|마켓컬리|쿠팡|SSG|쓱/.test(c)) return "식비";
  if (/주유|gs칼텍스|sk에너지|현대오일|s-oil|주차|하이패스|톨게이트/.test(c)) return "교통";
  if (/지하철|버스|택시|카카오모빌리티|티머니|캐시비|철도|코레일|srt/.test(c)) return "교통";
  if (/kt|skt|lg유플러스|통신|인터넷|관리비|전기|가스|수도/.test(c)) return "주거";
  if (/올리브영|다이소|무신사|지그재그|의류|미용|헤어|세탁/.test(c)) return "생활";
  if (/병원|의원|약국|치과|한의원|의료/.test(c)) return "생활";
  if (/넷플릭스|유튜브|spotify|왓챠|티빙|웨이브|디즈니|구독|영화|공연|운동|헬스/.test(c)) return "취미여행";
  if (/보험|세금|국민연금|건보|건강보험|지방세|국세|카드대금|대출|이자/.test(c)) return "보험세금";
  if (/어린이집|유치원|육아|문구|학원|선물|경조사|부모님/.test(c)) return "가족";
  if (/급여|월급|상여/.test(c)) return "근로소득";
  if (/이자|배당|환급|환불|캐시백/.test(c)) return "금융소득";
  return "기타지출";
}
function guessSubcategory(content, cat1) {
  const c = String(content || "").toLowerCase();
  for (const rule of loadUserSmsCategoryRules()) {
    try {
      if (new RegExp(rule.pattern, "i").test(content)) return rule.cat2 || "기타";
    } catch {}
  }
  if (cat1 === "식비") {
    if (/커피|카페|스타벅스|투썸|이디야|메가|할리스|컴포즈|빽다방/.test(c)) return "커피/간식";
    if (/마트|편의점|이마트|홈플러스|코스트코|gs25|cu|세븐|마켓컬리|쿠팡/.test(c)) return "식재료";
    if (/배달|요기요|쿠팡이츠|배민/.test(c)) return "배달";
    return "외식";
  }
  if (cat1 === "교통") {
    if (/주유|오일|칼텍스|s-oil/.test(c)) return "주유";
    if (/택시/.test(c)) return "택시";
    if (/주차|하이패스|톨/.test(c)) return "주차";
    return "대중교통";
  }
  if (cat1 === "주거") {
    if (/관리비|전기|가스|수도/.test(c)) return "관리비";
    if (/통신|kt|skt|유플러스|인터넷/.test(c)) return "통신비";
    return "기타";
  }
  if (cat1 === "생활") {
    if (/병원|의원|약국|치과|의료/.test(c)) return "의료";
    if (/의류|무신사|지그재그/.test(c)) return "의류";
    if (/미용|헤어/.test(c)) return "미용";
    return "생필품";
  }
  if (cat1 === "보험세금") {
    if (/보험/.test(c)) return "보험료";
    if (/세금|국세|지방세/.test(c)) return "세금";
    if (/국민연금|건보|건강보험/.test(c)) return "국민연금";
    return "기타";
  }
  if (cat1 === "근로소득") return "월급";
  if (cat1 === "금융소득") return /배당/.test(c) ? "배당" : /이자/.test(c) ? "이자" : "환급";
  return "기타";
}

// CSV 파싱 (신한·KB·하나·우리은행 포맷 지원)
function parseCsvText(text, accountNamesIn=[], accountNamesOut=[]) {
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if (lines.length < 2) return [];
  const results = [];
  const today = new Date().toISOString().slice(0,10);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c=>c.trim().replace(/^"|"$/g,""));
    if (cols.length < 3) continue;

    // 신한은행 포맷: 날짜, 내용, 출금, 입금, 잔액
    // KB포맷: 거래일자, 거래내용, 출금액, 입금액, 잔액
    // 공통: 날짜 컬럼, 내용 컬럼, 출금/입금 컬럼 탐지
    let date = "", content = "", outAmt = 0, inAmt = 0;
    
    // 날짜 탐지 (YYYY.MM.DD or YYYY-MM-DD or YYYYMMDD)
    const dateCol = cols.find(c => /^\d{4}[.\/\-]\d{1,2}[.\/\-]\d{1,2}$/.test(c) || /^\d{8}$/.test(c));
    if (dateCol) {
      date = dateCol.replace(/\./g,"-").replace(/\//g,"-");
      if (/^\d{8}$/.test(dateCol)) date = `${dateCol.slice(0,4)}-${dateCol.slice(4,6)}-${dateCol.slice(6,8)}`;
    }
    if (!date || date < "2020-01-01") continue;

    // 내용 탐지 (한글 2자 이상인 컬럼)
    content = cols.find(c => /[가-힣]{2,}/.test(c) && c.length > 1 && !c.includes(".")) || cols[1] || "";
    content = content.slice(0,40);

    // 금액 탐지 (숫자만 있는 컬럼)
    const numCols = cols.map(c=>Number(c.replace(/,/g,""))).filter(v=>Number.isFinite(v)&&v>=0);
    if (numCols.length >= 2) {
      outAmt = numCols.find(v=>v>0&&v<100000000) || 0;
      inAmt = numCols[1] > 0 ? numCols[1] : 0;
    }

    if (!content || (outAmt === 0 && inAmt === 0)) continue;

    if (outAmt > 0) {
      results.push({
        id: Math.random().toString(36).slice(2), date, type:"지출",
        cat1: guessCategory(content), cat2:"기타", amount:outAmt,
        inAccount:"", outAccount: accountNamesOut[0]||"",
        content, memo:"CSV 가져오기",
      });
    }
    if (inAmt > 0) {
      results.push({
        id: Math.random().toString(36).slice(2), date, type:"수입",
        cat1:"근로소득", cat2:"월급", amount:inAmt,
        inAccount: accountNamesIn[0]||"", outAccount:"",
        content, memo:"CSV 가져오기",
      });
    }
  }
  return results.slice(0, 500); // 최대 500건
}

// ─── SMS/CSV 가져오기 패널 ────────────────────────────────────────────────────
function ImportPanel({ data, update, accountNamesIn, accountNamesOut, onClose }) {
  const [mode, setMode] = React.useState("sms"); // "sms" | "csv"
  const [smsText, setSmsText] = React.useState("");
  const [csvText, setCsvText] = React.useState("");
  const [parsed, setParsed] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());
  const [done, setDone] = React.useState(false);
  const showToast = useToast();
  const fileRef = React.useRef();

  const handleParse = () => {
    const text = mode === "sms" ? smsText : csvText;
    if (!text.trim()) { showToast("텍스트를 먼저 붙여넣어 주세요.", "warn"); return; }
    const rows = mode === "sms"
      ? parseSmsText(text, accountNamesIn, accountNamesOut)
      : parseCsvText(text, accountNamesIn, accountNamesOut);
    if (!rows.length) { showToast("인식된 거래가 없습니다. 형식을 확인하세요.", "warn"); return; }
    setParsed(rows);
    setSelected(new Set(rows.map(r=>r.id)));
  };

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const toggleAll = () => {
    if (selected.size === parsed.length) setSelected(new Set());
    else setSelected(new Set(parsed.map(r=>r.id)));
  };

  const handleImport = () => {
    const toAdd = parsed.filter(r => selected.has(r.id));
    if (!toAdd.length) { showToast("가져올 항목을 선택하세요.", "warn"); return; }
    update(d => ({ ...d, transactions: [...d.transactions, ...toAdd] }));
    showToast(`${toAdd.length}건을 가져왔습니다.`, "success");
    setDone(true);
    setTimeout(onClose, 1200);
  };

  const typeColor = (type) => type==="수입"?"var(--green)":type==="지출"?"var(--red)":"var(--accent)";

  return (
    <>
      <div className="qa-overlay" onClick={onClose}/>
      <div className="qa-sheet" onClick={e=>e.stopPropagation()} style={{maxHeight:"88vh"}}>
        <div className="qa-handle"/>
        <div className="qa-header">
          <span className="qa-title">📥 거래 가져오기</span>
          <button className="qa-close" onClick={onClose}>✕</button>
        </div>
        <div className="qa-body">
          {/* 탭 선택 */}
          <div className="qa-type-row" style={{marginBottom:14}}>
            <button className={`qa-type-btn ${mode==="sms"?"active-expense":""}`} onClick={()=>{setMode("sms");setParsed([]);}}>
              💬 문자 붙여넣기
            </button>
            <button className={`qa-type-btn ${mode==="csv"?"active-income":""}`} onClick={()=>{setMode("csv");setParsed([]);}}>
              📄 CSV/엑셀
            </button>
          </div>

          {mode==="sms" && (
            <>
              <div style={{fontSize:12,color:"var(--text3)",marginBottom:8,lineHeight:1.6}}>
                카드사·토스·카카오페이 결제 문자를 한꺼번에 복사해서 붙여넣으세요. 국민·신한·우리·하나·농협·기업 등 주요 은행과 카드사, 토스·카카오·네이버·페이코 알림을 통합 인식합니다.
              </div>
              <textarea
                className="qa-input"
                style={{height:120,resize:"vertical",lineHeight:1.5}}
                placeholder={"[신한카드] 5,900원 결제 (스타벅스)\n[KB국민카드] 32,000원 승인 (올리브영)\n카카오페이 12,000원 결제 (배달의민족)"}
                value={smsText}
                onChange={e=>setSmsText(e.target.value)}
              />
            </>
          )}

          {mode==="csv" && (
            <>
              <div style={{fontSize:12,color:"var(--text3)",marginBottom:8,lineHeight:1.6}}>
                은행/카드사 앱 → 거래내역 → 엑셀/CSV 내보내기 후 파일을 열거나 내용을 붙여넣으세요. 신한·KB·하나·우리은행 형식을 지원합니다.
              </div>
              <button className="btn btn-ghost" style={{marginBottom:8,width:"100%"}} onClick={()=>fileRef.current?.click()}>
                📂 CSV 파일 열기
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleFileLoad}/>
              <textarea
                className="qa-input"
                style={{height:90,resize:"vertical",lineHeight:1.5,fontSize:11}}
                placeholder={"거래일자,거래내용,출금액,입금액,잔액\n2025-04-01,스타벅스,5900,,1234567"}
                value={csvText}
                onChange={e=>setCsvText(e.target.value)}
              />
            </>
          )}

          <button className={`qa-save-btn income`} style={{marginTop:10}} onClick={handleParse}>
            {parsed.length ? `다시 분석 (${parsed.length}건 감지됨)` : "거래 분석하기"}
          </button>

          {parsed.length > 0 && (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"16px 0 8px"}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>감지된 거래 {parsed.length}건</span>
                <button className="btn btn-sm btn-ghost" onClick={toggleAll}>
                  {selected.size===parsed.length?"전체 해제":"전체 선택"}
                </button>
              </div>
              <div style={{maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {parsed.map(r=>(
                  <div key={r.id} onClick={()=>setSelected(prev=>{const s=new Set(prev);s.has(r.id)?s.delete(r.id):s.add(r.id);return s;})}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:selected.has(r.id)?"var(--accent-bg)":"var(--surface2)",border:`1.5px solid ${selected.has(r.id)?"var(--accent)":"transparent"}`,cursor:"pointer",transition:".12s ease"}}>
                    <input type="checkbox" readOnly checked={selected.has(r.id)} style={{accentColor:"var(--accent)",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.content}</div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{r.date} · {r.cat1}</div>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:typeColor(r.type),flexShrink:0}}>{r.type==="수입"?"+":"-"}{r.amount.toLocaleString()}원</div>
                  </div>
                ))}
              </div>
              <button
                className={`qa-save-btn ${done?"transfer":"expense"}`}
                style={{marginTop:12}}
                onClick={handleImport}
                disabled={selected.size===0||done}
              >
                {done ? "✓ 가져오기 완료!" : `선택한 ${selected.size}건 가져오기`}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function TransactionsTab({ data, update, accountNamesIn, accountNamesOut }) {
  const showToast = useToast();

  const EMPTY={id:"",date:todayISO(),type:"지출",cat1:"",cat2:"",amount:"",inAccount:"",outAccount:"",content:"",memo:""};
  const [form,setForm]=useState(EMPTY);
  const [showForm,setShowForm]=useState(true);
  const [showImport,setShowImport]=useState(false);

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

  // ── 페이지네이션
  const TX_PAGE_SIZE = 50;
  const [txPage, setTxPage] = useState(1);
  // 필터 변경 시 1페이지로 리셋
  const prevFilterKey = useRef("");
  const filterKey = `${filterMonth}|${filterType}|${filterCat1}|${search}`;
  if (prevFilterKey.current !== filterKey) { prevFilterKey.current = filterKey; if (txPage !== 1) setTxPage(1); }
  const txTotalPages = Math.max(1, Math.ceil(filtered.length / TX_PAGE_SIZE));
  const pagedFiltered = filtered.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE);

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
    if(!canSave) return showToast('필수값을 먼저 채워주세요.', 'warn');
    const name=templateName.trim()||form.content||`${form.type} 템플릿`;
    update(d=>({...d,settings:{...d.settings,transactionTemplates:[...(Array.isArray(d.settings.transactionTemplates)?d.settings.transactionTemplates:[]),{id:uid(),name,type:form.type,cat1:form.cat1,cat2:form.cat2,amount:n(form.amount),inAccount:form.inAccount,outAccount:form.outAccount,content:form.content,memo:form.memo}]}}));
    setTemplateName("");
  };
  const applyTemplate=(tpl)=>{if(!tpl)return;setForm({...EMPTY,date:todayISO(),type:tpl.type||"지출",cat1:tpl.cat1||"",cat2:tpl.cat2||"",amount:tpl.amount||"",inAccount:tpl.inAccount||"",outAccount:tpl.outAccount||"",content:tpl.content||tpl.name||"",memo:tpl.memo||""});setShowForm(true);};
  const deleteTemplate=(id)=>update(d=>({...d,settings:{...d.settings,transactionTemplates:(Array.isArray(d.settings.transactionTemplates)?d.settings.transactionTemplates:[]).filter(t=>t.id!==id)}}));
  const addFixedRuleFromForm=()=>{
    if(!canSave) return showToast('필수값을 먼저 채워주세요.', 'warn');
    const day=clamp(Number(String(form.date||todayISO()).slice(8,10))||1,1,28);
    const name=templateName.trim()||form.content||`${form.type} 고정거래`;
    update(d=>({...d,settings:{...d.settings,fixedTransactionRules:[...(Array.isArray(d.settings.fixedTransactionRules)?d.settings.fixedTransactionRules:[]),{id:uid(),name,day,type:form.type,cat1:form.cat1,cat2:form.cat2,amount:n(form.amount),inAccount:form.inAccount,outAccount:form.outAccount,content:form.content,memo:form.memo,active:true}]}}));
    setTemplateName("");
  };
  const deleteFixedRule=(id)=>update(d=>({...d,settings:{...d.settings,fixedTransactionRules:(Array.isArray(d.settings.fixedTransactionRules)?d.settings.fixedTransactionRules:[]).filter(r=>r.id!==id)}}));
  const generateFixedTransactions=()=>{
    const month=autoFillMonth||thisMonthISO();
    const active=fixedRules.filter(r=>r.active!==false);
    if(!active.length) return showToast('등록된 고정거래가 없습니다.', 'warn');
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
    showToast(`${month} 고정거래 생성 완료추가: ${added}건 / 중복 제외: ${skipped}건`);
  };

  const save=()=>{
    if(!canSave) return showToast(validationMessages.filter(x=>x.level === 'danger').map(x=>x.title).join(' · '), 'warn');
    if(duplicateCandidates.length>0) {
      // 중복 감지 - 경고 토스트로 알림, 사용자가 다시 저장 버튼 누르면 통과
      if(!form.__duplicateConfirmed) {
        showToast("중복 거래가 감지되었습니다. 다시 저장하면 반영됩니다.", "warn");
        setForm(f=>({...f, __duplicateConfirmed:true}));
        return;
      }
    }
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
      {showImport&&<ImportPanel data={data} update={update} accountNamesIn={accountNamesIn} accountNamesOut={accountNamesOut} onClose={()=>setShowImport(false)}/>}
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
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-sm btn-ghost" onClick={()=>setShowImport(true)}>📥 문자/CSV 가져오기</button>
            <label style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer"}} title="영수증 사진으로 자동 입력">
              📷 영수증 OCR
              <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async(e)=>{
                const file=e.target.files?.[0]; if(!file)return;
                const reader=new FileReader();
                reader.onload=async(ev)=>{
                  const base64=ev.target.result.split(",")[1];
                  try{
                    showToast("영수증 분석 중...","info");
                    const res=await fetch("https://api.anthropic.com/v1/messages",{
                      method:"POST",
                      headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({
                        model:"claude-sonnet-4-20250514",
                        max_tokens:400,
                        messages:[{role:"user",content:[
                          {type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:base64}},
                          {type:"text",text:`이 영수증 이미지에서 아래 정보를 추출해 JSON으로만 응답하세요(다른 텍스트 없이):
{"date":"YYYY-MM-DD","amount":숫자,"content":"가게명또는내용","cat1":"식비|교통|생활|취미여행|기타지출 중 하나","memo":""}
날짜가 없으면 오늘(${todayISO()})으로, 금액은 최종 결제금액으로.`}
                        ]}]
                      })
                    });
                    const j=await res.json();
                    const txt=j?.content?.[0]?.text||"";
                    const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
                    if(parsed.amount>0){
                      setForm(f=>({...f,
                        date:parsed.date||todayISO(),
                        amount:String(parsed.amount),
                        content:parsed.content||f.content,
                        cat1:parsed.cat1||"기타지출",
                        memo:parsed.memo||"",
                        type:"지출",
                      }));
                      setShowForm(true);
                      showToast(`영수증 파싱 완료: ${parsed.content} ${fmt(parsed.amount)}원`,"success");
                    } else {
                      showToast("금액을 인식하지 못했습니다. 직접 입력해주세요.","warn");
                    }
                  }catch(err){
                    showToast("영수증 분석 실패: "+err.message,"error");
                  }
                };
                reader.readAsDataURL(file);
                e.target.value="";
              }}/>
            </label>
            <button onClick={()=>setShowForm(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:12,padding:"2px 6px"}}>{showForm?"▲ 접기":"▼ 펼치기"}</button>
          </div>
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
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {activeFilterCount>0&&(
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:99,background:"var(--accent-bg)",color:"var(--accent)",fontSize:11,fontWeight:600}}>필터 {activeFilterCount}개 적용</span>
                <button onClick={resetFilters} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,border:"none",cursor:"pointer",background:"var(--surface3)",color:"var(--text2)",fontSize:11,fontWeight:600}}>✕ 초기화</button>
              </div>
            )}
            <button onClick={()=>{
              const header="날짜,구분,대분류,소분류,금액,입금계좌,출금계좌,내용,메모";
              const rows=filtered.map(t=>[t.date,t.type,t.cat1,t.cat2,n(t.amount),t.inAccount||"",t.outAccount||"",String(t.content||"").replace(/,/g,"，"),String(t.memo||"").replace(/,/g,"，")].join(","));
              const csv="\uFEFF"+[header,...rows].join("\n");
              const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");
              a.href=url;a.download=`season_transactions_${filterMonth||"all"}_${filtered.length}건.csv`;
              document.body.appendChild(a);a.click();
              setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},500);
            }} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
              ⬇ CSV 내보내기
            </button>
          </div>
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
              {pagedFiltered.map(t=>(
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
        {filtered.length>0&&(
          <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <span style={{fontSize:11,color:"var(--text3)"}}>{filterMonth||"전체 기간"} · 총 {filtered.length}건 ({txPage}/{txTotalPages} 페이지)</span>
            {txTotalPages>1&&(
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <button onClick={()=>setTxPage(1)} disabled={txPage===1} style={{padding:"3px 8px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:11,cursor:txPage===1?"not-allowed":"pointer",opacity:txPage===1?0.4:1}}>«</button>
                <button onClick={()=>setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1} style={{padding:"3px 8px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:11,cursor:txPage===1?"not-allowed":"pointer",opacity:txPage===1?0.4:1}}>‹</button>
                {Array.from({length:txTotalPages},(_,i)=>i+1).filter(p=>p===1||p===txTotalPages||Math.abs(p-txPage)<=1).reduce((acc,p,idx,arr)=>{if(idx>0&&p-arr[idx-1]>1)acc.push("…");acc.push(p);return acc;},[]).map((p,i)=>
                  p==="…"
                    ?<span key={`ellipsis-${i}`} style={{fontSize:11,color:"var(--text3)",padding:"0 2px"}}>…</span>
                    :<button key={p} onClick={()=>setTxPage(p)} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${p===txPage?"var(--accent)":"var(--border)"}`,background:p===txPage?"var(--accent-bg)":"var(--surface2)",color:p===txPage?"var(--accent)":"var(--text2)",fontSize:11,fontWeight:p===txPage?700:400,cursor:"pointer"}}>{p}</button>
                )}
                <button onClick={()=>setTxPage(p=>Math.min(txTotalPages,p+1))} disabled={txPage===txTotalPages} style={{padding:"3px 8px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:11,cursor:txPage===txTotalPages?"not-allowed":"pointer",opacity:txPage===txTotalPages?0.4:1}}>›</button>
                <button onClick={()=>setTxPage(txTotalPages)} disabled={txPage===txTotalPages} style={{padding:"3px 8px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",fontSize:11,cursor:txPage===txTotalPages?"not-allowed":"pointer",opacity:txPage===txTotalPages?0.4:1}}>»</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Assets Tab ───────────────────────────────────────────────────────────────
function AssetsTab({ data, update }) {
  const showToast = useToast();

  const empty={id:"",kind:"자산",category:"은행예금",name:"",current:"",previous:"",includeInEmergency:false,note:""};
  const [form,setForm]=useState(empty);
  const save=()=>{
    if(!form.name) return showToast('이름을 입력하세요.', 'warn');
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


// ─── 목표비중 부족분 계산기 ─────────────────────────────────────────────
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
        <div className="empty">현재 조건에서는 목표비중 대비 부족분 계산 결과가 없습니다.</div>
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
      <div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5}}>⚠️ <strong>참고용 계산값입니다.</strong> 이 앱은 투자자문업 미등록 계산기이며, 실제 증권사 주문은 실행하지 않습니다. 조건 충족 시 "매수·배분 후보"를 계산해 보여주는 참고 정보이며, 실제 매수·이체는 증권사 앱에서 직접 진행하세요.</div>
    </div>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────
function normalizeStockQuery(v){ return String(v||"").toLowerCase().replace(/\s+/g,"").replace(/[()\-_.]/g,""); }
function buildServerSymbolFromRow(row){ if(row.symbol) return row.symbol; if((row.market==="KRX"||row.market==="KRX ETF")&&/^\d{6}$/.test(String(row.code||row.ticker||""))) return `${String(row.code||row.ticker).padStart(6,"0")}.KS`; return String(row.ticker||row.code||"").trim().toUpperCase(); }
function normalizeCurrency(v){ return String(v||"KRW").trim().toUpperCase(); }
function getFxUsdKrw(settings){ return n(settings?.fxUsdKrw||0)>0?n(settings.fxUsdKrw):0; }
function getFxRate(currency, settings){
  const c=normalizeCurrency(currency);
  if(c==="KRW")return 1;
  if(c==="USD")return n(settings?.fxUsdKrw)||0;
  if(c==="JPY")return n(settings?.fxJpyKrw)||0;
  if(c==="EUR")return n(settings?.fxEurKrw)||0;
  if(c==="CNY")return n(settings?.fxCnyKrw)||0;
  return 0;
}
function priceToKRW(row, settings){ const price=n(row.currentPrice||row.avgPrice); const rate=getFxRate(row.currency,settings); return normalizeCurrency(row.currency)==="KRW"?price:(rate>0?price*rate:0); }
function investedToKRW(row, settings){ const price=n(row.avgPrice); const fx=getFxUsdKrw(settings); return normalizeCurrency(row.currency)==="USD" ? (fx>0?price*fx:0) : price; }
function loadMarketCache(){ try{ return JSON.parse(localStorage.getItem(MARKET_CACHE_KEY)||'{"quotes":{},"fx":null}'); }catch{ return {quotes:{},fx:null}; } }
function saveMarketCache(cache){ try{ localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify({quotes:{},fx:null,...cache,updatedAt:new Date().toISOString()})); }catch(error){ console.warn("시세 캐시 저장 실패:", error); } }
function isFreshMarketAsOf(asOf, maxDays=MAX_MARKET_CACHE_AGE_DAYS){ const t=new Date(asOf||0).getTime(); return Number.isFinite(t)&&t>0&&Date.now()-t<=maxDays*24*60*60*1000; }
function cacheQuoteKey(row){ return buildServerSymbolFromRow(row) || String(row.name||row.id||"").trim(); }
function getCachedQuote(row){ const cache=loadMarketCache(); const key=cacheQuoteKey(row); const hit=key&&cache.quotes?cache.quotes[key]:null; return hit&&n(hit.currentPrice)>0?hit:null; }
function rememberQuote(row, quote){ if(!quote||n(quote.currentPrice)<=0)return; const cache=loadMarketCache(); const key=cacheQuoteKey({...row,...quote}); if(!key)return; cache.quotes={...(cache.quotes||{}),[key]:{...quote,cachedAt:new Date().toISOString()}}; saveMarketCache(cache); }
async function fetchJsonWithTimeout(url, options={}, timeoutMs=7000){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(), timeoutMs);
  try{ const r=await fetch(url,{...options,signal:controller.signal}); const text=await r.text(); let json={}; try{ json=text?JSON.parse(text):{}; }catch{ json={raw:text}; } if(!r.ok) throw new Error(`HTTP ${r.status}`); return json; }
  finally{ clearTimeout(timer); }
}
async function fetchFxUsdKrw(settings={}){
  // 1차: 내부 API
  const internalEndpoints=["/api/fx?base=USD&quote=KRW","/api/exchange-rate?base=USD&quote=KRW"];
  for(const url of internalEndpoints){
    try{ const j=await fetchJsonWithTimeout(url,{},5000); const rate=n(j.rate||j.usdKrw||j.USDKRW||j.item?.rate); if(rate>900&&rate<2000){ const fx={rate,asOf:j.asOf||j.date||j.item?.asOf||new Date().toISOString(),source:url,stale:false}; const cache=loadMarketCache(); saveMarketCache({...cache,fx}); return fx; } }
    catch(error){ console.warn("환율 내부API 실패:", url, error?.message||error); }
  }
  // 2차: Yahoo Finance (USDKRW=X) - 공개 API
  try{
    const yahooUrl="https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d";
    const r=await fetchJsonWithTimeout(yahooUrl,{},7000);
    const rate=n(r?.chart?.result?.[0]?.meta?.regularMarketPrice);
    if(rate>900&&rate<2000){
      const fx={rate,asOf:new Date().toISOString(),source:"yahoo-finance",stale:false};
      const cache=loadMarketCache(); saveMarketCache({...cache,fx}); return fx;
    }
  }catch(e){ console.warn("환율 Yahoo 실패:", e?.message); }
  // 3차: ExchangeRate-API (무료 공개)
  try{
    const r=await fetchJsonWithTimeout("https://open.er-api.com/v6/latest/USD",{},6000);
    const rate=n(r?.rates?.KRW);
    if(rate>900&&rate<2000){
      const fx={rate,asOf:new Date().toISOString(),source:"exchangerate-api",stale:false};
      const cache=loadMarketCache(); saveMarketCache({...cache,fx}); return fx;
    }
  }catch(e){ console.warn("환율 ExchangeRate-API 실패:", e?.message); }
  // 4차: 캐시 및 수동 설정값 fallback
  const cache=loadMarketCache();
  if(cache.fx&&n(cache.fx.rate)>0) return {...cache.fx,stale:true,source:(cache.fx.source||"cache")+"-stale"};
  if(n(settings.fxUsdKrw)>0) return {rate:n(settings.fxUsdKrw),asOf:settings.fxAsOf||"수동/기존값",source:"settings",stale:true};
  throw new Error("환율 조회 실패 (내부API·Yahoo·ExchangeRate-API 모두 실패)");
}
async function fetchQuoteWithFallback(row, previousRow=null){
  const symbol=buildServerSymbolFromRow(row);
  const isKrx=/^\d{6}\.KS$/.test(symbol)||/^\d{6}$/.test(String(row.code||row.ticker||""));
  const code6=String(row.code||row.ticker||"").replace(".KS","").trim();
  // 1차: 내부 API
  try{
    const j=await fetchJsonWithTimeout(`/api/quote?symbol=${encodeURIComponent(symbol)}&name=${encodeURIComponent(row.name||"")}`,{},5000);
    if(j.ok&&j.item&&n(j.item.currentPrice)>0){
      const quote={currentPrice:n(j.item.currentPrice),quoteAsOf:j.item.asOf||new Date().toISOString(),symbol:j.item.symbol||row.symbol,market:j.item.market||row.market,currency:j.item.currency||row.currency,stale:false,source:"internal"};
      rememberQuote(row,quote); return quote;
    }
  }catch(e){ console.warn("시세 내부API 실패:", symbol, e?.message); }
  // 2차: KRX ETF/주식 - 네이버증권 (jina.ai 프록시)
  if(isKrx && code6){
    try{
      const jinaUrl=`https://r.jina.ai/https://finance.naver.com/item/main.naver?code=${code6}`;
      const r=await fetchJsonWithTimeout(jinaUrl,{},8000);
      // jina는 text 반환이므로 raw 파싱
      const text=typeof r==="string"?r:(r.raw||r.text||JSON.stringify(r));
      const m=text.match(/현재가[^\d]*([\d,]+)/)||text.match(/"regularMarketPrice"\s*:\s*([\d.]+)/);
      if(m){
        const price=Number((m[1]||"").replace(/,/g,""));
        if(price>0){
          const quote={currentPrice:price,quoteAsOf:new Date().toISOString(),symbol:code6+".KS",market:"KRX",currency:"KRW",stale:false,source:"naver-jina"};
          rememberQuote(row,quote); return quote;
        }
      }
    }catch(e){ console.warn("시세 네이버/jina 실패:", code6, e?.message); }
  }
  // 3차: Yahoo Finance (KRX는 .KS, 미국주식은 직접)
  try{
    const yahooSymbol=isKrx?(code6+".KS"):symbol;
    const yahooUrl=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
    const r=await fetchJsonWithTimeout(yahooUrl,{},7000);
    const meta=r?.chart?.result?.[0]?.meta;
    if(meta&&n(meta.regularMarketPrice)>0){
      const quote={currentPrice:n(meta.regularMarketPrice),quoteAsOf:new Date(n(meta.regularMarketTime)*1000).toISOString(),symbol:yahooSymbol,market:meta.fullExchangeName||row.market,currency:meta.currency||row.currency||"KRW",stale:false,source:"yahoo"};
      rememberQuote(row,quote); return quote;
    }
  }catch(e){ console.warn("시세 Yahoo 실패:", symbol, e?.message); }
  // 4차: 캐시 및 이전값 fallback
  const cached=getCachedQuote(row);
  if(cached) return {currentPrice:n(cached.currentPrice),quoteAsOf:cached.quoteAsOf||cached.cachedAt,symbol:cached.symbol||row.symbol,market:cached.market||row.market,currency:cached.currency||row.currency,stale:true,source:"cache"};
  if(previousRow&&n(previousRow.currentPrice)>0) return {currentPrice:n(previousRow.currentPrice),quoteAsOf:previousRow.quoteAsOf||"기존값",symbol:previousRow.symbol||row.symbol,market:previousRow.market||row.market,currency:previousRow.currency||row.currency,stale:true,source:"previous"};
  throw new Error("시세 조회 실패 (내부API·네이버·Yahoo 모두 실패)");
}

function PortfolioTab({ data, update, accountOptions, financialAnalysis }) {
  const showToast = useToast();

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
      const q=await fetchQuoteWithFallback(next, null);
      setForm(f=>({...f,currentPrice:q.currentPrice?String(q.currentPrice):f.currentPrice,quoteAsOf:q.quoteAsOf||f.quoteAsOf,symbol:q.symbol||f.symbol,market:q.market||f.market,currency:q.currency||f.currency}));
      setQErr(q.stale?"현재가 API 실패로 캐시/기존 가격을 사용했습니다.":"");
    }catch{setQErr("현재가 자동 조회 실패. 기존 가격도 없어 직접 입력이 필요합니다.");}
    finally{setFetching(false);}
  };

  const save=()=>{
    if(!form.account||!form.name) return showToast('계좌와 종목명을 입력하세요.', 'warn');
    update(d=>{
      const row={...form,qty:n(form.qty),avgPrice:n(form.avgPrice),currentPrice:n(form.currentPrice||form.avgPrice),targetAmount:n(form.targetAmount),riskSigma:n(form.riskSigma),symbol:form.symbol||buildServerSymbolFromRow(form),id:form.id||uid()};
      const portfolio=form.id?d.portfolio.map(p=>p.id===form.id?row:p):[...d.portfolio,row];
      return {...d,portfolio};
    });
    setQErr("");setKw("");setForm(ef());
  };

  const bulkUpdate=async()=>{
    setBulkUp(true); setQErr("");
    try{
      const items=data.portfolio.map(p=>({id:p.id,symbol:buildServerSymbolFromRow(p),name:p.name,code:p.code,ticker:p.ticker}));
      let results=[];
      try{ const j=await fetchJsonWithTimeout("/api/bulk-quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items})},9000); if(!j.ok) throw new Error("bulk invalid"); results=Array.isArray(j.results)?j.results:[]; }
      catch(error){ console.warn("전체 현재가 API 실패, 개별 fallback 실행:", error?.message||error); results=await Promise.all(data.portfolio.map(async p=>{ try{ const q=await fetchQuoteWithFallback(p,p); return {id:p.id,ok:true,currentPrice:q.currentPrice,asOf:q.quoteAsOf,symbol:q.symbol,currency:q.currency,stale:q.stale}; }catch{ return {id:p.id,ok:false}; } })); }
      let okCount=0, staleCount=0, failCount=0;
      update(d=>({...d,settings:{...d.settings,marketDataLastUpdated:new Date().toISOString()},portfolio:d.portfolio.map(p=>{
        const hit=(results||[]).find(x=>x.id===p.id);
        if(!hit||!hit.ok||n(hit.currentPrice)<=0){ failCount++; return p; }
        okCount++; if(hit.stale) staleCount++;
        const next={...p,currentPrice:n(hit.currentPrice||p.currentPrice),quoteAsOf:hit.asOf||hit.quoteAsOf||p.quoteAsOf,symbol:hit.symbol||p.symbol,currency:hit.currency||p.currency};
        rememberQuote(next,{currentPrice:next.currentPrice,quoteAsOf:next.quoteAsOf,symbol:next.symbol,market:next.market,currency:next.currency});
        return next;
      })}));
      const srcMap={};
      results.filter(r=>r.ok).forEach(r=>{ const s=r.source||"unknown"; srcMap[s]=(srcMap[s]||0)+1; });
      const srcText=Object.entries(srcMap).map(([s,c])=>`${{"internal":"서버","yahoo":"Yahoo","naver-jina":"네이버","cache":"캐시"}[s]||s} ${c}개`).join(" · ");
      setMarketMsg(`현재가 갱신: 성공 ${okCount}개${staleCount?` (캐시 ${staleCount}개)`:""}${failCount?`, 실패 ${failCount}개`:""} | 소스: ${srcText||"-"}`);
      if(failCount>0) setQErr("일부 종목은 API 실패로 기존 가격을 유지했습니다.");
    }catch(error){setQErr(`전체 업데이트 실패: ${error?.message||"알 수 없는 오류"}. 기존 가격은 유지됩니다.`);}
    finally{setBulkUp(false);}
  };

  const updateFx=async()=>{
    setFxBusy(true); setMarketMsg(""); setQErr("");
    try{
      const fx=await fetchFxUsdKrw(data.settings||{});
      // 다중 통화 병렬 조회
      const [jpyRes,eurRes,cnyRes]=await Promise.allSettled([
        fetch("/api/fx?base=JPY&quote=KRW").then(r=>r.json()),
        fetch("/api/fx?base=EUR&quote=KRW").then(r=>r.json()),
        fetch("/api/fx?base=CNY&quote=KRW").then(r=>r.json()),
      ]);
      const fxJpy=jpyRes.status==="fulfilled"&&jpyRes.value?.ok?jpyRes.value.rate:0;
      const fxEur=eurRes.status==="fulfilled"&&eurRes.value?.ok?eurRes.value.rate:0;
      const fxCny=cnyRes.status==="fulfilled"&&cnyRes.value?.ok?cnyRes.value.rate:0;
      update(d=>({...d,settings:{...d.settings,
        fxUsdKrw:fx.rate,fxAsOf:fx.asOf,
        ...(fxJpy>0?{fxJpyKrw:fxJpy}:{}),
        ...(fxEur>0?{fxEurKrw:fxEur}:{}),
        ...(fxCny>0?{fxCnyKrw:fxCny}:{}),
        marketDataLastUpdated:new Date().toISOString(),
      }}));
      const extras=[fxJpy>0?`JPY ${fxJpy.toFixed(2)}`:null,fxEur>0?`EUR ${fmt(fxEur)}`:null,fxCny>0?`CNY ${fxCny.toFixed(1)}`:null].filter(Boolean).join(" / ");
      setMarketMsg(`${fx.stale?"환율 API 실패 · 기존/캐시 환율 유지":"환율 갱신 완료"}: 1 USD = ${fmt(fx.rate)} KRW${extras?" | "+extras:""}`);
      if(fx.stale) setQErr("환율 API가 실패하여 마지막 정상 환율을 사용했습니다. 환율 기준시각을 확인하세요.");
    }catch{
      setQErr("환율 자동 조회 실패. 기존 환율도 없어 USD 자산 평가는 차단됩니다. 설정에서 USD/KRW 환율을 직접 입력하세요.");
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
      <DisclaimerBanner context="portfolio"/>
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
  const showToast = useToast();

  const empty={id:"",cat1:"식비",budget:"",targetWeight:""};
  const [form,setForm]=useState(empty);
  const saveBudget=()=>{
    if(!form.cat1||n(form.budget)<=0) return showToast('카테고리와 예산을 입력하세요.', 'warn');
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
      reason:pensionGap>0 ? `추가 납입 기준 세액공제 참고값 ${fmt(pensionExtraCredit)}원` : "현재 설정 기준 세액공제 한도를 모두 채웠습니다.",
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
  if (isaGap > 0) actions.push(`12월 전 ISA 잔여 한도 ${fmt(isaGap)}원을 월별 납입 계획을 직접 판단하세요.`);
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



function extractTaxPolicySignals(settings) {
  const summary = String(settings?.taxUpdateSummary || "").replace(/\s+/g," ").trim();
  const signals = [];
  const push = (topic, text, tone="info") => signals.push({ topic, text, tone });
  if (!summary) {
    push("업데이트", "아직 최신 정보 확인 전입니다. 접속 시 자동 확인 또는 수동 확인 버튼을 눌러 상태를 갱신하세요.", "amber");
    return signals;
  }
  const has = (words) => words.some(w => summary.includes(w));
  if (has(["ISA", "개인종합자산관리계좌"])) push("ISA", "ISA 관련 안내 신호가 감지되었습니다. 한도·만기·연금이전 전략에 영향이 있는지 확인하세요.", "green");
  if (has(["종합소득세", "소득세", "신고"])) push("종합소득세", "종합소득세·신고 관련 안내 신호가 감지되었습니다. 5월 신고 전 금융소득·기타소득 자료를 정리하세요.", "amber");
  if (has(["연금", "IRP", "연말정산", "세액공제"])) push("연금/IRP", "연금·IRP·세액공제 관련 안내 신호가 감지되었습니다. 잔여 공제한도와 납입 타이밍을 점검하세요.", "accent");
  if (has(["재산세", "지방세", "위택스"])) push("재산세", "지방세·재산세 관련 안내 신호가 감지되었습니다. 7월·9월 납부 현금흐름을 별도로 확보하세요.", "info");
  if (!signals.length && settings?.taxUpdateStatus === "checked") {
    push("변경 신호", "공식 사이트 연결은 확인되었고, 앱 기준 세금 일정에 즉시 반영할 큰 변경 신호는 없습니다.", "green");
  }
  if (settings?.taxUpdateStatus === "failed") {
    push("확인 실패", "자동 조회가 실패했습니다. 신고·납부 전에는 국세청·홈택스·위택스에서 직접 확인이 필요합니다.", "red");
  }
  return signals.slice(0, 4);
}

function buildTaxCfoCoach({ calendar, opt, settings, taxAnalysis, futureSim }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const monthsLeft = Math.max(1, 12 - currentMonth + 1);
  const isaGap = n(calendar?.isaGap || 0);
  const pensionGap = n(calendar?.pensionGap || 0);
  const taxableTax = n(opt?.taxableTaxNow || calendar?.taxableTax || 0);
  const totalBenefit = n(opt?.totalImmediateBenefit || 0);
  const nextEvent = calendar?.next;
  const policySignals = extractTaxPolicySignals(settings);
  const monthlyIsa = isaGap > 0 ? Math.ceil(isaGap / monthsLeft) : 0;
  const monthlyPension = pensionGap > 0 ? Math.ceil(pensionGap / monthsLeft) : 0;
  let score = 82;
  if (isaGap > 0) score -= 7;
  if (pensionGap > 0) score -= 9;
  if (taxableTax > 0) score -= 8;
  if (settings?.taxUpdateStatus === "failed") score -= 8;
  if (settings?.taxUpdateStatus === "checked") score += 4;
  score = clamp(score, 35, 98);
  const grade = score >= 88 ? "매우 양호" : score >= 75 ? "양호" : score >= 60 ? "주의" : "점검 필요";
  const tone = score >= 88 ? "green" : score >= 75 ? "accent" : score >= 60 ? "amber" : "red";
  const headline = score >= 88
    ? "세금 루틴은 안정적입니다. 이제 납입 타이밍만 정교하게 관리하면 됩니다."
    : score >= 75
      ? "큰 위험은 낮지만, ISA·연금 잔여 한도와 신고월 현금흐름을 함께 관리해야 합니다."
      : "절세 여력과 신고 리스크가 남아 있습니다. 이번 달부터 자동 납입·자료 정리 루틴을 잡는 것이 좋습니다.";
  const impact = [
    { label:"예상 절세 여력", value:totalBenefit, text: totalBenefit > 0 ? `현재 입력값 기준 즉시 확인 가능한 절세 여력은 약 ${fmt(totalBenefit)}원입니다.` : "현재 입력값 기준 즉시 큰 절세 여력은 제한적입니다.", tone: totalBenefit > 0 ? "green" : "info" },
    { label:"ISA 잔여 한도", value:isaGap, text: isaGap > 0 ? `연말까지 월 약 ${fmt(monthlyIsa)}원씩 납입하면 잔여 한도를 맞출 수 있습니다.` : "올해 ISA 납입 한도는 사용 완료 또는 추가 납입 여력이 낮습니다.", tone: isaGap > 0 ? "green" : "info" },
    { label:"연금/IRP 잔여 한도", value:pensionGap, text: pensionGap > 0 ? `세액공제 한도까지 월 약 ${fmt(monthlyPension)}원씩 나누어 납입하는 전략이 안정적입니다.` : "연금/IRP 세액공제 한도 사용이 충분한 편입니다.", tone: pensionGap > 0 ? "accent" : "green" },
    { label:"과세 노출", value:taxableTax, text: taxableTax > 0 ? `일반계좌 평가이익 기준 추정 과세 노출은 약 ${fmt(taxableTax)}원입니다.` : "일반계좌 기준 큰 과세 노출은 아직 제한적입니다.", tone: taxableTax > 0 ? "amber" : "green" },
  ];
  const actionPlan = [];
  if (nextEvent) actionPlan.push({ step:"1", title:"가장 가까운 세금 일정 먼저 처리", text:`${nextEvent.date} · ${nextEvent.title}을 기준으로 필요한 증빙과 현금을 미리 준비하세요.`, tone:"amber" });
  if (pensionGap > 0) actionPlan.push({ step:"2", title:"연금/IRP 세액공제 납입 루틴", text:`잔여 한도 ${fmt(pensionGap)}원을 ${monthsLeft}개월로 나누면 월 약 ${fmt(monthlyPension)}원입니다. 11~12월 몰입보다 현금흐름이 안정적입니다.`, tone:"accent" });
  if (isaGap > 0) actionPlan.push({ step:"3", title:"ISA 잔여 한도 배분", text:`ISA 납입 잔여 한도 ${fmt(isaGap)}원, 월 참고값 ${fmt(monthlyIsa)}원입니다.`, tone:"green" });
  if (taxableTax > 0) actionPlan.push({ step:"4", title:"일반계좌 과세 노출 관리", text:"배당·매매손익 자료를 월별로 저장하고, 신규 투자금은 ISA·연금계좌와 비교 후 투입하세요.", tone:"amber" });
  if (!actionPlan.length) actionPlan.push({ step:"1", title:"유지 관리", text:"이번 달은 큰 세금 리스크가 낮습니다. 월말에 납입한도와 증빙자료만 10분 점검하세요.", tone:"green" });
  const cashTiming = [
    { title:"급여일 직후", text: isaGap > 0 ? `ISA ${fmt(monthlyIsa)}원 우선 배정` : "ISA 추가 납입보다 리밸런싱 점검", tone:"green" },
    { title:"월말", text: pensionGap > 0 ? `연금/IRP ${fmt(monthlyPension)}원 납입 가능 여부 확인` : "연금/IRP 한도 완료 상태 확인", tone:"accent" },
    { title:"신고·납부월", text: "카드값·투자금과 세금 납부 현금을 분리", tone:"amber" },
  ];
  return { score, grade, tone, headline, impact, policySignals, actionPlan:actionPlan.slice(0,4), cashTiming, monthlyIsa, monthlyPension, monthsLeft };
}

function TaxCfoCoach({ coach, settings }) {
  const badge = (t) => t === "red" ? "badge-red" : t === "amber" ? "badge-amber" : t === "green" ? "badge-green" : t === "accent" ? "badge-accent" : "badge-muted";
  const cls = (t) => t === "red" ? "danger" : t === "amber" ? "warn" : t === "green" ? "green" : "info";
  return (
    <div className="card tax-cfo-coach">
      <div className="cfo-hero" style={{marginBottom:14}}>
        <div>
          <span className={`badge ${badge(coach.tone)}`}>세금 재무 현황 요약 · 재무현황 요약</span>
          <h2>세금 관리 점수 {coach.score}점</h2>
          <p>{coach.headline}</p>
          <div className="ai-chip-row">
            <span className="ai-chip">등급: {coach.grade}</span>
            <span className="ai-chip">남은 납입 관리 기간: {coach.monthsLeft}개월</span>
            <span className="ai-chip">마지막 확인: {formatTaxUpdateDateTime(settings?.taxUpdateLastChecked)}</span>
          </div>
        </div>
        <div className="cfo-score">{coach.score}<span>/100</span></div>
      </div>

      <div className="g4" style={{marginBottom:14}}>
        {coach.impact.map((x) => (
          <div className={`compact-insight ${cls(x.tone)}`} key={x.label}>
            <span>{x.tone === "green" ? "✅" : x.tone === "amber" ? "⚠️" : x.tone === "accent" ? "💡" : "🧾"}</span>
            <div><strong>{x.label}</strong><p>{x.text}</p></div>
          </div>
        ))}
      </div>

      <div className="g2">
        <div className="card-sm">
          <div className="card-title"><h3>변경 신호 요약</h3><span className="badge badge-muted">자동 참고</span></div>
          <div className="stack">
            {coach.policySignals.map((s, idx) => (
              <div className={`compact-insight ${cls(s.tone)}`} key={`${s.topic}-${idx}`}>
                <span>{s.tone === "red" ? "❗" : s.tone === "amber" ? "⚠️" : s.tone === "green" ? "✅" : "🔎"}</span>
                <div><strong>{s.topic}</strong><p>{s.text}</p></div>
              </div>
            ))}
          </div>
          <div className="alert alert-warn" style={{marginTop:12}}>자동 요약은 공식 사이트 연결과 키워드 신호를 바탕으로 만든 참고용입니다. 실제 신고·납부 전에는 원문 공지 확인이 필요합니다.</div>
        </div>
        <div className="card-sm">
          <div className="card-title"><h3>이번 달 실행 순서</h3><span className="badge badge-accent">자동 코칭</span></div>
          <div className="stack">
            {coach.actionPlan.map((a) => (
              <div className={`cfo-step ${cls(a.tone)}`} key={a.step}>
                <div className="cfo-step-no">{a.step}</div>
                <div><strong>{a.title}</strong><p>{a.text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-sm" style={{marginTop:14}}>
        <div className="card-title"><h3>납입·절세 타이밍</h3><span className="badge badge-green">현금흐름 연결</span></div>
        <div className="g3">
          {coach.cashTiming.map((x) => (
            <div className={`compact-insight ${cls(x.tone)}`} key={x.title}>
              <span>{x.tone === "green" ? "🌱" : x.tone === "amber" ? "🧾" : "💰"}</span>
              <div><strong>{x.title}</strong><p>{x.text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const showToast = useToast();
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
      <DisclaimerBanner context="tax"/>
      {/* ── 자연어 요약 카드 ── */}
      <NaturalInsightCard icon={taxNLP.icon} title={taxNLP.title} message={taxNLP.message} tone={taxNLP.tone} actions={taxNLP.actions}/>
      <AICoachPanel coach={taxCoach}/>
      <TaxCalendarTimeline calendar={taxCalendar} settings={s} onUpdateSettings={(patch)=>update(d=>({ ...d, settings:{ ...d.settings, ...patch } }))}/>
      <TaxCfoCoach coach={buildTaxCfoCoach({ calendar:taxCalendar, opt, settings:s, taxAnalysis, futureSim })} settings={s}/>
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
  const showToast = useToast();

  const empty={id:"",name:"",yearsFromNow:1,amountNeeded:"",currentPrepared:"",priority:"높음"};
  const [form,setForm]=useState(empty);
  const saveEvent=()=>{
    if(!form.name||n(form.amountNeeded)<=0) return showToast('이름과 필요금액을 입력하세요.', 'warn');
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
      <AICoachPanel coach={buildIntegratedCoach({ area:"재무현황 요약", data, dashboard, dashboardDetail, financialAnalysis, budgetAnalysis, taxAnalysis, futureSim })}/>
      <DisclaimerBanner context="cfo"/>
      <div className="card cfo-hero">
        <div>
          <div className="kpi-label">재무 현황 계산기 (참고용)</div>
          <h2>내 재무현황 요약</h2>
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
          <h3>이번 달 입력값 기반 확인 사항</h3>
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
  const showToast = useToast();

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
    if(!form.name) return showToast('목표명을 입력하세요.', 'warn');
    if(form.goalKind==="순자산목표"){
      if(n(form.targetNetWorth||form.amountNeeded)<=0) return showToast('목표 순자산을 입력하세요.', 'warn');
    } else if(n(form.amountNeeded)<=0) return showToast('목표금액을 입력하세요.', 'warn');
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
      <DisclaimerBanner context="decision"/>
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
          <div className="card-title"><h3>확인 사항 카드 (참고용)</h3></div>
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
  const showToast = useToast();

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
    if(net>0 && emergencyMonths<6) actions.push({tag:"안전",title:"잉여 현금 일부를 비상금으로",text:`흑자 ${fmt(net)}원 중 일부를 비상금 6개월치 목표에 배분하는 방안을 참고하세요.`});
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
    if(net>0 && emergencyMonths>=6) nextSteps.push({title:"목표비중 기반 추가 배분 검토",text:"남는 현금을 목표 비중 기준으로 참고하여 직접 판단하세요."});
    if(pensionRemaining>0) nextSteps.push({title:"절세 한도 월할 계산",text:"남은 세액공제 한도를 남은 개월 수로 나눠 월 납입액을 정하세요."});
    if(nextSteps.length===0) nextSteps.push({title:"현재 루틴 유지",text:"거래 입력, 예산 점검, 월말 리포트 확인 루틴을 유지하세요."});

    const summaryText=[
      `${month} 월간 리포트예요 😊`,
      `재무 현황 참고 점수는 ${aiScore}점(${aiGrade})입니다. ${headline}`,
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
    try{await navigator.clipboard.writeText(report.summaryText);showToast('월간 리포트 요약을 복사했습니다.', 'success');}
    catch{showToast('복사에 실패했습니다. 브라우저 권한을 확인하세요.', 'error');}
  };

  const printReport=()=>window.print();

  const [emailSending,setEmailSending]=useState(false);
  const sendReportEmail=async()=>{
    const email=data.settings?.reportEmail||"";
    if(!email){
      showToast("설정 탭 → 리포트 수신 이메일을 먼저 입력해주세요.","warn");
      return;
    }
    setEmailSending(true);
    try{
      const body={
        to:email,
        month,
        subject:`[Season CFO] ${month} 월간 재무 리포트`,
        html:`
<h2 style="color:#1a1a2e">📊 ${month} 월간 재무 리포트</h2>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:700">수입</td><td style="padding:8px 12px;color:#2d6a4f;font-weight:700">${fmt(report.income)}원</td></tr>
  <tr><td style="padding:8px 12px;font-weight:700">지출</td><td style="padding:8px 12px;color:#c62828;font-weight:700">${fmt(report.expense)}원</td></tr>
  <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:700">순저축</td><td style="padding:8px 12px;font-weight:700">${fmt(report.net)}원</td></tr>
  <tr><td style="padding:8px 12px;font-weight:700">저축률</td><td style="padding:8px 12px">${fmtPct(report.savingsRate)}</td></tr>
</table>
<h3>📝 이번 달 요약</h3>
<p style="line-height:1.7;color:#333">${report.headline}</p>
<p style="line-height:1.7;color:#333">${report.summaryText}</p>
<h3>⚠️ 주요 이슈</h3>
<ul>${report.issues.map(i=>`<li style="margin-bottom:6px"><strong>${i.title}</strong>: ${i.text}</li>`).join("")}</ul>
<h3>✅ 다음 달 액션</h3>
<ul>${report.nextSteps.map(s=>`<li style="margin-bottom:6px"><strong>${s.title}</strong>: ${s.text}</li>`).join("")}</ul>
<p style="color:#999;font-size:12px;margin-top:24px">Season 개인 CFO 자산관리 앱에서 자동 발송된 리포트입니다.</p>
`
      };
      const res=await fetch("/api/send-report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(res.ok){showToast(`${email}로 리포트를 발송했습니다.`,"success");}
      else{const e=await res.json();showToast("발송 실패: "+e.error,"error");}
    }catch(e){
      showToast("발송 오류: "+e.message,"error");
    }finally{setEmailSending(false);}
  };

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
          <button className="btn btn-sm btn-ghost" onClick={sendReportEmail} disabled={emailSending}>{emailSending?"발송 중...":"📧 이메일 발송"}</button>
          <button className="btn btn-sm btn-primary" onClick={printReport}>출력/PDF</button>
        </div>
      </div>

      <div className="ai-coach-hero">
        <div className={`ai-coach-panel ${report.aiTone}`}>
          <div className="ai-coach-kicker">이번 달 재무 현황 요약</div>
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
          <div className="kpi-label">이달 재무 현황 참고 점수</div>
          <div className={`ai-coach-score ${report.aiTone==="good"?"text-green":report.aiTone==="danger"?"text-red":"text-accent"}`}>{report.aiScore}<span>/100</span></div>
          <span className={`badge ${report.aiTone==="good"?"badge-green":report.aiTone==="danger"?"badge-red":"badge-amber"}`}>{report.aiGrade}</span>
          <p className="small muted">현금흐름, 저축률, 예산 초과, 비상금, 절세 여력을 함께 반영한 참고 점수입니다. 투자자문이 아닌 현황 계산값입니다.</p>
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
      <DisclaimerBanner context="simulation"/>
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
  const showToast = useToast();

  const rows=getInvestmentTargets(settings);
  const totalWeight=rows.reduce((sum,r)=>sum+n(r.targetWeight),0);
  const weightedReturn=getWeightedExpectedReturn(settings);
  const totalWeightPct=totalWeight*100;
  const isOverWeight=totalWeight>1.000001;
  const isExactWeight=Math.abs(totalWeight-1)<=0.001;

  const commitRows=(nextRows)=>{
    const nextTotal=nextRows.reduce((sum,r)=>sum+n(r.targetWeight),0);
    if(nextTotal>1.000001){
      showToast(`목표비중 합계 ${fmtPct(nextTotal*100)} - 100% 이하로 조정해주세요.`, 'warn');
      return false;
    }
    set("investmentTargets", nextRows);
    return true;
  };

  const updateRow=(id,patch)=>{
    const nextRows=rows.map(r=>r.id===id?{...r,...patch}:r);
    if(Object.prototype.hasOwnProperty.call(patch,"targetWeight")) return commitRows(nextRows);
    set("investmentTargets", nextRows);
    return true;
  };
  const addRow=()=>{
    set("investmentTargets", [...rows,{id:uid(),name:"새 전략",expectedReturn:0.08,targetWeight:0,memo:""}]);
  };
  const removeRow=(id)=>{
    set("investmentTargets", rows.filter(r=>r.id!==id));
  };
  const remainingPctFor=(id)=>{
    const others=rows.filter(r=>r.id!==id).reduce((sum,r)=>sum+n(r.targetWeight),0)*100;
    return clamp(100-others,0,100);
  };

  return (
    <div className="card">
      <div className="card-title">
        <h3>투자 수익률 / 목표 비중</h3>
        <div className="row">
          <span className={`badge ${isOverWeight?"badge-red":isExactWeight?"badge-green":"badge-amber"}`}>합계 {fmtPct(totalWeightPct)}</span>
          <span className="badge badge-accent">가중 기대수익률 {fmtPct(weightedReturn*100)}</span>
          <button className="btn btn-sm btn-ghost" onClick={addRow}>+ 전략 추가</button>
        </div>
      </div>

      {isOverWeight && (
        <div className="alert alert-danger" style={{marginBottom:12}}>
          ⚠️ 투자 목표 비중 합계가 100%를 초과했습니다. 다른 화면으로 넘어가기 전에 반드시 100% 이하로 조정해주세요.
        </div>
      )}
      {!isOverWeight && !isExactWeight && (
        <div className="alert alert-warn" style={{marginBottom:12}}>
          현재 목표 비중 합계는 {fmtPct(totalWeightPct)}입니다. 장기 시뮬레이션과 리밸런싱 정확도를 위해 100%로 맞추는 것을 권장합니다.
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>전략/자산군명</th><th>연 기대수익률(%)</th><th>목표비중(%)</th><th>메모</th><th>작업</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td><input value={r.name} onChange={e=>updateRow(r.id,{name:e.target.value})} placeholder="예: 나스닥, 배당, 현금"/></td>
                <td><input type="number" step="0.1" min="-100" max="100" value={ratioToPercent(r.expectedReturn,2)} onChange={e=>updateRow(r.id,{expectedReturn:percentToRatio(e.target.value)})} placeholder="예: 10"/></td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={remainingPctFor(r.id)}
                    value={ratioToPercent(r.targetWeight,2)}
                    onChange={e=>updateRow(r.id,{targetWeight:percentToRatio(e.target.value)})}
                    placeholder="예: 90"
                  />
                  <div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>입력 가능 최대 {fmtPct(remainingPctFor(r.id),0)}</div>
                </td>
                <td><input value={r.memo||""} onChange={e=>updateRow(r.id,{memo:e.target.value})} placeholder="설명"/></td>
                <td><button className="btn btn-sm btn-danger" onClick={()=>removeRow(r.id)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:10,fontSize:12,color:isExactWeight?"var(--text3)":"var(--amber)",lineHeight:1.5}}>
        목표비중은 이제 소수점이 아니라 퍼센트로 입력합니다. 예: 나스닥 90, 배당 10. 합계가 100%를 초과하면 저장되지 않습니다. 포트폴리오 종목의 자산군명과 이 표의 전략명이 같아야 리밸런싱에 반영됩니다.
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
          <span className="badge badge-muted">자동 조회 기본 · 수동 입력은 비상용</span>
        </div>
        <div className="form-grid-3">
          <Field label="시장 데이터 모드">
            <select value={s.marketDataMode || "auto"} onChange={e=>set("marketDataMode", e.target.value)}>
              <option value="auto">자동 사용</option>
              <option value="manual">수동 입력</option>
            </select>
          </Field>
          <Field label="마지막 정상 USD/KRW">
            <input value={n(s.fxUsdKrw)>0?fmt(s.fxUsdKrw):""} readOnly placeholder="자동 조회 전"/>
          </Field>
          <Field label="마지막 시장데이터 갱신">
            <input value={s.marketDataLastUpdated?String(s.marketDataLastUpdated).replace("T"," ").slice(0,19):""} readOnly placeholder="자동 기록"/>
          </Field>
        </div>

        {(s.marketDataMode || "auto") === "manual" ? (
          <div className="form-grid-3" style={{marginTop:12}}>
            <Field label="수동 USD/KRW 환율"><input value={s.fxUsdKrw||""} onChange={e=>set("fxUsdKrw",n(e.target.value))} placeholder="예: 1380"/></Field>
            <Field label="수동 JPY/KRW 환율"><input value={s.fxJpyKrw||""} onChange={e=>set("fxJpyKrw",n(e.target.value))} placeholder="예: 9.2 (100엔→KRW)"/></Field>
            <Field label="수동 EUR/KRW 환율"><input value={s.fxEurKrw||""} onChange={e=>set("fxEurKrw",n(e.target.value))} placeholder="예: 1520"/></Field>
            <Field label="수동 CNY/KRW 환율"><input value={s.fxCnyKrw||""} onChange={e=>set("fxCnyKrw",n(e.target.value))} placeholder="예: 190"/></Field>
            <Field label="수동 환율 기준시각"><input value={s.fxAsOf?String(s.fxAsOf).replace("T"," ").slice(0,19):""} onChange={e=>set("fxAsOf",e.target.value)} placeholder="예: 2026-04-29 12:30"/></Field>
            <div className="alert alert-warn" style={{alignSelf:"end"}}>수동 모드는 API 실패·오프라인 검증용입니다.</div>
          </div>
        ) : (
          <div className="alert alert-info" style={{marginTop:12}}>
            자동 모드에서는 USD/KRW 환율만 자동 조회됩니다. JPY·EUR·CNY는 설정에서 수동 입력하거나 수동 모드로 전환하세요.
          </div>
        )}
        <div style={{marginTop:16}}>
          <Field label="📧 월간 리포트 수신 이메일">
            <input type="email" value={s.reportEmail||""} onChange={e=>set("reportEmail",e.target.value)} placeholder="example@email.com"/>
          </Field>
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
  const showToast = useToast();

  const empty={id:"",name:"",type:"은행",institution:"",currency:"KRW",owner:"본인",active:true,defaultIn:false,note:""};
  const [form,setForm]=useState(empty);
  const save=()=>{
    if(!form.name) return showToast('계좌명을 입력하세요.', 'warn');
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


// ─── Calculation Validation Center ───────────────────────────────────────────
function nearEqual(a,b,tolerance=1){return Math.abs(n(a)-n(b))<=tolerance;}
function calcAuditBadge(errorCount,warnCount){if(errorCount>0)return{cls:"badge-red",text:"확인필요"};if(warnCount>0)return{cls:"badge-amber",text:"주의"};return{cls:"badge-green",text:"정상"};}
function buildCalculationAudit({data,dashboard,financialAnalysis,monthlySeries,budgetAnalysis,taxAnalysis,futureSim}){
  const month=thisMonthISO();
  const tx=(data.transactions||[]).filter(t=>monthOf(t.date)===month);
  const income=tx.filter(t=>t.type==="수입").reduce((s,t)=>s+n(t.amount),0);
  const expense=tx.filter(t=>t.type==="지출").reduce((s,t)=>s+n(t.amount),0);
  const net=income-expense;
  const assets=(data.assets||[]).filter(a=>a.kind==="자산").reduce((s,a)=>s+n(a.current),0);
  const liabs=(data.assets||[]).filter(a=>a.kind==="부채").reduce((s,a)=>s+n(a.current),0);
  const portKRW=(data.portfolio||[]).reduce((s,p)=>s+n(p.qty)*priceToKRW(p,data.settings||{}),0);
  const portDash=n(dashboard?.portValue);
  const netWorthKRW=assets-liabs+portKRW;
  const row=(monthlySeries||[]).find(r=>r.month===month)||{net:0};
  const budgetSpent=(budgetAnalysis||[]).reduce((s,b)=>s+n(b.spent),0);
  const taxValue=(taxAnalysis||[]).reduce((s,r)=>s+n(r.value),0);
  const futureLast=(futureSim||[]).length?futureSim[futureSim.length-1]:null;
  const usdRows=(data.portfolio||[]).filter(p=>normalizeCurrency(p.currency)==="USD"&&n(p.qty)>0);
  const fx=getFxUsdKrw(data.settings||{});
  const checks=[
    {id:"income",area:"월간",title:"수입 합계",expected:income,actual:n(dashboard?.income),formula:"이번 달 수입 거래 합계 = 대시보드 수입",action:"수입 거래의 날짜·금액·구분을 확인",severity:nearEqual(income,dashboard?.income)?"ok":"error"},
    {id:"expense",area:"월간",title:"지출 합계",expected:expense,actual:n(dashboard?.expense),formula:"이번 달 지출 거래 합계 = 대시보드 지출",action:"지출 거래의 날짜·금액·구분을 확인",severity:nearEqual(expense,dashboard?.expense)?"ok":"error"},
    {id:"net",area:"월간",title:"순수입",expected:net,actual:n(dashboard?.net),formula:"수입 - 지출 = 순수입",action:"월 필터와 거래유형을 확인",severity:nearEqual(net,dashboard?.net)?"ok":"error"},
    {id:"series",area:"월간추이",title:"월간 추이 일치",expected:net,actual:n(row.net),formula:"월간추이 순수입 = 거래 기준 순수입",action:"거래 날짜 형식 YYYY-MM-DD 확인",severity:nearEqual(net,row.net)?"ok":"error"},
    {id:"assets",area:"자산",title:"총자산",expected:assets,actual:n(dashboard?.totalAssets),formula:"자산 current 합계 = 총자산",action:"자산/부채 구분값 확인",severity:nearEqual(assets,dashboard?.totalAssets)?"ok":"error"},
    {id:"liabs",area:"부채",title:"총부채",expected:liabs,actual:n(dashboard?.totalLiabs),formula:"부채 current 합계 = 총부채",action:"부채 잔액은 양수 입력 권장",severity:nearEqual(liabs,dashboard?.totalLiabs)?"ok":"error"},
    {id:"portfolio",area:"투자",title:"포트폴리오 원화평가",expected:portKRW,actual:n(financialAnalysis?.total),formula:"수량 × 현재가 × 환율",action:"USD 종목은 환율 입력 확인",severity:nearEqual(portKRW,financialAnalysis?.total)?"ok":"error"},
    {id:"portfolioDash",area:"투자",title:"대시보드 투자금액",expected:portKRW,actual:portDash,formula:"대시보드 투자금액 = 원화 환산 평가액",action:usdRows.length?"대시보드 계산식에 USD 환율 반영 필요":"포트폴리오 계산식 확인",severity:nearEqual(portKRW,portDash)?"ok":(usdRows.length?"warn":"error")},
    {id:"nw",area:"순자산",title:"순자산",expected:netWorthKRW,actual:n(dashboard?.netWorth),formula:"총자산 - 총부채 + 포트폴리오 원화평가",action:usdRows.length?"해외주식 환율 반영 기준 통일":"순자산 계산식 확인",severity:nearEqual(netWorthKRW,dashboard?.netWorth)?"ok":(usdRows.length?"warn":"error")},
    {id:"budget",area:"예산",title:"예산 지출 합계",expected:expense,actual:budgetSpent,formula:"예산 사용액 합계 = 이번 달 지출",action:"예산에 없는 지출 대분류 추가",severity:nearEqual(expense,budgetSpent)?"ok":"warn"},
    {id:"tax",area:"세금",title:"계좌별 세금 평가금액",expected:portKRW,actual:taxValue,formula:"세금 그룹 합계 = 포트폴리오 원화평가",action:"계좌명을 ISA/연금저축/IRP/일반계좌 기준과 맞추기",severity:nearEqual(portKRW,taxValue)?"ok":"error"},
    {id:"sim",area:"시뮬레이션",title:"미래 시뮬레이션 유효성",expected:n((futureLast||{}).total),actual:n((futureLast||{}).total),formula:"은퇴연령 > 현재나이, 결과값 0 이상",action:"현재나이·은퇴나이·월투자금·수익률 확인",severity:n(data.settings?.retireAge)<=n(data.settings?.currentAge)?"warn":(n((futureLast||{}).total)>=0?"ok":"error")},
  ];
  const warnings=[];
  if(usdRows.length>0&&fx<=0)warnings.push({title:"USD 환율 미설정",text:"해외주식이 있지만 환율이 0입니다.",action:"설정에서 USD/KRW 환율 입력"});
  if((data.transactions||[]).some(t=>n(t.amount)<0))warnings.push({title:"음수 거래 감지",text:"음수 금액은 월간 합계를 왜곡할 수 있습니다.",action:"금액은 양수, 유형으로 수입/지출 구분"});
  if((data.assets||[]).some(a=>n(a.current)<0))warnings.push({title:"음수 자산/부채 감지",text:"순자산 계산이 틀어질 수 있습니다.",action:"부채도 양수 잔액으로 입력"});
  const errorCount=checks.filter(c=>c.severity==="error").length;
  const warnCount=checks.filter(c=>c.severity==="warn").length+warnings.length;
  return{checks,warnings,summary:{errorCount,warnCount,okCount:checks.filter(c=>c.severity==="ok").length,total:checks.length,score:clamp(Math.round(100-errorCount*18-warnCount*7),0,100),badge:calcAuditBadge(errorCount,warnCount),numbers:{income,expense,net,assets,liabs,portKRW,netWorthKRW,dashboardNW:n(dashboard?.netWorth)}}};
}
function CalculationValidationCenter({audit}){
  const s=audit.summary;const issueRows=audit.checks.filter(c=>c.severity!=="ok");
  return <div className="stack">
    <div className="card calc-audit-hero">
      <div className="row-between" style={{alignItems:"flex-start",flexWrap:"wrap"}}><div><span className="badge badge-accent">3단계 완료형</span><h2 style={{marginTop:10,fontSize:24,letterSpacing:"-.04em"}}>계산값 검증 센터</h2><p style={{marginTop:8,color:"var(--text3)",fontSize:13,lineHeight:1.6}}>대시보드, 월간 추이, 자산·부채, 포트폴리오, 세금, 미래 시뮬레이션의 핵심 계산값을 독립 계산식으로 재검증합니다.</p></div><div className="backup-health-box"><div className="backup-health-value">{s.score}</div><div className="backup-health-label">신뢰 점수</div></div></div>
      <div className="backup-summary-grid"><div className="backup-summary-item"><span>상태</span><strong><span className={`badge ${s.badge.cls}`}>{s.badge.text}</span></strong><small>계산 검증 결과</small></div><div className="backup-summary-item"><span>오류</span><strong>{s.errorCount}건</strong><small>즉시 수정</small></div><div className="backup-summary-item"><span>주의</span><strong>{s.warnCount}건</strong><small>왜곡 가능성</small></div><div className="backup-summary-item"><span>통과</span><strong>{s.okCount}/{s.total}</strong><small>검증 공식</small></div></div>
      {s.errorCount>0&&<div className="alert alert-danger" style={{marginTop:14}}>계산 불일치가 있습니다. 외부 베타 테스트 전 반드시 수정하세요.</div>}{s.errorCount===0&&s.warnCount>0&&<div className="alert alert-warn" style={{marginTop:14}}>큰 오류는 없지만 환율·예산·설정값 검토가 필요합니다.</div>}{s.errorCount===0&&s.warnCount===0&&<div className="alert alert-ok" style={{marginTop:14}}>핵심 계산값이 모두 정상입니다.</div>}
    </div>
    <div className="card"><div className="card-title"><h3>핵심 숫자 대조</h3><span className="badge badge-muted">독립 계산</span></div><div className="table-wrap"><table><thead><tr><th>항목</th><th className="td-right">값</th><th>설명</th></tr></thead><tbody>{[["거래 기준 수입",s.numbers.income,"이번 달 수입 거래 합계"],["거래 기준 지출",s.numbers.expense,"이번 달 지출 거래 합계"],["거래 기준 순수입",s.numbers.net,"수입 - 지출"],["총자산",s.numbers.assets,"자산 항목 합계"],["총부채",s.numbers.liabs,"부채 항목 합계"],["포트폴리오 원화평가",s.numbers.portKRW,"수량 × 현재가 × 환율"],["검증 기준 순자산",s.numbers.netWorthKRW,"총자산 - 총부채 + 포트폴리오"],["대시보드 순자산",s.numbers.dashboardNW,"현재 표시값"]].map(r=><tr key={r[0]}><td className="td-name">{r[0]}</td><td className="td-right td-mono">{fmt(r[1])}원</td><td>{r[2]}</td></tr>)}</tbody></table></div></div>
    <div className="card"><div className="card-title"><h3>계산 검증 상세</h3><span className="badge badge-accent">{audit.checks.length}개 공식</span></div><div className="table-wrap"><table><thead><tr><th>영역</th><th>항목</th><th>상태</th><th className="td-right">기대값</th><th className="td-right">현재값</th><th>공식</th><th>조치</th></tr></thead><tbody>{audit.checks.map(c=><tr key={c.id}><td>{c.area}</td><td className="td-name">{c.title}</td><td>{c.severity==="ok"?<span className="badge badge-green">정상</span>:c.severity==="warn"?<span className="badge badge-amber">주의</span>:<span className="badge badge-red">오류</span>}</td><td className="td-right td-mono">{fmt(c.expected)}원</td><td className="td-right td-mono">{fmt(c.actual)}원</td><td style={{color:"var(--text3)",fontSize:12}}>{c.formula}</td><td style={{color:"var(--text3)",fontSize:12}}>{c.action}</td></tr>)}</tbody></table></div></div>
    <div className="g2"><div className="card"><div className="card-title"><h3>즉시 수정 목록</h3><span className="badge badge-red">우선순위</span></div>{issueRows.length===0&&audit.warnings.length===0?<div className="empty">즉시 수정할 계산 이슈가 없습니다.</div>:<div className="stack">{issueRows.slice(0,6).map(c=><div key={c.id} className={`compact-insight ${c.severity==="error"?"danger":"warn"}`}><span>{c.severity==="error"?"🚨":"⚠️"}</span><div><strong>{c.title}</strong><p>{c.action}</p></div></div>)}{audit.warnings.map((w,i)=><div key={i} className="compact-insight warn"><span>⚠️</span><div><strong>{w.title}</strong><p>{w.text} {w.action}</p></div></div>)}</div>}</div><div className="card"><div className="card-title"><h3>테스트 기준</h3><span className="badge badge-muted">출시 전 하한선</span></div><div className="stack"><div className="stat-row"><span className="stat-label">계산 오류</span><span className="stat-value">0건</span></div><div className="stat-row"><span className="stat-label">주의 이슈</span><span className="stat-value">2건 이하</span></div><div className="stat-row"><span className="stat-label">신뢰 점수</span><span className="stat-value">90점 이상</span></div></div><div className="alert alert-info" style={{marginTop:14}}>이 센터에서 오류 0건이 되어야 외부 베타 테스트를 시작하는 것이 안전합니다.</div></div></div>
  </div>;
}

// ─── Data Tab ─────────────────────────────────────────────────────────────────


// ─── Step 5 Sample Data Verification ────────────────────────────────────────
function buildSampleVerificationData() {
  const m = thisMonthISO();
  const settings = {
    ...DEFAULT_SETTINGS,
    currentAge: 36,
    retireAge: 55,
    monthlySalary1: 4500000,
    monthlySalary2: 0,
    monthlyInvestDefault: 2000000,
    monthlyInvestStage1: 2000000,
    monthlyInvestStage2: 2500000,
    monthlyInvestStage3: 5000000,
    annualReturnNasdaq: 0.10,
    annualReturnDividend: 0.06,
    fxUsdKrw: 1350,
    fxAsOf: todayISO(),
    marketDataLastUpdated: new Date().toISOString(),
    marketDataMode: "auto",
    retirementTargetAmount: 2000000000,
    retirementMonthlyExpense: 5000000,
    investmentTargets: [
      { id: "sample-target-nasdaq", name: "나스닥", expectedReturn: 0.10, targetWeight: 0.90, memo: "샘플 검증용" },
      { id: "sample-target-dividend", name: "배당", expectedReturn: 0.06, targetWeight: 0.10, memo: "샘플 검증용" },
    ],
  };
  const accounts = [
    { id: "sample-acc-salary", name: "우리은행(급여)", type: "은행", institution: "우리은행", currency: "KRW", owner: "본인", active: true, defaultIn: true, note: "샘플" },
    { id: "sample-acc-parking", name: "파킹통장", type: "은행", institution: "토스뱅크", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "샘플" },
    { id: "sample-acc-isa", name: "ISA", type: "증권", institution: "증권사", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "샘플" },
    { id: "sample-acc-card", name: "신용카드", type: "카드", institution: "카드사", currency: "KRW", owner: "본인", active: true, defaultIn: false, note: "샘플" },
  ];
  const transactions = [
    { id: "sample-tx-income-1", date: `${m}-05`, type: "수입", cat1: "근로소득", cat2: "월급", amount: 4500000, accountIn: "우리은행(급여)", accountOut: "", memo: "샘플 월급" },
    { id: "sample-tx-income-2", date: `${m}-10`, type: "수입", cat1: "금융소득", cat2: "배당", amount: 50000, accountIn: "ISA", accountOut: "", memo: "샘플 배당" },
    { id: "sample-tx-food", date: `${m}-06`, type: "지출", cat1: "식비", cat2: "외식", amount: 650000, accountIn: "", accountOut: "신용카드", memo: "샘플 식비" },
    { id: "sample-tx-house", date: `${m}-07`, type: "지출", cat1: "주거", cat2: "관리비", amount: 380000, accountIn: "", accountOut: "신용카드", memo: "샘플 주거비" },
    { id: "sample-tx-transport", date: `${m}-08`, type: "지출", cat1: "교통", cat2: "주유", amount: 220000, accountIn: "", accountOut: "신용카드", memo: "샘플 교통비" },
    { id: "sample-tx-life", date: `${m}-09`, type: "지출", cat1: "생활", cat2: "생필품", amount: 300000, accountIn: "", accountOut: "신용카드", memo: "샘플 생활비" },
    { id: "sample-tx-tax", date: `${m}-11`, type: "지출", cat1: "보험세금", cat2: "보험료", amount: 500000, accountIn: "", accountOut: "신용카드", memo: "샘플 보험료" },
    { id: "sample-tx-family", date: `${m}-12`, type: "지출", cat1: "가족", cat2: "선물", amount: 200000, accountIn: "", accountOut: "신용카드", memo: "샘플 가족비" },
    { id: "sample-tx-hobby", date: `${m}-13`, type: "지출", cat1: "취미여행", cat2: "구독", amount: 250000, accountIn: "", accountOut: "신용카드", memo: "샘플 취미비" },
  ];
  const assets = [
    { id: "sample-asset-cash", kind: "자산", category: "현금성", name: "비상금", current: 15000000, previous: 14000000, includeInEmergency: true, note: "샘플" },
    { id: "sample-asset-bank", kind: "자산", category: "은행예금", name: "우리은행(급여)", current: 5500000, previous: 5000000, includeInEmergency: false, note: "샘플" },
    { id: "sample-asset-parking", kind: "자산", category: "은행예금", name: "파킹통장", current: 8500000, previous: 8000000, includeInEmergency: true, note: "샘플" },
    { id: "sample-liab-card", kind: "부채", category: "카드", name: "신용카드", current: 2500000, previous: 2300000, includeInEmergency: false, note: "샘플" },
    { id: "sample-liab-car", kind: "부채", category: "자동차", name: "자동차 할부", current: 28000000, previous: 28600000, includeInEmergency: false, note: "샘플" },
  ];
  const portfolio = [
    { id: "sample-pf-nasdaq", account: "ISA", name: "TIGER 나스닥100", code: "133690", symbol: "133690.KS", currency: "KRW", qty: 120, avgPrice: 118000, currentPrice: 125000, targetAmount: 18000000, riskSigma: 0.22, assetClass: "나스닥", memo: "샘플" },
    { id: "sample-pf-nasdaq-h", account: "ISA", name: "TIGER 나스닥100(H)", code: "448300", symbol: "448300.KS", currency: "KRW", qty: 100, avgPrice: 105000, currentPrice: 108000, targetAmount: 16000000, riskSigma: 0.20, assetClass: "나스닥", memo: "샘플" },
    { id: "sample-pf-div", account: "ISA", name: "TIGER 배당다우존스", code: "458730", symbol: "458730.KS", currency: "KRW", qty: 80, avgPrice: 11600, currentPrice: 12000, targetAmount: 3000000, riskSigma: 0.15, assetClass: "배당", memo: "샘플" },
  ];
  const budgets = [
    { id: "sample-budget-food", cat1: "식비", budget: 800000, targetWeight: 0.15 },
    { id: "sample-budget-house", cat1: "주거", budget: 400000, targetWeight: 0.10 },
    { id: "sample-budget-transport", cat1: "교통", budget: 250000, targetWeight: 0.05 },
    { id: "sample-budget-life", cat1: "생활", budget: 350000, targetWeight: 0.06 },
    { id: "sample-budget-tax", cat1: "보험세금", budget: 500000, targetWeight: 0.10 },
    { id: "sample-budget-family", cat1: "가족", budget: 250000, targetWeight: 0.05 },
    { id: "sample-budget-hobby", cat1: "취미여행", budget: 300000, targetWeight: 0.08 },
  ];
  const events = [
    { id: "sample-event-car", name: "🚗 차량 교체", yearsFromNow: 4, amountNeeded: 25000000, currentPrepared: 8500000, priority: "높음" },
    { id: "sample-event-trip", name: "✈️ 장기 여행", yearsFromNow: 8, amountNeeded: 30000000, currentPrepared: 3000000, priority: "중간" },
  ];
  return migrateData({
    ...emptyData(),
    version: 50,
    categories: DEFAULT_CATEGORIES,
    transactions,
    accounts,
    assets,
    portfolio,
    budgets,
    events,
    settings,
    lastSavedAt: new Date().toISOString(),
    sampleDataAppliedAt: new Date().toISOString(),
  });
}
function buildStep5VerificationRows(validations, calculationAudit) {
  const validationIssueCount = (validations || []).reduce((sum, v) => sum + n(v.count), 0);
  const summary = calculationAudit?.summary || { score: 0, errorCount: 0, warnCount: 0, okCount: 0, total: 0 };
  const rows = [
    { item: "데이터 구조", status: validationIssueCount === 0 ? "정상" : "확인필요", detail: `입력 검증 이슈 ${validationIssueCount}건`, tone: validationIssueCount === 0 ? "green" : "red" },
    { item: "계산 공식", status: summary.errorCount === 0 ? "정상" : "확인필요", detail: `오류 ${summary.errorCount}건 · 주의 ${summary.warnCount}건`, tone: summary.errorCount === 0 ? (summary.warnCount ? "amber" : "green") : "red" },
    { item: "신뢰 점수", status: `${summary.score || 0}점`, detail: `통과 ${summary.okCount || 0}/${summary.total || 0}`, tone: (summary.score || 0) >= 90 ? "green" : (summary.score || 0) >= 75 ? "amber" : "red" },
    { item: "백업 가능성", status: isValidAppData(migrateData({ ...emptyData(), ...(window.__assetAppCurrentData || {}) })) ? "정상" : "확인필요", detail: "현재 데이터 구조 기준", tone: "green" },
  ];
  return rows;
}

function DataTab({ data, update, validations, calculationAudit }) {
  const showToast = useToast();
  const { showConfirm, ConfirmPortal } = useConfirm();
  const [showPrivacyLocal, setShowPrivacyLocal] = React.useState(false);

  const fileRef = useRef();
  const [backupList, setBackupList] = useState(() => getStorageBackupList());
  const [selectedBackupKey, setSelectedBackupKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [step5CheckedAt, setStep5CheckedAt] = useState("");
  if (typeof window !== "undefined") window.__assetAppCurrentData = data;

  const applySampleVerificationData = async () => {
    const ok1 = await showConfirm("샘플 데이터로 교체할까요?\n현재 데이터는 자동 백업됩니다.");
    if (!ok1) return;
    const backup = createManualStorageBackup(data, "before-sample-verification");
    if (!backup.ok) return showToast(`백업 실패: ${backup.error}`, 'error');
    update(() => buildSampleVerificationData());
    refreshBackups();
    setStep5CheckedAt(new Date().toISOString());
    setStatusMessage("테스트용 샘플 데이터를 적용했습니다. 대시보드와 계산값 검증 센터에서 숫자를 확인하세요.");
    showToast('샘플 데이터 적용 완료', 'success');
  };

  const runStep5Verification = () => {
    setStep5CheckedAt(new Date().toISOString());
    const errors = n(calculationAudit?.summary?.errorCount);
    const warns = n(calculationAudit?.summary?.warnCount);
    if (errors > 0) setStatusMessage(`전체 검증 결과: 오류 ${errors}건이 있습니다. 계산값 검증 센터의 즉시 수정 목록을 먼저 확인하세요.`);
    else if (warns > 0) setStatusMessage(`전체 검증 결과: 큰 오류는 없지만 주의 ${warns}건이 있습니다. 환율·예산·설정값을 확인하세요.`);
    else setStatusMessage("전체 검증 결과: 핵심 계산값과 데이터 구조가 정상입니다.");
  };

  const refreshBackups = () => {
    const list = getStorageBackupList();
    setBackupList(list);
    if (selectedBackupKey && !list.some((b) => b.key === selectedBackupKey)) setSelectedBackupKey("");
    return list;
  };

  const exportJSON = () => {
    const payload = migrateData({ ...emptyData(), ...data, exportedAt: new Date().toISOString() });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asset-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatusMessage("현재 데이터를 JSON 파일로 다운로드했습니다.");
  };

  const exportSelectedBackup = (key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return showToast('선택한 백업을 찾을 수 없습니다.', 'error');
    const createdAt = key.replace(STORAGE_BACKUP_PREFIX, "").replace(/[:.]/g, "-");
    const blob = new Blob([raw], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asset-backup-restore-point-${createdAt}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const createManualBackup = () => {
    const result = createManualStorageBackup(data, "manual");
    if (!result.ok) return showToast(`백업 실패: ${result.error}`, 'error');
    refreshBackups();
    setStatusMessage("수동 복원 지점을 생성했습니다.");
    showToast('수동 백업이 생성되었습니다.', 'success');
  };

  const restoreSelectedBackup = async (key) => {
    const targetKey = key || selectedBackupKey;
    if (!targetKey) return showToast('복원할 백업을 선택하세요.', 'warn');
    if (!(await showConfirm("선택한 시점으로 복원할까요?"))) return;
    const result = restoreStorageBackup(targetKey);
    if (!result.ok) return showToast(`복원 실패: ${result.error}`, 'error');
    update(() => result.data);
    refreshBackups();
    setStatusMessage("선택한 백업으로 복원했습니다.");
    showToast('복원 완료', 'success');
  };

  const deleteSelectedBackup = async (key) => {
    const targetKey = key || selectedBackupKey;
    if (!targetKey) return showToast('삭제할 백업을 선택하세요.', 'warn');
    if (!(await showConfirm("이 백업을 삭제할까요?"))) return;
    const result = deleteStorageBackup(targetKey);
    if (!result.ok) return showToast(`삭제 실패: ${result.error}`, 'error');
    refreshBackups();
    setStatusMessage("선택한 백업을 삭제했습니다.");
  };

  const importJSON = async (file) => {
    const rd = new FileReader();
    rd.onload = async () => {
      const result = validateImportedAppData(rd.result);
      if (!result.ok) return showToast(`복원 실패: ${result.error}`, 'error');
      if (!(await showConfirm("업로드한 파일로 복원할까요?"))) return;
      createManualStorageBackup(data, "before-import");
      update(() => result.data);
      refreshBackups();
      setStatusMessage("외부 JSON 파일로 복원했습니다.");
      showToast('복원 완료', 'success');
    };
    rd.onerror = () => showToast('파일을 읽지 못했습니다.', 'error');
    rd.readAsText(file);
  };

  const step5Rows = buildStep5VerificationRows(validations, calculationAudit);
  const step5IssueCount = step5Rows.filter((r) => r.tone === "red").length;
  const step5WarnCount = step5Rows.filter((r) => r.tone === "amber").length;
  const currentDataSize = estimateJSONSizeBytes(data);
  const validBackupCount = backupList.filter((b) => b.valid).length;
  const selectedBackup = backupList.find((b) => b.key === selectedBackupKey);

  return (
    <div className="stack">
      {showPrivacyLocal&&<PrivacyModal onClose={()=>setShowPrivacyLocal(false)}/>}
      {ConfirmPortal}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
        <button className="btn btn-sm btn-ghost" onClick={()=>setShowPrivacyLocal(true)}>📋 개인정보처리방침</button>
      </div>
      <div className="card backup-hero-card">
        <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <span className="badge badge-accent">2단계 완료형</span>
            <h2 style={{ marginTop: 10, fontSize: 24, letterSpacing: "-.04em" }}>백업 / 복원 센터</h2>
            <p style={{ marginTop: 8, color: "var(--text3)", fontSize: 13, lineHeight: 1.6 }}>
              현재 데이터의 복원 지점을 만들고, 저장 데이터 손상·외부 JSON 복원·이전 시점 복구를 한 화면에서 관리합니다.
            </p>
          </div>
          <div className="backup-health-box">
            <div className="backup-health-value">{validBackupCount}</div>
            <div className="backup-health-label">정상 백업</div>
          </div>
        </div>
        <div className="backup-summary-grid">
          <div className="backup-summary-item"><span>현재 데이터</span><strong>{formatBytes(currentDataSize)}</strong><small>저장 크기</small></div>
          <div className="backup-summary-item"><span>전체 백업</span><strong>{backupList.length}개</strong><small>최근 {MAX_BACKUPS}개 유지</small></div>
          <div className="backup-summary-item"><span>마지막 저장</span><strong>{data.lastSavedAt ? new Date(data.lastSavedAt).toLocaleString() : "-"}</strong><small>자동 저장 기준</small></div>
        </div>
        {statusMessage && <div className="alert alert-info" style={{ marginTop: 14 }}>{statusMessage}</div>}
      </div>

      <div className="card backup-hero-card">
        <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <span className="badge badge-green">5단계 완료형</span>
            <h2 style={{ marginTop: 10, fontSize: 24, letterSpacing: "-.04em" }}>테스트용 샘플 데이터 전체 검증</h2>
            <p style={{ marginTop: 8, color: "var(--text3)", fontSize: 13, lineHeight: 1.6 }}>
              실제 사용자 테스트 전에 샘플 데이터로 저장, 복원, 입력 검증, 계산 공식, 대시보드 숫자 흐름을 한 번에 확인합니다.
            </p>
          </div>
          <div className="backup-health-box">
            <div className="backup-health-value">{calculationAudit?.summary?.score || 0}</div>
            <div className="backup-health-label">검증 점수</div>
          </div>
        </div>
        <div className="backup-summary-grid">
          <div className="backup-summary-item"><span>검증 상태</span><strong>{step5IssueCount === 0 ? <span className="badge badge-green">테스트 가능</span> : <span className="badge badge-red">수정 필요</span>}</strong><small>샘플/현재 데이터 기준</small></div>
          <div className="backup-summary-item"><span>오류</span><strong>{step5IssueCount}건</strong><small>출시 전 차단 항목</small></div>
          <div className="backup-summary-item"><span>주의</span><strong>{step5WarnCount}건</strong><small>왜곡 가능성</small></div>
          <div className="backup-summary-item"><span>최근 검증</span><strong>{step5CheckedAt ? new Date(step5CheckedAt).toLocaleString() : "-"}</strong><small>수동 실행 기준</small></div>
        </div>
        <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={applySampleVerificationData}>테스트용 샘플 데이터 적용</button>
          <button className="btn btn-ghost" onClick={runStep5Verification}>현재 데이터로 검증 실행</button>
          <button className="btn btn-ghost" onClick={exportJSON}>현재 데이터 백업 다운로드</button>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>검증 항목</th><th>상태</th><th>상세</th></tr></thead>
            <tbody>
              {step5Rows.map((r) => (
                <tr key={r.item}>
                  <td className="td-name">{r.item}</td>
                  <td><span className={`badge ${r.tone === "green" ? "badge-green" : r.tone === "amber" ? "badge-amber" : "badge-red"}`}>{r.status}</span></td>
                  <td style={{ color: "var(--text3)", fontSize: 12 }}>{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="alert alert-warn" style={{ marginTop: 14 }}>
          샘플 데이터 적용 전 현재 데이터는 자동으로 복원 지점에 저장됩니다. 테스트 후 복원 지점 목록에서 이전 데이터로 되돌릴 수 있습니다.
        </div>
      </div>

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

      <CalculationValidationCenter audit={calculationAudit}/>

      <div className="g2">
        <div className="card">
          <div className="card-title">
            <h3>현재 데이터 백업</h3>
            <span className="badge badge-muted">수동 복원 지점</span>
          </div>
          <div className="stack">
            <button className="btn btn-primary" onClick={createManualBackup}>현재 상태를 복원 지점으로 저장</button>
            <button className="btn btn-ghost" onClick={exportJSON}>현재 데이터 JSON 다운로드</button>
            <button className="btn btn-ghost" onClick={()=>fileRef.current?.click()}>외부 JSON 파일로 복원</button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{display:"none"}} onChange={e=>{ const file=e.target.files?.[0]; if(file) importJSON(file); e.target.value=""; }}/>
          </div>
          <div className="alert alert-warn" style={{marginTop:14}}>
            복원 전에는 현재 데이터가 자동으로 별도 백업됩니다. 그래도 중요한 데이터는 JSON 파일로 한 번 더 내려받아 보관하는 것을 권장합니다.
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h3>위험 작업</h3>
            <span className="badge badge-red">주의</span>
          </div>
          <div className="stack">
            <button className="btn btn-danger" onClick={async()=>{ if(!(await showConfirm("전체 초기화할까요?\n자동 백업 후 진행됩니다."))) return; createManualStorageBackup(data,"before-clear"); update(()=>emptyData()); refreshBackups(); setStatusMessage("전체 데이터를 초기화했습니다. 초기화 직전 백업이 생성되었습니다."); }}>전체 초기화</button>
            <button className="btn btn-ghost" onClick={()=>{ localStorage.removeItem(OB_KEY); window.location.reload(); }} title="온보딩 위자드를 다시 보여줍니다">🚀 온보딩 다시 보기</button>
            <button className="btn btn-ghost" onClick={refreshBackups}>백업 목록 새로고침</button>
          </div>
          <div style={{marginTop:12,fontSize:12,color:"var(--text3)",lineHeight:1.5}}>
            전체 초기화는 거래내역, 자산, 포트폴리오, 설정값을 모두 기본값으로 되돌립니다. 실행 직전 복원 지점이 자동으로 생성됩니다.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>복원 지점 목록</h3>
          <div className="row">
            <button className="btn btn-sm btn-ghost" onClick={refreshBackups}>새로고침</button>
            {selectedBackup && <button className="btn btn-sm btn-primary" onClick={()=>restoreSelectedBackup()}>선택 백업 복원</button>}
          </div>
        </div>
        {backupList.length === 0 ? (
          <div className="empty">아직 생성된 백업이 없습니다. 먼저 “현재 상태를 복원 지점으로 저장”을 눌러주세요.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>선택</th><th>생성 시각</th><th>상태</th><th className="td-right">크기</th><th className="td-right">거래</th><th className="td-right">자산</th><th className="td-right">투자</th><th>작업</th></tr>
              </thead>
              <tbody>
                {backupList.map((b) => (
                  <tr key={b.key}>
                    <td><input type="radio" name="backupKey" checked={selectedBackupKey===b.key} onChange={()=>setSelectedBackupKey(b.key)}/></td>
                    <td className="td-name">{b.createdAt ? new Date(b.createdAt.split(":manual")[0].split(":before")[0]).toLocaleString() : "-"}</td>
                    <td>{b.valid ? <span className="badge badge-green">정상</span> : <span className="badge badge-red">손상</span>}</td>
                    <td className="td-right td-mono">{formatBytes(b.sizeBytes)}</td>
                    <td className="td-right td-mono">{fmt(b.transactionCount)}</td>
                    <td className="td-right td-mono">{fmt(b.assetCount)}</td>
                    <td className="td-right td-mono">{fmt(b.portfolioCount)}</td>
                    <td>
                      <div className="row" style={{gap:6, flexWrap:"wrap"}}>
                        <button className="btn btn-sm btn-primary" disabled={!b.valid} onClick={()=>restoreSelectedBackup(b.key)}>복원</button>
                        <button className="btn btn-sm btn-ghost" onClick={()=>exportSelectedBackup(b.key)}>다운로드</button>
                        <button className="btn btn-sm btn-danger" onClick={()=>deleteSelectedBackup(b.key)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  let status = achievementRate >= 1 ? "시뮬레이션 참고 수치" : achievementRate >= .75 ? "목표 근접" : "투자금 증액 필요";
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
      <DisclaimerBanner context="investment"/>
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
  { id:"cfo", icon:"🏛️", label:"재무현황 요약" },
  { id:"automation", icon:"🤖", label:"자동화 시스템" },
  { section: "관리" },
  { id:"settings", icon:"⚙", label:"설정" },
  { id:"accounts", icon:"🏧", label:"계좌관리" },
  { id:"data", icon:"💾", label:"데이터·백업" },
];

const PAGE_TITLES = { dashboard:"대시보드", transactions:"거래내역", assets:"자산·부채", portfolio:"투자 포트폴리오", budget:"가계부", planning:"목표·계획", professional:"전문진단", risk:"리스크 분석", analysis:"재무분석", tax:"세금·절세", simulation:"미래 시뮬레이션", monthlyReport:"월간 리포트", decision:"의사결정 센터", goals:"목표 자금관리", cfo:"재무현황 요약", automation:"자동화 시스템", settings:"설정", accounts:"계좌관리", data:"데이터 관리" };

export {
  STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  STORAGE_BACKUP_PREFIX,
  STORAGE_TEMP_KEY,
  MAX_BACKUPS,
  MARKET_CACHE_KEY,
  MAX_MARKET_CACHE_AGE_DAYS,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  CLOUD_TABLE,
  AUTH_ID_DOMAIN,
  supabase,
  normalizeLoginId,
  isValidLoginId,
  loginIdToAuthEmail,
  displayAccountName,
  todayISO,
  thisMonthISO,
  uid,
  n,
  fmt,
  fmtPct,
  ratioToPercent,
  percentToRatio,
  clamp,
  monthOf,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_BUDGETS,
  DEFAULT_EVENTS,
  DEFAULT_ACCOUNTS,
  DEFAULT_ASSETS,
  DEFAULT_PORTFOLIO,
  STOCK_MASTER,
  normalizeSalaryLabel,
  normalizeCategories,
  emptyData,
  migrateData,
  safeParseJSON,
  isValidAppData,
  cleanupOldBackups,
  createStorageBackup,
  restoreLatestValidBackup,
  loadData,
  saveData,
  estimateJSONSizeBytes,
  formatBytes,
  getStorageBackupList,
  createManualStorageBackup,
  restoreStorageBackup,
  deleteStorageBackup,
  validateImportedAppData,
  OB_KEY,
  OB_DISCLAIMER_KEY,
  OnboardingWizard,
  polarToCartesian,
  arcPath,
  polylinePath,
  areaPath,
  MonthlyTrendChart,
  AssetDonutChart,
  AnimatedScoreBar,
  GoalGauge,
  NaturalInsightCard,
  buildIntegratedCoach,
  AICoachPanel,
  buildDashboardNLP,
  DashboardAdvicePanel,
  buildSimulationNLP,
  buildBudgetNLP,
  buildTaxNLP,
  buildPortfolioNLP,
  buildPlanningNLP,
  buildAnalysisNLP,
  AuthBar,
  ValidationMark,
  FieldHint,
  InfoTooltip,
  Field,
  normalizeReturnRate,
  calcCFOScoreFromMetrics,
  buildCFOScoreSimulation,
  modelSafeScore,
  buildCFODecisionModel,
  getEmergencyFundFromCFOData,
  getYearlyIsaContributionFromCFOData,
  buildNextCFOFlowAction,
  CFOFlowStrip,
  buildCFOActionPreview,
  CountUpNumber,
  CFODecisionDashboard,
  CFOExecutionHistoryPanel,
  detectCFOActionKind,
  defaultCFOActionForm,
  getCFOActionRuleKey,
  getCFOExecutionKey,
  getCFOExecutionDuplicateInfo,
  getAccountAssetCurrent,
  getPortfolioMarketValue,
  buildCFOExecutionVerification,
  CFOActionInputModal,
  CFOUndoToast,
  findAssetIndexByAccountName,
  ensureAssetRow,
  addToAssetCurrent,
  buildCFOInvestmentAllocation,
  applyPortfolioBuy,
  applyCFOActionToData,
  undoPortfolioBuy,
  rollbackCFOActionFromData,
  DashboardTab,
  KpiCard,
  ToastContext,
  ToastProvider,
  useToast,
  ConfirmModal,
  useConfirm,
  PrivacyModal,
  DisclaimerBanner,
  LegalFooter,
  getAccountByKeyword,
  getIsaUsedThisYear,
  validateTransactionRows,
  buildSplitTransactions,
  QuickAddModal,
  KOREAN_FINANCIAL_INSTITUTIONS,
  CARD_INSTITUTION_HINTS,
  SMS_CATEGORY_RULE_STORAGE_KEY,
  SMS_PATTERN_RULE_STORAGE_KEY,
  loadUserSmsCategoryRules,
  loadUserSmsPatternRules,
  normalizeSmsLine,
  detectSmsInstitution,
  parseSmsDate,
  extractSmsAmount,
  detectSmsType,
  extractSmsContent,
  findMatchedAccount,
  applyUserSmsPatternRules,
  parseSmsText,
  guessCategory,
  guessSubcategory,
  parseCsvText,
  ImportPanel,
  TransactionsTab,
  AssetsTab,
  CHART_COLORS,
  ChartTooltip,
  ChartTooltipPct,
  getInvestmentTargets,
  getInvestmentTargetMap,
  getWeightedExpectedReturn,
  buildAutoTriggerPlan,
  RebalanceCard,
  DipBuyAlertCard,
  AutoTriggerCard,
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
  rememberQuote,
  PortfolioTab,
  BudgetTab,
  AnalysisTab,
  calcTaxOptimization,
  taxDeadlineDate,
  buildTaxCalendar,
  buildCalendarCells,
  TAX_UPDATE_SOURCES,
  formatTaxUpdateDateTime,
  summarizeTaxUpdateStatus,
  buildTaxActionRecommendations,
  extractTaxPolicySignals,
  buildTaxCfoCoach,
  TaxCfoCoach,
  TaxActionCoach,
  TaxCalendarTimeline,
  TaxTab,
  PlanningTab,
  AutomationSystemTab,
  CFOCenterTab,
  GoalFundingTab,
  DecisionCenterTab,
  MonthlyReportTab,
  SimulationTab,
  InvestmentTargetSettings,
  SettingsTab,
  AccountsTab,
  nearEqual,
  calcAuditBadge,
  buildCalculationAudit,
  CalculationValidationCenter,
  buildSampleVerificationData,
  buildStep5VerificationRows,
  DataTab,
  pfPortfolioValue,
  pfAnnualToMonthly,
  buildProfessionalRebalance,
  buildProfessionalRisk,
  buildProfessionalGoal,
  buildProfessionalDashboard,
  ProfessionalTab,
  pct,
  DEFAULT_STRESS,
  classifyAssetClass,
  getValue,
  normalizeRows,
  portfolioVolatility,
  maxConcentration,
  stressLoss,
  makeRiskGrade,
  calculateMddRisk,
  Badge,
  MetricCard,
  ScenarioEditor,
  Step2MddRiskPanel,
  NAV,
  PAGE_TITLES,
  STYLES
};
