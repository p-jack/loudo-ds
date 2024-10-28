import { test, expect, describe } from "vitest"
import { mixed, mixin } from "./index"

test("simple", () => {
  class Z {}
  interface AI {
    readonly field:string
    method():string
  }
  abstract class A extends Z implements AI {
    get field() { return "abc" }
    method() { return "xyz" }
  }
  interface Z extends AI {}
  expect(mixed(Z, A)).toBe(false)
  mixin(Z, [A])
  expect(mixed(Z, A)).toBe(true)
  const z = new Z()
  expect(z.field).toBe("abc")
  expect(z.method()).toBe("xyz")
})

test("symbol", () => {
  const field = Symbol("field")
  const method = Symbol("method")
  class Z {}
  interface AI {
    [method]():string
    readonly [field]:string
  }
  class A extends Z implements AI {
    get [field]() { return "abc" }
    [method]() { return "xyz" }
  }
  interface Z extends AI {}
  expect(mixed(Z, A)).toBe(false)
  mixin(Z, [A])
  expect(mixed(Z, A)).toBe(true)
  const z = new Z()
  expect(z[field]).toBe("abc")
  expect(z[method]()).toBe("xyz")
})
