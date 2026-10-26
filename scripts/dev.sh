#!/bin/sh
# Build hull, rebuild it on every change and run it in a fresh profile of
# the browser given as the first argument (a web-ext target, such as
# firefox-desktop or chromium). web-ext reloads hull when dist/ changes.
set -eu

cd "$(dirname "$0")/.."

npx vite build
npx vite build --watch &
trap 'kill $!' EXIT INT TERM
npx web-ext run -s dist -t "$1"
