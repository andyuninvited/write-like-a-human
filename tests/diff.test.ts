import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_PATH, loadConfig } from "../src/lib/config.js";
import { diffReport, diffSentences, similarity } from "../src/lib/diff.js";

const config = loadConfig(DEFAULT_CONFIG_PATH);

describe("diffSentences", () => {
  it("classifies kept, changed, cut, and added sentences", () => {
    const draft = "We shipped the returns flow. It was truly a seamless journey for everyone involved. Support tickets fell by half.";
    const final = "We shipped the returns flow. Support tickets fell by half in the first week. Nobody fills in a form now.";
    const kinds = diffSentences(draft, final).map((e) => e.kind);
    expect(kinds).toEqual(["kept", "cut", "changed", "added"]);
  });

  it("ignores case and punctuation when matching kept sentences", () => {
    expect(diffSentences("Hello, world.", "hello world")[0]?.kind).toBe("kept");
  });

  it("handles empty input", () => {
    expect(diffSentences("", "")).toEqual([]);
    expect(diffSentences("", "New line.").map((e) => e.kind)).toEqual(["added"]);
  });
});

describe("diffReport", () => {
  it("reports lard factor and the lint rules the edit removed", () => {
    const r = diffReport("We leverage robust tools to move fast — really fast.", "We move fast.", config);
    expect(r.summary.draftWords).toBe(9);
    expect(r.summary.finalWords).toBe(3);
    expect(r.summary.lardFactor).toBe(0.67);
    expect(r.rulesRemoved).toEqual(["ai-vocabulary", "em-dash"]);
    expect(r.rulesIntroduced).toEqual([]);
  });
});

describe("similarity", () => {
  it("is 1 for identical word sets and 0 for disjoint ones", () => {
    expect(similarity("a b c", "c b a")).toBe(1);
    expect(similarity("a b", "c d")).toBe(0);
  });
});
