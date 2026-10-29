#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { resolveConfig } from "./lib/config.js";
import { diffReport, formatDiff } from "./lib/diff.js";
import { formatEval, runEval } from "./lib/eval.js";
import { initWorkspace } from "./lib/init.js";
import { formatLint, lint } from "./lib/lint.js";
import { computeProfile, readSamples, renderProfile } from "./lib/profile.js";

const HELP = `write-like-a-human: make AI write in your voice, and learn from your edits.

Usage:
  write-like-a-human init [dir]                 Scaffold a voice workspace (default ./voice)
  write-like-a-human lint <file...>             Mechanical checks from your rules
      --format <name>                   Apply a word budget from rules.json formats
      --max-words <n>                   Explicit word ceiling
  write-like-a-human diff <draft> <final>       Sentence-level diff for the learning loop
  write-like-a-human profile                    Compute a fingerprint from voice/samples into voice/profile.md
  write-like-a-human eval                       Run the eval suite
      --cases <dir>                     Case folders (default evals/cases)
      --min-recall <0-1>                Fail below this ban recall (default 0.8)
      --min-final-clean <0-1>           Fail below this share of clean finals (default 1)
      --judge                           Optional LLM judge (stub, off by default)

Alias: wlah <command> works the same.

Shared flags:
  --voice <dir>     Voice workspace (default ./voice)
  --config <file>   Rules file (default <voice>/rules.json, then built-in defaults)
  --json            Machine-readable output
  -h, --help        Show this help
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    format: { type: "string" },
    "max-words": { type: "string" },
    voice: { type: "string", default: "voice" },
    config: { type: "string" },
    cases: { type: "string", default: join("evals", "cases") },
    "min-recall": { type: "string", default: "0.8" },
    "min-final-clean": { type: "string", default: "1" },
    judge: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

const out = (data: unknown, human: string): void => {
  console.log(values.json ? JSON.stringify(data, null, 2) : human);
};

const num = (flag: string, raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`--${flag} must be a number, got "${raw}"`);
  return n;
};

const commands: Record<string, (args: string[]) => number> = {
  init: ([dir]) => {
    const target = dir ?? values.voice ?? "voice";
    const { created, skipped } = initWorkspace(target);
    out(
      { target, created, skipped },
      [
        `Voice workspace at ${target}/`,
        ...created.map((f) => `  created ${f}`),
        ...skipped.map((f) => `  kept existing ${f}`),
        "",
        `Next: put 3 to 10 pieces of your own writing in ${target}/samples/, then run \`write-like-a-human profile\`.`,
      ].join("\n"),
    );
    return 0;
  },

  lint: (files) => {
    if (!files.length) throw new Error("lint needs at least one file");
    const config = resolveConfig(values.config, values.voice);
    const opts = { format: values.format, maxWords: num("max-words", values["max-words"]) };
    const results = files.map((file) => ({ file, ...lint(readFileSync(file, "utf8"), config, opts) }));
    out(results, results.map((r) => formatLint(r.file, r)).join("\n\n"));
    return results.some((r) => r.errors > 0) ? 1 : 0;
  },

  diff: ([draft, final]) => {
    if (!draft || !final) throw new Error("diff needs <draft> <final>");
    const report = diffReport(readFileSync(draft, "utf8"), readFileSync(final, "utf8"), resolveConfig(values.config, values.voice));
    out(report, formatDiff(report));
    return 0;
  },

  profile: () => {
    const voice = values.voice ?? "voice";
    const samples = readSamples(join(voice, "samples"));
    if (!samples.length) throw new Error(`No .md or .txt samples in ${join(voice, "samples")}. Add some of your own writing first.`);
    const profile = computeProfile(samples);
    const path = join(voice, "profile.md");
    writeFileSync(path, renderProfile(profile, new Date().toISOString().slice(0, 10)));
    out(profile, `Wrote ${path} from ${profile.samples} sample(s): avg sentence ${profile.avgSentence} words, ${profile.words} words total.`);
    return 0;
  },

  eval: () => {
    if (values.judge) {
      if (process.env.WLAH_JUDGE !== "1") throw new Error("--judge also needs WLAH_JUDGE=1 set. It is off by default.");
      throw new Error("The LLM judge is a stub in this release. Deterministic metrics only.");
    }
    const t = { minRecall: num("min-recall", values["min-recall"]) ?? 0.8, minFinalClean: num("min-final-clean", values["min-final-clean"]) ?? 1 };
    const voice = values.voice ?? "voice";
    const { results, summary } = runEval(values.cases ?? join("evals", "cases"), resolveConfig(values.config, voice), join(voice, "samples"), t);
    out({ results, summary }, formatEval(results, summary, t));
    return summary.passed ? 0 : 1;
  },
};

const main = (): number => {
  const [command, ...args] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return command || values.help ? 0 : 1;
  }
  const run = commands[command];
  if (!run) {
    console.error(`Unknown command "${command}".\n\n${HELP}`);
    return 1;
  }
  try {
    return run(args);
  } catch (e) {
    console.error(`write-like-a-human ${command}: ${(e as Error).message}`);
    return 2;
  }
};

process.exitCode = main();
