import type { Config } from "./config.js";
import { lint } from "./lint.js";
import { countWords, maskNonProse, mean, round, splitSentences, tokens } from "./text.js";

export type DiffEntry =
  | { kind: "kept"; draft: string; final: string }
  | { kind: "changed"; draft: string; final: string; similarity: number; wordDelta: number }
  | { kind: "cut"; draft: string; words: number }
  | { kind: "added"; final: string; words: number };

export type DiffReport = {
  entries: DiffEntry[];
  summary: {
    draftWords: number;
    finalWords: number;
    lardFactor: number;
    draftSentences: number;
    finalSentences: number;
    draftAvgSentence: number;
    finalAvgSentence: number;
    kept: number;
    changed: number;
    cut: number;
    added: number;
  };
  rulesRemoved: string[];
  rulesIntroduced: string[];
};

const normalize = (s: string): string => tokens(s).join(" ");

// Dice coefficient over word sets, so a trimmed or extended sentence still pairs with its original.
export const similarity = (a: string, b: string): number => {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size && !tb.size) return 1;
  const inter = [...ta].filter((t) => tb.has(t)).length;
  return (2 * inter) / (ta.size + tb.size);
};

const lcsPairs = (a: string[], b: string[]): [number, number][] => {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
    else j++;
  }
  return pairs;
};

// Within a gap between exact matches, greedily pair the most similar sentences
// as edits, in order. Anything left over is a cut or an addition.
const alignGap = (draft: string[], final: string[], threshold: number): DiffEntry[] => {
  const out: DiffEntry[] = [];
  let j = 0;
  for (const d of draft) {
    const candidates = final.slice(j).map((f, k) => ({ k: j + k, s: similarity(d, f) }));
    const best = candidates.reduce<{ k: number; s: number } | undefined>((acc, c) => (c.s > (acc?.s ?? -1) ? c : acc), undefined);
    if (best && best.s >= threshold) {
      final.slice(j, best.k).forEach((f) => out.push({ kind: "added", final: f, words: countWords(f) }));
      const f = final[best.k] ?? "";
      out.push({ kind: "changed", draft: d, final: f, similarity: round(best.s), wordDelta: countWords(f) - countWords(d) });
      j = best.k + 1;
    } else out.push({ kind: "cut", draft: d, words: countWords(d) });
  }
  final.slice(j).forEach((f) => out.push({ kind: "added", final: f, words: countWords(f) }));
  return out;
};

export const diffSentences = (draftText: string, finalText: string, threshold = 0.4): DiffEntry[] => {
  const draft = splitSentences(draftText).map((s) => s.text);
  const final = splitSentences(finalText).map((s) => s.text);
  const anchors = [...lcsPairs(draft.map(normalize), final.map(normalize)), [draft.length, final.length] as [number, number]];
  const entries: DiffEntry[] = [];
  let di = 0;
  let fi = 0;
  for (const [da, fa] of anchors) {
    entries.push(...alignGap(draft.slice(di, da), final.slice(fi, fa), threshold));
    if (da < draft.length && fa < final.length) entries.push({ kind: "kept", draft: draft[da] ?? "", final: final[fa] ?? "" });
    di = da + 1;
    fi = fa + 1;
  }
  return entries;
};

const ruleIds = (text: string, config: Config): Set<string> => new Set(lint(text, config).violations.map((v) => v.rule));

export const diffReport = (draftText: string, finalText: string, config: Config): DiffReport => {
  const entries = diffSentences(draftText, finalText);
  const draftWords = countWords(maskNonProse(draftText));
  const finalWords = countWords(maskNonProse(finalText));
  const ds = splitSentences(draftText);
  const fs = splitSentences(finalText);
  const count = (k: DiffEntry["kind"]) => entries.filter((e) => e.kind === k).length;
  const before = ruleIds(draftText, config);
  const after = ruleIds(finalText, config);
  return {
    entries,
    summary: {
      draftWords,
      finalWords,
      lardFactor: draftWords ? round((draftWords - finalWords) / draftWords) : 0,
      draftSentences: ds.length,
      finalSentences: fs.length,
      draftAvgSentence: round(mean(ds.map((s) => s.words)), 1),
      finalAvgSentence: round(mean(fs.map((s) => s.words)), 1),
      kept: count("kept"),
      changed: count("changed"),
      cut: count("cut"),
      added: count("added"),
    },
    rulesRemoved: [...before].filter((r) => !after.has(r)).sort(),
    rulesIntroduced: [...after].filter((r) => !before.has(r)).sort(),
  };
};

export const formatDiff = (r: DiffReport): string => {
  const lines = r.entries.flatMap((e) => {
    switch (e.kind) {
      case "kept":
        return [`  = ${e.final}`];
      case "changed":
        return [`  ~ (${e.wordDelta >= 0 ? "+" : ""}${e.wordDelta}w) ${e.draft}`, `    -> ${e.final}`];
      case "cut":
        return [`  - (-${e.words}w) ${e.draft}`];
      case "added":
        return [`  + (+${e.words}w) ${e.final}`];
    }
  });
  const s = r.summary;
  return [
    "Sentence diff (= kept, ~ changed, - cut, + added)",
    ...lines,
    "",
    `Words: ${s.draftWords} -> ${s.finalWords} (lard factor ${s.lardFactor})`,
    `Sentences: ${s.draftSentences} -> ${s.finalSentences}, avg length ${s.draftAvgSentence} -> ${s.finalAvgSentence} words`,
    `Kept ${s.kept}, changed ${s.changed}, cut ${s.cut}, added ${s.added}`,
    `Lint rules the edit removed: ${r.rulesRemoved.join(", ") || "none"}`,
    `Lint rules the edit introduced: ${r.rulesIntroduced.join(", ") || "none"}`,
    "",
    "Next: name the move behind each ~ and - line, then log it in feedback-log.md.",
  ].join("\n");
};
