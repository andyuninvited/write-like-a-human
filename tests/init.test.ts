import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initWorkspace } from "../src/lib/init.js";

describe("initWorkspace", () => {
  it("scaffolds the voice workspace", () => {
    const dir = join(mkdtempSync(join(tmpdir(), "vl-init-")), "voice");
    const { created, skipped } = initWorkspace(dir);
    expect(skipped).toEqual([]);
    expect(created).toEqual(expect.arrayContaining(["rules.json", "voice-rules.md", "feedback-log.md", "profile.md", join("samples", "README.md"), join("edits", "README.md")]));
    expect(existsSync(join(dir, "samples"))).toBe(true);
  });

  it("never overwrites existing files", () => {
    const dir = mkdtempSync(join(tmpdir(), "vl-init-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "voice-rules.md"), "mine");
    const { skipped } = initWorkspace(dir);
    expect(skipped).toContain("voice-rules.md");
    expect(readFileSync(join(dir, "voice-rules.md"), "utf8")).toBe("mine");
  });
});
