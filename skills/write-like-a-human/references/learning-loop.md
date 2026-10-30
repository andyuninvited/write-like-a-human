# Learning Loop

The user is the ground truth. Their corrections produce better rules than any framework, so this loop captures every one of them on purpose.

## Triggers

Run the loop when any of these happen. Do not wait to be asked.

| Trigger | What it looks like |
|---|---|
| A final version comes back | "Here's what I actually sent." A pasted email, a submitted answer |
| The edits inbox gains a pair | A new folder in `edits/` with `draft.md` and `final.md` |
| Pushback in chat | "Too long." "Stiff." "That's not how I talk." |
| A fact or name correction | Wrong title, wrong spelling, wrong framing of a company |
| Outside feedback names the writing | A reviewer, editor, or rejection note that points at a writing problem |

## Procedure

**1. Get both versions side by side.** Use the actual text. Extract PDFs to text first. Never work from memory of what the draft said.

**2. Diff at the sentence level.** Run `write-like-a-human diff draft.md final.md` if the CLI is installed. It lists kept, changed, cut, and added sentences, the lard factor, and which lint rules the edit removed.

**3. Name the move behind each change.** "Cut a three-clause build to one clause" is a move. "Deleted the word 'very'" is an edit. Rules come from moves.

**4. Classify each move:**

- **Existing rule violated.** The rule exists and the draft broke it. Log the violation.
- **New, one-off.** Specific to this piece. Log it and do not promote it.
- **New, likely to recur.** Log it. Promote it on its second appearance.

**5. Log it.** Append to the user's `feedback-log.md`, newest first:

```
## YYYY-MM-DD - what was being written
- MOVE: what changed, stated as a rule
- STATUS: new rule | existing rule violated | one-off | promoted
- EVIDENCE: the before and the after, one line each
```

**6. Promote on the second occurrence.** Add the rule to the user's `style-rules.md` (judgment calls) or `rules.json` (anything a regex or word list can catch). Keep the example and the date. Rules with a real example attached get followed.

**7. Convert repeat offenders to checks.** A rule violated three times needs a literal search in `rules.json`, not a third restatement.

**8. Retire, never delete.** When a rule stops being true, move it to the Superseded section of `style-rules.md` with the date and what replaced it. The history explains why the current rule exists.

**9. Close the inbox.** Move processed pairs to `edits/done/`. A processed pair also makes a good eval case; see the repo's `evals/README.md`.

## Quarterly consolidation

Every few months, or when `feedback-log.md` passes about 20 entries:

- **Fold duplicates.** Several entries pointing at one rule become one rule with the best example.
- **Cut rules that never fire.** A ban nobody has needed in months is taking up attention.
- **Re-check word budgets** in `rules.json` against what the user actually sends. They drift.
- **Re-run `write-like-a-human profile`** if new samples were added, and `write-like-a-human eval` to confirm the rules still catch what the user cuts.

## What not to do

**Do not import rules from articles, frameworks, or general principles.** Every rule in the user's files should trace to a specific correction on a specific draft. That is why the rules work.

**Do not let any reference file pass about 1,000 words.** If one does, something in it has stopped earning its place. The skill holds itself to the same standard as the writing.

**Do not restate a rule that keeps getting violated.** Turn it into a mechanical check.
