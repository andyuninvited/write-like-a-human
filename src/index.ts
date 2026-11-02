export {
  DEFAULT_CONFIG_PATH,
  loadConfig,
  parseConfig,
  resolveConfig,
  type Config,
  type FormatBudget,
  type RegexRule,
  type Rule,
  type Severity,
  type WordsRule,
} from "./lib/config.js";
export { formatLint, lint, type LintOptions, type LintResult, type Violation } from "./lib/lint.js";
export { diffReport, diffSentences, formatDiff, type DiffEntry, type DiffReport } from "./lib/diff.js";
export { computeProfile, readSamples, renderProfile, sentenceDistance, type Profile } from "./lib/profile.js";
