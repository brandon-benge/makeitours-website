// makeitours-website#40 (makeitours#199): the store preview's search, pages, copy and report.
// The page works without this script: every project is listed and each reference is visible.

/** Words of `query`, lower case. A project matches when every word is in its text or in one part's. */
export const words = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);
export const matches = (text, terms) => terms.every((t) => text.includes(t));

export function filter(projects, query) {
  const terms = words(query);
  return projects.map((p) => {
    if (!terms.length || matches(p.text, terms)) return { project: p, parts: p.parts.map(() => true), shown: true };
    const parts = p.parts.map((text) => matches(text, terms));
    return { project: p, parts, shown: parts.some(Boolean) };
  });
}

export function pageOf(count, pageSize, page) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return { pages, current, start: (current - 1) * pageSize, end: current * pageSize };
}

function start(doc) {
  const list = doc.getElementById('store-projects');
  if (!list) return;
  const size = Number(list.dataset.pageSize) || 50;
  const cards = [...list.querySelectorAll('.store-project')];
  const model = cards.map((card) => ({
    card, text: card.dataset.search ?? '', partEls: [...card.querySelectorAll('.store-part')],
    get parts() { return this.partEls.map((el) => el.dataset.search ?? ''); },
  }));
  const input = doc.getElementById('store-q');
  const count = doc.getElementById('store-count');
  const empty = doc.getElementById('store-empty');
  const nav = doc.querySelector('.store-pages');
  const toast = doc.getElementById('store-toast');
  let page = 1;

  const render = () => {
    const results = filter(model, input?.value ?? '');
    const shown = results.filter((r) => r.shown);
    const { pages, current, start: from, end } = pageOf(shown.length, size, page);
    page = current;
    for (const r of results) {
      const index = shown.indexOf(r);
      r.project.card.hidden = !r.shown || index < from || index >= end;
      r.project.partEls.forEach((el, i) => { el.hidden = !r.parts[i]; });
    }
    if (empty) empty.hidden = shown.length > 0;
    if (count) count.textContent = `${shown.length} ${shown.length === 1 ? 'project' : 'projects'}, oldest listing first, ${size} per page.`;
    if (nav) {
      nav.hidden = pages < 2;
      doc.getElementById('store-page').textContent = `Page ${current} of ${pages}`;
      doc.getElementById('store-prev').disabled = current <= 1;
      doc.getElementById('store-next').disabled = current >= pages;
    }
  };

  const say = (text) => { if (toast) toast.textContent = text; };
  doc.querySelector('.store-search')?.addEventListener('submit', (e) => e.preventDefault());
  input?.addEventListener('input', () => { page = 1; render(); });
  doc.getElementById('store-prev')?.addEventListener('click', () => { page -= 1; render(); });
  doc.getElementById('store-next')?.addEventListener('click', () => { page += 1; render(); });
  list.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('store-copy')) {
      const reference = button.dataset.reference ?? '';
      try {
        await navigator.clipboard.writeText(reference);
        say(`Copied ${reference}. This is a sample reference; the app can't use it yet.`);
      } catch {
        say(`Copy ${reference} by selecting it. This is a sample reference.`);
      }
    } else if (button.classList.contains('store-report')) {
      say('Thanks. In this preview, reports are not sent. In the store, a report goes to the MakeItOurs team for review.');
    }
  });
  render();
}

if (typeof document !== 'undefined') start(document);
