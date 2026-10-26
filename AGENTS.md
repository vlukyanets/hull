# AGENTS.md

hull is the owner's home page and new-tab page: a browser extension with
links, search and small widgets, later programs on their machine. Firefox
first, Chromium too. TypeScript, Preact, Vite; web-ext runs and packs it.

The project is a prototype: get the smallest version working end to end,
then harden it. Working code beats documents.

## Layout

- `src/newtab/`, `src/options/`: the two pages; `src/widgets/<name>/`:
  one directory per widget. `manifest.json` is written by hand.
- `src/config/`: the config, TOML and storage; the only code that
  touches `browser.storage`.
- `src/platform/`: the only code that calls APIs that differ between
  browsers; it checks first and falls back.
- `docs/architecture.md`: the parts, the invariants and the decisions.
  Read it before changing the structure, the config or a permission.

## Commands

- `npm ci` once, then `npm run check`: type check, tests, build and
  `web-ext lint`. Run it before saying a change works.
- `npm run dev`: build on change and open a fresh Firefox profile with
  hull loaded; `npm run dev:chromium` does the same in Chromium.

## How to work

- Work follows the scope in `docs/architecture.md`, one item at a time;
  agree on the item with the owner before building it. When it is done,
  move what stays true into `docs/`.
- Use library defaults. Add a setting, constant or timeout only when
  something breaks without it.
- Test the logic in `src/config/` and `src/platform/` with vitest;
  components only render.
- Done means `npm run check` passed and `npm run dev` showed the change
  in Firefox; a change in `src/platform/` is also tried in Chromium. If a
  check failed or could not run, say so and show its output.
- Read and change files with the file tools (Read, Edit, Write), not
  shell commands: no `cat`, `sed -i`, `echo >` or heredocs. Delete only
  with `git rm`, after asking.

## Ask the owner first

Bring these as 2-3 options with a recommendation, and wait for a yes:

- a new dependency, or a new permission in `manifest.json`;
- a change to the config format or the storage keys;
- a call to anything outside the extension: a website, an API, a program;
- anything hard to undo, such as deleting data, branches or files that
  are not part of the current change.

A question from the owner is not approval.

## Never

- Put secrets, tokens or personal data in files, logs, commits or chat.
  Never read, copy or ask for the owner's AMO or store API keys.
- Load code from outside the bundle, use `eval` or `new Function`, loosen
  the content security policy or add telemetry. AMO review rejects them.
- Point web-ext at the owner's browser profile or change their settings.
- Commit, push or open a pull request unless the owner says so. Never
  merge, approve or close a pull request, touch tags, release, sign or
  publish the extension (`web-ext sign`, AMO, Chrome Web Store).
- Add AI attribution anywhere: no `Co-Authored-By`, session links or
  "Generated with" lines in commits or pull requests.
- Disable, skip or weaken a check to make it pass.
- Change `user.name` or `user.email`, pass `--author`, run a bare
  `git stash` or `pkill`.

## Git

- Name a branch after its topic, in a few lowercase words joined by
  hyphens, such as `links-grid` or `search`: no prefix like `feat/` or
  `claude/`, no random words. Its worktree folder has the same name.
- Work in a worktree of your own, never in the main checkout:
  `git worktree add .claude/worktrees/<branch> -b <branch> origin/master`.
  Not `claude --worktree`, which names the branch itself. A branch that
  builds on another one starts from that branch instead.
- Run every command inside the worktree. The main checkout stays on
  `master`; do not switch, rebase or reset it.
- Remove a worktree only when its branch is merged or the owner drops it,
  and only when `git status` there prints nothing.
- Commit title: imperative, at most 72 characters, no prefix, no period.
  The body says why.
- Push only with `--force-with-lease --force-if-includes`.

## Writing

- English, plain ASCII: no long dashes, curly quotes, arrows or emoji.
- Markdown is formatted by hand; tables are unpadded, with the separator
  `| --- | --- |`.

## This file

Add a rule here only after an agent made that mistake. Keep the file under
100 lines.
