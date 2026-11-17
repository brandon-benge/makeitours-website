// makeitours-website#40 (makeitours#199): the store preview's search, pages, copy and report.
// The page works without this script: every project is listed and each reference is visible.
// makeitours-website#41: with `data-live` the same page reads the live Hosted store instead.

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

// ---- makeitours-website#41: the live store ----

/** What a visitor may say when reporting a part (data-plane STORE_REPORT_REASONS). */
export const REPORT_REASONS = [
  ['offensive', 'Offensive'], ['spam', 'Spam or advertising'], ['unsafe', 'Unsafe to build'],
  ['stolen', 'Copied without permission'], ['other', 'Something else'],
];
export const MAX_REPORT_NOTE = 500;
export const MAX_QUERY = 200;

export const esc = (text) => String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** A store address: `projects`, `projects/<id>` or `parts/<id>/reports`, with optional `q` or `cursor`. */
export function storeUrl(api, path, params = {}) {
  const url = new URL(`${api.replace(/\/+$/, '')}/v1/store/${path}`);
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, String(value));
  return url.toString();
}

/** The short message for a failed read: busy when rate limited, otherwise unavailable. */
export const unavailableText = (status) => status === 429
  ? 'The store is busy right now. Try again in an hour.'
  : 'The store is unavailable right now. Try again later.';

/** What to tell the visitor after a report, by the service's answer. */
export function reportText(status) {
  if (status === 202) return 'Thanks. The MakeItOurs team looks at every report, usually within a day.';
  if (status === 404) return 'That part is no longer in the store.';
  if (status === 429) return "You've sent the most reports allowed for today. Try again tomorrow.";
  if (status === 400) return 'Choose a reason, then send the report again.';
  return "The report couldn't be sent. Try again later.";
}

const day = (iso) => String(iso ?? '').slice(0, 10);
const tagList = (tags) => tags?.length ? `<ul class="store-tags" aria-label="Tags">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

/** One project card. Its parts load when the visitor opens them. */
export function projectHtml(p) {
  const facts = [`By ${esc(p.creator)}`, `listed ${esc(day(p.listed_at))}`, p.size ? `about ${esc(p.size)}` : ''].filter(Boolean).join(' · ');
  const count = p.part_count === 1 ? '1 part' : `${p.part_count} parts`;
  return `<article class="card store-project" data-id="${esc(p.id)}">
    <h3>${esc(p.name)}</h3>
    <p class="muted store-byline">${facts}</p>
    ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
    ${tagList(p.tags)}
    <button type="button" class="btn secondary store-open" aria-expanded="false" data-id="${esc(p.id)}">Show its ${count}</button>
    <div class="store-parts-slot"></div>
  </article>`;
}

/** A project's parts, each with its reference, Copy reference and Report misuse. */
export function partsHtml(project) {
  if (!project.parts?.length) return '<p class="muted">This project has no parts listed right now.</p>';
  return `<h4>Parts you can add to your project</h4><ul class="store-parts">${project.parts.map((x) => `
    <li class="store-part">
      <div class="store-part-head"><strong>${esc(x.name)}</strong>${x.size ? `<span class="muted">${esc(x.size)}</span>` : ''}</div>
      ${x.summary ? `<p class="store-part-summary">${esc(x.summary)}</p>` : ''}
      ${tagList(x.tags)}
      <div class="store-part-actions">
        <code class="store-ref" title="Reference to paste in the app">${esc(x.reference.code)}</code>
        <button type="button" class="btn secondary store-copy" data-reference="${esc(x.reference.code)}" aria-label="Copy the reference for ${esc(x.name)}">Copy reference</button>
        <button type="button" class="store-report" data-part="${esc(x.id)}" data-name="${esc(x.name)}" aria-label="Report ${esc(x.name)} for misuse">Report misuse</button>
      </div>
    </li>`).join('')}</ul>`;
}

/** Reads JSON, or null with the status when the service refuses or can't be reached. */
async function read(fetchImpl, url) {
  try {
    const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
    if (!response.ok) return { status: response.status, body: null };
    return { status: response.status, body: await response.json() };
  } catch {
    return { status: 0, body: null };
  }
}

export function startLive(doc, list, fetchImpl = globalThis.fetch?.bind(globalThis)) {
  const api = list.dataset.api ?? '';
  const input = doc.getElementById('store-q');
  const count = doc.getElementById('store-count');
  const empty = doc.getElementById('store-empty');
  const failure = doc.getElementById('store-unavailable');
  const more = doc.getElementById('store-more');
  const toast = doc.getElementById('store-toast');
  const dialog = doc.getElementById('store-report-dialog');
  const say = (text) => { if (toast) toast.textContent = text; };
  let next = null;
  let shown = 0;
  let generation = 0;

  const fail = (status) => {
    list.innerHTML = '';
    list.removeAttribute('aria-busy');
    if (failure) { failure.textContent = unavailableText(status); failure.hidden = false; }
    if (count) count.textContent = '';
    if (empty) empty.hidden = true;
    if (more) more.hidden = true;
  };

  const load = async ({ append = false } = {}) => {
    const mine = ++generation;
    const query = (input?.value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY);
    if (!append) { list.setAttribute('aria-busy', 'true'); shown = 0; }
    const { status, body } = await read(fetchImpl, storeUrl(api, 'projects', query ? { q: query } : { cursor: append ? next : '' }));
    if (mine !== generation) return;
    if (!body || !Array.isArray(body.projects)) { fail(status); return; }
    if (failure) failure.hidden = true;
    list.removeAttribute('aria-busy');
    const cards = body.projects.map(projectHtml).join('');
    if (append) list.insertAdjacentHTML('beforeend', cards); else list.innerHTML = cards;
    shown += body.projects.length;
    next = query ? null : body.next ?? null;
    if (more) more.hidden = !next;
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = query
      ? `${shown} ${shown === 1 ? 'project matches' : 'projects match'}, best match first.`
      : `${shown}${next ? '+' : ''} ${shown === 1 ? 'project' : 'projects'}, oldest listing first.`;
  };

  const open = async (button) => {
    const card = button.closest('.store-project');
    const slot = card?.querySelector('.store-parts-slot');
    if (!card || !slot) return;
    if (button.getAttribute('aria-expanded') === 'true') {
      button.setAttribute('aria-expanded', 'false');
      slot.hidden = true;
      button.textContent = button.dataset.label ?? button.textContent;
      return;
    }
    button.dataset.label ??= button.textContent;
    if (!slot.innerHTML) {
      button.disabled = true;
      const { status, body } = await read(fetchImpl, storeUrl(api, `projects/${encodeURIComponent(button.dataset.id ?? '')}`));
      button.disabled = false;
      if (status === 404) {
        card.innerHTML = '<p class="muted">This project is no longer in the store.</p>';
        return;
      }
      if (!body) { say(unavailableText(status)); return; }
      slot.innerHTML = partsHtml(body);
    }
    slot.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.textContent = 'Hide parts';
  };

  let reporting = null;
  const report = (button) => {
    reporting = { id: button.dataset.part ?? '', name: button.dataset.name ?? 'this part', button };
    if (!dialog?.showModal) { say('Reports need a newer browser. Email makeitours-support@bengesoftwarellc.com instead.'); return; }
    dialog.querySelector('#store-report-name').textContent = reporting.name;
    dialog.querySelector('form').reset();
    dialog.querySelector('#store-report-status').textContent = '';
    dialog.showModal();
  };
  dialog?.querySelector('form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (event.submitter?.value === 'cancel') { dialog.close(); return; }
    const form = event.currentTarget;
    const reason = form.elements.reason.value;
    const note = form.elements.note.value.trim().slice(0, MAX_REPORT_NOTE);
    const send = form.querySelector('[value="send"]');
    if (send) send.disabled = true;
    let status = 0;
    try {
      const response = await fetchImpl(storeUrl(api, `parts/${encodeURIComponent(reporting?.id ?? '')}/reports`),
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(note ? { reason, note } : { reason }) });
      status = response.status;
    } catch { status = 0; }
    if (send) send.disabled = false;
    if (status === 202 || status === 404 || status === 429) {
      dialog.close();
      say(reportText(status));
      reporting?.button.focus();
    } else {
      dialog.querySelector('#store-report-status').textContent = reportText(status);
    }
  });

  let timer;
  doc.querySelector('.store-search')?.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); void load(); });
  input?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => void load(), 350); });
  more?.addEventListener('click', () => void load({ append: true }));
  list.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('store-open')) return open(button);
    if (button.classList.contains('store-report')) return report(button);
    if (button.classList.contains('store-copy')) {
      const reference = button.dataset.reference ?? '';
      try {
        await doc.defaultView.navigator.clipboard.writeText(reference);
        say(`Copied ${reference}. In the MakeItOurs app, choose Use a Store Part and paste it.`);
      } catch {
        say(`Select ${reference} to copy it, then paste it in the MakeItOurs app under Use a Store Part.`);
      }
    }
  });
  return load();
}

if (typeof document !== 'undefined') {
  const list = document.getElementById('store-projects');
  if (list?.dataset.live === 'true') void startLive(document, list);
  else start(document);
}
