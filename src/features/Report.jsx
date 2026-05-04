import { useState } from "react";
import { calculateSummary, makeReport } from "../core/engine.js";
import { postJson, validateAiResponse } from "../core/api.js";

export default function Report({ data, session, notify }) {
  const [report, setReport] = useState(() => makeReport(data));
  const endpoint = import.meta.env.VITE_FN_AI_REPORT_PROXY;

  async function runAi() {
    const fallback = makeReport(data);
    if (!endpoint) {
      setReport(fallback);
      notify("AI Endpoint가 없어 로컬 리포트를 생성했습니다.", "warn");
      return;
    }
    try {
      const raw = await postJson(endpoint, { token: session?.access_token, body: { report: calculateSummary(data), dataSummary: { tx: data.transactions.length } } });
      const checked = validateAiResponse(raw);
      setReport(checked.data);
      notify(checked.ok ? "AI 리포트를 생성했습니다." : `AI 응답 보정: ${checked.errors.join(", ")}`, checked.ok ? "ok" : "warn");
    } catch (error) {
      setReport(fallback);
      notify(`AI 서버 실패. 로컬 리포트로 대체했습니다: ${error.message}`, "warn");
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">CFO REPORT</p>
      <h2>{report.title}</h2>
      <div className="notice"><b>결론</b><br />{report.conclusion}</div>
      <div className="grid2">
        <div className="card">
          <h3>근거</h3>
          <div className="list">{(report.evidence || []).map((x) => <div key={x} className="item">{x}</div>)}</div>
        </div>
        <div className="card">
          <h3>다음 행동</h3>
          <div className="list">{(report.nextActions || []).map((x) => <div key={x} className="item">{x}</div>)}</div>
        </div>
      </div>
      <div className="btns">
        <button className="btn primary" onClick={runAi}>AI/로컬 리포트 생성</button>
      </div>
      {(report.cautions || []).map((x) => <p className="muted" key={x}>※ {x}</p>)}
    </section>
  );
}
