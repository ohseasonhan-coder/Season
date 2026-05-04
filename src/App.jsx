import { useState } from "react";
import { loadData, saveData } from "./core/engine.js";
import Dashboard from "./features/Dashboard.jsx";
import SplitInput from "./features/SplitInput.jsx";
import Report from "./features/Report.jsx";
import Cloud from "./features/Cloud.jsx";
import Backup from "./features/Backup.jsx";
import Ops from "./features/Ops.jsx";
import Settings from "./features/Settings.jsx";

const tabs = [
  ["dashboard", "대시보드", "CFO"],
  ["input", "분배입력", "Split"],
  ["report", "AI 리포트", "AI"],
  ["cloud", "로그인/클라우드", "Sync"],
  ["backup", "백업/복구", "Safe"],
  ["ops", "운영센터", "Ops"],
  ["settings", "설정", "Set"],
];

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [active, setActive] = useState("dashboard");
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState(null);

  function onData(next) {
    setData(saveData(next));
  }

  function notify(message, level = "ok") {
    setNotice({ message, level, id: Date.now() });
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">S</div>
          <div>
            <h1>Season CFO App</h1>
            <p>GitHub 전체 삭제 후 그대로 넣는 최종본 · 비결제형</p>
          </div>
        </div>
        <div className="pill">{session?.user?.email || "로컬 모드"}</div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          {tabs.map(([key, label, sub]) => (
            <button key={key} className={`nav ${active === key ? "active" : ""}`} onClick={() => setActive(key)}>
              <span>{label}</span><small>{sub}</small>
            </button>
          ))}
        </aside>

        <main className="main">
          {notice && <div className={`notice ${notice.level}`}>{notice.message}</div>}

          {active === "dashboard" && <Dashboard data={data} />}
          {active === "input" && <SplitInput data={data} onData={onData} notify={notify} />}
          {active === "report" && <Report data={data} session={session} notify={notify} />}
          {active === "cloud" && <Cloud data={data} onData={onData} session={session} setSession={setSession} notify={notify} />}
          {active === "backup" && <Backup data={data} onData={onData} session={session} notify={notify} />}
          {active === "ops" && <Ops data={data} session={session} notify={notify} />}
          {active === "settings" && <Settings data={data} onData={onData} notify={notify} />}
        </main>
      </div>
    </div>
  );
}
