# hull

A home page and new-tab page for Firefox, that also runs in Chromium
browsers: links to your own services, a search box, a clock and notes,
with the config in TOML. Later, widgets for your own programs.

The project is an early prototype: the new-tab page shows a clock and the
date, nothing more yet. The plan is in
[`docs/architecture.md`](docs/architecture.md).

## Requirements

- Node.js 26 with npm, see `.nvmrc`.
- Firefox; Chromium to try the other target.

## Development

```sh
npm ci                  # install
npm run check           # type check, tests, build, web-ext lint
npm run dev             # build on change, open a fresh Firefox with hull
npm run dev:chromium    # the same in Chromium
npm run package         # a zip in web-ext-artifacts/
```

`npm run dev` opens the browser before it installs hull, so the first tab
stays empty: open a new tab to see hull.

`dist/` and `web-ext-artifacts/` are generated and not in git.

How the code is laid out and why: `docs/architecture.md`.

## Licence

MIT, see [LICENSE](LICENSE).
