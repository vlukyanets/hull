// Lint dist/ the way AMO review does and fail on any error or warning but
// one: Preact sets innerHTML for dangerouslySetInnerHTML, and the linter
// warns about it in every build. hull never uses it; check.sh fails on
// innerHTML in src/ instead.
import { execFileSync } from "node:child_process"

const ALLOWED = ["UNSAFE_VAR_ASSIGNMENT"]

let out
try {
  out = execFileSync(
    "node_modules/.bin/web-ext",
    ["lint", "-s", "dist", "--output", "json"],
    { encoding: "utf8" },
  )
} catch (e) {
  // web-ext exits non-zero when it finds errors; the report is the same.
  out = e.stdout
}

const { errors, warnings } = JSON.parse(out)
const found = [...errors, ...warnings.filter((w) => !ALLOWED.includes(w.code))]
for (const f of found) console.error(`${f.code} ${f.file ?? ""}: ${f.message}`)
if (found.length > 0) process.exit(1)
console.log(`web-ext lint: no errors, ${warnings.length} allowed warning(s)`)
