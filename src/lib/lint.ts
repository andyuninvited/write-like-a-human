import type { Config, Rule, Severity } from "./config.js";
import { countWords, lineCol, maskNonProse, parseFrontmatter } from "./text.js";

export type Violation = {
  rule: string;
  severity: Severity;
  message: string;
  match: string;
  line: number;
  col: number;
};

export type LintOptions = {
  format?: string;
  maxWords?: number;
};

export type LintResult = {
  words: number;
  format?: string;
  maxWords?: number;
  violations: Violation[];
  errors: number;
  warnings: number;
};

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "leverage" also catches leverages, leveraged, leveraging.
export const wordPattern = (word: string): string => {
  const w = escape(word.trim()).replace(/\s+/g, "\\s+");
  if (/\s/.test(word.trim())) return `\\b${w}\\b`;
  const stem = word.endsWith("e") ? escape(word.slice(0, -1)) : w;
  return `\\b(?:${w}(?:s|es|d|ed|ly)?|${stem}ing)\\b`;
};

const toRegExp = (rule: Rule): RegExp => {
  if (rule.kind === "words") return new RegExp(rule.words.map(wordPattern).join("|"), "gi");
  const flags = rule.flags ?? "i";
  return new RegExp(rule.pattern, flags.includes("g") ? flags : `${flags}g`);
};

// "A, B, and C" with items up to four words, or "A, B and C" with items up to two words.
// The tighter second form keeps "When X, do Y or Z" from reading as a list.
const TRIPLET =
  /\b[\w'’-]+(?:[ \t]+[\w'’-]+){0,3},[ \t]+[\w'’-]+(?:[ \t]+[\w'’-]+){0,3},[ \t]+(?:and|or)[ \t]+[\w'’-]+|\b[\w'’-]+(?:[ \t]+[\w'’-]+)?,[ \t]+[\w'’-]+(?:[ \t]+[\w'’-]+)?[ \t]+(?:and|or)[ \t]+[\w'’-]+/gi;

const scan = (original: string, masked: string, re: RegExp, make: (match: string) => Omit<Violation, "line" | "col" | "match">): Violation[] =>
  [...masked.matchAll(re)]
    .filter((m) => m[0].trim() !== "")
    .map((m) => ({ ...make(m[0]), match: original.slice(m.index ?? 0, (m.index ?? 0) + m[0].length), ...lineCol(original, m.index ?? 0) }));

const budgetFor = (text: string, config: Config, opts: LintOptions): { format?: string; maxWords?: number; targetWords?: number } => {
  const { data } = parseFrontmatter(text);
  const format = opts.format ?? data.format;
  const fmMax = Number(data.maxWords ?? data["max-words"]);
  const preset = format ? config.formats[format] : undefined;
  const maxWords = opts.maxWords ?? (Number.isFinite(fmMax) && fmMax > 0 ? fmMax : preset?.maxWords);
  return { format, maxWords, targetWords: preset?.targetWords };
};

export const lint = (text: string, config: Config, opts: LintOptions = {}): LintResult => {
  const masked = maskNonProse(text);
  const active = config.rules.filter((r) => !config.disabled.includes(r.id));

  const ruleHits = active.flatMap((rule) =>
    scan(text, masked, toRegExp(rule), () => ({ rule: rule.id, severity: rule.severity ?? "error", message: rule.message })),
  );

  const tripletHits =
    config.triplets.enabled && !config.disabled.includes("triplet")
      ? scan(text, masked, TRIPLET, () => ({
          rule: "triplet",
          severity: config.triplets.severity,
          message: "Three-item series. Keep the strongest item unless all three carry a new particular.",
        }))
      : [];

  const words = countWords(masked);
  const { format, maxWords, targetWords } = budgetFor(text, config, opts);
  const budgetHits: Violation[] = [];
  if (maxWords !== undefined && !config.disabled.includes("word-budget")) {
    if (words > maxWords)
      budgetHits.push({ rule: "word-budget", severity: "error", message: `${words} words, over the ${maxWords}-word ceiling${format ? ` for ${format}` : ""}.`, match: "", line: 1, col: 1 });
    else if (targetWords !== undefined && words > targetWords)
      budgetHits.push({ rule: "word-budget", severity: "warn", message: `${words} words, over the ${targetWords}-word target${format ? ` for ${format}` : ""}.`, match: "", line: 1, col: 1 });
  }

  const violations = [...budgetHits, ...ruleHits, ...tripletHits].sort((a, b) => a.line - b.line || a.col - b.col);
  return {
    words,
    format,
    maxWords,
    violations,
    errors: violations.filter((v) => v.severity === "error").length,
    warnings: violations.filter((v) => v.severity === "warn").length,
  };
};

export const formatLint = (file: string, result: LintResult): string => {
  const lines = result.violations.map(
    (v) => `${file}:${v.line}:${v.col}  ${v.severity.padEnd(5)}  ${v.rule.padEnd(22)}  ${v.message}${v.match ? `  "${v.match.replace(/\s+/g, " ")}"` : ""}`,
  );
  const budget = result.maxWords !== undefined ? ` / ${result.maxWords}` : "";
  const summary = `${file}: ${result.words}${budget} words, ${result.errors} error(s), ${result.warnings} warning(s)`;
  return [...lines, summary].join("\n");
};
