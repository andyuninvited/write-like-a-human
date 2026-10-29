# Diagnostic Pass

Five mechanical checks. Run them on every draft before returning it. They are tests with answers, not matters of taste.

The checks draw on classic work on sentence structure and revision (Christensen on levels of generality, Lanham on the lard factor, Gopen and Swan on stress position). Only the diagnostic half is used. Everything below cuts, reorders, or sharpens. Nothing below adds, because the failure this skill exists to fix is drafts that grow.

## 1. Level-1 coordination runs

**The test:** number each sentence or clause by abstraction. The base claim is level 1. A clause that drops to a concrete particular is level 2, and a more specific one is level 3. Restatements at the same abstraction keep the same number.

**The failure:** three or more consecutive elements at level 1, restating one idea in parallel forms.

**Example:**

> A good onboarding flow respects the user's time. It doesn't waste their attention, it doesn't ask questions it could answer itself, and it doesn't make them wait.

Four elements, all level 1. Fix:

> A good onboarding flow never asks a question it could answer itself.

**The fix:** keep the strongest element and cut the rest. If a real particular is available from the source material, descend into it. If not, stop.

## 2. Counterfeit modifiers

**The test:** for each trailing clause, ask whether it adds a particular the base clause lacked: a name, a number, an object, a mechanism, a date. If not, it is decoration with the grammar of substance.

**Counterfeit:** "He rebuilt the support team, improving morale, empowering agents, and driving satisfaction."

**Genuine:** "He rebuilt the support team around a single shared inbox, which cut first-response time from a day to under an hour."

**Mechanical aid:** `write-like-a-human lint` flags three-item series as `triplet` warnings. Check each one by hand.

## 3. Stress position

**The principle:** the end of a sentence carries the most emphasis. Context leads and news lands.

**The failure:** the payoff arrives in the first clause and the sentence dies on qualifiers. "Churn dropped by half after we moved billing reminders to the week before renewal, which was a change the team had debated for some time."

**The fix:** "After we moved billing reminders to the week before renewal, churn dropped by half."

**Also check openings.** Each sentence should start on something the previous sentence delivered. A paragraph where every sentence opens cold reads as bullets wearing prose.

## 4. Lard factor

**The test:** (draft words minus tight rewrite words) divided by draft words. Bloated prose gives up a third to a half. If a heavy passage cuts by less than a third, look again.

**Where lard hides:** nominalizations ("the implementation of the process enables the reduction of"), stacked prepositions, weak forms of "to be," and the `ai-vocabulary` words.

**The move:** find who is doing what to whom. Make the actor the subject and the action the verb.

**Calibrate to the user.** `write-like-a-human diff` reports the lard factor between a draft and the user's final, and `write-like-a-human eval` reports the average across cases. That average is this user's real bar.

## 5. Contrastive scaffolding

**The test:** search for "not X, but Y," "isn't X, it's Y," "not about X. It's about Y," "rather than," and "instead of." State the positive claim and stop. The reader infers the negative when the positive is sharp.

**Hunt it deliberately.** This pattern survives read-throughs because it sounds like insight. The `contrastive-not-but`, `contrastive-not-its`, and `contrastive-soft` lint rules exist because a restated rule did not stop it and a search did.

## When a rule keeps failing

If the learning loop logs the same rule violated three times, restating it here will not help. Add a literal search string or regex to `rules.json` so the linter catches it every time.
