import { test, expect, describe } from "vitest"
import { Hasher, hashDouble, hashInteger, hashString } from "./index"

function h() { return new Hasher() }

describe("Hasher", () => {
  test("boolean", () => {
    expect(h().boolean(true).result).toBe(166810)
    expect(h().boolean(false).result).toBe(166811)
  })
  test("double", () => {
    expect(h().double(NaN).result).toBe(2142693317)
    expect(h().double(Infinity).result).toBe(2143217605)
    expect(h().double(Math.PI).result).toBe(1955006502)
  })
  test("integer", () => {
    expect(h().integer(1).result).toBe(166810)
    expect(h().integer(1 << 32 - 1).result).toBe(-2147316837)
  })
  test("string", () => {
    expect(h().string("").result).toBe(5381)
    expect(h().string("a").result).toBe(166906)
    expect(h().string("b").result).toBe(166905)
    expect(h().string("ab").result).toBe(5174052)
  })
})

test("hashDouble", () => {
  expect(hashDouble(NaN)).toBe(2142693317)
  expect(hashDouble(Infinity)).toBe(2143217605)
  expect(hashDouble(Math.PI)).toBe(1955006502)
})

test("hashInteger", () => {
  expect(hashInteger(0)).toBe(166811)
  expect(hashInteger(1)).toBe(166810)
  expect(hashInteger(1 << 32 - 1)).toBe(-2147316837)
})

test("hashString", () => {
  expect(hashString("")).toBe(5381)
  expect(hashString("a")).toBe(166906)
  expect(hashString("b")).toBe(166905)
  expect(hashString("ab")).toBe(5174052)
})