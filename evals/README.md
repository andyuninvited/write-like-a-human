# Evals

These cases are invented. Every company, person, and number in them is fictional and exists only to show the format.

## Case format

One folder per case:

| File | Required | Contents |
|---|---|---|
| `draft.md` | yes | The AI draft |
| `final.md` | yes | The version the human actually sent |
| `brief.md` | no | What was asked for, kept for context |
| `case.json` | no | `format` (a key in `rules.json` formats) and `expected` (tells the human removed) |

An `expected` entry is a rule id (`"em-dash"`) or a rule id plus the term it should catch (`"ai-vocabulary:leverage"`). Built-in ids are `word-budget` and `triplet`, plus every id in your `rules.json`.

## Running

```sh
write-like-a-human eval --cases evals/cases --style examples/style
write-like-a-human eval --cases my-cases --min-recall 0.9 --json
```

Exit code 0 means the suite passed, 1 means a threshold failed, and 2 means bad input.

## Reading the results

- **A missed expectation** means your rules let a tell through. Add the word or pattern to `rules.json` and rerun.
- **A final that trips an error** means a rule is firing on your own writing. Loosen it, downgrade it to a warning, or add it to `disabled`.
- **Profile distance going up** from draft to final can be fine for very short formats. Watch the trend across cases, not one number.

## Turning your edits into cases

After the learning loop processes a pair in `style/edits/`, copy the folder here (or to your own cases folder), add a `case.json` listing the tells you removed, and run the suite. Over time the cases become a regression test for your style: when you change a rule, the suite tells you what it stopped catching.
