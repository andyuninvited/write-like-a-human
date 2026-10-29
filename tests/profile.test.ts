import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeProfile, distribution, readSamples, renderProfile, sentenceDistance } from "../src/lib/profile.js";

const samples = [
  "I shipped it. We're done. Then we tested it again, and it held.",
  "Thanks for the quote. Can you send the terms by Friday? I'd like red, green, and blue.",
];

describe("computeProfile", () => {
  const p = computeProfile(samples);

  it("measures sentence length", () => {
    expect(p.sentences).toBe(6);
    expect(p.avgSentence).toBeGreaterThan(3);
    expect(Object.values(p.distribution).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 1);
  });

  it("captures openers, contractions, first person, and Oxford commas", () => {
    expect(p.topOpeners.map((o) => o.word)).toContain("i");
    expect(p.contractionsPer100Words).toBeGreaterThan(0);
    expect(p.firstPersonPer100Words).toBeGreaterThan(0);
    expect(p.oxfordCommaRate).toBe(1);
    expect(p.punctuationPerSentence.question).toBeCloseTo(1 / 6, 2);
  });

  it("renders a markdown profile", () => {
    const md = renderProfile(p, "2026-01-01");
    expect(md).toContain("# Voice Profile");
    expect(md).toContain("2026-01-01");
    expect(md).toContain("Oxford comma rate: 100%");
  });
});

describe("distribution and distance", () => {
  it("buckets lengths", () => {
    expect(distribution([3, 10, 50])).toEqual({ "1-8": 0.33, "9-15": 0.33, "16-25": 0, "26-40": 0, "41+": 0.33 });
  });

  it("is zero distance for text matching the profile", () => {
    const p = computeProfile(["One two three. Four five six."]);
    expect(sentenceDistance(p, "Seven eight nine. Ten eleven twelve.")).toEqual({ avgDelta: 0, tvd: 0 });
  });
});

describe("readSamples", () => {
  it("reads md and txt files and skips README", () => {
    const dir = mkdtempSync(join(tmpdir(), "vl-samples-"));
    writeFileSync(join(dir, "a.md"), "A.");
    writeFileSync(join(dir, "b.txt"), "B.");
    writeFileSync(join(dir, "README.md"), "ignore");
    writeFileSync(join(dir, "c.json"), "{}");
    expect(readSamples(dir)).toEqual(["A.", "B."]);
    expect(readSamples(join(dir, "missing"))).toEqual([]);
  });
});
