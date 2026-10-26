# hull

A home page and new-tab page for Firefox, that also runs in Chromium
browsers: links to your own services, a search box, a clock and notes,
with the config in TOML. Later, widgets for your own programs.

The project is an early prototype: nothing is built yet. The plan is in
[`docs/architecture.md`](docs/architecture.md).

## Requirements

- Node.js LTS with npm.
- Firefox; Chromium to try the other target.

## Development

```sh
npm ci                  # install
npm run check           # type check, tests, build, web-ext lint
npm run dev             # build on change, open a fresh Firefox with hull
npm run dev:chromium    # the same in Chromium
npm run package         # a zip in web-ext-artifacts/
```

`dist/` and `web-ext-artifacts/` are generated and not in git.

How the code is laid out and why: `docs/architecture.md`.

## Licence

MIT, see [LICENSE](LICENSE).
