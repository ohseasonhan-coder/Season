const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  appMode: process.env.NODE_ENV || "production"
});
