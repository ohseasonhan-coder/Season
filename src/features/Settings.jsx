import { saveData } from "../core/engine.js";
import { Field } from "../components/ui.jsx";

export default function Settings({ data, onData, notify }) {
  function patchSettings(patch) {
    onData(saveData({ ...data, settings: { ...data.settings, ...patch } }));
    notify("설정을 저장했습니다.", "ok");
  }

  function patchAccount(index, patch) {
    const accounts = data.accounts.map((a, i) => i === index ? { ...a, ...patch } : a);
    onData(saveData({ ...data, accounts }));
  }

  function addAccount() {
    const accounts = [...data.accounts, { id: `${Date.now()}`, name: "새 계좌", type: "asset", balance: 0, emergency: false }];
    onData(saveData({ ...data, accounts }));
  }

  return (
    <section className="card">
      <p className="eyebrow">SETTINGS</p>
      <h2>설정</h2>
      <div className="form-grid">
        <Field label="비상금 목표"><input value={data.settings.emergencyTarget} onChange={(e) => patchSettings({ emergencyTarget: Number(e.target.value) })} /></Field>
        <Field label="ISA 연간 한도"><input value={data.settings.isaAnnualLimit} onChange={(e) => patchSettings({ isaAnnualLimit: Number(e.target.value) })} /></Field>
        <Field label="월 투자 목표"><input value={data.settings.monthlyInvestmentTarget} onChange={(e) => patchSettings({ monthlyInvestmentTarget: Number(e.target.value) })} /></Field>
        <Field label="성향"><input value={data.settings.riskProfile} onChange={(e) => patchSettings({ riskProfile: e.target.value })} /></Field>
      </div>
      <h3>계좌</h3>
      <div className="list">
        {data.accounts.map((acc, i) => (
          <div key={acc.id} className="item">
            <div className="form-grid">
              <Field label="계좌명"><input value={acc.name} onChange={(e) => patchAccount(i, { name: e.target.value })} /></Field>
              <Field label="유형">
                <select value={acc.type} onChange={(e) => patchAccount(i, { type: e.target.value })}>
                  <option value="asset">자산</option>
                  <option value="liability">부채</option>
                </select>
              </Field>
              <Field label="잔액"><input value={acc.balance} onChange={(e) => patchAccount(i, { balance: Number(e.target.value) })} /></Field>
              <Field label="비상금 포함">
                <select value={acc.emergency ? "yes" : "no"} onChange={(e) => patchAccount(i, { emergency: e.target.value === "yes" })}>
                  <option value="yes">포함</option>
                  <option value="no">미포함</option>
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>
      <button className="btn" onClick={addAccount}>계좌 추가</button>
    </section>
  );
}
