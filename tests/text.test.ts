import { describe, expect, it } from "vitest";
import { countWords, lineCol, maskNonProse, median, parseFrontmatter, splitSentences } from "../src/lib/text.js";

describe("parseFrontmatter", () => {
  it("reads simple key: value pairs and returns the body", () => {
    const { data, body } = parseFrontmatter("---\nformat: cold-email\nmaxWords: \"90\"\n---\nHello there.");
    expect(data).toEqual({ format: "cold-email", maxWords: "90" });
    expect(body).toBe("Hello there.");
  });

  it("returns the text untouched when there is no frontmatter", () => {
    expect(parseFrontmatter("Just text.")).toEqual({ data: {}, body: "Just text." });
  });
});

describe("maskNonProse", () => {
  it("blanks code and frontmatter but keeps offsets", () => {
    const text = "---\na: b\n---\nUse `leverage` here.\n```\nrobust\n```\nDone.";
    const masked = maskNonProse(text);
    expect(masked).toHaveLength(text.length);
    expect(masked).not.toMatch(/leverage|robust|a: b/);
    expect(masked).toContain("Done.");
  });
});

describe("splitSentences", () => {
  it("splits on terminal punctuation followed by a capital", () => {
    expect(splitSentences("We shipped. It worked! Did it?").map((s) => s.text)).toEqual(["We shipped.", "It worked!", "Did it?"]);
  });

  it("keeps abbreviations and decimals inside one sentence", () => {
    const s = splitSentences("Use a tool, e.g. a linter. Growth hit 3.5 percent.");
    expect(s.map((x) => x.text)).toEqual(["Use a tool, e.g. a linter.", "Growth hit 3.5 percent."]);
  });

  it("treats headings, list items, and blank lines as boundaries", () => {
    const s = splitSentences("# Title\n\nFirst para\nwraps here.\n\n- item one\n- item two");
    expect(s.map((x) => x.text)).toEqual(["Title", "First para wraps here.", "item one", "item two"]);
  });

  it("counts words per sentence", () => {
    expect(splitSentences("One two three.")[0]?.words).toBe(3);
  });
});

describe("helpers", () => {
  it("counts words including contractions and hyphenated words", () => {
    expect(countWords("It's a well-known fact, 100 percent.")).toBe(6);
  });

  it("computes line and column from an index", () => {
    expect(lineCol("ab\ncd", 4)).toEqual({ line: 2, col: 2 });
  });

  it("computes medians for odd and even lists", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});
