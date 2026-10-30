import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { TEMPLATES_DIR } from "./config.js";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// Copies the template workspace into `target` without overwriting anything already there.
export const initWorkspace = (target: string): { created: string[]; skipped: string[] } => {
  const source = join(TEMPLATES_DIR, "style");
  const files = walk(source).map((src) => ({ src, rel: relative(source, src) }));
  const created: string[] = [];
  const skipped: string[] = [];
  for (const { src, rel } of files) {
    const dest = join(target, rel);
    if (existsSync(dest)) {
      skipped.push(rel);
      continue;
    }
    mkdirSync(join(dest, ".."), { recursive: true });
    copyFileSync(src, dest);
    created.push(rel);
  }
  return { created, skipped };
};
