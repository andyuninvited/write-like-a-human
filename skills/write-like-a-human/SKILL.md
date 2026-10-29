---
name: write-like-a-human
description: "Writes in the user's own voice and improves from their edits. Use whenever drafting or revising prose another person will read: cover letters, cold emails and DMs, application answers, posts, proposals, and client notes. Loads the user's voice rules, samples, and profile, drafts to a format budget, runs a five-check diagnostic pass for AI-flavored prose, and runs a learning loop when the user sends back an edited version, drops a draft and final pair into their edits inbox, or pushes back on a draft. Also handles first-time setup when the user asks to set up write-like-a-human or no voice workspace exists yet."
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# write-like-a-human

One standard for everything the user sends to another human, built from their own writing and sharpened by their own edits.

**Scope:** outbound prose. Not code, not internal docs, and not chat replies to the user.

## Find the workspace

Look for the voice workspace in this order and use the first one that exists:

1. `voice/` at the project root
2. `~/.claude/voice/`

If neither exists, run the init flow in `references/init.md` before drafting anything. A draft without the user's samples is a generic draft.

The workspace holds `samples/` (their own writing, the ground truth), `edits/` (an inbox of draft and final pairs), `voice-rules.md` (their rules), `rules.json` (mechanical checks), `profile.md` (a measured fingerprint), and `feedback-log.md` (every correction, dated).

## The one rule that governs the rest

**Never invent a particular.** Every name, number, date, mechanism, company, and outcome must come from a real source: the user's own words in this session, their samples, a document they pointed to, or a page you actually fetched. When the source is thin, you may cut, reorder, clarify, and re-emphasize. You may not add specifics, and you may not reach for atmospheric filler ("over coffee," "late one night") to cover the gap. Write shorter instead.

An invented number that contradicts what the user has said elsewhere is a credibility leak they cannot take back.

## Step 1. Load the constraints

Read, in order:

1. `references/voice-rules.md` for the universal core rules
2. The user's `voice-rules.md`, which overrides the core wherever they disagree
3. The user's `profile.md` and two or three files from `samples/` that match the format
4. The format spec in `references/formats.md`, adjusted by any budget in the user's `rules.json`

## Step 2. Draft to the format

Each format has a word budget and a beat structure. Hit them. Budgets are ceilings. A draft over budget has something in it that stopped earning its place.

Match the profile: sentence length range, how sentences open, contractions, punctuation habits, and the words the user actually uses.

## Step 3. Run the diagnostic pass

Run `references/diagnostics.md` against the draft. It is five mechanical tests with answers:

1. Level-1 coordination runs
2. Counterfeit modifiers
3. Dead stress positions
4. Lard factor
5. Contrastive scaffolding

If the `write-like-a-human` CLI is installed, also run `write-like-a-human lint <file> --format <name>` and fix every error. Without the CLI, search the draft by hand for each pattern in `rules.json`.

## Step 4. Gate

Do not return the draft until every box passes:

- [ ] Every number and proper noun traces to a real source
- [ ] No banned word or pattern from `rules.json` or the user's `voice-rules.md`
- [ ] Inside the word budget for the format
- [ ] Opens on information
- [ ] Ends on a line that does new work
- [ ] Sounds like the samples when read side by side

## Step 5. Report back short

Write the draft to a file when the user works in files. Reply with one or two lines: where it is and what is next. Do not paste the draft and summarize it too.

## The learning loop

The user is the ground truth. Their corrections produce better rules than any framework, so the loop captures them on purpose.

**Run it whenever any of these happen, without being asked:**

- The user pastes back the version they actually sent
- A new draft and final pair appears in `edits/`
- The user pushes back in chat ("too long," "stiff," "that's not me")
- The user corrects a fact, a name, or a framing

**Procedure:** `references/learning-loop.md`. Diff their version against the draft at the sentence level (`write-like-a-human diff draft.md final.md` helps), name the move behind each change, classify it, log it in `feedback-log.md`, and promote it into the rules when it shows up a second time.

**Never skip the diff.** A rule extracted from a real edit beats a rule invented from principle.
