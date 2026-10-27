# Chromium and Node for `npm run dev:chromium`, so Chromium need not be
# installed on the machine. Debian keeps its chromium package at the
# current stable version.
FROM node:26-trixie-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
