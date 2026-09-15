/**
 * Recolours the vendored Lordicon Lottie files to DropChain's palette.
 *
 * The Webflow site passed colors="primary:#ffffff,secondary:#01f089" to the
 * Lordicon web component. We self-host the animations instead, so the same
 * mapping is baked into the JSON once, here.
 *
 * Usage: node scripts/recolor-icons.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICON_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));

const PRIMARY = [1, 1, 1];              // #ffffff
const SECONDARY = [0.004, 0.941, 0.537]; // #01f089

// Source colours as authored by Lordicon, matched with a small tolerance.
const RULES = [
  { from: [0.071, 0.075, 0.192], to: PRIMARY },   // dark navy line work
  { from: [0, 0, 0], to: PRIMARY },               // black line work
  { from: [0.031, 0.659, 0.541], to: SECONDARY }, // teal accent
];

const TOLERANCE = 0.02;
const matches = (value, target) =>
  target.every((channel, i) => Math.abs(value[i] - channel) <= TOLERANCE);

let replacements = 0;

function recolor(node) {
  if (Array.isArray(node)) {
    node.forEach(recolor);
    return;
  }
  if (!node || typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node)) {
    const isColor =
      key === 'c' &&
      value &&
      typeof value === 'object' &&
      Array.isArray(value.k) &&
      value.k.length >= 3 &&
      value.k.slice(0, 3).every((n) => typeof n === 'number');

    if (isColor) {
      const rule = RULES.find((r) => matches(value.k, r.from));
      if (rule) {
        value.k = [...rule.to, ...value.k.slice(3)];
        replacements += 1;
      }
    }
    recolor(value);
  }
}

const files = (await readdir(ICON_DIR)).filter((f) => f.endsWith('.json'));
for (const file of files) {
  const path = join(ICON_DIR, file);
  const data = JSON.parse(await readFile(path, 'utf8'));
  recolor(data);
  await writeFile(path, JSON.stringify(data));
}

console.log(`Recoloured ${replacements} colour stops across ${files.length} icons.`);
