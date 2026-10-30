# DEVLOG

## Working State

**Current Task**: Initial build of the skill, CLI, and eval harness (issue #1, branch `feat/1-initial-skill`).

**Key Files**:
- `skills/write-like-a-human/SKILL.md` - the skill: find workspace, load, draft, diagnose, gate, report, and the learning-loop trigger
- `skills/write-like-a-human/templates/style/rules.json` - starter mechanical rules, single source for `init` and the lint fallback
- `src/lib/lint.ts` - rule engine: words and regex rules, triplet heuristic, word budgets, code masking
- `src/lib/diff.ts` - sentence-level diff (LCS anchors plus Dice-similarity pairing) for the learning loop
- `src/lib/eval.ts` - deterministic eval: ban recall, clean finals, lard factor, profile distance

**Active Decisions**:
- Templates live inside the skill folder so a copied skill is self-contained.
- Mechanical rules in JSON, judgment rules in Markdown. A regex cannot judge stress position, and a Markdown rule cannot fail a build.
- Diff similarity uses Dice over word sets. Jaccard under-paired sentences that were trimmed or extended.
- One example case misses on purpose ("journey") to show what a recall gap looks like.

**Next Steps**: Push to GitHub, open the PR, and collect real-user feedback on the init interview.

**Blockers**: None in code.

**Gotchas**:
- Regex rules default to case-insensitive and always get the `g` flag added.
- `throat-clearing` and `restating-closer` use a lookbehind for sentence starts, so they need the `m` flag to match at line starts.

## Session Archive

### 2026-10-29 - Initial build
Extracted principles and mechanisms from a private writing skill into a generic, privacy-clean version. Built the skill (SKILL.md plus five references), workspace templates, a TypeScript CLI (init, lint, diff, profile, eval), 53 vitest tests, six invented eval cases, and an invented example style. Eval surfaced a real gap: `meta-commentary` missed "The real problem was," so the rule now accepts "is" or "was."

## Milestones

- 2026-10-29 - v0.1.0 feature-complete on branch

## Mistakes & Lessons

- 2026-10-29 - First `contrastive-not-but` regex let X span commas and matched across two clauses. Excluding commas from X fixed it. Lesson: test every regex rule against a sentence that contains two constructions.

## Technical Debt

- LLM judge is a stub. Needs a design that keeps prompts and user samples private before it calls anything.
- Triplet heuristic only catches comma series, not three parallel sentences in a row.
- Sentence splitter handles common abbreviations only.
