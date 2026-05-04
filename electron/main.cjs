const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f4f5f7",
    show: false,
    title: "개인 CFO 자산관리",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error("did-fail-load", errorCode, errorDescription, validatedURL);
  });

  win.webContents.on("render-process-gone", (event, details) => {
    dialog.showErrorBox("렌더러 오류", `앱 화면 프로세스가 종료되었습니다.\n원인: ${details.reason}`);
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox(
        "빌드 파일 없음",
        "dist/index.html 파일을 찾을 수 없습니다.\n먼저 npm run build 또는 build-win.bat을 실행하세요."
      );
    }
    win.loadFile(indexPath);
  }

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
