import { useEffect, useState } from "react";
import { saveData } from "../core/engine.js";
import { isSupabaseConfigured, siteUrl, supabase } from "../auth/supabaseClient.js";
import { Field } from "../components/ui.jsx";

export default function Cloud({ data, onData, session, setSession, notify }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession || null));
    return () => listener?.subscription?.unsubscribe?.();
  }, [setSession]);

  async function magic() {
    if (!supabase) return notify("Supabase 미설정입니다.", "error");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: siteUrl() } });
    notify(error ? error.message : "Magic Link 메일을 보냈습니다.", error ? "error" : "ok");
  }

  async function signIn() {
    if (!supabase) return notify("Supabase 미설정입니다.", "error");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    notify(error ? error.message : "로그인되었습니다.", error ? "error" : "ok");
  }

  async function signUp() {
    if (!supabase) return notify("Supabase 미설정입니다.", "error");
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: siteUrl() } });
    notify(error ? error.message : "회원가입 요청이 완료되었습니다.", error ? "error" : "ok");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    notify("로그아웃되었습니다.", "ok");
  }

  async function saveCloud() {
    if (!supabase || !session?.user) return notify("로그인이 필요합니다.", "error");
    const { error } = await supabase.from("season_profiles").upsert({ user_id: session.user.id, payload: data, updated_at: new Date().toISOString() });
    notify(error ? error.message : "클라우드 저장 완료", error ? "error" : "ok");
  }

  async function loadCloud() {
    if (!supabase || !session?.user) return notify("로그인이 필요합니다.", "error");
    const { data: row, error } = await supabase.from("season_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
    if (error) return notify(error.message, "error");
    if (!row?.payload) return notify("클라우드 데이터가 없습니다.", "warn");
    onData(saveData(row.payload));
    notify("클라우드 데이터를 불러왔습니다.", "ok");
  }

  return (
    <section className="grid2">
      <div className="card">
        <p className="eyebrow">AUTH</p>
        <h2>로그인</h2>
        <p className="muted">Supabase 미설정 시에도 로컬 앱으로 정상 작동합니다.</p>
        <div className="notice">상태: {isSupabaseConfigured ? "Supabase 연결 준비됨" : "로컬 전용"} / {session?.user?.email || "로그아웃"}</div>
        <Field label="이메일"><input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="비밀번호"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <div className="btns">
          <button className="btn" onClick={magic}>Magic Link</button>
          <button className="btn" onClick={signIn}>로그인</button>
          <button className="btn" onClick={signUp}>회원가입</button>
          <button className="btn danger" onClick={signOut}>로그아웃</button>
        </div>
        <p className="mini">Redirect URL: {siteUrl()}</p>
      </div>
      <div className="card">
        <p className="eyebrow">SYNC</p>
        <h2>클라우드 저장</h2>
        <p className="muted">사용자별 데이터를 `season_profiles` 테이블에 저장합니다.</p>
        <div className="btns">
          <button className="btn primary" onClick={saveCloud}>클라우드 저장</button>
          <button className="btn" onClick={loadCloud}>클라우드 불러오기</button>
        </div>
      </div>
    </section>
  );
}
