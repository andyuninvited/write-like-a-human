# write-like-a-human

Make AI write in your voice, and get better every time you fix a draft.

write-like-a-human is a Claude Code skill plus a small CLI. The skill drafts from your own writing samples and rules. When you rewrite a draft, it diffs your version against its own, names what you changed, and turns repeated changes into rules. The CLI enforces those rules mechanically and measures whether they still catch what you cut.

MIT licensed. By Andy Rosic.

## The problem

AI drafts read like AI drafts. They pad for completeness, stack three examples where one would do, open by clearing their throat, and close by restating the point. They also sound like nobody in particular.

Style prompts help for a day. The fix that lasts is a loop: your edits are the ground truth, and every edit you make teaches the system something specific. write-like-a-human gives that loop a folder layout, a procedure, and a set of tests so it keeps working after the first week.

## Quickstart (60 seconds)

1. Clone the repo and copy the skill into Claude Code:

   ```sh
   git clone https://github.com/andyuninvited/write-like-a-human.git
   cp -r write-like-a-human/skills/write-like-a-human ~/.claude/skills/        # every project
   # or
   cp -r write-like-a-human/skills/write-like-a-human your-project/.claude/skills/   # one project
   ```

2. In Claude Code, say "set up write-like-a-human." Claude asks who you write to, what you write, and which words you hate, then asks you to paste 3 to 10 things you wrote yourself. It builds your workspace from those answers.

3. Ask for a draft as usual ("write a cold email to..."). When you rewrite it, paste your version back or drop the pair into `voice/edits/`. That starts the loop.

The CLI is optional. The skill works without it, and uses it when it is installed:

```sh
cd write-like-a-human
npm install        # also builds dist/
npm link           # puts `write-like-a-human` and the short alias `wlah` on your PATH
wlah --help
```

Node 20 or newer. No runtime dependencies.

## How the loop works

```
  your samples ──► profile.md + voice-rules.md + rules.json
                          │
                          ▼
   brief ──► Claude drafts to a format budget
                          │
                          ▼
             diagnostic pass + `write-like-a-human lint`
                          │
                          ▼
                  draft goes to you
                          │
              you rewrite it and send
                          │
                          ▼
   draft + final ──► `write-like-a-human diff` ──► name each move
                          │
           ┌──────────────┼───────────────────┐
           ▼              ▼                   ▼
      one-off        seen twice         violated 3 times
      (log it)    (promote to rules)  (add a regex to rules.json)
                          │
                          ▼
            feedback-log.md, then back to the top
```

Four habits keep the loop healthy:

- **Never invent a particular.** Names, numbers, and outcomes come from a real source or they stay out. Thin material means a shorter draft.
- **Promote on the second occurrence.** One edit is an anecdote. Two edits are a rule.
- **Turn repeat offenders into checks.** A rule broken three times gets a regex in `rules.json`, because restating it has already failed.
- **Retire rules by marking them superseded.** The history explains why the current rule exists.

Every few months the skill folds duplicate rules, cuts rules that never fire, and re-checks word budgets against what you actually send. Each reference file stays under about 1,000 words. Rules come from your edits and never from articles.

## Your workspace

`init` creates this, in `voice/` at a project root or in `~/.claude/voice/` for every project:

| Path | What it holds |
|---|---|
| `samples/` | Your own writing. The ground truth. |
| `edits/` | Inbox for `draft.md` and `final.md` pairs. Processed pairs move to `edits/done/`. |
| `voice-rules.md` | Your rules: judgment calls a regex cannot make. |
| `rules.json` | Mechanical checks the linter enforces. |
| `profile.md` | Measured fingerprint: sentence length, openers, punctuation, contractions, and recurring words. |
| `feedback-log.md` | Every correction, dated, with the before and after. |

`/voice/` is in `.gitignore`. Your samples and edits stay on your machine unless you choose to commit them.

## The CLI

| Command | What it does |
|---|---|
| `write-like-a-human init [dir]` | Scaffolds the workspace. Never overwrites existing files. |
| `write-like-a-human lint <file...>` | Runs your `rules.json` checks. Exits 1 on any error. `--format cover-letter` or `--max-words 120` applies a word budget, and so does `format:` in the file's frontmatter. |
| `write-like-a-human diff <draft> <final>` | Sentence-level diff: kept, changed, cut, and added sentences, word deltas, lard factor, and the lint rules your edit removed. |
| `write-like-a-human profile` | Reads `voice/samples/` and writes `voice/profile.md`. |
| `write-like-a-human eval` | Runs the eval suite and exits 1 if it misses the thresholds. |

`wlah` is a short alias for every command. Every command takes `--voice <dir>`, `--config <file>`, and `--json`.

### Rules config

`rules.json` holds two kinds of rules, plus word budgets:

```json
{
  "disabled": ["em-dash"],
  "rules": [
    { "id": "my-words", "kind": "words", "words": ["synergy", "circle back"], "message": "Say it plainly.", "severity": "error" },
    { "id": "no-just", "kind": "regex", "pattern": "\\bjust\\b", "message": "Usually filler.", "severity": "warn" }
  ],
  "triplets": { "enabled": true, "severity": "warn" },
  "formats": { "cold-email": { "maxWords": 130, "targetWords": 100 } }
}
```

A `words` entry also catches common inflections, so `leverage` flags `leveraged` and `leveraging`. Text inside code spans, code fences, HTML comments, and frontmatter is skipped. Errors fail the lint, and warnings only report.

The starter rules cover the usual AI tells: em-dashes, generic vocabulary (`leverage`, `robust`, `seamless`), contrastive scaffolding, throat-clearing openers, meta-commentary, restating closers, empty intensifiers, and reflexive three-item lists. They are a starting point. If your samples use em-dashes well, add `"em-dash"` to `disabled`. Your writing outranks the starter list.

## Evals

The eval suite answers one question: do your rules catch what you actually cut?

A case is a folder with three files and an optional fourth:

```
evals/cases/03-short-post-code-review/
  brief.md     what was asked for
  draft.md     the AI draft
  final.md     what you actually sent
  case.json    { "format": "short-post", "expected": ["em-dash", "ai-vocabulary:unlock"] }
```

`expected` lists the tells you removed, as a rule id or a rule id plus a term. The suite is deterministic and needs no model:

| Metric | Meaning |
|---|---|
| Ban recall | Share of `expected` tells the linter flags in the draft. Below 0.8 fails. |
| Finals with zero errors | Share of your finals that pass your own rules. A rule that fires on your writing is too tight. Below 1 fails. |
| Lard factor | (draft words minus final words) / draft words. Your real cutting rate. |
| Profile distance | Total variation distance between each text's sentence-length distribution and your samples. Finals should sit closer than drafts. |

Run the shipped examples with `npm run eval`. Six invented cases ship with the repo, and one of them misses on purpose: the word "journey" is in a draft but missing from the starter list, so recall reads 0.97. Adding it to the `ai-vocabulary` rule is exactly the move the loop exists to prompt.

To build your own suite, copy each processed pair from `voice/edits/` into a cases folder and run `write-like-a-human eval --cases <dir>`. See `evals/README.md`.

An optional LLM-judge mode is stubbed behind `--judge` and the `WLAH_JUDGE=1` environment variable. It is off by default and makes no network calls in this release.

## Repo layout

```
skills/write-like-a-human/ the Claude Code skill, self-contained
  SKILL.md                 steps: load, draft, diagnose, gate, report, and the loop trigger
  references/              core rules, formats, diagnostics, learning loop, init interview
  templates/voice/         what `init` copies into your workspace
src/                       the CLI (TypeScript, no runtime dependencies)
tests/                     vitest
evals/cases/               invented example cases
examples/voice/            an invented writer's samples and rules, used by the example evals
```

The skill folder carries its own templates so it works when copied on its own. The CLI reads the same templates, so there is one source for the starter rules.

## FAQ

**Do I need the CLI?** No. The skill tells Claude how to run every check by hand. The CLI makes the checks exact and repeatable, and it is the only way to run evals.

**Does anything get sent anywhere?** No. The CLI reads and writes local files only. The LLM judge is a stub and stays off unless you set both the flag and the environment variable.

**How many samples do I need?** Three is enough to start and ten is plenty. Variety across formats and audiences matters more than volume.

**Can I use this with other AI tools?** The workspace is plain Markdown and JSON, and the CLI is tool-agnostic. The skill file is written for Claude Code, and its steps read fine as a system prompt elsewhere.

**Why are em-dashes banned by default?** Readers now treat a page full of them as a sign of machine writing. If you use them on purpose, turn the rule off.

**Why not let the model learn my voice from samples alone?** Samples show what you write. Edits show what you refuse to send. The second signal is sharper, and it is the one most tools throw away.

## License

MIT. Copyright (c) 2026 Andy Rosic.
