import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error("Season CFO render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh",
        background: "#070b12",
        color: "#f6f7fb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        padding: 24
      }}>
        <div style={{
          maxWidth: 820,
          margin: "60px auto",
          background: "#101521",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 24,
          padding: 24
        }}>
          <p style={{ color: "#8b9aff", fontWeight: 900, fontSize: 12, letterSpacing: ".08em" }}>
            SEASON CFO ERROR RECOVERY
          </p>
          <h1 style={{ margin: "0 0 10px", letterSpacing: "-.04em" }}>
            앱 렌더링 중 오류가 발생했습니다
          </h1>
          <p style={{ color: "#9da6b8", lineHeight: 1.6 }}>
            검은 화면 대신 오류를 표시하도록 복구 화면이 실행되었습니다.
            아래 메시지를 복사해서 확인하면 원인을 빠르게 잡을 수 있습니다.
          </p>
          <pre style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "#070b12",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 14,
            padding: 14,
            color: "#ff90a0",
            fontSize: 12
          }}>
            {String(this.state.error?.stack || this.state.error || "Unknown error")}
          </pre>
          <button
            onClick={() => {
              localStorage.removeItem("season-dropin-final-data");
              localStorage.removeItem("season-dropin-final-recovery");
              localStorage.removeItem("season-dropin-final-notifications");
              window.location.reload();
            }}
            style={{
              border: "1px solid rgba(255,255,255,.12)",
              background: "#6c7dff",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            로컬 데이터 초기화 후 새로고침
          </button>
        </div>
      </div>
    );
  }
}
