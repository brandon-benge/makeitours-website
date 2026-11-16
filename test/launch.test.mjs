import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyLaunch, launchCopy, readLaunch, validLaunch } from '../scripts/launch.mjs';

// makeitours-website#39/#45: one switch moves every page from pre-launch to
// launched wording. The site ships pre-launch until #39's release.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');
const store = 'https://apps.apple.com/us/app/makeitours/id0000000000';
const launched = { state: 'launched', appStoreUrl: store };
const prelaunchWords = /pre-launch|Pre-launch|staging|on sale yet|not open|Not open|can't be followed|no launch date|in testing/;
const main = html => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

test('the site is pre-launch and every page matches content/launch.json', () => {
  assert.equal(readLaunch().state, 'pre-launch');
  const result = spawnSync(process.execPath, [join(root, 'scripts/render-launch.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('launched needs an App Store link', () => {
  assert.throws(() => validLaunch({ state: 'launched', appStoreUrl: null }), /appStoreUrl/);
  assert.throws(() => validLaunch({ state: 'launched', appStoreUrl: 'https://example.com/app' }), /appStoreUrl/);
  assert.throws(() => validLaunch({ state: 'open' }), /state/);
  assert.equal(validLaunch(launched).state, 'launched');
});

test('every launch block is used by a page', () => {
  const blocks = launchCopy(launched);
  const used = new Set();
  for (const name of ['index.html', 'getting-started.html']) for (const b of applyLaunch(read(name), blocks).seen) used.add(b);
  const hostedSource = read('scripts/render-hosted.mjs');
  for (const name of Object.keys(blocks)) {
    assert.ok(used.has(name) || hostedSource.includes(`launchText['${name}']`), name);
  }
});

test('launched pages drop the pre-launch wording and link the App Store', () => {
  const blocks = launchCopy(launched);
  for (const name of ['index.html', 'getting-started.html']) {
    const blocksOnly = applyLaunch(read(name), blocks).html;
    for (const m of blocksOnly.matchAll(/<!-- launch:([\w-]+) -->([\s\S]*?)<!-- \/launch:\1 -->/g)) {
      assert.doesNotMatch(m[2], prelaunchWords, `${name} ${m[1]}`);
    }
    assert.ok(blocksOnly.includes(`href="${store}"`), name);
    assert.doesNotMatch(main(blocksOnly), /href="#today"/, `${name}: no link to a removed section`);
  }
  const started = main(applyLaunch(read('getting-started.html'), blocks).html);
  assert.ok(started.indexOf('id="hosted"') < started.indexOf('id="byoi"'), 'Hosted stays listed first');
  const home = main(applyLaunch(read('index.html'), blocks).html);
  assert.equal((home.match(/class="btn primary"/g) ?? []).length, 1);
});

test('the Hosted page renders launched from the same switch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'launch-'));
  writeFileSync(join(dir, 'launch.json'), JSON.stringify(launched));
  const result = spawnSync(process.execPath, [join(root, 'scripts/render-hosted.mjs'), '--stdout'], {
    encoding: 'utf8', env: { ...process.env, LAUNCH_FILE: join(dir, 'launch.json') },
  });
  assert.equal(result.status, 0, result.stderr);
  const top = result.stdout.slice(result.stdout.indexOf('<main'), result.stdout.indexOf('id="features"'));
  assert.doesNotMatch(top, /Pre-launch|staging testing|nothing is on sale/);
  assert.match(top, /your App Store region may show a different price/);
});
