# write-like-a-human

Public, MIT-licensed Claude Code skill plus a small CLI that makes AI write in a user's style and improves from their edits.

## Stack

- TypeScript 5, Node 20+, ESM, no runtime dependencies
- vitest for tests, eslint with typescript-eslint
- Distribution: GitHub only for now. Not published to npm.

## Commands

```
npm install          # installs dev deps and builds dist/ via prepare
npm run build        # tsc -> dist/
npm run typecheck    # tsc --noEmit over src and tests
npm run lint         # eslint
npm test             # vitest run
npm run eval         # eval suite on evals/cases with examples/style
npm run lint:prose   # dogfood: lint README, CLAUDE.md, and evals/README.md with the starter rules
```

## Structure

```
skills/write-like-a-human/       the skill (SKILL.md, references/, templates/style/)
src/cli.ts               argument parsing and command dispatch
src/lib/                 text, config, lint, diff, profile, eval, init
tests/                   one test file per lib module
evals/cases/             invented eval cases
examples/style/          invented writer's samples and rules for the example evals
```

## Architecture

The skill is the product and must work without the CLI. The CLI turns the skill's mechanical checks into exact, repeatable commands. `skills/write-like-a-human/templates/style/rules.json` is the single source of starter rules: `init` copies it, and `lint` falls back to it when no workspace config exists.

## Conventions

- Functional style, small pure functions in `src/lib`, side effects only in `cli.ts` and `init.ts`.
- Every new lib function gets a test. Run `npm test` and `npm run eval` after every change.
- Reference files in `skills/write-like-a-human/references/` stay under about 1,000 words each.
- Prose in README and docs passes `npm run lint:prose`: no em-dashes, Oxford commas, and no `not X, but Y`.

## Key Context

- **Public repo. Privacy rule:** nothing about the author's employers, clients, contacts, career numbers, or products. All examples are invented and obviously illustrative. The only personal reference is the author line in README and LICENSE.
- No paid API calls during build, tests, or evals. The LLM judge is a stub behind `--judge` plus `WLAH_JUDGE=1`.
- `/style/` is gitignored so users' samples never get committed by accident.
- See DEVLOG.md for session history and decisions.
