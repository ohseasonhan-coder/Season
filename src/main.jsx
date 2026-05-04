import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./styles.css";

async function cleanupOldServiceWorkersAndCaches() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("Service worker/cache cleanup skipped:", error);
  }
}

cleanupOldServiceWorkersAndCaches().finally(() => {
  const root = document.getElementById("root");

  if (!root) {
    document.body.innerHTML = "<pre style='color:white;padding:20px'>root element not found</pre>";
    return;
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
});
