import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "./config.js";
import { lint, wordPattern, type Violation } from "./lint.js";
import { computeProfile, readSamples, sentenceDistance, type Profile } from "./profile.js";
import { countWords, maskNonProse, mean, round } from "./text.js";

export type CaseMeta = {
  format?: string;
  expected?: string[];
};

export type EvalCase = {
  name: string;
  brief: string;
  draft: string;
  final: string;
  meta: CaseMeta;
};

export type CaseResult = {
  name: string;
  format?: string;
  draftWords: number;
  finalWords: number;
  lardFactor: number;
  draft: { errors: number; warnings: number };
  final: { errors: number; warnings: number; rules: string[] };
  expected: string[];
  caught: string[];
  missed: string[];
  recall: number | null;
  distance: { draft: { avgDelta: number; tvd: number }; final: { avgDelta: number; tvd: number } } | null;
};

export type EvalSummary = {
  cases: number;
  meanLardFactor: number;
  banRecall: number | null;
  finalCleanRate: number;
  meanDraftTvd: number | null;
  meanFinalTvd: number | null;
  passed: boolean;
};

export type Thresholds = {
  minRecall: number;
  minFinalClean: number;
};

const read = (dir: string, file: string): string => {
  const p = join(dir, file);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
};

export const loadCases = (dir: string): EvalCase[] => {
  if (!existsSync(dir)) throw new Error(`Cases directory not found: ${dir}`);
  return readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isDirectory())
    .sort()
    .map((name) => {
      const caseDir = join(dir, name);
      const draft = read(caseDir, "draft.md");
      const final = read(caseDir, "final.md");
      if (!draft || !final) throw new Error(`Case ${name} needs draft.md and final.md`);
      const metaRaw = read(caseDir, "case.json");
      return { name, brief: read(caseDir, "brief.md"), draft, final, meta: metaRaw ? (JSON.parse(metaRaw) as CaseMeta) : {} };
    });
};

// An expectation is a rule id ("em-dash") or a rule id plus the term it should catch ("ai-vocabulary:leverage").
export const expectationMet = (expected: string, violations: Violation[]): boolean => {
  const [rule, term] = expected.split(/:(.*)/s);
  return violations.some(
    (v) => v.rule === rule && (term === undefined || term === "" || new RegExp(wordPattern(term), "i").test(v.match)),
  );
};

export const evalCase = (c: EvalCase, config: Config, profile: Profile | null): CaseResult => {
  const opts = { format: c.meta.format };
  const d = lint(c.draft, config, opts);
  const f = lint(c.final, config, opts);
  const expected = c.meta.expected ?? [];
  const caught = expected.filter((e) => expectationMet(e, d.violations));
  const draftWords = countWords(maskNonProse(c.draft));
  const finalWords = countWords(maskNonProse(c.final));
  return {
    name: c.name,
    format: c.meta.format,
    draftWords,
    finalWords,
    lardFactor: draftWords ? round((draftWords - finalWords) / draftWords) : 0,
    draft: { errors: d.errors, warnings: d.warnings },
    final: { errors: f.errors, warnings: f.warnings, rules: [...new Set(f.violations.filter((v) => v.severity === "error").map((v) => v.rule))] },
    expected,
    caught,
    missed: expected.filter((e) => !caught.includes(e)),
    recall: expected.length ? round(caught.length / expected.length) : null,
    distance: profile ? { draft: sentenceDistance(profile, c.draft), final: sentenceDistance(profile, c.final) } : null,
  };
};

export const summarize = (results: CaseResult[], t: Thresholds): EvalSummary => {
  const expectedTotal = results.reduce((a, r) => a + r.expected.length, 0);
  const caughtTotal = results.reduce((a, r) => a + r.caught.length, 0);
  const withDistance = results.filter((r) => r.distance !== null);
  const banRecall = expectedTotal ? round(caughtTotal / expectedTotal) : null;
  const finalCleanRate = results.length ? round(results.filter((r) => r.final.errors === 0).length / results.length) : 1;
  return {
    cases: results.length,
    meanLardFactor: round(mean(results.map((r) => r.lardFactor))),
    banRecall,
    finalCleanRate,
    meanDraftTvd: withDistance.length ? round(mean(withDistance.map((r) => r.distance?.draft.tvd ?? 0))) : null,
    meanFinalTvd: withDistance.length ? round(mean(withDistance.map((r) => r.distance?.final.tvd ?? 0))) : null,
    passed: (banRecall === null || banRecall >= t.minRecall) && finalCleanRate >= t.minFinalClean,
  };
};

export const runEval = (casesDir: string, config: Config, samplesDir: string | undefined, t: Thresholds) => {
  const samples = samplesDir ? readSamples(samplesDir) : [];
  const profile = samples.length ? computeProfile(samples) : null;
  const results = loadCases(casesDir).map((c) => evalCase(c, config, profile));
  return { results, summary: summarize(results, t), profile };
};

export const formatEval = (results: CaseResult[], s: EvalSummary, t: Thresholds): string => {
  const width = Math.max(...results.map((r) => r.name.length), 4) + 2;
  const rows = results.map((r) => {
    const dist = r.distance ? `  tvd ${r.distance.draft.tvd} -> ${r.distance.final.tvd}` : "";
    const recall = r.recall === null ? "n/a" : `${r.caught.length}/${r.expected.length}`;
    const missed = r.missed.length ? `  missed: ${r.missed.join(", ")}` : "";
    const fp = r.final.errors ? `  final trips: ${r.final.rules.join(", ")}` : "";
    return `${r.name.padEnd(width)} words ${r.draftWords} -> ${r.finalWords} (lard ${r.lardFactor})  errors ${r.draft.errors} -> ${r.final.errors}  recall ${recall}${dist}${missed}${fp}`;
  });
  return [
    ...rows,
    "",
    `Cases: ${s.cases}`,
    `Mean lard factor (draft to final): ${s.meanLardFactor}`,
    `Ban recall: ${s.banRecall ?? "n/a"} (min ${t.minRecall})`,
    `Finals with zero errors: ${s.finalCleanRate} (min ${t.minFinalClean})`,
    s.meanDraftTvd === null ? "Profile distance: no samples found, skipped" : `Sentence-length distance from profile (tvd): drafts ${s.meanDraftTvd}, finals ${s.meanFinalTvd}`,
    s.passed ? "PASS" : "FAIL",
  ].join("\n");
};
