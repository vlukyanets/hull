#!/bin/sh
# Build hull, rebuild it on every change and run it in a fresh profile of
# the browser given as the first argument (a web-ext target, such as
# firefox-desktop or chromium). web-ext reloads hull when dist/ changes.
# Chromium runs in a container, see scripts/chromium/run.sh.
set -eu

cd "$(dirname "$0")/.."

npx vite build
npx vite build --watch &
trap 'kill $!' EXIT INT TERM
if [ "$1" = chromium ]; then
  scripts/chromium/run.sh
else
  npx web-ext run -s dist -t "$1"
fi
