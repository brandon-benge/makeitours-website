import { readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync, existsSync, rmSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const statuses = ['not-yet-written', 'draft', 'needs-review', 'approved'];
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requiredText = (value, name) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new Error(`Invalid ${name}`);
  return value;
};

export function safeRead(root, name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || name.startsWith('/') || name.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid source path');
  let current = root;
  for (const part of name.split('/')) {
    current = resolve(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error('Source symlinks are forbidden');
  }
  return readFileSync(current, 'utf8');
}

export function renderSite(root, audience, shared = false) {
  const catalog = JSON.parse(safeRead(root, 'content/docs/catalog.json'));
  if (catalog.audience !== audience || !['public', 'internal'].includes(audience)) throw new Error('Wrong document audience');
  if (!Array.isArray(catalog.documents)) throw new Error('Invalid catalog');
  const seen = new Set();
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  // Documents are text. Images/assets and interactive code come only from reviewed templates.
  md.disable('image');
  md.validateLink = url => /^https:\/\//i.test(url) || /^mailto:(feature|privacy|support|contact)@bengesoftwarellc\.com$/i.test(url) || /^#[a-zA-Z0-9_-]+$/.test(url);
  const docs = catalog.documents.map(doc => {
    if (!doc || !slug.test(doc.id) || ['assets', 'share', 'index'].includes(doc.id) || seen.has(doc.id)) throw new Error('Invalid or duplicate document ID');
    seen.add(doc.id);
    requiredText(doc.title, 'title'); requiredText(doc.summary, 'summary'); requiredText(doc.version, 'version');
    if (doc.audience !== audience || !statuses.includes(doc.status)) throw new Error('Invalid document audience/status');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.updated) || new Date(doc.updated).toISOString().slice(0, 10) !== doc.updated) throw new Error('Invalid revision date');
    if (doc.planning && audience !== 'internal') throw new Error('Planning is private');
    if (doc.status === 'not-yet-written' && doc.source) throw new Error('Unwritten document has a source');
    if (doc.status !== 'not-yet-written' && !doc.source) throw new Error('Document source missing');
    return doc;
  });
  const privateSite = audience === 'internal';
  const home = privateSite ? (shared ? '/case-study/share/' : '/case-study/') : '../index.html';
  const edition = privateSite ? (shared ? 'Private shared documents' : 'Private product documents') : 'Product documentation';
  function page(title, body, doc = null) {
    const prefix = doc ? '../' : './';
    const homeLink = privateSite ? home : (doc ? '../../index.html' : home);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} — MakeItOurs</title>${privateSite ? '<meta name="robots" content="noindex,nofollow,noarchive">' : ''}<link rel="stylesheet" href="${prefix}assets/docs.css"><script type="module" src="${prefix}assets/workflow.js"></script></head>
<body><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="${escape(homeLink)}">MakeIt<span>O</span>urs</a><nav aria-label="Documentation"><a href="${prefix}index.html">Documents</a><a href="${escape(homeLink)}">${privateSite ? 'Case study' : 'Product home'}</a>${privateSite ? '' : `<a href="${doc ? '../../' : '../'}support.html">Support</a>`}</nav></header>
<main id="main"><p class="eyebrow">${edition}</p><h1>${escape(title)}</h1>${doc ? `<div class="metadata"><span>${escape(doc.status.replaceAll('-', ' '))}</span><span>${escape(doc.version)}</span><span>Revised ${escape(doc.updated)}</span></div>` : ''}${body}</main><footer>© 2026 Benge Software LLC · ${privateSite ? 'Read-only documentation · Access does not confer approval.' : '<a href="mailto:support@bengesoftwarellc.com">Contact support</a>'}</footer></body></html>\n`;
  }
  const files = new Map();
  const rows = docs.map(doc => `<li class="card"><p class="label">${escape(doc.status.replaceAll('-', ' '))}</p><h2>${doc.source ? `<a href="${doc.id}/index.html">${escape(doc.title)}</a>` : escape(doc.title)}</h2><p>${escape(doc.summary)}</p></li>`).join('\n');
  files.set('index.html', page('Documentation', `<p class="lede">${privateSite ? 'Product thinking, decisions, and launch preparation. Drafts and outstanding work remain visible.' : 'Understand the product, follow its workflow, and see verified release updates.'}</p><ul class="catalog">${rows}</ul>`));
  for (const doc of docs.filter(d => d.source)) {
    let body = md.render(safeRead(root, `content/docs/${doc.source}`));
    if (doc.workflow) {
      const flow = JSON.parse(safeRead(root, `content/docs/${doc.workflow}`));
      requiredText(flow.title, 'workflow title');
      if (!Array.isArray(flow.steps) || flow.steps.length < 2 || flow.steps.length > 12) throw new Error('Invalid workflow steps');
      for (const step of flow.steps) { requiredText(step.title, 'step title'); requiredText(step.description, 'step description'); }
      body += `<section class="workflow" aria-labelledby="flow-title"><p class="eyebrow">Illustrative workflow · not live activity</p><h2 id="flow-title">${escape(flow.title)}</h2><p>Read each step below, or use the controls to walk through the flow.</p><div class="controls" hidden><button type="button" data-previous>Previous</button><button type="button" data-play>Play</button><button type="button" data-next>Next</button><button type="button" data-reset>Reset</button><span class="flow-status" role="status" aria-live="polite"></span></div><ol class="steps">${flow.steps.map((step, i) => `<li><span class="step-number">${i + 1}</span><div><h3>${escape(step.title)}</h3><p>${escape(step.description)}</p></div></li>`).join('')}</ol><p class="motion-note">Animation starts only when you choose Play. Reduced-motion settings keep step changes immediate.</p></section>`;
    }
    if (doc.planning) {
      body += `<section data-planning-endpoint="${shared ? '/api/share/docs/planning' : '/api/docs/planning'}" aria-labelledby="planning-title"><h2 id="planning-title">Project schedule</h2><p class="planning-status" role="status">Loading planning data…</p><button type="button" data-refresh>Refresh</button><div class="planning-output"></div></section><script type="module" src="../assets/planning.js"></script>`;
      files.set('assets/planning.js', safeRead(root, 'scripts/docs-assets/planning.js'));
    }
    files.set(`${doc.id}/index.html`, page(doc.title, `<article>${body}</article>`, doc));
  }
  for (const name of ['docs.css', 'workflow.js']) files.set(`assets/${name}`, safeRead(root, `scripts/docs-assets/${name}`));
  return files;
}

function inventory(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  if (lstatSync(dir).isSymbolicLink()) throw new Error('Output symlinks are forbidden');
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.isSymbolicLink()) throw new Error('Output symlinks are forbidden');
    return e.isDirectory() ? inventory(resolve(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`];
  });
}

export function build(root, { check = false } = {}) {
  const audience = JSON.parse(safeRead(root, 'content/docs/catalog.json')).audience;
  const editions = audience === 'internal' ? [['dist/docs', false], ['dist/docs/share', true]] : [['docs', false]];
  // Validate both editions completely before changing output.
  const rendered = editions.map(([target, shared]) => [target, renderSite(root, audience, shared)]);
  for (const [target, files] of rendered) {
    const output = resolve(root, target);
    for (const parent of [dirname(output), output]) if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) throw new Error('Output symlinks are forbidden');
    const existing = inventory(output).filter(name => target === 'dist/docs' ? !name.startsWith('share/') : true);
    if (check) {
      if (existing.sort().join('\n') !== [...files.keys()].sort().join('\n') || [...files].some(([name, text]) => readFileSync(resolve(output, name), 'utf8') !== text)) throw new Error(`Generated documentation differs: ${target}. Run npm run docs:build.`);
    } else {
      for (const old of existing) if (!files.has(old)) rmSync(resolve(output, old));
      for (const [name, text] of files) { const path = resolve(output, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); }
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  build(root, { check: process.argv.includes('--check') });
  console.log(`Documentation ${process.argv.includes('--check') ? 'checked' : 'rendered'} for ${relative(process.cwd(), root) || '.'}`);
}
