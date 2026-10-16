const repository = 'brandon-benge/makeitours-website';
const issueUrl = /^https:\/\/github\.com\/brandon-benge\/makeitours-website\/issues\/([1-9][0-9]*)$/;
const prohibited = /(^|[:/ _-])(support|confidential|private)([:/ _-]|$)/;

export function selectRoadmapIssues(records) {
  if (!Array.isArray(records)) throw new Error('Invalid GitHub response');
  const seen = new Set();
  return records.flatMap(record => {
    if (!record || typeof record !== 'object' || record.pull_request) return [];
    if (typeof record.title !== 'string' || !record.title.trim() || record.title.length > 200 ||
        typeof record.html_url !== 'string' || !issueUrl.test(record.html_url) ||
        Number(issueUrl.exec(record.html_url)[1]) !== record.number ||
        !['open', 'closed'].includes(record.state) || !Array.isArray(record.labels)) throw new Error('Invalid published issue');
    const labels = record.labels.map(label => label?.name);
    if (!labels.every(label => typeof label === 'string') || labels.some(label => prohibited.test(label.toLowerCase()))) throw new Error('Unsafe published issue');
    if (!labels.includes('publish:roadmap')) throw new Error('Unpublished issue in response');
    const phases = ['phase:1', 'phase:later'].filter(label => labels.includes(label));
    const types = ['type:feature', 'type:bug'].filter(label => labels.includes(label));
    if (phases.length !== 1 || types.length !== 1 || seen.has(record.number)) throw new Error('Invalid roadmap classification');
    seen.add(record.number);
    return [{ number: record.number, title: record.title, url: record.html_url, state: record.state, phase: phases[0], type: types[0] }];
  }).sort((a, b) => (a.phase === b.phase ? a.number - b.number : a.phase === 'phase:1' ? -1 : 1));
}

export async function loadRoadmapIssues(fetcher = fetch) {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.github.com/repos/${repository}/issues?state=all&labels=publish%3Aroadmap&per_page=100&page=${page}`;
    const response = await fetcher(url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('GitHub is unavailable');
    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length > 100) throw new Error('Invalid GitHub response');
    all.push(...batch);
    if (batch.length < 100) return selectRoadmapIssues(all);
  }
  throw new Error('Roadmap result is incomplete');
}

if (typeof document !== 'undefined') {
  const status = document.getElementById('roadmap-status');
  const results = document.getElementById('roadmap-results');
  const button = document.getElementById('roadmap-refresh');
  let busy = false;
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true; button.disabled = true;
    try {
      const issues = await loadRoadmapIssues();
      const groups = [
        ['phase:1', 'Before the first outside-user pilot'],
        ['phase:later', 'After pilot evidence'],
      ];
      results.replaceChildren();
      for (const [phase, heading] of groups) {
        const section = document.createElement('section');
        const title = document.createElement('h3'); title.textContent = heading; section.append(title);
        const list = document.createElement('ul'); list.className = 'roadmap-list';
        for (const issue of issues.filter(item => item.phase === phase)) {
          const item = document.createElement('li');
          const link = document.createElement('a'); link.href = issue.url; link.textContent = issue.title; link.rel = 'noopener noreferrer';
          const state = document.createElement('span'); state.className = 'muted'; state.textContent = ` · ${issue.state === 'closed' ? 'Closed' : 'Open'} ${issue.type === 'type:bug' ? 'bug' : 'feature request'}`;
          item.append(link, state); list.append(item);
        }
        if (!list.children.length) { const item = document.createElement('li'); item.textContent = 'No published items in this phase.'; list.append(item); }
        section.append(list); results.append(section);
      }
      status.textContent = `Updated ${new Date().toLocaleString()} from public GitHub Issues. These are plans, not shipped features or delivery dates.`;
    } catch {
      results.replaceChildren();
      status.textContent = 'The current roadmap could not be loaded from GitHub. Browse the public issues directly or try again.';
    } finally { busy = false; button.disabled = false; }
  }
  button.addEventListener('click', refresh);
  setInterval(() => { if (!document.hidden) refresh(); }, 300000);
  refresh();
}
