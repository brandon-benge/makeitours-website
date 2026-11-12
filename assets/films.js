// makeitours#168: the live film list. Each page ships with the films it was
// released with. This swaps in the current list from films.bengesoftwarellc.com
// so a new or re-cut film needs no website release. On any error the page
// stays as released. `?films=next` shows the staged preview list instead.
const FILMS = 'https://films.bengesoftwarellc.com';

export const listUrl = search =>
  `${FILMS}/catalog/v1/${new URLSearchParams(search).get('films') === 'next' ? 'films-next.json' : 'films.json'}`;

const onFilms = url => typeof url === 'string' && url.startsWith(`${FILMS}/v1/`);
export const valid = f => !!f && onFilms(f.video) && onFilms(f.poster)
  && (f.captions == null || onFilms(f.captions)) && Number.isFinite(f.seconds) && f.seconds > 0;

// Same markup as scripts/render-hosted.mjs film(), built without innerHTML.
export function figure(doc, f, label) {
  const fig = doc.createElement('figure');
  fig.className = 'film';
  const video = doc.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'none');
  video.setAttribute('crossorigin', 'anonymous');
  video.setAttribute('poster', f.poster);
  video.setAttribute('aria-label', label);
  const source = doc.createElement('source');
  source.setAttribute('src', f.video);
  source.setAttribute('type', 'video/mp4');
  video.append(source);
  if (f.captions) {
    const track = doc.createElement('track');
    for (const [k, v] of [['kind', 'captions'], ['srclang', 'en'], ['label', 'English'], ['src', f.captions]]) track.setAttribute(k, v);
    video.append(track);
  }
  const caption = doc.createElement('figcaption');
  caption.textContent = `${label} · ${Math.round(f.seconds)} seconds, no sound`;
  fig.append(video, caption);
  return fig;
}

// Fills every [data-film-slot] from the list. A loaded list is authoritative:
// a slot it has no film for is hidden, so a rollback or withdrawal shows at once.
export function apply(doc, list) {
  if (!list || list.schema !== 1) return false;
  for (const slot of [...doc.querySelectorAll('[data-film-slot]')]) {
    const name = slot.getAttribute('data-film-slot');
    const [kind, id] = name.split(':');
    if (kind === 'byoi-setup') {
      const steps = (Array.isArray(list.byoiSetup) ? list.byoiSetup : []).filter(s => typeof s?.title === 'string' && valid(s.film));
      slot.replaceChildren(...steps.map(s => figure(doc, s.film, `Film: ${s.title}`)));
      continue;
    }
    const f = kind === 'feature' ? list.features?.[id] : kind === 'overview' ? list.overviews?.[id] : undefined;
    if (!valid(f)) {
      slot.hidden = true;
      continue;
    }
    if (!slot.hidden && slot.querySelector('source')?.getAttribute('src') === f.video) continue;
    const next = figure(doc, f, slot.getAttribute('data-film-label'));
    next.setAttribute('data-film-slot', name);
    next.setAttribute('data-film-label', slot.getAttribute('data-film-label'));
    slot.replaceWith(next);
  }
  return true;
}

if (typeof document !== 'undefined' && typeof fetch === 'function') {
  fetch(listUrl(location.search), { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : null))
    .then(list => apply(document, list))
    .catch(() => {});
}
