# Format Templates

Starting budgets and beat structures. They are ceilings, counted on body text only (no header block, no signature). Tune the numbers in the user's `rules.json` `formats` block once their real sends show where they land, and record the change in `feedback-log.md`.

Draft text is plain paragraphs. Do not wrap it in `>` blockquotes, because the user copies it straight into email and docs.

## Cover letter: target 250 words, ceiling 300

**Beat 1, the opinion.** One short paragraph with a single concrete, arguable claim about this company's situation. The bar: a smart person there would want to argue about it over a call. "Teams that win do X" describes the world and takes no stake.

**Beat 2, the proof.** One paragraph, one proof point, the one that fits this role best. A stack of credentials reads as a resume pasted into a letter. Order the proof by what this reader finds credible: named employers or clients for established institutions, public work and demos for startups.

**Beat 3, the close.** One or two short paragraphs that tie the proof to this role's pressures and end warm, in a complete sentence.

_Illustrative only: a cover letter for a fictional logistics startup might open on how its drivers lose the most time at the loading dock, prove it with one warehouse rollout the writer ran, and close on the dock problem they want to solve next._

## Cold email or DM: target 100 words, ceiling 130

A first touch is an introduction, not a cover letter.

1. **A subject line that survives an inbox scan.** Say what kind of message it is.
2. **The ask in the first paragraph.** It opens a conversation.
3. **One opinion and one proof.** Everything else is material for the call.
4. **One warm sentence.** A correct but cold note gets archived.
5. **For sales outreach, a concrete ask with a time box** ("is a fifteen-minute call worth it?") and a scheduling link on its own line.

Cite only what the recipient says about themselves. A premise built on third-party research that turns out wrong ends the thread in one reply.

## Short post: target 150 words, ceiling 200

**Hook in the first line.** It carries the stakes, the number, or the surprise, and it reads complete without the "see more" click.

**One idea.** If the draft has two, it is two posts.

**End on the takeaway or a real question.** No hashtag stack, no "Thoughts?" unless the user actually writes that way.

## Application answer: target 140 words, ceiling 160

Follow the question's structure exactly. If it asks for the situation, the decision, and the outcome, give those three in that order.

**End on the number, then one sentence about what changed afterward.**

For motivation questions ("why do you want to work here"), lead with the writer's own connection to the company's problem. Never explain the company's product back to them.

## Adding a format

Add a section here with a budget, the beats, and one illustrative example. Add the matching entry to `rules.json` `formats` so the linter enforces the ceiling. Base the budget on the user's real sends, not on a guess.
