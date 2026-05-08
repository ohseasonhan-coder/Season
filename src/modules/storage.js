// Auto-split facade: grouped exports from the stable legacy core.
export {
  safeParseJSON,
  isValidAppData,
  cleanupOldBackups,
  createStorageBackup,
  restoreLatestValidBackup,
  loadData,
  saveData,
  estimateJSONSizeBytes,
  formatBytes,
  getStorageBackupList,
  createManualStorageBackup,
  restoreStorageBackup,
  deleteStorageBackup,
  validateImportedAppData
} from "../seasonCore.jsx";
