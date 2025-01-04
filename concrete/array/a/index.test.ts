import { test, expect, describe, beforeEach } from "vitest"
import { A, RoA } from "./index"
import { LEvent, Sized, Stash } from "loudo-ds-core"
import { AAdd, AChange, ARemove, BaseA } from "loudo-ds-array-interfaces"
import { mixed } from "loudo-mixin"

interface Capture<T extends {}> {
  captured():LEvent<T,number>|undefined
  added():T[]
  removed():T[]
  ear(event:LEvent<T,number>):void
}

function capture<T extends {}>():Capture<T> {
  let captured:LEvent<T,number>|undefined = undefined
  return {
    captured:() => { const r = captured; captured = undefined; return r },
    added:() => captured?.added ? [...captured.added.elements] : [],
    removed:() => captured?.removed ? [...captured.removed.elements] : [],
    ear(event:LEvent<T,number>) {
      captured = event
    }
  }
}

describe("RoA", () => {
  let a = RoA.of<string>()
  beforeEach(() => {
    a = RoA.of("A", "B", "C", "D")
  })
  test("at", () => {
    expect(a.at(0)).toBe("A")
    expect(a.at(1)).toBe("B")
    expect(a.at(2)).toBe("C")
    expect(a.at(3)).toBe("D")
  })
  test("eq", () => {
    expect(a.eq === Object.is).toBe(true)
  })
  test("findIndex", () => {
    expect(a.findIndex(x => x === "C")).toBe(2)
    expect(a.findIndex(x => x === "Z")).toBeUndefined()
  })
  test("first", () => { expect(a.first).toBe("A") })
  test("from", () => {
    const eq = (a:string,b:string) => a.toLowerCase() === b.toLowerCase()
    const a2 = RoA.from(["A", "b", "C"], { eq })
    expect(a2.eq).toStrictEqual(eq)
    expect([...a2]).toStrictEqual(["A", "b", "C"])
  })
  test("fromJSON", () => {
    const a2 = RoA.fromJSON(a, ["A", "B", "C", "D"])
    expect(a2.equals(a)).toBe(true)
    expect(() => { RoA.fromJSON(a, "")}).toThrowError()
    expect(() => { RoA.fromJSON(a, null)}).toThrowError()
    expect(() => { RoA.fromJSON(a, 0)}).toThrowError()
    expect(() => { RoA.fromJSON(a, {})}).toThrowError()
  })
  test("iterator", () => { expect([...a]).toStrictEqual(["A", "B", "C", "D"]) })
  test("last", () => { expect(a.last).toBe("D") })
  test("mixins", () => {
    expect(mixed(a, BaseA)).toBe(true)
    expect(mixed(a, Sized)).toBe(true)
    expect(mixed(a, Stash)).toBe(true)
  })
  describe("only", () => {
    test("many", () => {
      expect(() => { a.only }).toThrowError()
    })
    test("zero", () => {
      expect(() => { A.of().only }).toThrowError()
    })
    test("one", () => {
      expect(A.of("one").only).toBe("one")
    })
  })
})

describe("A", () => {
  let a = A.of<string>()
  let c = capture<string>()
  beforeEach(() => {
    a = A.of("A", "B", "C", "D")
    c = capture<string>()
    a.hear(c.ear)
    c.captured()
  })
  test("mixins", () => {
    expect(mixed(a, BaseA)).toBe(true)
    expect(mixed(a, Sized)).toBe(true)
    expect(mixed(a, Stash)).toBe(true)
    expect(mixed(a, AChange)).toBe(true)
    expect(mixed(a, ARemove)).toBe(true)
    expect(mixed(a, AAdd)).toBe(true)
  })
  describe("add", () => {
    test("no index", () => {
      a.add("E")
      expect([...a]).toStrictEqual(["A", "B", "C", "D", "E"])
      expect(c.added()).toStrictEqual(["E"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.at).toBe(4)
    })
    test("with index", () => {
      a.add("Z", 0)
      expect([...a]).toStrictEqual(["Z", "A", "B", "C", "D"])
      expect(c.added()).toStrictEqual(["Z"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.at).toBe(0)
      expect(() => { a.add("Z", 100) }).toThrow("index 100 > size 5")
    })
  })
  describe("addAll", () => {
    test("no index", () => {
      a.addAll(new Set(["E", "F"]))
      expect([...a]).toStrictEqual(["A", "B", "C", "D", "E", "F"])
      expect(c.added()).toStrictEqual(["E", "F"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.at).toBe(4)
    })
    test("with index", () => {
      a.addAll(A.of("Z", "Y"), 0)
      expect([...a]).toStrictEqual(["Z", "Y", "A", "B", "C", "D"])
      expect(c.added()).toStrictEqual(["Z", "Y"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.at).toBe(0)
    })
  })
  test("constructor", () => {
    const a = A.of("11", "22", "33")
    const c = capture<string>()
    a.hear(c.ear)
    expect(c.added()).toStrictEqual(["11", "22", "33"])
    const evt = c.captured()
    expect(evt?.cleared).toBe(false)
    expect(evt?.added?.at).toBe(0)
    expect(evt?.removed).toBeUndefined()
  })
  test("clear", () => {
    a.clear()
    expect(a.size).toBe(0)
    expect(a.empty).toBe(true)
    expect(a.first).toBeUndefined()
    expect(a.last).toBeUndefined()
    const event = c.captured()
    expect(event?.cleared).toBe(true)
    expect(event?.removed).toBeUndefined()
    expect(event?.added).toBeUndefined()
  })
  test("firstIndex", () => {
    expect(a.firstIndex).toBe(0)
  })
  test("from", () => {
    const eq = (a:string,b:string) => a.toLowerCase() === b.toLowerCase()
    const a2 = A.from(["A", "b", "C"], { eq })
    expect(a2.eq).toStrictEqual(eq)
    expect([...a2]).toStrictEqual(["A", "b", "C"])
  })
  test("fromJSON", () => {
    const a2 = A.fromJSON(a, ["A", "B", "C", "D"])
    expect(a2.equals(a)).toBe(true)
    expect(() => { A.fromJSON(a, "")}).toThrowError()
    expect(() => { A.fromJSON(a, null)}).toThrowError()
    expect(() => { A.fromJSON(a, 0)}).toThrowError()
    expect(() => { A.fromJSON(a, {})}).toThrowError()
  })
  test("removeAt", () => {
    expect(() => { a.removeAt(-1) }).toThrow("negative array index: -1")
    a.removeAt(2)
    expect([...a]).toStrictEqual(["A", "B", "D"])
    expect(c.removed()).toStrictEqual(["C"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toBe(2)
  })
  test("set", () => {
    a.set(1, "X")
    expect([...a]).toStrictEqual(["A", "X", "C", "D"])
  })
})

test("from", () => {
  const set = new Set(["A", "B", "C"])
  const a = new A(set)
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})

test("of", () => {
  const a = A.of("A", "B", "C")
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})
