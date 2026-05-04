export function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

export function Kpi({ title, value, sub }) {
  return <div className="card kpi"><span>{title}</span><strong>{value}</strong>{sub && <span>{sub}</span>}</div>;
}

export function ValidationList({ result }) {
  if (!result) return null;
  return (
    <div className="list">
      {result.errors.map((x) => <div className="item error" key={x}>{x}</div>)}
      {result.warnings.map((x) => <div className="item warn" key={x}>{x}</div>)}
      {!result.errors.length && !result.warnings.length && <div className="item ok">검증 통과</div>}
    </div>
  );
}

export function ConfirmModal({ title, description, children, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        {children}
        <div className="btns">
          <button className="btn" onClick={onCancel}>취소</button>
          <button className="btn primary" onClick={onConfirm}>확인 후 진행</button>
        </div>
      </div>
    </div>
  );
}
