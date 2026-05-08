import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// ── 전역 JS 오류를 화면에 표시 (배포 환경 디버깅용)
window.addEventListener("error", (e) => {
  const existing = document.getElementById("__global_error_overlay");
  if (existing) return;
  const div = document.createElement("div");
  div.id = "__global_error_overlay";
  div.style.cssText = "position:fixed;inset:0;z-index:999999;background:#0d0f14;color:#f0f1f3;padding:32px;font-family:monospace;overflow:auto;";
  div.innerHTML = `
    <h2 style="color:#ff5c72;margin:0 0 16px">⚠️ 앱 로드 오류</h2>
    <p style="color:#9ba3b5;margin:0 0 12px;font-family:sans-serif">아래 오류 내용을 개발자에게 전달해주세요.</p>
    <pre style="background:#161920;border:1px solid #2a2d36;padding:16px;border-radius:12px;white-space:pre-wrap;color:#ffb4c0;font-size:13px">${e.message}\n\n${e.filename}:${e.lineno}:${e.colno}</pre>
    <button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#6c7dff;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">새로고침</button>
    <button onclick="this.parentElement.remove()" style="margin-top:16px;margin-left:8px;padding:10px 20px;background:#2a2d36;color:#9ba3b5;border:none;border-radius:10px;font-size:14px;cursor:pointer">닫기</button>
  `;
  document.body.appendChild(div);
});

window.addEventListener("unhandledrejection", (e) => {
  const existing = document.getElementById("__global_error_overlay");
  if (existing) return;
  const div = document.createElement("div");
  div.id = "__global_error_overlay";
  div.style.cssText = "position:fixed;inset:0;z-index:999999;background:#0d0f14;color:#f0f1f3;padding:32px;font-family:monospace;overflow:auto;";
  div.innerHTML = `
    <h2 style="color:#ff5c72;margin:0 0 16px">⚠️ 앱 Promise 오류</h2>
    <p style="color:#9ba3b5;margin:0 0 12px;font-family:sans-serif">아래 오류 내용을 개발자에게 전달해주세요.</p>
    <pre style="background:#161920;border:1px solid #2a2d36;padding:16px;border-radius:12px;white-space:pre-wrap;color:#ffb4c0;font-size:13px">${String(e.reason?.message || e.reason)}</pre>
    <button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#6c7dff;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">새로고침</button>
    <button onclick="this.parentElement.remove()" style="margin-top:16px;margin-left:8px;padding:10px 20px;background:#2a2d36;color:#9ba3b5;border:none;border-radius:10px;font-size:14px;cursor:pointer">닫기</button>
  `;
  document.body.appendChild(div);
});

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

// ── 안정화 버전: 기존 서비스워커/PWA 캐시 제거
// 이전 배포의 service worker가 오래된 index.html 또는 JS 해시 파일을 캐시하면
// Vercel에서 JS 요청이 index.html로 되돌아와 검은 화면/MIME 오류가 발생할 수 있습니다.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("season-cfo")).map((key) => caches.delete(key)));
      }
      console.info("[SW] 기존 서비스워커와 앱 캐시를 정리했습니다.");
    } catch (err) {
      console.warn("[SW] 정리 실패:", err);
    }
  });
}
