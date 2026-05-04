import { calculateSummary, dataQuality, fmt } from "../core/engine.js";
import { Kpi } from "../components/ui.jsx";

export default function Dashboard({ data }) {
  const s = calculateSummary(data);
  const q = dataQuality(data);

  return (
    <>
      <section className="card hero">
        <div>
          <p className="eyebrow">DASHBOARD</p>
          <h2>개인 CFO 통합 대시보드</h2>
          <p className="muted">재무 입력, 검증, 리포트, 백업, 클라우드 동기화를 한 화면 구조로 관리합니다.</p>
        </div>
        <div className={`score ${q.level}`}>{q.score}</div>
      </section>
      <section className="grid">
        <Kpi title="순자산" value={`${fmt(s.netWorth)}원`} />
        <Kpi title="비상금" value={`${fmt(s.emergency)}원`} sub={`${s.emergencyRate}% 달성`} />
        <Kpi title="ISA 잔여" value={`${fmt(s.isaRemain)}원`} />
        <Kpi title="이번 달 수입" value={`${fmt(s.income)}원`} />
        <Kpi title="이번 달 지출" value={`${fmt(s.expense)}원`} />
        <Kpi title="순현금흐름" value={`${fmt(s.cashflow)}원`} />
      </section>
      <section className="grid2">
        <div className="card">
          <h3>데이터 품질</h3>
          <div className="list">
            {q.issues.length === 0 && <div className="item ok">데이터 품질 문제가 없습니다.</div>}
            {q.issues.map((issue, i) => <div key={i} className={`item ${issue.level}`}><b>{issue.title}</b>{issue.message}</div>)}
          </div>
        </div>
        <div className="card">
          <h3>최근 거래</h3>
          <div className="list">
            {(data.transactions || []).slice(0, 10).map((tx) => (
              <div key={tx.id} className="item">
                <b>{tx.date} · {tx.purpose}</b>
                {fmt(tx.amount)}원 · {tx.memo || "메모 없음"}
              </div>
            ))}
            {!(data.transactions || []).length && <div className="item">아직 거래가 없습니다.</div>}
          </div>
        </div>
      </section>
    </>
  );
}
