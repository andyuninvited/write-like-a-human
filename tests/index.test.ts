import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_PATH, lint, loadConfig } from "../src/index.js";

describe("library entry", () => {
  it("lints a string with the default config and flags a banned pattern", () => {
    const config = loadConfig(DEFAULT_CONFIG_PATH);
    const result = lint("We leveraged the data to delve into churn.", config);
    const rules = result.violations.map((v) => v.rule);
    expect(rules).toContain("ai-vocabulary");
    expect(result.errors).toBeGreaterThan(0);
  });
});
