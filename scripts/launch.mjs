// makeitours-website#39/#45: one switch for pre-launch versus launched wording.
// content/launch.json holds the state. Every block that changes at launch is
// listed here with both versions; pages mark them with
// <!-- launch:NAME -->…<!-- /launch:NAME --> and hosted.html takes them from
// render-hosted.mjs. Flipping to "launched" is #39's release step: it needs
// production live, the App Store link, the journey films (makeitours-app#115)
// and the owner's review of this wording in the same release.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const states = ['pre-launch', 'launched'];

// LAUNCH_FILE lets tests and previews render the other state without editing content/launch.json.
export const readLaunch = (file = process.env.LAUNCH_FILE || join(root, 'content', 'launch.json')) => validLaunch(JSON.parse(readFileSync(file, 'utf8')));

export const validLaunch = launch => {
  if (!states.includes(launch?.state)) throw new Error(`content/launch.json: state must be one of ${states.join(', ')}`);
  if (launch.state === 'launched' && !/^https:\/\/apps\.apple\.com\/[\w/.-]+$/.test(launch.appStoreUrl ?? '')) {
    throw new Error('content/launch.json: launched needs appStoreUrl, an https://apps.apple.com/ link');
  }
  return launch;
};

export const launchCopy = ({ state, appStoreUrl }) => {
  const pre = state === 'pre-launch';
  const store = pre ? '' : appStoreUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const blocks = {
    // index.html
    'meta': pre
      ? '<meta name="description" content="MakeItOurs is developing a way to turn building and making ideas, from decks to mechanical parts, into checked, owned 3D models and drawings. Currently in staging testing.">'
      : '<meta name="description" content="MakeItOurs turns building and making ideas, from decks to mechanical parts, into checked, owned 3D models and drawings, on Mac and iPhone.">',
    'hero-status': pre
      ? ` The staging build produces checked geometry,
        drawings and export files from versioned project source. It is still
        under test and has not been released to customers.`
      : ` It produces checked geometry, drawings and
        export files from versioned project source.`,
    'hero-note': pre ? `
        Not open to the public yet: <a href="roadmap.html">see the roadmap</a>.` : '',
    'status-card': pre
      ? '<div class="card"><strong>Pre-launch</strong><p class="muted" style="margin: 8px 0 0;">This site shows a product under development. The examples below come from staging and do not mean public accounts or subscriptions are available. <a href="roadmap.html">Read the current roadmap</a> and <a href="docs/release-notes/index.html">verified release notes</a>.</p></div>'
      : '',
    'price-lede': pre
      ? ' These are the launch prices; nothing is on sale yet while MakeItOurs is in staging testing.'
      : ' Plans and packs are bought in the app through the App Store.',
    'what-you-get': pre ? `
      The capabilities being tested in staging. Customer availability and
      supported workflows will be confirmed in release notes.
` : `
      What every project gets. The release notes list what changed in each
      version.
`,
    'viewer': pre ? 'Staging builds open' : 'Builds open',
    'exports': pre ? 'Staging builds can produce' : 'Builds can produce',
    'source': pre ? 'Staging projects keep' : 'Projects keep',
    'paths-status': pre ? ' Self-serve purchase and public onboarding are not open yet.' : '',
    'devices': pre ? `
    <h2>Mac and iPhone · in testing</h2>
    <p>
      Native Mac and iPhone flows are being tested by the owner on staging.
      App Store distribution and broader device support have not been
      verified for a customer release.
    </p>

    <div class="card">
      <strong>Follow the work</strong>
      <p class="muted" style="margin: 8px 0 0;">
        <a href="roadmap.html">The roadmap</a> explains what is built for
        staging and what still needs to happen before outside users can try it.
      </p>
    </div>

    ` : `
    <h2>Mac and iPhone</h2>
    <p>
      MakeItOurs runs on Mac and iPhone.
      <a href="${store}">Get it on the App Store</a>.
    </p>

    `,
    // getting-started.html
    'availability': pre
      ? '<div class="card" id="availability"><strong>Not open to the public yet.</strong><p class="muted" style="margin: 8px 0 0;">MakeItOurs is in pre-launch testing on staging with the owner and invited testers. There is no public sign-up, purchase or App Store release yet, and no launch date. The steps on this page describe how it will work once it opens. Follow the <a href="roadmap.html">roadmap</a> and <a href="docs/release-notes/index.html">release notes</a> for updates, and see <a href="#today">what you can do today</a>.</p></div>'
      : `<div class="card" id="availability"><strong>Available on the App Store.</strong><p class="muted" style="margin: 8px 0 0;">Get MakeItOurs for Mac and iPhone from the <a href="${store}">App Store</a>, then follow the steps below. The <a href="docs/release-notes/index.html">release notes</a> list what changed in each version.</p></div>`,
    'steps-note': pre
      ? "These are the customer steps for when Hosted opens. They can't be followed yet."
      : 'Follow these steps for your first Hosted project.',
    'get-app': pre
      ? 'Install MakeItOurs on your Mac or iPhone.'
      : `Install MakeItOurs on your Mac or iPhone from the <a href="${store}">App Store</a>.`,
    'today': pre ? `
  <h2 id="today">What you can do today</h2>
  <ul>
    <li>Watch the films on this page and on the <a href="hosted.html">Hosted page</a> to see the staging build at work.</li>
    <li>Read the <a href="roadmap.html">roadmap</a> for what still needs to happen before outside users can try it, and the <a href="docs/release-notes/index.html">release notes</a> for verified releases.</li>
    <li>Send product ideas or early interest to <a href="mailto:feature@bengesoftwarellc.com">feature@bengesoftwarellc.com</a>. Invited testers can get help at <a href="mailto:makeitours-support@bengesoftwarellc.com">makeitours-support@bengesoftwarellc.com</a>.</li>
  </ul>

  ` : '',
    // hosted.html (render-hosted.mjs)
    'hosted-status-card': pre
      ? '  <div class="card"><strong>Pre-launch.</strong><p class="muted" style="margin: 8px 0 0;">MakeItOurs is in staging testing. Public accounts are not available yet, and features marked “Coming soon” are not released.</p></div>\n'
      : '',
    'hosted-price-note': pre
      ? 'These are the launch prices. MakeItOurs is still in staging testing, so nothing is on sale yet. Prices are in US dollars; your App Store region may show a different price.'
      : 'Prices are in US dollars; your App Store region may show a different price.',
  };
  return blocks;
};

// Replaces every marked block in a page. Unknown or missing blocks fail.
export const applyLaunch = (html, blocks) => {
  const seen = new Set();
  const out = html.replace(/<!-- launch:([\w-]+) -->([\s\S]*?)<!-- \/launch:\1 -->/g, (_, name) => {
    if (!(name in blocks)) throw new Error(`unknown launch block ${name}`);
    seen.add(name);
    return `<!-- launch:${name} -->${blocks[name]}<!-- /launch:${name} -->`;
  });
  return { html: out, seen };
};
