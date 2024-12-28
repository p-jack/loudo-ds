import { test, expect, describe, beforeEach } from "vitest"
import { Tin, LEvent, mixed } from "loudo-ds-core"
import { One } from "./index"

test("One", () => {
  let one = new One("111")
  expect(one.size).toBe(1)
  expect(one.empty).toBe(false)
  expect(one.has("111")).toBe(true)
  expect(one.has("222")).toBe(false)
  expect(one.first).toBe("111")
  expect(one.last).toBe("111")
  expect(one.only).toBe("111")
  expect([...one]).toStrictEqual(["111"])
})
