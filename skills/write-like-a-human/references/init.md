# Init Flow

Run this the first time, or when the user asks to set up write-like-a-human. It takes about ten minutes and everything after it depends on it.

## 1. Pick the location

Ask one question: should this style apply to this project only, or everywhere?

- This project only: `style/` at the project root. Remind them it is gitignored by default if they cloned write-like-a-human, and that they should add `style/` to their own `.gitignore` if the project is public.
- Everywhere: `~/.claude/style/`

## 2. Scaffold

If the CLI is installed, run `write-like-a-human init <dir>`. Otherwise create the same layout by hand:

```
<dir>/
  samples/          their own writing, the ground truth
  edits/            inbox for draft and final pairs
  style-rules.md    their rules
  rules.json        mechanical checks for the linter
  profile.md        measured fingerprint
  feedback-log.md   dated record of corrections
```

Copy the files from `templates/style/` in this skill directory. Never overwrite a file that already exists.

## 3. Interview

Ask these one or two at a time, conversationally. Keep their answers in their words.

1. Who do you write to most? (Hiring managers, customers, investors, a team, an audience.)
2. What do you write most? Pick from cover letters, cold emails and DMs, short posts, application answers, or name your own.
3. Paste 3 to 10 things you wrote yourself that you liked. Emails, posts, and letters all count. Writing done without AI help is best.
4. Which words or phrases make you wince when AI writes them?
5. Anything you always do? (Contractions, Oxford commas, short paragraphs, a sign-off.)

## 4. Write what you learned

- Save each sample to `samples/` as its own `.md` file with a short descriptive name.
- Run `write-like-a-human profile --style <dir>` to write `profile.md`. Without the CLI, read the samples and write the same sections by hand: sentence length range, how sentences open, punctuation habits, contractions, and recurring words.
- Fill in `style-rules.md`: audience, formats, words they hate (also add them to the `ai-vocabulary` rule or a new `words` rule in `rules.json`), and habits from question 5.
- Turn off any starter rule their samples break on purpose. If they use em-dashes well and often, add `"em-dash"` to `disabled` in `rules.json`. Their writing outranks the starter list.
- Set word budgets in `rules.json` `formats` for the formats they named.

## 5. Confirm

Tell them in two lines what was created and that the loop starts with their next edit: "When you rewrite a draft, paste your version back or drop the pair in `edits/`."

Only extract rules from what is in front of you. Do not invent preferences the samples do not show.
