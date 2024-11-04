import { test, expect, describe, beforeEach } from "vitest"
import { A } from "./index"
import { LEvent } from "loudo-ds-core"

interface Capture<T> {
  captured():LEvent<T,number>|undefined
  added():T[]
  removed():T[]
  ear(event:LEvent<T,number>):void
}

function capture<T>():Capture<T> {
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
  let a = A.from<string>([])
  beforeEach(() => {
    a = A.of("A", "B", "C", "D")
  })
  test("at", () => {
    expect(a.at(0)).toBe("A")
    expect(a.at(1)).toBe("B")
    expect(a.at(2)).toBe("C")
    expect(a.at(3)).toBe("D")
  })
  test("findIndex", () => {
    expect(a.findIndex(x => x === "C")).toBe(2)
    expect(a.findIndex(x => x === "Z")).toBeUndefined()
  })
  test("first", () => { expect(a.first).toBe("A") })
  test("iterator", () => { expect([...a]).toStrictEqual(["A", "B", "C", "D"]) })
  test("last", () => { expect(a.last).toBe("D") })

})

describe("A", () => {
  let a = A.from<string>([])
  let c = capture<string>()
  beforeEach(() => {
    a = A.of("A", "B", "C", "D")
    c = capture<string>()
    a.hear(c.ear)
    c.captured()
  })
  describe("add", () => {
    test("no index", () => {
      a.add("E")
      expect([...a]).toStrictEqual(["A", "B", "C", "D", "E"])
      expect(c.added()).toStrictEqual(["E"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.count).toBe(1)
      expect(event?.added?.at).toBe(4)
    })
    test("with index", () => {
      a.add("Z", 0)
      expect([...a]).toStrictEqual(["Z", "A", "B", "C", "D"])
      expect(c.added()).toStrictEqual(["Z"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.count).toBe(1)
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
      expect(event?.added?.count).toBe(2)
      expect(event?.added?.at).toBe(4)
    })
    test("with index", () => {
      a.addAll(A.of("Z", "Y"), 0)
      expect([...a]).toStrictEqual(["Z", "Y", "A", "B", "C", "D"])
      expect(c.added()).toStrictEqual(["Z", "Y"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.added?.count).toBe(2)
      expect(event?.added?.at).toBe(0)
    })
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
  describe("remove", () => {
    test("no count", () => {
      expect(() => { a.remove(-1) }).toThrow("negative array index: -1")
      a.remove(2)
      expect([...a]).toStrictEqual(["A", "B", "D"])
      expect(c.removed()).toStrictEqual(["C"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.removed?.at).toBe(2)
      expect(event?.removed?.count).toBe(1)
    })
    test("with count", () => {
      expect(() => { a.remove(1, 5) }).toThrow("index 5 >= size 4")
      a.remove(1, 2)
      expect([...a]).toStrictEqual(["A", "D"])
      expect(c.removed()).toStrictEqual(["B", "C"])
      const event = c.captured()
      expect(event?.cleared).toStrictEqual(false)
      expect(event?.removed?.at).toBe(1)
      expect(event?.removed?.count).toBe(2)
    })
    test("zero count", () => {
      a.remove(1, 0)
      expect(c.captured()).toBeUndefined()
    })
  })
  test("set", () => {
    a.set(1, "X")
    expect([...a]).toStrictEqual(["A", "X", "C", "D"])
  })
  test("sort", () => {
    a.add("000")
    a.sort((a,b) => b.codePointAt(0)! - a.codePointAt(0)!)
    expect([...a]).toStrictEqual(["D", "C", "B", "A", "000"])
    expect(c.added()).toStrictEqual(["D", "C", "B", "A", "000"])
    const event = c.captured()
    expect(event?.cleared).toBe(true)
    expect(event?.added?.at).toBe(0)
    expect(event?.added?.count).toBe(5)
  })
})

test("from", () => {
  const set = new Set(["A", "B", "C"])
  const a = A.from(set)
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})

test("of", () => {
  const a = A.of("A", "B", "C")
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})

// test("ify", () => {
//   const a1 = La.of("a", "b")
//   const a2 = La.ify(a1)
//   expect(a1 === a2).toBe(true)
//   const a3 = La.ify([...a1])
//   expect(a1 === a3).toBe(false)
// })
