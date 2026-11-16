// makeitours-website#39/#45: writes the pre-launch or launched wording from
// content/launch.json into index.html and getting-started.html.
// `--check` fails when a page is out of date. Run render-hosted.mjs too.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyLaunch, launchCopy, readLaunch } from './launch.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const launchPages = ['index.html', 'getting-started.html'];
const blocks = launchCopy(readLaunch());
let stale = false;
for (const name of launchPages) {
  const file = join(root, name);
  const page = readFileSync(file, 'utf8');
  const { html } = applyLaunch(page, blocks);
  if (html === page) continue;
  if (process.argv.includes('--check')) { console.error(`${name} is out of date: run node scripts/render-launch.mjs`); stale = true; }
  else writeFileSync(file, html);
}
if (stale) process.exit(1);
