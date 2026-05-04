export const STORAGE_KEY = "season-dropin-final-data";
export const RECOVERY_KEY = "season-dropin-final-recovery";
export const NOTIFY_KEY = "season-dropin-final-notifications";

export const DEFAULT_DATA = {
  version: 1,
  settings: {
    emergencyTarget: 30000000,
    isaAnnualLimit: 20000000,
    monthlyInvestmentTarget: 2000000,
    riskProfile: "장기성장형",
  },
  accounts: [
    { id: "parking", name: "파킹통장", type: "asset", balance: 5000000, emergency: true },
    { id: "kofr", name: "KOFR 비상금", type: "asset", balance: 5000000, emergency: true },
    { id: "isa", name: "ISA 계좌", type: "asset", balance: 0, emergency: false },
    { id: "card", name: "신용카드", type: "liability", balance: 0, emergency: false },
  ],
  transactions: [],
  portfolio: [],
  updatedAt: "",
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateData(JSON.parse(raw)) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

export function migrateData(data = {}) {
  return {
    ...DEFAULT_DATA,
    ...data,
    version: 1,
    settings: { ...DEFAULT_DATA.settings, ...(data.settings || {}) },
    accounts: Array.isArray(data.accounts) ? data.accounts : DEFAULT_DATA.accounts,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
  };
}

export function saveData(data) {
  const next = { ...migrateData(data), updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function n(v) {
  const parsed = Number(String(v ?? "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function fmt(v) {
  return Math.round(n(v)).toLocaleString("ko-KR");
}

export function calculateSummary(data) {
  const accounts = data.accounts || [];
  const assets = accounts.filter((a) => a.type !== "liability").reduce((s, a) => s + n(a.balance), 0);
  const liabilities = accounts.filter((a) => a.type === "liability").reduce((s, a) => s + n(a.balance), 0);
  const emergency = accounts.filter((a) => a.emergency).reduce((s, a) => s + n(a.balance), 0);
  const tx = data.transactions || [];
  const month = new Date().toISOString().slice(0, 7);
  const monthTx = tx.filter((x) => String(x.date || "").startsWith(month));
  const income = monthTx.filter((x) => x.direction === "income").reduce((s, x) => s + n(x.amount), 0);
  const expense = monthTx.filter((x) => ["expense", "liability"].includes(x.direction)).reduce((s, x) => s + n(x.amount), 0);
  const isaPaid = tx.filter((x) => new Date(x.date).getFullYear() === new Date().getFullYear() && x.purpose === "ISA").reduce((s, x) => s + n(x.amount), 0);
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    emergency,
    emergencyRate: n(data.settings.emergencyTarget) ? Math.min(100, Math.round((emergency / n(data.settings.emergencyTarget)) * 100)) : 0,
    income,
    expense,
    cashflow: income - expense,
    isaPaid,
    isaRemain: Math.max(0, n(data.settings.isaAnnualLimit) - isaPaid),
    month,
  };
}

export function validateSplitInput(data, draft) {
  const errors = [];
  const warnings = [];
  const total = n(draft.total);
  const rows = draft.rows || [];
  const rowTotal = rows.reduce((s, r) => s + n(r.amount), 0);
  const accounts = new Set((data.accounts || []).map((a) => a.name));

  if (!draft.date) errors.push("날짜를 입력하세요.");
  if (total <= 0) errors.push("총액은 0보다 커야 합니다.");
  if (!rows.length) errors.push("분배 행이 없습니다.");
  if (total !== rowTotal) errors.push(`총액 ${fmt(total)}원과 분배합계 ${fmt(rowTotal)}원이 다릅니다.`);

  rows.forEach((r, i) => {
    if (!r.direction) errors.push(`${i + 1}번째 행의 방향이 없습니다.`);
    if (!r.purpose) errors.push(`${i + 1}번째 행의 목적이 없습니다.`);
    if (n(r.amount) <= 0) errors.push(`${i + 1}번째 행의 금액이 올바르지 않습니다.`);
    if (r.from && !accounts.has(r.from)) warnings.push(`${r.from} 계좌가 등록되어 있지 않습니다.`);
    if (r.to && !accounts.has(r.to)) warnings.push(`${r.to} 계좌가 등록되어 있지 않습니다.`);
    if (r.direction === "transfer" && r.from && r.to && r.from === r.to) errors.push(`${i + 1}번째 행의 출금/입금 계좌가 같습니다.`);
  });

  const year = new Date(draft.date || new Date()).getFullYear();
  const existingIsa = (data.transactions || [])
    .filter((tx) => new Date(tx.date).getFullYear() === year && tx.purpose === "ISA")
    .reduce((s, tx) => s + n(tx.amount), 0);
  const incomingIsa = rows.filter((r) => r.purpose === "ISA").reduce((s, r) => s + n(r.amount), 0);
  if (existingIsa + incomingIsa > n(data.settings.isaAnnualLimit)) {
    errors.push(`ISA 한도 초과: 기존 ${fmt(existingIsa)}원 + 입력 ${fmt(incomingIsa)}원 > 한도 ${fmt(data.settings.isaAnnualLimit)}원`);
  }

  const summary = calculateSummary(data);
  if (summary.emergencyRate < 100 && rows.some((r) => ["ISA", "일반투자"].includes(r.purpose))) {
    warnings.push(`비상금 목표 달성률이 ${summary.emergencyRate}%입니다. 투자 입력이 의도한 것인지 확인하세요.`);
  }

  return { errors, warnings };
}

export function applySplitInput(data, draft) {
  const txs = draft.rows.map((r) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: draft.date,
    direction: r.direction,
    purpose: r.purpose,
    from: r.from || "",
    to: r.to || "",
    amount: n(r.amount),
    memo: draft.memo || "",
    createdAt: new Date().toISOString(),
  }));

  const accounts = (data.accounts || []).map((acc) => {
    let balance = n(acc.balance);
    for (const tx of txs) {
      if (tx.from === acc.name) balance -= tx.amount;
      if (tx.to === acc.name) balance += tx.amount;
      if (tx.direction === "expense" && tx.from === acc.name) balance -= tx.amount;
      if (tx.direction === "income" && tx.to === acc.name) balance += tx.amount;
      if (tx.direction === "liability" && tx.to === acc.name) balance += tx.amount;
    }
    return { ...acc, balance };
  });

  return saveData({ ...data, accounts, transactions: [...txs, ...(data.transactions || [])] });
}

export function dataQuality(data) {
  let score = 100;
  const issues = [];
  if (!(data.accounts || []).length) {
    score -= 25;
    issues.push({ level: "error", title: "계좌 없음", message: "계좌가 없으면 분석이 불가능합니다." });
  }
  if (!(data.transactions || []).length) {
    score -= 15;
    issues.push({ level: "warn", title: "거래 없음", message: "거래 입력이 아직 없습니다." });
  }
  const badTx = (data.transactions || []).filter((tx) => !tx.date || !tx.amount || !tx.purpose).length;
  if (badTx) {
    score -= Math.min(30, badTx * 5);
    issues.push({ level: "error", title: "거래 데이터 누락", message: `${badTx}건의 거래에 날짜/금액/목적 누락이 있습니다.` });
  }
  return { score: Math.max(0, Math.round(score)), level: score >= 85 ? "ok" : score >= 70 ? "warn" : "error", issues };
}

export function makeReport(data) {
  const s = calculateSummary(data);
  const q = dataQuality(data);
  return {
    title: `${s.month} CFO 리포트`,
    conclusion: s.cashflow >= 0 ? "이번 달 현금흐름은 양호합니다." : "이번 달 현금흐름이 음수입니다. 지출과 카드 사용을 점검해야 합니다.",
    evidence: [
      `순자산 ${fmt(s.netWorth)}원`,
      `이번 달 순현금흐름 ${fmt(s.cashflow)}원`,
      `비상금 달성률 ${s.emergencyRate}%`,
      `ISA 잔여 한도 ${fmt(s.isaRemain)}원`,
      `데이터 품질 점수 ${q.score}점`,
    ],
    nextActions: [
      "누락된 거래를 먼저 확인하세요.",
      s.emergencyRate < 100 ? "비상금 목표 달성 전까지 투자금 일부를 비상금으로 배분할지 검토하세요." : "비상금 목표가 충족되었으므로 투자 자동화 비중을 점검하세요.",
      "ISA 연간 납입 한도와 실제 납입액을 확인하세요.",
      "월말에 JSON 또는 암호화 백업을 저장하세요.",
    ],
    cautions: ["입력된 데이터 기준의 참고용 리포트입니다.", "투자·세금 판단은 최신 제도와 개인 상황에 따라 달라질 수 있습니다."],
    confidence: (data.transactions || []).length >= 10 ? "medium" : "low",
  };
}

export function createRecovery(data, reason = "manual") {
  const item = { id: `${Date.now()}`, reason, createdAt: new Date().toISOString(), payload: data, summary: summarizeData(data) };
  const next = [item, ...getRecoveries()].slice(0, 30);
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(next));
  return item;
}

export function getRecoveries() {
  try { return JSON.parse(localStorage.getItem(RECOVERY_KEY) || "[]"); } catch { return []; }
}

export function summarizeData(data) {
  return {
    version: data.version,
    accounts: (data.accounts || []).length,
    transactions: (data.transactions || []).length,
    portfolio: (data.portfolio || []).length,
    updatedAt: data.updatedAt || "",
  };
}

export function addNotification(type, title, message) {
  const item = { id: `${Date.now()}`, type, title, message, read: false, createdAt: new Date().toISOString() };
  const next = [item, ...getNotifications()].slice(0, 100);
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
  return item;
}

export function getNotifications() {
  try { return JSON.parse(localStorage.getItem(NOTIFY_KEY) || "[]"); } catch { return []; }
}

export function clearNotifications() {
  localStorage.removeItem(NOTIFY_KEY);
}

export function exportJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJson(file) {
  return migrateData(JSON.parse(await file.text()));
}

export async function encryptData(data, password) {
  if (!password || password.length < 8) throw new Error("암호는 8자 이상이어야 합니다.");
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  return { version: 1, algorithm: "AES-GCM", salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(encrypted)), createdAt: new Date().toISOString() };
}

export async function decryptData(encrypted, password) {
  const dec = new TextDecoder();
  const key = await deriveKey(password, fromB64(encrypted.salt), ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(encrypted.iv) }, key, fromB64(encrypted.ciphertext));
  return migrateData(JSON.parse(dec.decode(plain)));
}

async function deriveKey(password, salt, usages) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, usages);
}

function b64(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromB64(str) {
  const binary = atob(str);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}
