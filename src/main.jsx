import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Root render error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0d0f14",
          color: "#f0f1f3",
          padding: 24,
          fontFamily: "Pretendard, Arial, sans-serif"
        }}>
          <div style={{
            width: "min(760px, 100%)",
            background: "#161920",
            border: "1px solid #2a2d36",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 70px rgba(0,0,0,.45)"
          }}>
            <h1 style={{fontSize: 22, marginBottom: 10}}>앱 화면을 불러오는 중 문제가 발생했습니다.</h1>
            <p style={{color: "#9ba3b5", lineHeight: 1.6}}>
              검은 화면 대신 오류 화면을 표시했습니다. 아래 오류 내용을 확인해 주세요.
            </p>
            <pre style={{
              marginTop: 16,
              whiteSpace: "pre-wrap",
              background: "#0d0f14",
              border: "1px solid #2a2d36",
              color: "#ffb4c0",
              padding: 14,
              borderRadius: 14
            }}>{String(this.state.error?.message || this.state.error)}</pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                border: 0,
                background: "#6c7dff",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML = "<div style='padding:24px;font-family:Arial'>root 요소를 찾을 수 없습니다.</div>";
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
