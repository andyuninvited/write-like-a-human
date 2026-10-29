import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type Severity = "error" | "warn";

export type WordsRule = {
  id: string;
  kind: "words";
  words: string[];
  message: string;
  severity?: Severity;
};

export type RegexRule = {
  id: string;
  kind: "regex";
  pattern: string;
  flags?: string;
  message: string;
  severity?: Severity;
};

export type Rule = WordsRule | RegexRule;

export type FormatBudget = {
  maxWords: number;
  targetWords?: number;
};

export type Config = {
  rules: Rule[];
  triplets: { enabled: boolean; severity: Severity };
  formats: Record<string, FormatBudget>;
  disabled: string[];
};

export const TEMPLATES_DIR = fileURLToPath(new URL("../../skills/write-like-a-human/templates", import.meta.url));
export const DEFAULT_CONFIG_PATH = join(TEMPLATES_DIR, "voice", "rules.json");

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const fail = (path: string, msg: string): never => {
  throw new Error(`Invalid rules config ${path}: ${msg}`);
};

const parseRule = (path: string, raw: unknown, i: number): Rule => {
  if (!isRecord(raw)) return fail(path, `rules[${i}] must be an object`);
  const { id, kind, message, severity } = raw;
  if (typeof id !== "string" || !id) return fail(path, `rules[${i}].id must be a non-empty string`);
  if (typeof message !== "string") return fail(path, `rule "${id}" needs a message`);
  if (severity !== undefined && severity !== "error" && severity !== "warn")
    return fail(path, `rule "${id}" severity must be "error" or "warn"`);
  if (kind === "words") {
    if (!Array.isArray(raw.words) || !raw.words.every((w) => typeof w === "string"))
      return fail(path, `rule "${id}" words must be a string array`);
    return { id, kind, words: raw.words as string[], message, severity };
  }
  if (kind === "regex") {
    if (typeof raw.pattern !== "string") return fail(path, `rule "${id}" pattern must be a string`);
    const flags = typeof raw.flags === "string" ? raw.flags : undefined;
    try {
      new RegExp(raw.pattern, flags);
    } catch (e) {
      return fail(path, `rule "${id}" has a bad regex: ${(e as Error).message}`);
    }
    return { id, kind, pattern: raw.pattern, flags, message, severity };
  }
  return fail(path, `rule "${id}" kind must be "words" or "regex"`);
};

const parseFormats = (path: string, raw: unknown): Record<string, FormatBudget> => {
  if (raw === undefined) return {};
  if (!isRecord(raw)) return fail(path, "formats must be an object");
  return Object.fromEntries(
    Object.entries(raw).map(([name, v]) => {
      if (!isRecord(v) || typeof v.maxWords !== "number") return fail(path, `formats.${name}.maxWords must be a number`);
      const targetWords = typeof v.targetWords === "number" ? v.targetWords : undefined;
      return [name, { maxWords: v.maxWords, targetWords }];
    }),
  );
};

export const parseConfig = (path: string, json: unknown): Config => {
  if (!isRecord(json)) return fail(path, "top level must be an object");
  const rules = Array.isArray(json.rules) ? json.rules.map((r, i) => parseRule(path, r, i)) : [];
  const t = isRecord(json.triplets) ? json.triplets : {};
  const disabled = Array.isArray(json.disabled) ? json.disabled.filter((d): d is string => typeof d === "string") : [];
  return {
    rules,
    triplets: { enabled: t.enabled !== false, severity: t.severity === "error" ? "error" : "warn" },
    formats: parseFormats(path, json.formats),
    disabled,
  };
};

export const loadConfig = (path: string): Config => parseConfig(path, JSON.parse(readFileSync(path, "utf8")) as unknown);

// Explicit path wins, then <voiceDir>/rules.json, then the shipped defaults.
export const resolveConfig = (explicit: string | undefined, voiceDir = "voice"): Config => {
  if (explicit) return loadConfig(explicit);
  const local = join(voiceDir, "rules.json");
  return loadConfig(existsSync(local) ? local : DEFAULT_CONFIG_PATH);
};
