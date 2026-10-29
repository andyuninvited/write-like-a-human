export type Frontmatter = Record<string, string>;

export type Sentence = {
  text: string;
  start: number;
  words: number;
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const ABBREVIATIONS = ["e.g.", "i.e.", "etc.", "vs.", "Mr.", "Mrs.", "Ms.", "Dr.", "St.", "Inc.", "Ltd.", "Co."];
const WORD = /[A-Za-z0-9][A-Za-z0-9'’-]*/g;

export const parseFrontmatter = (text: string): { data: Frontmatter; body: string } => {
  const match = FRONTMATTER.exec(text);
  if (!match) return { data: {}, body: text };
  const data = Object.fromEntries(
    (match[1] ?? "")
      .split(/\r?\n/)
      .map((line) => /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1] ?? "", (m[2] ?? "").trim().replace(/^["']|["']$/g, "")]),
  );
  return { data, body: text.slice(match[0].length) };
};

const blank = (s: string): string => s.replace(/[^\n]/g, " ");

// Replaces frontmatter, fenced code, inline code, and HTML comments with spaces so
// offsets into the masked text still line up with the original file.
export const maskNonProse = (text: string): string => {
  const fm = FRONTMATTER.exec(text);
  const head = fm ? blank(fm[0]) : "";
  return (head + text.slice(fm ? fm[0].length : 0))
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/~~~[\s\S]*?~~~/g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/`[^`\n]*`/g, blank);
};

export const countWords = (text: string): number => text.match(WORD)?.length ?? 0;

export const tokens = (text: string): string[] => (text.match(WORD) ?? []).map((w) => w.toLowerCase());

const protectAbbreviations = (s: string): string =>
  ABBREVIATIONS.reduce((acc, abbr) => acc.split(abbr).join(abbr.replace(/\./g, "\uE000")), s);

const restore = (s: string): string => s.replace(/\uE000/g, ".");

// Splits prose into sentences. Markdown block boundaries (blank lines, headings,
// list items) always end a sentence.
export const splitSentences = (input: string): Sentence[] => {
  const text = maskNonProse(input);
  const blocks: { text: string; start: number }[] = [];
  const blockRe = /[^\n]+(?:\n(?![ \t]*\n)(?![ \t]*(?:[-*+]\s|\d+[.)]\s|#{1,6}\s|>))[^\n]+)*/g;
  for (const m of text.matchAll(blockRe)) {
    const raw = m[0];
    const prefix = /^[ \t]*(?:[-*+]\s+|\d+[.)]\s+|#{1,6}\s+|>\s*)?/.exec(raw)?.[0] ?? "";
    blocks.push({ text: raw.slice(prefix.length), start: (m.index ?? 0) + prefix.length });
  }
  return blocks.flatMap((block) => {
    const protectedText = protectAbbreviations(block.text);
    const out: Sentence[] = [];
    const re = /[^.!?]*(?:[.!?]+["'”’)\]]*|$)/g;
    let cursor = 0;
    let pending = "";
    let pendingStart = 0;
    for (const m of protectedText.matchAll(re)) {
      if (m[0] === "") break;
      if (pending === "") pendingStart = m.index ?? cursor;
      pending += m[0];
      cursor = (m.index ?? 0) + m[0].length;
      const next = protectedText.slice(cursor);
      const boundary = next === "" || /^\s+["'“‘([]?[A-Z0-9]/.test(next);
      if (boundary) {
        const trimmed = restore(pending).trim();
        if (countWords(trimmed) > 0) {
          const lead = pending.length - pending.trimStart().length;
          out.push({ text: trimmed.replace(/\s+/g, " "), start: block.start + pendingStart + lead, words: countWords(trimmed) });
        }
        pending = "";
      }
    }
    return out;
  });
};

export const lineCol = (text: string, index: number): { line: number; col: number } => {
  const before = text.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, col: (lines[lines.length - 1]?.length ?? 0) + 1 };
};

export const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

export const stdev = (xs: number[]): number => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

export const round = (n: number, places = 2): number => Math.round(n * 10 ** places) / 10 ** places;
