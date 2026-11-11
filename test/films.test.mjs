import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// makeitours-app#59/#60: approved films, loaded only when played.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');

test('getting-started.html is generated from content/films.json', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/render-films.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('every film comes from the public films address and waits for a tap', () => {
  for (const page of ['hosted.html', 'getting-started.html']) {
    const html = read(page);
    const videos = html.match(/<video[^>]*>/g) ?? [];
    assert.ok(videos.length > 0, page);
    for (const tag of videos) {
      assert.match(tag, /preload="none"/, page);
      assert.doesNotMatch(tag, /autoplay/, page);
      assert.match(tag, /poster="https:\/\/films\.bengesoftwarellc\.com\/v1\//, page);
    }
    for (const src of html.match(/src="https:\/\/[^"]+"/g) ?? []) {
      assert.match(src, /^src="https:\/\/films\.bengesoftwarellc\.com\/v1\//, page);
    }
  }
});

test('planned features have no film', () => {
  const content = JSON.parse(read('content/hosted-features.json'));
  for (const feature of content.features) {
    if (feature.status === 'planned') assert.equal(feature.film, undefined, feature.id);
  }
});
