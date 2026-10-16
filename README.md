# MakeItOurs website

Static marketing and support website for MakeItOurs, published at
https://bengesoftwarellc.com/makeitours-website/.

This repository was extracted from `brandon-benge/website` using Git subtree
history. Its working location in the product workspace is
`makeitours/makeitours-website/`.

## Preview

For a standalone preview, run `python3 -m http.server 8000 --bind 127.0.0.1`
from this repository and open http://localhost:8000/.

For the actual production URL layout, run
`python3 scripts/build_site.py --preview --serve --open-browser` from the company
website repository. It reads this nested working checkout and assembles both
sites into `_site/`. Restart the command after edits to refresh the snapshot.

## Release

Publishing commits here does not deploy the website. The central
[company website repository](https://github.com/brandon-benge/website) owns
GitHub Pages, the domain, and the `site-sources.json` release manifest.

1. Commit and push the desired website changes here.
2. Set `makeitours.ref` in the company's `site-sources.json` to that full commit
   SHA. Update the product workspace's submodule pointer when advancing its
   development checkout.
3. Run the central release build and tests documented in its README, then review
   and merge the central change to `main` to publish.

The central workflow downloads this public repository directly, without access
to the private product workspace. Revert the central SHA to roll back. The
workspace submodule pointer and central publication SHA serve separate purposes;
changing the workspace pointer alone does not release the website.

## Web documents and animated workflows

Editable customer content lives in `content/docs/`. `catalog.json` lists each
page's ID, audience (`public`), review status, revision date and product version.
Markdown supplies prose; optional workflow JSON supplies step titles and text.
Reviewed JavaScript/CSS in `scripts/docs-assets/` supplies accessible animation.
It never runs code from Markdown. Edit either source directly without AI, or
have AI edit the same files. Features, bugs and support cases remain tickets.

```sh
npm ci
npm test
npm run docs:build
npm run docs:check
```

Commit generated `docs/` HTML/assets alongside source when a commit is authorized.
CI rejects stale generated files. The central Python build publishes these web
files only; authoring source, catalogs and Node dependencies are excluded. Git
revision history applies to the source; draft metadata is not release approval.
The release-notes page currently has no verified release entry. The example
workflow is illustrative, with Play/Pause, Previous/Next and Reset, no autoplay,
a readable no-JavaScript fallback and reduced-motion styling.

Do not put internal documents or customer support details in this public repo.

## Live roadmap tickets

`roadmap.html` reads public issues from the `makeitours-website` repository at
view time. A maintainer reviews an issue before applying `publish:roadmap`,
exactly one `phase:1` or `phase:later`, and one `type:feature` or `type:bug`.
Its title, open/closed state and canonical GitHub link then appear without a
website commit. The issue body owns outcome, acceptance criteria and discussion;
Project fields own private priority and dates. The browser receives no token
and never requests issue bodies or private Project data. GitHub API errors or
rate limits show an unavailable message, not an empty finished roadmap.
