import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_PATH, loadConfig, parseConfig, type Config } from "../src/lib/config.js";
import { lint, wordPattern } from "../src/lib/lint.js";

const defaults = loadConfig(DEFAULT_CONFIG_PATH);
const ids = (text: string, config: Config = defaults, opts = {}) => lint(text, config, opts).violations.map((v) => v.rule);

describe("default rules", () => {
  it.each([
    ["em-dash", "We moved fast — too fast."],
    ["ai-vocabulary", "We leveraged the data."],
    ["ai-vocabulary", "A seamless handoff."],
    ["contrastive-not-but", "It was not a cost decision, but a values decision."],
    ["contrastive-not-its", "It's not a tool, it's a teammate."],
    ["contrastive-not-its", "This isn't about speed. It's about trust."],
    ["contrastive-soft", "We chose email rather than chat."],
    ["throat-clearing", "I hope this email finds you well. Here is the plan."],
    ["throat-clearing", "Thanks. In today's market, speed wins."],
    ["meta-commentary", "The real problem was latency."],
    ["restating-closer", "We won. In short, it worked."],
    ["empty-intensifier", "I am truly excited."],
    ["triplet", "We value speed, trust, and focus."],
  ])("flags %s in %j", (rule, text) => {
    expect(ids(text)).toContain(rule);
  });

  it("passes plain prose", () => {
    const r = lint("We moved billing reminders to the week before renewal. Churn dropped by half.", defaults);
    expect(r.errors).toBe(0);
    expect(r.warnings).toBe(0);
  });

  it("does not flag text inside code spans or fences", () => {
    expect(ids("Avoid `leverage` and:\n\n```\nIt's not X, it's Y — robust\n```\n")).toEqual([]);
  });

  it("does not read a two-part sentence as a triplet", () => {
    expect(ids("When you rewrite it, paste your version back or drop the pair in the inbox.")).toEqual([]);
    expect(ids("We need red, green and blue.")).toContain("triplet");
  });

  it("does not flag a plain negative without a contrast", () => {
    expect(ids("We did not ship on Friday. The fix needs testing.")).toEqual([]);
  });

  it("reports line and column of each hit", () => {
    const [v] = lint("Fine line.\nWe leverage it.", defaults).violations;
    expect(v).toMatchObject({ rule: "ai-vocabulary", line: 2, col: 4, match: "leverage" });
  });
});

describe("word budget", () => {
  const long = Array.from({ length: 140 }, () => "word").join(" ");

  it("errors past the format ceiling from frontmatter", () => {
    const r = lint(`---\nformat: cold-email\n---\n${long}`, defaults);
    expect(r.violations.find((v) => v.rule === "word-budget")?.severity).toBe("error");
    expect(r.words).toBe(140);
  });

  it("warns past the target but under the ceiling", () => {
    const r = lint(long, defaults, { format: "cover-letter", maxWords: undefined });
    expect(r.violations.some((v) => v.rule === "word-budget")).toBe(false);
    const mid = Array.from({ length: 260 }, () => "word").join(" ");
    expect(lint(mid, defaults, { format: "cover-letter" }).violations[0]).toMatchObject({ rule: "word-budget", severity: "warn" });
  });

  it("lets an explicit --max-words win", () => {
    expect(ids("one two three four", defaults, { maxWords: 3 })).toContain("word-budget");
  });
});

describe("config", () => {
  it("turns rules off through disabled", () => {
    const config = { ...defaults, disabled: ["em-dash", "triplet"] };
    expect(ids("A — B, C, and D.", config)).toEqual([]);
  });

  it("supports custom word rules and warn severity", () => {
    const config = parseConfig("test", { rules: [{ id: "mine", kind: "words", words: ["synergize"], message: "no", severity: "warn" }] });
    const r = lint("They synergized.", config);
    expect(r.warnings).toBe(1);
    expect(r.errors).toBe(0);
  });

  it("rejects malformed configs with a useful message", () => {
    expect(() => parseConfig("x.json", { rules: [{ id: "bad", kind: "regex", pattern: "(", message: "m" }] })).toThrow(/bad regex/);
    expect(() => parseConfig("x.json", { rules: [{ kind: "words" }] })).toThrow(/id/);
    expect(() => parseConfig("x.json", { formats: { a: {} } })).toThrow(/maxWords/);
  });
});

describe("wordPattern", () => {
  it("matches common inflections", () => {
    const re = new RegExp(wordPattern("leverage"), "i");
    expect(["leverage", "leverages", "leveraged", "leveraging"].every((w) => re.test(w))).toBe(true);
    expect(re.test("leverager")).toBe(false);
  });
});
