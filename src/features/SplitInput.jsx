import { useMemo, useState } from "react";
import { applySplitInput, createRecovery, fmt, validateSplitInput } from "../core/engine.js";
import { ConfirmModal, Field, ValidationList } from "../components/ui.jsx";

const defaultDraft = {
  date: new Date().toISOString().slice(0, 10),
  total: 2000000,
  memo: "월 저축/투자",
  rows: [
    { direction: "transfer", purpose: "비상금", from: "파킹통장", to: "KOFR 비상금", amount: 500000 },
    { direction: "transfer", purpose: "ISA", from: "파킹통장", to: "ISA 계좌", amount: 1500000 },
  ],
};

export default function SplitInput({ data, onData, notify }) {
  const [draft, setDraft] = useState(defaultDraft);
  const [confirm, setConfirm] = useState(false);
  const validation = useMemo(() => validateSplitInput(data, draft), [data, draft]);
  const rowTotal = draft.rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  function patchRow(index, patch) {
    setDraft((prev) => ({ ...prev, rows: prev.rows.map((r, i) => i === index ? { ...r, ...patch } : r) }));
  }

  function requestSave() {
    if (validation.errors.length) {
      notify(validation.errors[0], "error");
      return;
    }
    setConfirm(true);
  }

  function save() {
    createRecovery(data, "분배입력 저장 전 자동 백업");
    const next = applySplitInput(data, draft);
    onData(next);
    notify("분배입력을 저장했습니다.", "ok");
    setConfirm(false);
  }

  return (
    <section className="card">
      <p className="eyebrow">SPLIT INPUT</p>
      <h2>분배입력</h2>
      <p className="muted">비상금, ISA, 생활비, 카드사용 등을 한 번에 나누어 입력합니다.</p>
      <div className="form-grid">
        <Field label="날짜"><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
        <Field label="총액"><input value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} /></Field>
      </div>
      <Field label="메모"><input value={draft.memo} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} /></Field>
      <div className="notice">분배 합계: {fmt(rowTotal)}원</div>
      <div className="list">
        {draft.rows.map((row, i) => (
          <div key={i} className="item">
            <div className="form-grid">
              <Field label="방향">
                <select value={row.direction} onChange={(e) => patchRow(i, { direction: e.target.value })}>
                  <option value="transfer">자산이동</option>
                  <option value="income">수입</option>
                  <option value="expense">지출</option>
                  <option value="liability">카드사용</option>
                </select>
              </Field>
              <Field label="목적">
                <select value={row.purpose} onChange={(e) => patchRow(i, { purpose: e.target.value })}>
                  <option>비상금</option><option>ISA</option><option>일반투자</option><option>생활비</option><option>카드상환</option><option>수입</option>
                </select>
              </Field>
              <Field label="출금계좌"><input value={row.from} onChange={(e) => patchRow(i, { from: e.target.value })} /></Field>
              <Field label="입금/대상계좌"><input value={row.to} onChange={(e) => patchRow(i, { to: e.target.value })} /></Field>
              <Field label="금액"><input value={row.amount} onChange={(e) => patchRow(i, { amount: e.target.value })} /></Field>
            </div>
            <div className="btns">
              <button className="btn danger" onClick={() => setDraft({ ...draft, rows: draft.rows.filter((_, idx) => idx !== i) })}>행 삭제</button>
            </div>
          </div>
        ))}
      </div>
      <div className="btns">
        <button className="btn" onClick={() => setDraft({ ...draft, rows: [...draft.rows, { direction: "transfer", purpose: "ISA", from: "파킹통장", to: "ISA 계좌", amount: 0 }] })}>행 추가</button>
        <button className="btn primary" onClick={requestSave}>저장 전 검증</button>
      </div>
      <ValidationList result={validation} />
      {confirm && (
        <ConfirmModal title="저장 확인" description="아래 경고와 분배 내역을 확인한 뒤 저장하세요." onCancel={() => setConfirm(false)} onConfirm={save}>
          <ValidationList result={validation} />
        </ConfirmModal>
      )}
    </section>
  );
}
