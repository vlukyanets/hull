# hull

A home page and new-tab page for Firefox, that also runs in Chromium
browsers: links to your own services, a search box, a clock and notes,
with the config in TOML. Later, widgets for your own programs.

The project is an early prototype: the new-tab page shows a clock, the
date, a search box and your links. You edit the config as TOML on the
options page: the "Edit" link in the corner of the new tab, or hull in
about:addons; it also imports and exports the config as a TOML file. The
plan is in [`docs/architecture.md`](docs/architecture.md).

## Requirements

- Node.js 26 with npm, see `.nvmrc`.
- Firefox.
- Docker and a Wayland desktop to try Chromium; Chromium itself runs in a
  container and need not be installed.

## Development

```sh
npm ci                  # install
npm run check           # type check, tests, build, web-ext lint
npm run dev             # build on change, open a fresh Firefox with hull
npm run dev:chromium    # the same in Chromium, in a container
npm run package         # a zip in web-ext-artifacts/
```

`npm run dev` opens the browser before it installs hull, so the first tab
stays empty: open a new tab to see hull.

`npm run dev:chromium` builds a Docker image with Node and Debian's
Chromium the first time, which downloads them. Chromium opens in a window
on the desktop; the container sees the repo read-only and the Wayland
socket. Docker's seccomp filter is off for it, so Chromium's own sandbox
can run. `docker rmi hull-chromium` removes the image.

`dist/` and `web-ext-artifacts/` are generated and not in git.

How the code is laid out and why: `docs/architecture.md`.

## Licence

MIT, see [LICENSE](LICENSE).
