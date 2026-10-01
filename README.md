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
