import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_PATH, loadConfig } from "../src/lib/config.js";
import { evalCase, expectationMet, loadCases, runEval, summarize } from "../src/lib/eval.js";
import { lint } from "../src/lib/lint.js";

const config = loadConfig(DEFAULT_CONFIG_PATH);
const t = { minRecall: 0.8, minFinalClean: 1 };

describe("expectationMet", () => {
  const v = lint("We are leveraging it — now.", config).violations;
  it("matches by rule id or rule id plus term", () => {
    expect(expectationMet("em-dash", v)).toBe(true);
    expect(expectationMet("ai-vocabulary:leverage", v)).toBe(true);
    expect(expectationMet("ai-vocabulary:robust", v)).toBe(false);
    expect(expectationMet("triplet", v)).toBe(false);
  });
});

describe("evalCase", () => {
  it("scores recall, lard factor, and final errors", () => {
    const r = evalCase(
      { name: "x", brief: "", draft: "We leverage tools — fast.", final: "We move fast.", meta: { expected: ["em-dash", "ai-vocabulary:leverage", "meta-commentary"] } },
      config,
      null,
    );
    expect(r.caught).toEqual(["em-dash", "ai-vocabulary:leverage"]);
    expect(r.missed).toEqual(["meta-commentary"]);
    expect(r.recall).toBe(0.67);
    expect(r.lardFactor).toBe(0.25);
    expect(r.final.errors).toBe(0);
    expect(r.distance).toBeNull();
  });
});

describe("summarize", () => {
  it("fails when a final trips an error rule", () => {
    const r = evalCase({ name: "y", brief: "", draft: "Robust.", final: "Still robust.", meta: { expected: ["ai-vocabulary"] } }, config, null);
    const s = summarize([r], t);
    expect(s.finalCleanRate).toBe(0);
    expect(s.passed).toBe(false);
  });
});

describe("loadCases and runEval", () => {
  it("loads case folders and runs end to end", () => {
    const root = mkdtempSync(join(tmpdir(), "vl-eval-"));
    const c = join(root, "cases", "one");
    mkdirSync(c, { recursive: true });
    writeFileSync(join(c, "draft.md"), "It's not a tool, it's a teammate.");
    writeFileSync(join(c, "final.md"), "It works like a teammate.");
    writeFileSync(join(c, "case.json"), JSON.stringify({ expected: ["contrastive-not-its"] }));
    mkdirSync(join(root, "samples"));
    writeFileSync(join(root, "samples", "s.md"), "Short one. Another short one.");
    const { results, summary } = runEval(join(root, "cases"), config, join(root, "samples"), t);
    expect(results).toHaveLength(1);
    expect(summary).toMatchObject({ cases: 1, banRecall: 1, finalCleanRate: 1, passed: true });
    expect(summary.meanFinalTvd).not.toBeNull();
  });

  it("throws on a case missing its final", () => {
    const root = mkdtempSync(join(tmpdir(), "vl-eval-"));
    mkdirSync(join(root, "bad"));
    writeFileSync(join(root, "bad", "draft.md"), "x");
    expect(() => loadCases(root)).toThrow(/final\.md/);
  });

  it("passes on the shipped example cases", () => {
    const { summary } = runEval("evals/cases", loadConfig("examples/voice/rules.json"), "examples/voice/samples", t);
    expect(summary.cases).toBeGreaterThanOrEqual(5);
    expect(summary.passed).toBe(true);
  });
});
