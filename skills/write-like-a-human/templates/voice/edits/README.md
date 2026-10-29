# Edits Inbox

Drop pairs here whenever you rewrite an AI draft before sending it:

```
edits/2026-03-14-cold-email/draft.md
edits/2026-03-14-cold-email/final.md
```

Then ask Claude to run the learning loop, or run `write-like-a-human diff draft.md final.md` yourself. After a pair is processed and logged, move it to `edits/done/` so the inbox only holds new work.

A processed pair also makes a good eval case. Copy it into your cases folder with a `case.json` that lists the rules you expect the linter to catch.
