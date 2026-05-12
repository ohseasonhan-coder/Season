// FORCE_TOP_LOGIN_SCROLL_V4_MODULAR: App shell only; feature exports are grouped in src/modules
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
  STYLES,
  CommandPalette,
} from "./modules/index.js";

// ─── FAB 힌트 말풍선 (첫 방문 1회만) ────────────────────────────────────────
function FabTooltipHint() {
  const KEY = "season-fab-hint-shown";
  const [visible, setVisible] = React.useState(() => !localStorage.getItem(KEY));
  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => { localStorage.setItem(KEY, "1"); setVisible(false); }, 6000);
    return () => clearTimeout(t);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="fab-hint" onClick={() => { localStorage.setItem(KEY, "1"); setVisible(false); }}>
      <div className="fab-hint-text">👆 여기서 거래를 바로 입력해요!</div>
      <div className="fab-hint-arrow"/>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,setData]=useState(loadData);
  const [tab,setTab]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(true);

  // ── 온보딩: localStorage 플래그로 최초 1회만 표시
  const [showOnboarding,setShowOnboarding]=useState(()=>!localStorage.getItem(OB_KEY));
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCmd, setShowCmd] = useState(false);

  // ── Ctrl+K / ⌘K 커맨드 팔레트 단축키
  useEffect(()=>{
    const handler=(e)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="k"){
        e.preventDefault();
        setShowCmd(v=>!v);
      }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  // ── 다크/라이트 테마
  const [theme,setTheme]=useState(()=>localStorage.getItem("season-theme")||"dark");
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme",theme);
    localStorage.setItem("season-theme",theme);
  },[theme]);
  const toggleTheme=()=>setTheme(t=>t==="dark"?"light":"dark");

  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [syncState,setSyncState]=useState("");
  const [cloudReady,setCloudReady]=useState(false);
  const [showFab,setShowFab]=useState(false);
  const [showMobileMore,setShowMobileMore]=useState(false);
  const skipCloudSaveRef=useRef(false);

  useEffect(()=>{ saveData(data); },[data]);

  useEffect(()=>{
    if(!supabase){setAuthLoading(false);return;}
    supabase.auth.getSession().then(({data:{session:s}})=>{setSession(s);setAuthLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  },[]);

  const [conflictData,setConflictData]=useState(null); // {remote, remoteUpdatedAt, localUpdatedAt}

  const loadCloudData=async()=>{
    if(!supabase||!session?.user)return;
    setSyncState("불러오는 중...");
    const {data:row,error}=await supabase.from(CLOUD_TABLE).select("data,updated_at").eq("user_id",session.user.id).maybeSingle();
    if(error){setSyncState("불러오기 실패");return;}
    if(row?.data){
      const remoteUpdatedAt=row.updated_at||"";
      const localUpdatedAt=data.lastSavedAt||"";
      // 로컬에 데이터가 있고, 로컬이 더 최신이면 충돌 확인
      const localHasData=data.transactions.length>0||data.assets.length>0||data.portfolio.length>0;
      const localIsNewer=localHasData&&localUpdatedAt&&remoteUpdatedAt&&localUpdatedAt>remoteUpdatedAt;
      if(localIsNewer){
        setConflictData({remote:migrateData(row.data),remoteUpdatedAt,localUpdatedAt});
        setSyncState("충돌 감지");
        setCloudReady(true);
        return;
      }
      skipCloudSaveRef.current=true;
      setData(migrateData(row.data));
      setSyncState("불러오기 완료");
    } else {
      setSyncState("신규 계정");
    }
    setCloudReady(true);
  };

  const resolveConflict=(useRemote)=>{
    if(!conflictData)return;
    if(useRemote){skipCloudSaveRef.current=true;setData(conflictData.remote);setSyncState("서버 데이터로 복원");}
    else{setSyncState("로컬 데이터 유지");}
    setConflictData(null);
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

  // ── 온보딩 완료 핸들러
  const handleOnboardingComplete=({ newSettings={}, newAssets=[], userName="" }={})=>{
    if(Object.keys(newSettings).length > 0 || newAssets.length > 0 || userName) {
      update(d=>({
        ...d,
        settings: { ...d.settings, ...newSettings, ...(userName ? { userName } : {}) },
        assets: newAssets.length > 0
          ? [...d.assets.filter(a=>a.note!=="온보딩 입력"), ...newAssets]
          : d.assets,
      }));
    }
    setShowOnboarding(false);
    setTab("dashboard");
  };
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
  },[data.transactions,data.assets,data.portfolio]);

  const validations=useMemo(()=>{
    const accountNames = data.accounts.map(a=>String(a.name||"").trim()).filter(Boolean);
    const duplicateAccountNames = accountNames.length - new Set(accountNames).size;
    const assetNames = data.assets.map(a=>String(a.name||"").trim()).filter(Boolean);
    const duplicateAssetNames = assetNames.length - new Set(assetNames).size;
    const validAccounts = new Set(accountNames);
    const today = todayISO();
    const targetWeightSum = (data.settings?.investmentTargets||[]).reduce((sum,t)=>sum+n(t.targetWeight),0);
    const legacyWeightSum = n(data.settings?.targetNasdaqWeight)+n(data.settings?.targetNasdaqHWeight)+n(data.settings?.targetDividendWeight);
    const fx = n(data.settings?.fxUsdKrw);
    const usdHoldings = data.portfolio.filter(p=>normalizeCurrency(p.currency)==="USD" || STOCK_MASTER.find(s=>s.name===p.name||s.symbol===p.symbol)?.currency==="USD");
    const badReturnSettings = [data.settings?.annualReturnNasdaq,data.settings?.annualReturnDividend,data.settings?.postRetirementReturn]
      .filter(v=>n(v)<-0.8 || n(v)>1).length;
    return [
      {item:"거래내역 필수값 누락",count:data.transactions.filter(t=>t.type&&(!t.cat1||!t.cat2)).length,where:"거래내역",desc:"구분 선택 시 대분류/소분류 필수"},
      {item:"거래 금액 오류",count:data.transactions.filter(t=>t.amount!==""&&n(t.amount)<=0).length,where:"거래내역",desc:"금액은 0보다 커야 합니다"},
      {item:"거래 날짜 오류",count:data.transactions.filter(t=>!t.date || String(t.date).length<10 || String(t.date)>today).length,where:"거래내역",desc:"날짜 누락 또는 미래일자는 확인이 필요합니다"},
      {item:"수입 계좌 누락",count:data.transactions.filter(t=>t.type==="수입"&&!t.inAccount).length,where:"거래내역",desc:"수입은 입금계좌가 필요합니다"},
      {item:"지출 계좌 누락",count:data.transactions.filter(t=>t.type==="지출"&&!t.outAccount).length,where:"거래내역",desc:"지출은 출금계좌가 필요합니다"},
      {item:"존재하지 않는 계좌 참조",count:data.transactions.filter(t=>(t.inAccount&&!validAccounts.has(t.inAccount))||(t.outAccount&&!validAccounts.has(t.outAccount))).length,where:"거래내역",desc:"거래내역 계좌명이 계좌관리 목록에 없습니다"},
      {item:"자산이동 계좌 누락",count:data.transactions.filter(t=>t.type==="자산이동"&&(!t.inAccount||!t.outAccount)).length,where:"거래내역",desc:"자산이동은 입출금 계좌 모두 필요"},
      {item:"동일 계좌 이체",count:data.transactions.filter(t=>t.type==="자산이동"&&t.inAccount&&t.outAccount&&t.inAccount===t.outAccount).length,where:"거래내역",desc:"입금계좌와 출금계좌가 같으면 이동거래가 성립하지 않습니다"},
      {item:"계좌명 중복",count:duplicateAccountNames,where:"계좌관리",desc:"같은 계좌명이 있으면 거래 연결이 틀어질 수 있습니다"},
      {item:"자산/부채 이름 중복",count:duplicateAssetNames,where:"자산·부채",desc:"같은 이름의 항목이 중복되었습니다"},
      {item:"자산/부채 금액 오류",count:data.assets.filter(a=>n(a.current)<0||n(a.previous)<0).length,where:"자산·부채",desc:"자산·부채 현재/전월 금액은 음수일 수 없습니다"},
      {item:"포트폴리오 수량 오류",count:data.portfolio.filter(p=>n(p.qty)<0||n(p.avgPrice)<0||n(p.currentPrice)<0).length,where:"포트폴리오",desc:"수량·평균단가·현재가는 음수일 수 없습니다"},
      {item:"포트폴리오 현재가 미입력",count:data.portfolio.filter(p=>n(p.qty)>0&&n(p.currentPrice||0)<=0).length,where:"포트폴리오",desc:"보유 수량 있으면 현재가 필요"},
      {item:"USD 환율 누락",count:usdHoldings.length>0&&fx<=0?usdHoldings.length:0,where:"시장데이터",desc:"해외자산 원화평가를 위해 USD/KRW 환율이 필요합니다"},
      {item:"투자 목표 비중 100% 초과",count:targetWeightSum>1.000001?1:0,where:"설정",desc:`목표 비중 합계 ${(targetWeightSum*100).toFixed(1)}%입니다. 100% 이하로 조정하는 것을 권장합니다`},
      {item:"기본 목표 비중 100% 초과",count:legacyWeightSum>1.000001?1:0,where:"설정",desc:`나스닥/배당 기본 비중 합계 ${(legacyWeightSum*100).toFixed(1)}%입니다`},
      {item:"기대수익률 입력 범위 오류",count:badReturnSettings,where:"설정",desc:"연 수익률은 -80%~100% 범위에서 점검하세요. 화면 입력은 % 기준입니다"},
      {item:"예산 금액 오류",count:data.budgets.filter(b=>n(b.budget)<0||n(b.targetWeight)<0||n(b.targetWeight)>1).length,where:"예산",desc:"예산은 0 이상, 목표비중은 0~100%여야 합니다"},
      {item:"목표 이벤트 금액 오류",count:data.events.filter(e=>n(e.amountNeeded)<0||n(e.currentPrepared)<0||n(e.currentPrepared)>n(e.amountNeeded)&&n(e.amountNeeded)>0).length,where:"목표",desc:"목표금액·준비금액의 음수 또는 초과값을 확인하세요"},
    ];
  },[data.transactions,data.accounts,data.assets,data.portfolio,data.budgets,data.events,data.settings]);

  const budgetAnalysis=useMemo(()=>{
    const month=thisMonthISO();
    const totalIncome=data.transactions.filter(t=>monthOf(t.date)===month&&t.type==="수입").reduce((s,t)=>s+n(t.amount),0);
    return data.budgets.map(b=>{
      const spent=data.transactions.filter(t=>monthOf(t.date)===month&&t.type==="지출"&&t.cat1===b.cat1).reduce((s,t)=>s+n(t.amount),0);
      const rate=b.budget>0?(spent/b.budget)*100:0;
      return{...b,spent,rate,status:rate>=100?"초과":rate>=80?"주의":"정상",recommendedBudget:totalIncome*n(b.targetWeight)};
    });
  },[data.transactions,data.budgets]);

  // ── Web Push 알림: 예산 초과 감지 시 브라우저 알림
  useEffect(()=>{
    if(!budgetAnalysis||budgetAnalysis.length===0)return;
    const overItems=budgetAnalysis.filter(b=>b.status==="초과");
    if(overItems.length===0)return;
    if(!("Notification" in window))return;
    if(Notification.permission==="default"){
      Notification.requestPermission();
      return;
    }
    if(Notification.permission!=="granted")return;
    const lastNotifyKey="season_budget_notify_"+thisMonthISO();
    const alreadyNotified=localStorage.getItem(lastNotifyKey);
    if(alreadyNotified)return;
    try{
      const title="💸 예산 초과 알림";
      const body=overItems.slice(0,3).map(b=>`${b.cat1}: ${fmt(b.spent)} (예산 ${fmt(b.budget)})`).join("\n");
      new Notification(title,{body,icon:"/icon.svg",tag:"season-budget-alert",requireInteraction:false});
      localStorage.setItem(lastNotifyKey,"1");
    }catch(e){console.warn("Push 알림 실패:",e);}
  },[budgetAnalysis]);

  const monthlySeries=useMemo(()=>{
    const m=new Map();
    data.transactions.forEach(t=>{const k=monthOf(t.date);if(!k)return;if(!m.has(k))m.set(k,{month:k,income:0,expense:0});const row=m.get(k);if(t.type==="수입")row.income+=n(t.amount);if(t.type==="지출")row.expense+=n(t.amount);});
    return[...m.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(r=>({...r,net:r.income-r.expense}));
  },[data.transactions]);

  // ── 이상 지출 탐지: 전달 대비 카테고리별 150% 이상 급증 감지
  const anomalyAlerts=useMemo(()=>{
    if(monthlySeries.length<2)return[];
    const months=[...new Set(data.transactions.map(t=>monthOf(t.date)).filter(Boolean))].sort();
    if(months.length<2)return[];
    const cur=months[months.length-1];
    const prev=months[months.length-2];
    const catMap=(month)=>{
      const m={};
      data.transactions.filter(t=>monthOf(t.date)===month&&t.type==="지출").forEach(t=>{
        m[t.cat1]=(m[t.cat1]||0)+n(t.amount);
      });
      return m;
    };
    const curCats=catMap(cur);
    const prevCats=catMap(prev);
    const alerts=[];
    Object.entries(curCats).forEach(([cat,curAmt])=>{
      const prevAmt=prevCats[cat]||0;
      if(prevAmt<=0||curAmt<=0)return;
      const ratio=curAmt/prevAmt;
      if(ratio>=1.5&&curAmt>=50000){
        alerts.push({
          cat,curAmt,prevAmt,ratio,
          level:ratio>=2?"danger":"warn",
          msg:`${cat} 지출이 전달보다 ${Math.round((ratio-1)*100)}% 증가했습니다 (${fmt(prevAmt)}→${fmt(curAmt)})`,
        });
      }
    });
    return alerts.sort((a,b)=>b.ratio-a.ratio);
  },[data.transactions,monthlySeries]);

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
  },[data.transactions,data.assets,data.accounts,data.portfolio,monthlySeries,budgetAnalysis,validations,futureSim]);

  const dashboardChartData=useMemo(()=>{
    const assetBuckets=new Map();
    data.assets.filter(a=>a.kind==="자산").forEach(a=>{const l=a.category||"기타자산";assetBuckets.set(l,(assetBuckets.get(l)||0)+n(a.current));});
    if(financialAnalysis.total>0)assetBuckets.set("투자포트폴리오",(assetBuckets.get("투자포트폴리오")||0)+financialAnalysis.total);
    const assetSegments=[...assetBuckets.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,6);
    const totalEventTarget=eventAnalysis.reduce((s,e)=>s+n(e.amountNeeded),0);
    const totalEventPrepared=eventAnalysis.reduce((s,e)=>s+n(e.currentPrepared),0);
    return{monthlyTrend:monthlySeries,assetSegments,retirementTarget:n(data.settings.retirementTargetAmount),retirementProjected:dashboardDetail.retirementRow?.total||0,totalEventTarget,totalEventPrepared};
  },[data.assets,data.settings.retirementTargetAmount,monthlySeries,financialAnalysis.total,eventAnalysis,dashboardDetail.retirementRow]);

  const calculationAudit=useMemo(()=>buildCalculationAudit({data,dashboard,financialAnalysis,monthlySeries,budgetAnalysis,taxAnalysis,futureSim}),[data,dashboard,financialAnalysis,monthlySeries,budgetAnalysis,taxAnalysis,futureSim]);

  const totalIssues=validations.reduce((s,v)=>s+n(v.count),0);

  // ── authLoading guard: Supabase 세션 확인 전에는 빈 화면 대신 스피너
  if(authLoading){
    return(
      <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--bg)",gap:16}}>
        <style>{STYLES}</style>
        <div style={{width:48,height:48,borderRadius:"50%",border:"4px solid var(--border)",borderTopColor:"var(--accent)",animation:"spin 0.8s linear infinite"}}/>
        <div style={{fontSize:14,color:"var(--text3)"}}>앱을 불러오는 중...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <ToastProvider>
    <div className="app scroll-safe-root" data-scroll-fix="MOBILE_SCROLL_FORCE_FIX_V5">
      <script dangerouslySetInnerHTML={{__html:`(function(){try{var t=localStorage.getItem('season-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`}}/>
      <style>{STYLES}</style>

      {/* ── 온보딩 위자드 (최초 방문 시만) ── */}
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete}/>
      )}

      {/* ── 클라우드 동기화 충돌 다이얼로그 ── */}
      {conflictData&&(
        <div style={{position:"fixed",inset:0,zIndex:99990,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:28,maxWidth:440,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,.4)"}}>
            <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>⚠️ 데이터 충돌 감지</div>
            <p style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:20}}>
              이 기기의 로컬 데이터와 서버 데이터가 다릅니다.<br/>어느 쪽을 사용할지 선택해주세요.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <div style={{padding:"12px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface2)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",marginBottom:4}}>📱 이 기기 (로컬)</div>
                <div style={{fontSize:12,color:"var(--text2)"}}>{conflictData.localUpdatedAt?.slice(0,16).replace("T"," ")||"시간 알 수 없음"}</div>
              </div>
              <div style={{padding:"12px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface2)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",marginBottom:4}}>☁️ 서버 (클라우드)</div>
                <div style={{fontSize:12,color:"var(--text2)"}}>{conflictData.remoteUpdatedAt?.slice(0,16).replace("T"," ")||"시간 알 수 없음"}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>resolveConflict(false)} style={{padding:"12px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",fontSize:13,fontWeight:700,cursor:"pointer"}}>📱 로컬 유지</button>
              <button onClick={()=>resolveConflict(true)} style={{padding:"12px",borderRadius:12,border:"none",background:"var(--accent)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>☁️ 서버로 덮어쓰기</button>
            </div>
            <p style={{fontSize:11,color:"var(--text3)",marginTop:12,textAlign:"center"}}>선택 후 자동으로 동기화됩니다. 선택하지 않은 쪽은 JSON 백업으로 보관하세요.</p>
          </div>
        </div>
      )}

      {/* ── 모바일 전용 헤더 ── */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-header-logo">S</div>
          <span className="mobile-header-title">{PAGE_TITLES[tab]||"Season Finance"}</span>
        </div>
        <div className="mobile-header-right">
          {dashboard.net!==0&&(
            <span className={`mobile-header-badge ${dashboard.net>=0?"surplus":"deficit"}`}>
              {dashboard.net>=0?"▲":"▼"} {fmt(Math.abs(dashboard.net)/10000)}만
            </span>
          )}
          <button className={`mobile-header-sync ${!session?.user?"offline":""}`} onClick={()=>{const el=document.getElementById("__authbar_mobile_state");if(el)el.click();}}>
            ☁️ <span>{session?.user?"연결됨":"로그인"}</span>
          </button>
          <button className="mobile-header-theme" onClick={toggleTheme} aria-label="테마 전환">
            {theme==="dark"?"☀️":"🌙"}
          </button>
        </div>
      </header>

      {/* ── 모바일 하단 탭바 ── */}
      <nav className="mobile-tabbar">
        <div className="mobile-tabbar-inner">
          {[
            {id:"dashboard", icon:"◈", label:"홈"},
            {id:"transactions", icon:"↔", label:"거래"},
            {id:"cfo", icon:"🏛️", label:"CFO"},
            {id:"assets", icon:"🏦", label:"자산"},
            {id:"__more__", icon:"☰", label:"더보기"},
          ].map(item=>(
            <button
              key={item.id}
              className={`mobile-tab-btn ${item.id==="__more__"?(["dashboard","transactions","cfo","assets"].includes(tab)?"":"active"):tab===item.id?"active":""}`}
              onClick={item.id==="__more__"?()=>setShowMobileMore(true):()=>setTab(item.id)}
            >
              <div className="mobile-tab-icon-wrap">
                <span className="mobile-tab-icon">{item.icon}</span>
              </div>
              <span className="mobile-tab-label">{item.label}</span>
              {item.id==="__more__"&&totalIssues>0&&<span className="mobile-tab-dot"/>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── 모바일 더보기 시트 ── */}
      {showMobileMore&&(
        <>
          <div className="mobile-more-sheet-overlay" onClick={()=>setShowMobileMore(false)}/>
          <div className="mobile-more-sheet">
            <div className="mobile-more-handle"/>
            {[
              {section:"분석·인사이트", ids:["portfolio","budget","planning","professional","risk","analysis"]},
              {section:"세금·미래", ids:["tax","simulation","monthlyReport","decision","goals","automation"]},
              {section:"관리", ids:["settings","accounts","data"]},
            ].map(group=>{
              const items=NAV.filter(i=>i.id&&group.ids.includes(i.id));
              if(!items.length) return null;
              return (
                <div key={group.section} style={{marginBottom:14}}>
                  <div className="mobile-more-section">{group.section}</div>
                  <div className="mobile-more-grid">
                    {items.map(item=>(
                      <button key={item.id} className={`mobile-more-item ${tab===item.id?"active":""}`} onClick={()=>{setTab(item.id);setShowMobileMore(false);}} aria-label={item.label} aria-current={tab===item.id?"page":undefined}>
                        <div className="mobile-more-icon">{item.icon}</div>
                        <span>{item.label}</span>
                        {item.id==="data"&&totalIssues>0&&<span style={{fontSize:9,color:"var(--red)",fontWeight:900}}>●</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
              <button key={item.id} className={`nav-item ${tab===item.id?"active":""}`} data-tip={item.label} title={sidebarOpen ? "" : item.label} onClick={()=>setTab(item.id)} aria-label={item.label} aria-current={tab===item.id?"page":undefined}>
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
              <button className="topbar-search-btn" onClick={()=>setShowCmd(true)} title="검색 (Ctrl+K)">
                🔍 <span className="topbar-search-label">검색</span>
                <kbd className="topbar-kbd">⌘K</kbd>
              </button>
              <span style={{fontSize:12,color:"var(--text3)"}}>{thisMonthISO()}</span>
              {dashboard.net!==0&&(
                <span className={`badge ${dashboard.net>=0?"badge-green":"badge-red"}`}>
                  이번달 {dashboard.net>=0?"흑자":"적자"} {fmt(Math.abs(dashboard.net))}원
                </span>
              )}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme==="dark"?"라이트 모드로 전환":"다크 모드로 전환"}
                aria-label={theme==="dark"?"라이트 모드로 전환":"다크 모드로 전환"}
              >
                {theme==="dark"?"☀️":"🌙"}
              </button>
            </div>
          </div>

          <div className="page">
            {tab==="dashboard"&&<DashboardTab data={data} update={update} dashboard={dashboard} dashboardDetail={dashboardDetail} dashboardChartData={dashboardChartData} financialAnalysis={financialAnalysis} budgetAnalysis={budgetAnalysis} monthlySeries={monthlySeries} eventAnalysis={eventAnalysis} taxAnalysis={taxAnalysis} futureSim={futureSim} anomalyAlerts={anomalyAlerts}/>}
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
            {tab==="data"&&<DataTab data={data} update={update} validations={validations} calculationAudit={calculationAudit}/>}
          <div className="legal-footer">
            이 서비스는 <strong>투자자문업 미등록 개인 재무 현황 계산기</strong>입니다. 제공되는 모든 수치·분석·제안은 사용자가 직접 입력한 데이터를 기반으로 한 참고용이며, 투자 결정의 근거로 사용하지 마세요.
            실제 투자·세무 결정은 공인 금융전문가 또는 세무사와 상담하시기 바랍니다.
            &nbsp;|&nbsp;
            <button
              onClick={() => setShowPrivacy(true)}
              style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:"inherit",padding:0,textDecoration:"underline"}}
            >
              개인정보처리방침
            </button>
          </div>
          </div>
        </div>
      </div>


      {showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
      {showCmd&&<CommandPalette onNavigate={setTab} onClose={()=>setShowCmd(false)} onQuickAdd={()=>setShowQuickAdd(true)}/>}
      {/* FAB 간편입력 */}
      {!showOnboarding && (
        <>
          <FabTooltipHint />
          <button
            className={showQuickAdd ? 'fab fab-open' : 'fab'}
            onClick={() => setShowQuickAdd(v => !v)}
            aria-label='간편 거래 입력'
            title='간편 거래 입력'
          >
            +
          </button>
          {showQuickAdd && (
            <QuickAddModal
              data={data}
              update={update}
              accountNamesIn={accountNamesIn}
              accountNamesOut={accountNamesOut}
              onClose={() => setShowQuickAdd(false)}
            />
          )}
        </>
      )}
    </div>
    </ToastProvider>
  );
}
