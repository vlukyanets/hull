#!/bin/sh
# Type check and test, then build and lint the build the way AMO review
# lints it.
set -eu

cd "$(dirname "$0")/.."

npx tsc -p .
npx vitest run
npx vite build

# The linter allows Preact's own innerHTML (see lint.js), so ours fails here.
if grep -rn innerHTML src; then
  echo "innerHTML in src/: let Preact render instead" >&2
  exit 1
fi
node scripts/lint.js

echo "check passed"
