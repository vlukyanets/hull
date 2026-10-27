// Starts Chromium with hull from /hull/dist, shows hull's new tab and loads
// hull again whenever dist/ changes, over the DevTools pipe. web-ext does
// the same, but adds a flag Chromium warns about as unsupported. Runs in
// the container, see run.sh.
import { spawn } from "node:child_process"
import { watch } from "node:fs"

const dist = "/hull/dist"

// The binary itself: Debian's /usr/bin/chromium is a script that adds
// flags of its own.
const chromium = spawn(
  "/usr/lib/chromium/chromium",
  [
    "--remote-debugging-pipe",
    "--enable-unsafe-extension-debugging",
    "--user-data-dir=/tmp/profile",
    "--no-first-run",
    "--no-default-browser-check",
    "--ozone-platform=wayland",
  ],
  // fd 3 takes commands to Chromium, fd 4 gives its answers.
  { stdio: ["ignore", "inherit", "inherit", "pipe", "pipe"] },
)
chromium.on("exit", (code) => process.exit(code ?? 0))
process.on("SIGTERM", () => chromium.kill())
process.on("SIGINT", () => chromium.kill())

// The DevTools protocol over the pipe: JSON messages ended by a null byte.
let lastId = 0
const pending = new Map()
const listeners = new Set()
function send(method, params, sessionId) {
  const id = ++lastId
  chromium.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + "\0")
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
let buffer = ""
chromium.stdio[4].on("data", (chunk) => {
  buffer += chunk
  let end
  while ((end = buffer.indexOf("\0")) >= 0) {
    const message = JSON.parse(buffer.slice(0, end))
    buffer = buffer.slice(end + 1)
    if (message.id === undefined) {
      for (const listener of listeners) listener(message)
      continue
    }
    const call = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) call.reject(new Error(message.error.message))
    else call.resolve(message.result)
  }
})

async function load() {
  try {
    await send("Extensions.loadUnpacked", { path: dist })
    console.log("hull loaded")
    return true
  } catch (e) {
    console.error(`hull not loaded: ${e.message}`)
    return false
  }
}

// The first tab opens before hull is loaded, with Chromium's own new tab;
// once hull is in, open the new tab in it again.
const firstTab = new Promise((resolve) => {
  listeners.add(({ method, params }) => {
    if (method === "Target.targetCreated" && params.targetInfo.type === "page") {
      resolve(params.targetInfo.targetId)
    }
  })
})
await send("Target.setDiscoverTargets", { discover: true })
const targetId = await firstTab
if (await load()) {
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true })
  await send("Page.navigate", { url: "chrome://newtab/" }, sessionId)
}

// A build writes several files; load once they are all written.
let timer
watch(dist, { recursive: true }, () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})
