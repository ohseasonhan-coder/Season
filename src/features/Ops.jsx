import { useMemo, useState } from "react";
import { addNotification, clearNotifications, dataQuality, exportJson, getNotifications, makeReport, summarizeData } from "../core/engine.js";
import { postJson } from "../core/api.js";

export default function Ops({ data, session, notify }) {
  const [version, setVersion] = useState(0);
  const notifications = useMemo(() => getNotifications(), [version]);
  const q = dataQuality(data);
  const report = makeReport(data);

  function diagnostics() {
    exportJson({
      at: new Date().toISOString(),
      summary: summarizeData(data),
      quality: q,
      report,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
    }, "season-diagnostics.json");
  }

  async function adminCheck() {
    const endpoint = import.meta.env.VITE_FN_ADMIN_AUTHORIZE;
    if (!endpoint) return notify("관리자 검증 Endpoint가 없습니다.", "warn");
    try {
      const out = await postJson(endpoint, { token: session?.access_token, body: { email: session?.user?.email } });
      notify(out.allowed ? "관리자 권한 확인됨" : "관리자 권한 없음", out.allowed ? "ok" : "warn");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <section className="grid2">
      <div className="card">
        <p className="eyebrow">OPS</p>
        <h2>운영센터</h2>
        <p className="muted">앱 상태, 데이터 품질, 관리자 권한, 진단 자료를 확인합니다.</p>
        <div className="grid2">
          <div className="card kpi"><span>데이터 품질</span><strong className={q.level}>{q.score}</strong></div>
          <div className="card kpi"><span>알림</span><strong>{notifications.length}</strong></div>
        </div>
        <div className="btns">
          <button className="btn primary" onClick={diagnostics}>진단 JSON 다운로드</button>
          <button className="btn" onClick={adminCheck}>관리자 권한 확인</button>
          <button className="btn" onClick={() => { addNotification("info", "점검 알림", "비상금과 ISA 한도를 확인하세요."); setVersion((v) => v + 1); }}>테스트 알림</button>
          <button className="btn danger" onClick={() => { clearNotifications(); setVersion((v) => v + 1); }}>알림 삭제</button>
        </div>
      </div>
      <div className="card">
        <p className="eyebrow">NOTIFICATIONS</p>
        <h2>알림센터</h2>
        <div className="list">
          {notifications.map((n) => <div key={n.id} className="item"><b>{n.title}</b>{n.message}<br />{new Date(n.createdAt).toLocaleString("ko-KR")}</div>)}
          {!notifications.length && <div className="item">알림이 없습니다.</div>}
        </div>
      </div>
    </section>
  );
}
