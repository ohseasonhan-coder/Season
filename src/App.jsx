import React, { useMemo, useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from "recharts";
import {
  LayoutDashboard, Wallet, PiggyBank, Landmark, TrendingUp, CalendarClock,
  ShieldCheck, Settings, Download, Upload, RefreshCcw, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight, Plus, Trash2, Sparkles,
  FileText, Banknote, ReceiptText, Car, Home, Database, Calculator
} from "lucide-react";

const STORAGE_KEY = "personal-cfo-electron-complete-v6";

const won = (n) => {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "0원";
  return new Intl.NumberFormat("ko-KR").format(Math.round(v)) + "원";
};

const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const safeNumber = (v, fallback = 0) => {
  const n = Number(String(v ?? "").replaceAll(",", ""));
  return Number.isFinite(n) ? n : fallback;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultData = {
  profile: {
    name: "한승훈",
    birthYear: 1989,
    targetRetireAge: 55,
    currentYear: 2026,
    annualReturnBase: 8,
    annualReturnBull: 12,
    annualReturnBear: 5,
    targetNetWorth: 2000000000,
    monthlyIncome: 4500000,
    monthlyFixedExpense: 2200000,
    monthlyVariableExpense: 500000,
    monthlyInvestment: 2000000,
    veteransPension: 1770000,
    pensionLodgeRent: 0
  },
  emergency: {
    target: 30000000,
    kofrRatio: 70,
    parkingRatio: 30,
    currentKofr: 7000000,
    currentParking: 3000000,
    monthlyPlan: 500000
  },
  isa: {
    openedYear: 2026,
    annualLimit: 20000000,
    currentValue: 6500000,
    yearlyContribution: 6500000,
    monthlyPlan: 1500000,
    maturityYears: 5,
    pensionTransferPlan: 30000000,
    nextIsaSeed: 20000000
  },
  tax: {
    pensionSavingLimit: 6000000,
    irpLimit: 3000000,
    currentPensionSaving: 0,
    currentIrp: 0,
    expectedCreditRate: 13.2
  },
  assets: [
    { id: uid(), name: "ISA 나스닥100 환노출", type: "투자", category: "나스닥100", value: 3500000, targetRatio: 45 },
    { id: uid(), name: "ISA 나스닥100 환헤지", type: "투자", category: "나스닥100(H)", value: 2500000, targetRatio: 45 },
    { id: uid(), name: "미국배당다우존스", type: "투자", category: "배당ETF", value: 500000, targetRatio: 10 },
    { id: uid(), name: "KOFR 비상금", type: "현금성", category: "비상금", value: 7000000, targetRatio: 0 },
    { id: uid(), name: "파킹통장", type: "현금성", category: "비상금", value: 3000000, targetRatio: 0 }
  ],
  debts: [
    { id: uid(), name: "BMW i4 차량 할부", type: "차량", value: 28000000, monthlyPayment: 708000, memo: "4년 후 잔존가치 가정" }
  ],
  transactions: [
    { id: uid(), date: "2026-04-01", account: "급여", category: "수입", subcategory: "급여", amount: 4500000, memo: "월급" },
    { id: uid(), date: "2026-04-02", account: "ISA", category: "투자", subcategory: "나스닥100", amount: -1500000, memo: "월 투자" },
    { id: uid(), date: "2026-04-03", account: "비상금", category: "저축", subcategory: "KOFR/파킹", amount: -500000, memo: "비상금 적립" },
    { id: uid(), date: "2026-04-10", account: "생활비", category: "지출", subcategory: "식비", amount: -650000, memo: "생활비" }
  ]
};

function calc(data) {
  const assetsTotal = data.assets.reduce((s, a) => s + safeNumber(a.value), 0);
  const debtsTotal = data.debts.reduce((s, d) => s + safeNumber(d.value), 0);
  const netWorth = assetsTotal - debtsTotal;
  const emergencyTotal = safeNumber(data.emergency.currentKofr) + safeNumber(data.emergency.currentParking);
  const emergencyRate = Math.min(100, emergencyTotal / safeNumber(data.emergency.target, 1) * 100);
  const income = safeNumber(data.profile.monthlyIncome) + safeNumber(data.profile.veteransPension) + safeNumber(data.profile.pensionLodgeRent);
  const expenses = safeNumber(data.profile.monthlyFixedExpense) + safeNumber(data.profile.monthlyVariableExpense);
  const invest = safeNumber(data.profile.monthlyInvestment);
  const debtPay = data.debts.reduce((s,d)=>s+safeNumber(d.monthlyPayment),0);
  const monthlySurplus = income - expenses - invest - safeNumber(data.emergency.monthlyPlan) - debtPay;
  const isaRemaining = Math.max(0, safeNumber(data.isa.annualLimit) - safeNumber(data.isa.yearlyContribution));
  const investAssets = data.assets.filter(a => a.type === "투자");
  const investTotal = investAssets.reduce((s, a) => s + safeNumber(a.value), 0);
  const cashTotal = data.assets.filter(a => a.type === "현금성").reduce((s, a) => s + safeNumber(a.value), 0);
  const taxPaid = safeNumber(data.tax.currentPensionSaving) + safeNumber(data.tax.currentIrp);
  const taxLimit = safeNumber(data.tax.pensionSavingLimit) + safeNumber(data.tax.irpLimit);
  const expectedTaxCredit = Math.min(taxPaid, taxLimit) * safeNumber(data.tax.expectedCreditRate) / 100;

  const emergencyScore = Math.round(Math.min(100, emergencyRate));
  const cashflowScore = Math.max(0, Math.min(100, monthlySurplus >= 0 ? 85 + Math.min(15, monthlySurplus / 100000) : 60 + monthlySurplus / 100000));
  const debtScore = Math.max(0, Math.min(100, debtsTotal === 0 ? 100 : 100 - (debtsTotal / Math.max(assetsTotal, 1)) * 60));
  const investScore = Math.max(0, Math.min(100, invest / Math.max(income, 1) * 180));
  const isaScore = Math.max(0, Math.min(100, safeNumber(data.isa.yearlyContribution) / safeNumber(data.isa.annualLimit, 1) * 100));
  const retireScore = Math.max(0, Math.min(100, Math.max(0, netWorth) / safeNumber(data.profile.targetNetWorth, 1) * 100));
  const taxScore = Math.max(0, Math.min(100, taxPaid / Math.max(taxLimit,1) * 100));
  const totalScore = Math.round(emergencyScore * .2 + cashflowScore * .18 + debtScore * .16 + investScore * .16 + isaScore * .1 + retireScore * .1 + taxScore * .1);

  return { assetsTotal, debtsTotal, netWorth, emergencyTotal, emergencyRate, income, expenses, invest, debtPay, monthlySurplus, isaRemaining, investTotal, cashTotal, expectedTaxCredit, taxLimit, taxPaid, scores: { emergencyScore, cashflowScore, debtScore, investScore, isaScore, retireScore, taxScore, totalScore } };
}

function projectFuture({ current, monthly, annualReturn, years }) {
  const r = annualReturn / 100 / 12;
  const months = years * 12;
  let value = current;
  for (let i = 0; i < months; i++) value = value * (1 + r) + monthly;
  return value;
}

function usePersistentState() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData;
      const parsed = JSON.parse(raw);
      return { ...defaultData, ...parsed, profile: {...defaultData.profile, ...(parsed.profile||{})}, emergency:{...defaultData.emergency, ...(parsed.emergency||{})}, isa:{...defaultData.isa, ...(parsed.isa||{})}, tax:{...defaultData.tax, ...(parsed.tax||{})} };
    } catch {
      return defaultData;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);
  return [data, setData];
}

function Card({ children, className = "" }) { return <div className={`card ${className}`}>{children}</div>; }
function Stat({ title, value, sub, tone = "" }) { return <Card className={`stat ${tone}`}><p>{title}</p><h3>{value}</h3>{sub && <span>{sub}</span>}</Card>; }
function SectionTitle({ icon: Icon, title, desc }) { return <div className="section-title"><div className="section-icon"><Icon size={18} /></div><div><h2>{title}</h2>{desc && <p>{desc}</p>}</div></div>; }

const menu = [
  ["dashboard", "대시보드", LayoutDashboard],
  ["cashflow", "현금흐름", Wallet],
  ["accounts", "자산/부채", Database],
  ["emergency", "비상금", PiggyBank],
  ["isa", "ISA", Landmark],
  ["portfolio", "투자분석", TrendingUp],
  ["retirement", "은퇴", CalendarClock],
  ["tax", "세금/연금", ReceiptText],
  ["decision", "의사결정", Sparkles],
  ["report", "월간리포트", FileText],
  ["settings", "설정/백업", Settings]
];

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
    <div className="brand"><div className="brand-logo">C</div>{!collapsed && <div><b>Personal CFO</b><span>Electron Complete v6</span></div>}</div>
    <button className="collapse" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>
    <nav>{menu.map(([key, label, Icon]) => <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)} title={label}><Icon size={19}/>{!collapsed && <span>{label}</span>}</button>)}</nav>
  </aside>;
}

function Dashboard({ data, m }) {
  const assetPie = [{ name: "투자자산", value: m.investTotal }, { name: "현금성", value: m.cashTotal }, { name: "부채", value: m.debtsTotal }];
  const scoreData = [
    { name: "비상금", score: m.scores.emergencyScore }, { name: "현금흐름", score: m.scores.cashflowScore },
    { name: "부채", score: m.scores.debtScore }, { name: "투자", score: m.scores.investScore },
    { name: "ISA", score: m.scores.isaScore }, { name: "세금", score: m.scores.taxScore }, { name: "은퇴", score: m.scores.retireScore }
  ];
  return <div className="page">
    <SectionTitle icon={LayoutDashboard} title="전체 대시보드" desc="순자산, 현금흐름, 투자, 비상금, ISA, 세금, 은퇴 준비를 한 화면에서 봅니다." />
    <div className="grid stats-grid">
      <Stat title="총자산" value={won(m.assetsTotal)} sub="투자 + 현금성 자산" />
      <Stat title="총부채" value={won(m.debtsTotal)} sub="차량 할부 등" tone="warn" />
      <Stat title="순자산" value={won(m.netWorth)} sub={`목표 대비 ${pct(m.scores.retireScore)}`} tone="good" />
      <Stat title="CFO 점수" value={`${m.scores.totalScore}점`} sub={m.scores.totalScore >= 80 ? "매우 양호" : "보완 필요"} tone="premium" />
    </div>
    <div className="grid two">
      <Card><h3>자산 구성</h3><div className="chart"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={assetPie} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>{assetPie.map((_, i) => <Cell key={i} />)}</Pie><Tooltip formatter={(v) => won(v)} /></PieChart></ResponsiveContainer></div></Card>
      <Card><h3>CFO 세부 점수</h3><div className="chart"><ResponsiveContainer width="100%" height={260}><BarChart data={scoreData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="score" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></Card>
    </div>
    <Advice data={data} m={m} />
  </div>;
}

function Advice({ data, m }) {
  const items = [];
  if (m.emergencyRate < 50) items.push(["비상금 우선", `비상금 달성률이 ${pct(m.emergencyRate)}입니다. 투자 확대보다 비상금 3,000만원 달성을 먼저 관리하세요.`, "warn"]);
  else items.push(["비상금 안정", `비상금 달성률이 ${pct(m.emergencyRate)}입니다. KOFR 70% / 파킹 30% 구조를 유지하세요.`, "good"]);
  if (m.isaRemaining > 0) items.push(["ISA 한도", `올해 ISA 잔여 한도는 ${won(m.isaRemaining)}입니다. 월별 납입 계획으로 분산하세요.`, "premium"]);
  if (m.monthlySurplus < 0) items.push(["현금흐름 경고", `투자·저축·부채상환 후 월 현금흐름이 ${won(m.monthlySurplus)}입니다. 변동지출 또는 투자액 조정이 필요합니다.`, "warn"]);
  else items.push(["현금흐름 양호", `투자·저축·부채상환 후에도 ${won(m.monthlySurplus)}의 여유가 있습니다.`, "good"]);
  if (m.taxPaid < m.taxLimit) items.push(["연금/IRP", `연금저축·IRP 세액공제 한도 중 ${won(m.taxLimit - m.taxPaid)}가 남아 있습니다.`, "neutral"]);
  return <Card><h3>자동 조언 카드</h3><div className="advice-list">{items.map(([title, body, tone], i) => <div className={`advice ${tone}`} key={i}>{tone === "warn" ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}<div><b>{title}</b><p>{body}</p></div></div>)}</div></Card>;
}

function Cashflow({ data, setData, m }) {
  const monthly = [
    { month: "1월", income: 430, expense: 250, invest: 150, debt: 70 },
    { month: "2월", income: 450, expense: 260, invest: 170, debt: 70 },
    { month: "3월", income: 455, expense: 270, invest: 180, debt: 70 },
    { month: "4월", income: m.income/10000, expense: m.expenses/10000, invest: m.invest/10000, debt: m.debtPay/10000 }
  ];
  const addRow = () => setData(d => ({...d, transactions: [{ id: uid(), date: "2026-05-01", account: "입력", category: "지출", subcategory: "기타", amount: -10000, memo: "" }, ...d.transactions]}));
  return <div className="page"><SectionTitle icon={Wallet} title="월간 현금흐름" desc="수입, 지출, 저축, 투자, 부채상환, 순현금흐름을 분리해서 봅니다." />
    <div className="grid stats-grid"><Stat title="월 수입" value={won(m.income)} sub="급여 + 보훈연금 + 임대" /><Stat title="월 지출" value={won(m.expenses)} sub="고정 + 변동" tone="warn" /><Stat title="월 부채상환" value={won(m.debtPay)} sub="할부/대출" tone="warn" /><Stat title="투자 후 여유" value={won(m.monthlySurplus)} sub="마이너스면 조정 필요" tone={m.monthlySurplus >= 0 ? "good" : "warn"} /></div>
    <Card><h3>월별 추이</h3><div className="chart"><ResponsiveContainer width="100%" height={280}><AreaChart data={monthly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Area dataKey="income" name="수입(만원)" /><Area dataKey="expense" name="지출(만원)" /><Area dataKey="invest" name="투자(만원)" /><Area dataKey="debt" name="부채상환(만원)" /></AreaChart></ResponsiveContainer></div></Card>
    <EditableTable title="거래내역" rows={data.transactions} setRows={(transactions)=>setData(d=>({...d, transactions}))} columns={["date","account","category","subcategory","amount","memo"]} onAdd={addRow} />
  </div>;
}

function Accounts({ data, setData, m }) {
  const addAsset = () => setData(d=>({...d, assets:[...d.assets, {id:uid(), name:"새 자산", type:"현금성", category:"기타", value:0, targetRatio:0}]}));
  const addDebt = () => setData(d=>({...d, debts:[...d.debts, {id:uid(), name:"새 부채", type:"기타", value:0, monthlyPayment:0, memo:""}]}));
  return <div className="page"><SectionTitle icon={Database} title="자산 / 부채" desc="은행계좌, 주식계좌, 자동차, 부동산, 부채를 기본 데이터로 관리합니다." />
    <div className="grid stats-grid"><Stat title="자산 합계" value={won(m.assetsTotal)} /><Stat title="부채 합계" value={won(m.debtsTotal)} tone="warn"/><Stat title="순자산" value={won(m.netWorth)} tone="good"/><Stat title="부채상환액" value={won(m.debtPay)} /></div>
    <EditableTable title="자산 목록" rows={data.assets} setRows={(assets)=>setData(d=>({...d, assets}))} columns={["name","type","category","value","targetRatio"]} onAdd={addAsset} />
    <EditableTable title="부채 목록" rows={data.debts} setRows={(debts)=>setData(d=>({...d, debts}))} columns={["name","type","value","monthlyPayment","memo"]} onAdd={addDebt} />
  </div>;
}

function Emergency({ data, setData, m }) {
  const target = safeNumber(data.emergency.target);
  const kofrTarget = target * safeNumber(data.emergency.kofrRatio) / 100;
  const parkingTarget = target * safeNumber(data.emergency.parkingRatio) / 100;
  const months = Math.ceil(Math.max(0, target - m.emergencyTotal) / Math.max(1, safeNumber(data.emergency.monthlyPlan)));
  return <div className="page"><SectionTitle icon={PiggyBank} title="비상금 관리" desc="비상금은 ISA와 분리하여 KOFR 70% / 파킹 30%로 관리합니다." />
    <div className="grid stats-grid"><Stat title="비상금 현재" value={won(m.emergencyTotal)} sub={`달성률 ${pct(m.emergencyRate)}`} tone="good" /><Stat title="목표금액" value={won(target)} /><Stat title="부족금액" value={won(Math.max(0, target - m.emergencyTotal))} sub={`예상 ${months}개월`} tone="warn" /><Stat title="월 적립" value={won(data.emergency.monthlyPlan)} sub="투자와 별도" tone="premium" /></div>
    <Card><h3>비상금 입력</h3><FormGrid><NumberInput label="KOFR 현재금액" value={data.emergency.currentKofr} onChange={v=>setData(d=>({...d, emergency:{...d.emergency, currentKofr:v}}))}/><NumberInput label="파킹통장 현재금액" value={data.emergency.currentParking} onChange={v=>setData(d=>({...d, emergency:{...d.emergency, currentParking:v}}))}/><NumberInput label="목표금액" value={data.emergency.target} onChange={v=>setData(d=>({...d, emergency:{...d.emergency, target:v}}))}/><NumberInput label="월 적립액" value={data.emergency.monthlyPlan} onChange={v=>setData(d=>({...d, emergency:{...d.emergency, monthlyPlan:v}}))}/></FormGrid></Card>
    <div className="grid two"><Stat title="KOFR 목표" value={won(kofrTarget)} sub={`현재 ${won(data.emergency.currentKofr)}`} /><Stat title="파킹 목표" value={won(parkingTarget)} sub={`현재 ${won(data.emergency.currentParking)}`} /></div>
  </div>;
}

function ISA({ data, setData, m }) {
  const years = safeNumber(data.isa.maturityYears);
  const projected = projectFuture({ current: safeNumber(data.isa.currentValue), monthly: safeNumber(data.isa.monthlyPlan), annualReturn: safeNumber(data.profile.annualReturnBase), years });
  return <div className="page"><SectionTitle icon={Landmark} title="ISA 계좌" desc="ISA 납입, 잔여 한도, 만기 이전 계획을 별도 관리합니다." />
    <div className="grid stats-grid"><Stat title="ISA 현재 평가금액" value={won(data.isa.currentValue)} /><Stat title="올해 납입액" value={won(data.isa.yearlyContribution)} /><Stat title="잔여 한도" value={won(m.isaRemaining)} tone="premium" /><Stat title={`${years}년 예상`} value={won(projected)} tone="good" /></div>
    <Card><h3>ISA 입력</h3><FormGrid><NumberInput label="현재 평가금액" value={data.isa.currentValue} onChange={v=>setData(d=>({...d, isa:{...d.isa, currentValue:v}}))}/><NumberInput label="올해 납입액" value={data.isa.yearlyContribution} onChange={v=>setData(d=>({...d, isa:{...d.isa, yearlyContribution:v}}))}/><NumberInput label="연 납입한도" value={data.isa.annualLimit} onChange={v=>setData(d=>({...d, isa:{...d.isa, annualLimit:v}}))}/><NumberInput label="월 납입계획" value={data.isa.monthlyPlan} onChange={v=>setData(d=>({...d, isa:{...d.isa, monthlyPlan:v}}))}/><NumberInput label="연금저축 이전계획" value={data.isa.pensionTransferPlan} onChange={v=>setData(d=>({...d, isa:{...d.isa, pensionTransferPlan:v}}))}/><NumberInput label="새 ISA 시드" value={data.isa.nextIsaSeed} onChange={v=>setData(d=>({...d, isa:{...d.isa, nextIsaSeed:v}}))}/></FormGrid></Card>
  </div>;
}

function Portfolio({ data, setData, m }) {
  const investments = data.assets.filter(a=>a.type === "투자");
  const chart = investments.map(a => ({ name: a.category, value: safeNumber(a.value), target: safeNumber(a.targetRatio), current: m.investTotal ? safeNumber(a.value)/m.investTotal*100 : 0 }));
  return <div className="page"><SectionTitle icon={TrendingUp} title="투자 포트폴리오 분석" desc="현재 비중, 목표 비중, 리밸런싱 차이를 확인합니다." />
    <div className="grid stats-grid"><Stat title="투자자산" value={won(m.investTotal)} /><Stat title="현금성 자산" value={won(m.cashTotal)} /><Stat title="성장자산 비중" value={pct(chart.filter(x=>x.name.includes("나스닥")).reduce((s,x)=>s+x.current,0))} tone="premium" /><Stat title="배당 비중" value={pct(chart.filter(x=>x.name.includes("배당")).reduce((s,x)=>s+x.current,0))} /></div>
    <Card><h3>현재 비중 vs 목표 비중</h3><div className="chart"><ResponsiveContainer width="100%" height={300}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v)=>pct(v)}/><Bar dataKey="current" name="현재비중" radius={[8,8,0,0]}/><Bar dataKey="target" name="목표비중" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></Card>
  </div>;
}

function Retirement({ data, setData, m }) {
  const currentAge = safeNumber(data.profile.currentYear) - safeNumber(data.profile.birthYear);
  const years = Math.max(0, safeNumber(data.profile.targetRetireAge) - currentAge);
  const monthlyWithPension = m.invest + safeNumber(data.profile.veteransPension);
  const scenarios = [
    { name: "보수 5%", value: projectFuture({ current:Math.max(0,m.netWorth), monthly:monthlyWithPension, annualReturn:5, years }) },
    { name: "기준 8%", value: projectFuture({ current:Math.max(0,m.netWorth), monthly:monthlyWithPension, annualReturn:8, years }) },
    { name: "공격 12%", value: projectFuture({ current:Math.max(0,m.netWorth), monthly:monthlyWithPension, annualReturn:12, years }) },
    { name: "잃어버린 10년", value: projectFuture({ current:Math.max(0,m.netWorth), monthly:m.invest, annualReturn:2, years }) }
  ];
  const line = Array.from({length: years+1}, (_,i)=>({ year: data.profile.currentYear + i, "5%": projectFuture({current:Math.max(0,m.netWorth), monthly:m.invest, annualReturn:5, years:i})/100000000, "8%": projectFuture({current:Math.max(0,m.netWorth), monthly:m.invest, annualReturn:8, years:i})/100000000, "12%": projectFuture({current:Math.max(0,m.netWorth), monthly:m.invest, annualReturn:12, years:i})/100000000 }));
  return <div className="page"><SectionTitle icon={CalendarClock} title="은퇴 시뮬레이션" desc="55세 목표 기준으로 수익률별 예상 순자산을 비교합니다." />
    <div className="grid stats-grid"><Stat title="현재 나이" value={`${currentAge}세`} /><Stat title="은퇴 목표" value={`${data.profile.targetRetireAge}세`} /><Stat title="남은 기간" value={`${years}년`} /><Stat title="목표자산" value={won(data.profile.targetNetWorth)} tone="premium" /></div>
    <Card><h3>수익률별 예상 순자산</h3><div className="scenario-grid">{scenarios.map(s=><div className="scenario" key={s.name}><b>{s.name}</b><p>{won(s.value)}</p></div>)}</div></Card>
    <Card><h3>연도별 예상 추이</h3><div className="chart"><ResponsiveContainer width="100%" height={320}><LineChart data={line}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year"/><YAxis unit="억"/><Tooltip/><Line type="monotone" dataKey="5%" /><Line type="monotone" dataKey="8%" /><Line type="monotone" dataKey="12%" /></LineChart></ResponsiveContainer></div></Card>
    <Card><h3>기본값 입력</h3><FormGrid><NumberInput label="출생연도" value={data.profile.birthYear} onChange={v=>setData(d=>({...d, profile:{...d.profile, birthYear:v}}))}/><NumberInput label="현재연도" value={data.profile.currentYear} onChange={v=>setData(d=>({...d, profile:{...d.profile, currentYear:v}}))}/><NumberInput label="은퇴 목표나이" value={data.profile.targetRetireAge} onChange={v=>setData(d=>({...d, profile:{...d.profile, targetRetireAge:v}}))}/><NumberInput label="목표 순자산" value={data.profile.targetNetWorth} onChange={v=>setData(d=>({...d, profile:{...d.profile, targetNetWorth:v}}))}/><NumberInput label="월 투자금" value={data.profile.monthlyInvestment} onChange={v=>setData(d=>({...d, profile:{...d.profile, monthlyInvestment:v}}))}/><NumberInput label="보훈연금" value={data.profile.veteransPension} onChange={v=>setData(d=>({...d, profile:{...d.profile, veteransPension:v}}))}/></FormGrid></Card>
  </div>;
}

function Tax({ data, setData, m }) {
  return <div className="page"><SectionTitle icon={ReceiptText} title="세금 / 연금 코치" desc="연금저축, IRP, 세액공제 예상액을 관리합니다." />
    <div className="grid stats-grid"><Stat title="공제 납입액" value={won(m.taxPaid)} /><Stat title="공제 한도" value={won(m.taxLimit)} /><Stat title="남은 한도" value={won(Math.max(0,m.taxLimit-m.taxPaid))} tone="premium" /><Stat title="예상 세액공제" value={won(m.expectedTaxCredit)} tone="good" /></div>
    <Card><h3>연금/IRP 입력</h3><FormGrid><NumberInput label="연금저축 한도" value={data.tax.pensionSavingLimit} onChange={v=>setData(d=>({...d, tax:{...d.tax, pensionSavingLimit:v}}))}/><NumberInput label="IRP 한도" value={data.tax.irpLimit} onChange={v=>setData(d=>({...d, tax:{...d.tax, irpLimit:v}}))}/><NumberInput label="연금저축 납입액" value={data.tax.currentPensionSaving} onChange={v=>setData(d=>({...d, tax:{...d.tax, currentPensionSaving:v}}))}/><NumberInput label="IRP 납입액" value={data.tax.currentIrp} onChange={v=>setData(d=>({...d, tax:{...d.tax, currentIrp:v}}))}/><NumberInput label="세액공제율(%)" value={data.tax.expectedCreditRate} onChange={v=>setData(d=>({...d, tax:{...d.tax, expectedCreditRate:v}}))}/></FormGrid></Card>
  </div>
}

function Decision({ data, m }) {
  const decisions = [
    { title: "이번 달 1순위", body: m.emergencyRate < 70 ? "비상금 보강을 우선하세요. ISA 추가 납입은 여유 현금흐름 안에서 진행하는 편이 안정적입니다." : "비상금이 안정권에 들어왔습니다. ISA 한도 소진과 투자 지속률 관리가 핵심입니다." },
    { title: "투자 지속성", body: m.monthlySurplus >= 0 ? "현재 월 투자금은 현금흐름상 유지 가능합니다." : "현재 월 투자금은 현금흐름을 압박합니다. 일시적으로 투자액을 낮추는 선택지도 필요합니다." },
    { title: "리스크", body: "나스닥100 90% 구조는 장기 성장 기대가 크지만 하락장 체감 손실도 큽니다. 비상금과 배당ETF 비중이 심리적 방어막 역할을 합니다." },
    { title: "세금/연금", body: "ISA 만기 후 연금저축 이전 계획은 장기 절세 구조에 유리할 수 있습니다. 연말정산 한도와 납입 여력을 같이 확인하세요." }
  ];
  return <div className="page"><SectionTitle icon={Sparkles} title="의사결정 센터" desc="숫자를 바탕으로 이번 달 행동 우선순위를 제안합니다." /><div className="decision-list">{decisions.map((d,i)=><Card key={i}><h3>{d.title}</h3><p>{d.body}</p></Card>)}</div></div>;
}

function Report({ data, m }) {
  return <div className="page"><SectionTitle icon={FileText} title="월간 리포트" desc="현재 입력값 기준 자동 요약입니다." />
    <Card><h3>이번 달 재무 요약</h3><p className="report-text">현재 총자산은 <b>{won(m.assetsTotal)}</b>, 총부채는 <b>{won(m.debtsTotal)}</b>, 순자산은 <b>{won(m.netWorth)}</b>입니다. 비상금은 <b>{won(m.emergencyTotal)}</b>으로 목표 대비 <b>{pct(m.emergencyRate)}</b> 달성했습니다. 월 수입은 <b>{won(m.income)}</b>, 월 지출은 <b>{won(m.expenses)}</b>, 월 투자금은 <b>{won(m.invest)}</b>, 월 부채상환은 <b>{won(m.debtPay)}</b>이며, 투자와 비상금 적립 후 예상 여유 현금흐름은 <b>{won(m.monthlySurplus)}</b>입니다. CFO 종합점수는 <b>{m.scores.totalScore}점</b>입니다.</p></Card>
    <Advice data={data} m={m}/>
  </div>;
}

function SettingsPage({ data, setData }) {
  const [text, setText] = useState("");
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "personal-cfo-backup.json"; a.click(); URL.revokeObjectURL(url);
  };
  const importData = () => {
    try { const parsed = JSON.parse(text); setData({...defaultData, ...parsed}); alert("복원 완료"); } catch { alert("JSON 형식이 올바르지 않습니다."); }
  };
  return <div className="page"><SectionTitle icon={Settings} title="설정 / 백업 / 복원" desc="앱 데이터는 브라우저 또는 Electron localStorage에 저장됩니다." />
    <Card><h3>기본 현금흐름 설정</h3><FormGrid><NumberInput label="월급" value={data.profile.monthlyIncome} onChange={v=>setData(d=>({...d, profile:{...d.profile, monthlyIncome:v}}))}/><NumberInput label="보훈연금" value={data.profile.veteransPension} onChange={v=>setData(d=>({...d, profile:{...d.profile, veteransPension:v}}))}/><NumberInput label="펜션 임대수입" value={data.profile.pensionLodgeRent} onChange={v=>setData(d=>({...d, profile:{...d.profile, pensionLodgeRent:v}}))}/><NumberInput label="고정지출" value={data.profile.monthlyFixedExpense} onChange={v=>setData(d=>({...d, profile:{...d.profile, monthlyFixedExpense:v}}))}/><NumberInput label="변동지출" value={data.profile.monthlyVariableExpense} onChange={v=>setData(d=>({...d, profile:{...d.profile, monthlyVariableExpense:v}}))}/><NumberInput label="월 투자금" value={data.profile.monthlyInvestment} onChange={v=>setData(d=>({...d, profile:{...d.profile, monthlyInvestment:v}}))}/></FormGrid></Card>
    <div className="grid two"><Card><h3>백업</h3><p>현재 데이터를 JSON 파일로 저장합니다.</p><button className="primary" onClick={exportData}><Download size={16}/> 백업 다운로드</button></Card><Card><h3>복원</h3><p>백업 JSON 내용을 붙여넣고 복원합니다.</p><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="백업 JSON 붙여넣기"/><button className="primary" onClick={importData}><Upload size={16}/> 복원하기</button></Card></div>
    <Card><h3>초기화</h3><button className="danger" onClick={()=>{ if(confirm("모든 데이터를 기본값으로 초기화할까요?")) setData(defaultData); }}><RefreshCcw size={16}/> 기본값으로 초기화</button></Card>
  </div>;
}

function FormGrid({ children }) { return <div className="form-grid">{children}</div>; }
function NumberInput({ label, value, onChange }) { return <label className="field"><span>{label}</span><input value={value} onChange={e=>onChange(safeNumber(e.target.value))} /></label>; }

function EditableTable({ title, rows, setRows, columns, onAdd }) {
  const numeric = ["amount","value","targetRatio","monthlyPayment"];
  const update = (id, key, value) => setRows(rows.map(r => r.id === id ? {...r, [key]: numeric.includes(key) ? safeNumber(value) : value} : r));
  const remove = (id) => setRows(rows.filter(r=>r.id !== id));
  return <Card><div className="table-head"><h3>{title}</h3><button className="primary small" onClick={onAdd}><Plus size={15}/> 추가</button></div><div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}<th></th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{columns.map(c=><td key={c}><input value={row[c] ?? ""} onChange={e=>update(row.id, c, e.target.value)} /></td>)}<td><button className="icon-btn" onClick={()=>remove(row.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></Card>;
}

function MobileTabs({ active, setActive }) {
  const items = [["dashboard","대시보드",LayoutDashboard],["cashflow","현금",Wallet],["emergency","비상금",PiggyBank],["isa","ISA",Landmark],["portfolio","투자",TrendingUp]];
  return <div className="mobile-tabs">{items.map(([key,label,Icon])=><button key={key} className={active===key?"active":""} onClick={()=>setActive(key)}><Icon size={18}/><span>{label}</span></button>)}</div>;
}

export default function App() {
  const [data, setData] = usePersistentState();
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const m = useMemo(()=>calc(data), [data]);

  const pages = {
    dashboard: <Dashboard data={data} m={m}/>,
    cashflow: <Cashflow data={data} setData={setData} m={m}/>,
    accounts: <Accounts data={data} setData={setData} m={m}/>,
    emergency: <Emergency data={data} setData={setData} m={m}/>,
    isa: <ISA data={data} setData={setData} m={m}/>,
    portfolio: <Portfolio data={data} setData={setData} m={m}/>,
    retirement: <Retirement data={data} setData={setData} m={m}/>,
    tax: <Tax data={data} setData={setData} m={m}/>,
    decision: <Decision data={data} m={m}/>,
    report: <Report data={data} m={m}/>,
    settings: <SettingsPage data={data} setData={setData}/>
  };

  return <div className="app-shell">
    <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>
    <main className="main"><header className="topbar"><div><h1>개인 CFO 자산관리 앱</h1><p>Electron 전체 패키지 · 기능 복구 · 검은 화면 방지 안정화 버전</p></div><div className="top-actions"><button className="ghost" onClick={()=>setActive("settings")}><Settings size={16}/> 설정</button></div></header>{pages[active] || pages.dashboard}</main>
    <MobileTabs active={active} setActive={setActive}/>
  </div>;
}
