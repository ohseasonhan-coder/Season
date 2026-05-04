import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

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
        <div className="fatal-screen">
          <div className="fatal-card">
            <h1>앱 화면을 불러오는 중 문제가 발생했습니다.</h1>
            <p>검은 화면 대신 오류 화면을 표시했습니다. 아래 오류 내용을 확인해 주세요.</p>
            <pre>{String(this.state.error?.message || this.state.error)}</pre>
            <button onClick={() => window.location.reload()}>새로고침</button>
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
