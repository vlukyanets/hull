import { describe, expect, test } from "vitest"
import { tileHref } from "./href"

describe("tileHref", () => {
  test("puts https:// in front of a URL with no scheme", () => {
    expect(tileHref("nas.lan")).toBe("https://nas.lan")
    expect(tileHref("192.168.1.1/admin")).toBe("https://192.168.1.1/admin")
  })

  test("reads a name and a port as a host, not as a scheme", () => {
    expect(tileHref("localhost:8000")).toBe("https://localhost:8000")
    expect(tileHref("nas.lan:5000/photos")).toBe("https://nas.lan:5000/photos")
  })

  test("leaves a URL with a scheme as it is", () => {
    expect(tileHref("http://192.168.1.1")).toBe("http://192.168.1.1")
    expect(tileHref("ssh://nas.lan")).toBe("ssh://nas.lan")
    expect(tileHref("mailto:me@example.com")).toBe("mailto:me@example.com")
  })
})
