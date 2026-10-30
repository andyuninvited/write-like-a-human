# Core Style Rules

The universal starting point. The user's own `style-rules.md` overrides anything here, and any mechanical rule can be switched off in their `rules.json` by adding its id to `disabled`. Their samples outrank this file.

## The governing rule

**Never invent a particular.** Names, numbers, dates, mechanisms, companies, and outcomes come from a real source or they do not appear. When material is thin, cut and clarify. Do not decorate.

## Starter bans

These are the tells readers now associate with machine prose. They are a starter list, meant to be edited. Each has a matching rule id in `rules.json`.

| Banned | Use instead | Rule id |
|---|---|---|
| Em-dash used as all-purpose glue | A period, a comma, or a spaced hyphen | `em-dash` |
| leverage, robust, seamless, streamline, delve, utilize, and similar | The plain verb for what happens | `ai-vocabulary` |
| "not X, but Y" | The positive claim, alone | `contrastive-not-but` |
| "It's not X, it's Y" and "This isn't about X. It's about Y." | The positive claim, alone | `contrastive-not-its` |
| Throat-clearing openers ("In today's world," "I hope this finds you well") | The first sentence that carries information | `throat-clearing` |
| Meta-commentary ("The real problem is," "Make no mistake") | The claim itself | `meta-commentary` |
| Restating closers ("In short," "Ultimately") | Nothing. End on the last line that did new work | `restating-closer` |
| Rule-of-three triplets by reflex | The strongest item | `triplet` |
| Empty intensifiers ("truly," "incredibly," "passionate about") | The fact that would justify the intensity | `empty-intensifier` |

## Starter patterns

**Open on information.** The first sentence should be one the reader could not have predicted.

**One number beats a stack.** "Cut onboarding from nine days to two" lands. "Cut onboarding from nine days to two across four regions for 300 new hires in Q3" buries it.

**Plain phrasing when the lesson matters, metric phrasing when the metric is the claim.** "So customers stopped waiting on hold" beats "reduced median handle time by 41 seconds" unless the 41 seconds is the point.

**End stories past the climax.** A story that stops when the obstacle breaks leaves the reader scoring the setup. Carry it one beat further, to what changed afterward, with a number if one exists.

**Name the reader's hard problem. Do not accuse them of failing at it.** "A two-sided marketplace lives or dies on the side that churns quietly" invites a nod. "Most marketplaces ignore their quiet churners" invites a defense.

**On "why us" questions, most of the words are about them.** The writer's experience shows up as the evidence clause at the end of a sentence about the reader's problem.

## How rules get added

Every rule in the user's file should trace to a specific edit they made, with the date and the before and after. See `learning-loop.md`. Rules imported from articles or style guides make the file longer and the writing no better.
