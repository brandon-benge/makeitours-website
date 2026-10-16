import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRoadmapIssues, selectRoadmapIssues } from '../assets/roadmap.js';

const issue = (number, labels = ['publish:roadmap', 'phase:1', 'type:feature']) => ({
  number, title: `Planned work ${number}`, state: 'open',
  html_url: `https://github.com/brandon-benge/makeitours-website/issues/${number}`,
  labels: labels.map(name => ({ name })),
});

test('selects live, classified public issues including closed items', () => {
  const result = selectRoadmapIssues([issue(3, ['publish:roadmap', 'phase:later', 'type:bug']), { ...issue(1), state: 'closed' }]);
  assert.deepEqual(result.map(({ number, phase, state }) => [number, phase, state]), [[1, 'phase:1', 'closed'], [3, 'phase:later', 'open']]);
});

test('rejects unsafe, unclassified, duplicate and cross-repository results', () => {
  for (const bad of [
    issue(1, ['publish:roadmap', 'phase:1', 'type:feature', 'confidential']),
    issue(1, ['phase:1', 'type:feature']),
    issue(1, ['publish:roadmap', 'phase:1', 'phase:later', 'type:feature']),
    { ...issue(1), html_url: 'https://github.com/other/repo/issues/1' },
  ]) assert.throws(() => selectRoadmapIssues([bad]));
  assert.throws(() => selectRoadmapIssues([issue(1), issue(1)]));
});

test('fails on API errors and never treats a partial paginated result as complete', async () => {
  await assert.rejects(loadRoadmapIssues(async () => ({ ok: false })), /unavailable/);
  let calls = 0;
  await assert.rejects(loadRoadmapIssues(async () => { calls++; return { ok: true, json: async () => Array(100).fill(issue(1)) }; }), /incomplete/);
  assert.equal(calls, 5);
  const published = await loadRoadmapIssues(async () => ({ ok: true, json: async () => [issue(2)] }));
  assert.equal(published[0].number, 2);
});
