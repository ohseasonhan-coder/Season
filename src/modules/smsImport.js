// Auto-split facade: grouped exports from the stable legacy core.
export {
  loadUserSmsCategoryRules,
  loadUserSmsPatternRules,
  normalizeSmsLine,
  detectSmsInstitution,
  parseSmsDate,
  extractSmsAmount,
  detectSmsType,
  extractSmsContent,
  findMatchedAccount,
  applyUserSmsPatternRules,
  parseSmsText,
  guessCategory,
  guessSubcategory,
  parseCsvText
} from "../seasonCore.jsx";
