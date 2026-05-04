import { useMemo, useState } from "react";
import { createRecovery, decryptData, encryptData, exportJson, getRecoveries, importJson, saveData } from "../core/engine.js";
import { Field } from "../components/ui.jsx";
import { supabase } from "../auth/supabaseClient.js";

export default function Backup({ data, onData, session, notify }) {
  const [password, setPassword] = useState("");
  const [version, setVersion] = useState(0);
  const recoveries = useMemo(() => getRecoveries(), [version]);

  function makeRecovery() {
    createRecovery(data, "사용자 수동 복구점");
    setVersion((v) => v + 1);
    notify("복구점을 생성했습니다.", "ok");
  }

  async function importPlain(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      createRecovery(data, "일반 JSON 가져오기 전 자동 백업");
      const next = await importJson(file);
      onData(saveData(next));
      notify("JSON을 가져왔습니다.", "ok");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      e.target.value = "";
    }
  }

  async function exportEncrypted() {
    try {
      const encrypted = await encryptData(data, password);
      exportJson(encrypted, `season-encrypted-${new Date().toISOString().slice(0,10)}.json`);
      notify("암호화 백업을 다운로드했습니다.", "ok");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function importEncrypted(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      createRecovery(data, "암호화 백업 복원 전 자동 백업");
      const encrypted = JSON.parse(await file.text());
      const restored = await decryptData(encrypted, password);
      onData(saveData(restored));
      notify("암호화 백업을 복원했습니다.", "ok");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      e.target.value = "";
    }
  }

  async function uploadStorage() {
    if (!supabase || !session?.user) return notify("로그인이 필요합니다.", "error");
    try {
      const encrypted = await encryptData(data, password);
      const path = `${session.user.id}/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: "application/json" });
      const { error } = await supabase.storage.from("season-secure-backups").upload(path, blob, { upsert: false });
      notify(error ? error.message : `Storage 업로드 완료: ${path}`, error ? "error" : "ok");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <section className="grid2">
      <div className="card">
        <p className="eyebrow">BACKUP</p>
        <h2>백업/복구</h2>
        <div className="btns">
          <button className="btn" onClick={() => exportJson(data, `season-data-${new Date().toISOString().slice(0,10)}.json`)}>일반 JSON 내보내기</button>
          <label className="btn">일반 JSON 가져오기<input hidden type="file" accept="application/json" onChange={importPlain} /></label>
          <button className="btn" onClick={makeRecovery}>복구점 생성</button>
        </div>
        <Field label="암호화 백업 암호"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <div className="btns">
          <button className="btn primary" onClick={exportEncrypted}>암호화 백업 다운로드</button>
          <label className="btn">암호화 백업 가져오기<input hidden type="file" accept="application/json" onChange={importEncrypted} /></label>
          <button className="btn" onClick={uploadStorage}>Supabase Storage 업로드</button>
        </div>
      </div>
      <div className="card">
        <p className="eyebrow">RECOVERY</p>
        <h2>복구점</h2>
        <div className="list">
          {recoveries.map((r) => (
            <div key={r.id} className="item">
              <b>{new Date(r.createdAt).toLocaleString("ko-KR")}</b>
              {r.reason}<br />
              거래 {r.summary.transactions}건 · 계좌 {r.summary.accounts}개
              <div className="btns">
                <button className="btn" onClick={() => { onData(saveData(r.payload)); notify("복구점을 복원했습니다.", "ok"); }}>복원</button>
              </div>
            </div>
          ))}
          {!recoveries.length && <div className="item">복구점이 없습니다.</div>}
        </div>
      </div>
    </section>
  );
}
