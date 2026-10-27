#!/bin/sh
# Run hull from dist/ in Chromium inside a container, in a window on the
# Wayland desktop; launch.mjs loads hull again when dist/ changes. The
# container sees the repo read-only and the Wayland socket, nothing else of
# the machine; its profile is gone when it stops.
#
# Docker's default seccomp profile blocks the user namespaces Chromium's
# sandbox needs, so it is turned off for this container: the other way,
# --no-sandbox, would run web pages without Chromium's sandbox.
set -eu

cd "$(dirname "$0")/../.."

docker build -q -t hull-chromium scripts/chromium >/dev/null
exec docker run --rm --init \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  --security-opt seccomp=unconfined --shm-size 1g \
  -e XDG_RUNTIME_DIR=/tmp/xdg -e WAYLAND_DISPLAY=wayland-0 \
  -v "$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY:/tmp/xdg/wayland-0" \
  -v "$PWD:/hull:ro" -w /hull \
  hull-chromium node scripts/chromium/launch.mjs
