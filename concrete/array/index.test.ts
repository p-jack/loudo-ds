import { test, expect, describe, beforeEach } from "vitest"
import { La } from "."
import { Exclude, IN_EX, IN_IN, EX_IN, EX_EX } from "loudo-ds-ordered"
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


interface TestCase {
  name: string
  array: string[]
  full?: boolean
  start: number
  end: number
  exclude: Exclude
}

const testCases:TestCase[] = [
{
  full: true,
  name: "FullLa",
  array: ["A", "B", "C", "D"],
  start: 0,
  end: 4,
  exclude: IN_EX,
},
{
  name: "full facade",
  array: ["A", "B", "C", "D"],
  start: 0,
  end: 4,
  exclude: IN_EX,
},
{
  name: "drop first",
  array: ["", "A", "B", "C", "D"],
  start: 1,
  end: 5,
  exclude: IN_EX,
},
{
  name: "drop last",
  array: ["A", "B", "C", "D", ""],
  start: 0,
  end: 4,
  exclude: IN_EX,
},
{
  name: "drop both",
  array: ["", "", "A", "B", "C", "D", "", ""],
  start: 2,
  end: 6,
  exclude: IN_EX,
},
{
  name: "reverse full",
  array: ["D", "C", "B", "A"],
  start: 4,
  end: 0,
  exclude: EX_IN,
},
{
  name: "reverse drop first",
  array: ["", "D", "C", "B", "A"],
  start: 5,
  end: 1,
  exclude: EX_IN,
},
{
  name: "reverse drop last",
  array: ["D", "C", "B", "A", ""],
  start: 4,
  end: 0,
  exclude: EX_IN,
},
{
  name: "reverse drop both",
  array: ["", "", "D", "C", "B", "A", "", ""],
  start: 6,
  end: 2,
  exclude: EX_IN,
},
]

for (const tc of testCases) {
  describe(tc.name, () => {
    let a = La.from<string>([])
    let c = capture<string>()
    beforeEach(() => {
      if (tc.full) a = La.from([...tc.array])
      else a = La.from([...tc.array]).slice(tc.start, tc.end, tc.exclude)
      c = capture<string>()
      a.hear(c.ear)
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
        a.addAll(La.of("Z", "Y"), 0)
        expect([...a]).toStrictEqual(["Z", "Y", "A", "B", "C", "D"])
        expect(c.added()).toStrictEqual(["Z", "Y"])
        const event = c.captured()
        expect(event?.cleared).toStrictEqual(false)
        expect(event?.added?.count).toBe(2)
        expect(event?.added?.at).toBe(0)
      })
    })
    test("at", () => {
      expect(a.at(0)).toBe("A")
      expect(a.at(1)).toBe("B")
      expect(a.at(2)).toBe("C")
      expect(a.at(3)).toBe("D")
    })
    test("bounds", () => {
      expect(() => { a.at(-1) }).toThrow("invalid array index: -1")
      expect(() => { a.at(0.5) }).toThrow("invalid array index: 0.5")
      expect(() => { a.at(4) }).toThrow("index 4 >= size of 4")
      expect(() => { a.add("F", 17) }).toThrow("insertion index 17 > size of 4")
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
    test("findIndex", () => {
      expect(a.findIndex(x => x === "C")).toBe(2)
      expect(a.findIndex(x => x === "Z")).toBeUndefined()
    })
    test("first", () => { expect(a.first).toBe("A") })
    test("iterator", () => { expect([...a]).toStrictEqual(["A", "B", "C", "D"]) })
    test("last", () => { expect(a.last).toBe("D") })
    describe("remove", () => {
      test("no count", () => {
        expect(() => { a.remove(-1) }).toThrow("invalid array index: -1")
        a.remove(2)
        expect([...a]).toStrictEqual(["A", "B", "D"])
        expect(c.removed()).toStrictEqual(["C"])
        const event = c.captured()
        expect(event?.cleared).toStrictEqual(false)
        expect(event?.removed?.at).toBe(2)
        expect(event?.removed?.count).toBe(1)
      })
      test("with count", () => {
        expect(() => { a.remove(1, 5) }).toThrow("index 5 >= size of 4")
        a.remove(1, 2)
        expect([...a]).toStrictEqual(["A", "D"])
        expect(c.removed()).toStrictEqual(["B", "C"])
        const event = c.captured()
        expect(event?.cleared).toStrictEqual(false)
        expect(event?.removed?.at).toBe(1)
        expect(event?.removed?.count).toBe(2)
      })
      test("with predicate", () => {
        a.remove((x,i) => {
          if (i === 1) return true
          return false
        })
        expect([...a]).toStrictEqual(["A", "C", "D"])
        expect(c.removed()).toStrictEqual(["B"])
        const event = c.captured()
        expect(event?.cleared).toStrictEqual(false)
        expect(event?.removed?.at).toBe(1)
        expect(event?.removed?.count).toBe(1)
      })
    })
    test("slice", () => {
      const f = a.slice(1, 2, IN_IN)
      expect([...f]).toStrictEqual(["B", "C"])
      const r = a.slice(2, 1, IN_IN)
      expect([...r]).toStrictEqual(["C", "B"])
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
    test("reversed", () => {
      const r = a.reversed
      expect([...r]).toStrictEqual(["D", "C", "B", "A"])
      const f = r.reversed
      expect([...f]).toStrictEqual(["A", "B", "C", "D"])
    })
  })
}

describe("forward facade events", () => {
  let a = La.from([""])
  let s = La.from([""])
  let c = capture<string>()
  beforeEach(() => {
    a = La.from(["0", "1", "2", "3", "A", "B", "C", "D", "8", "9", "10", "11"])
    s = a.slice(4, 8)
    c = capture<string>()
    s.hear(c.ear)
    c.captured() // reset
  })
  test("clear", () => {
    a.clear()
    expect(s.size).toBe(0)
    expect(s.empty).toBe(true)
    const event = c.captured()
    expect(event?.cleared).toBe(true)
    expect(event?.removed).toBeUndefined()
    expect(event?.added).toBeUndefined()
  })
  test("add far", () => {
    a.add("000", 0)
    expect(c.captured()).toBeUndefined()
    a.add("Z")
    expect(c.captured()).toBeUndefined()
  })
  test("remove left and right", () => {
    a.remove(3, 6)
    expect([...a]).toStrictEqual(["0", "1", "2", "9", "10", "11"])
    expect(s.empty).toBe(true)
    expect([...s]).toStrictEqual([])
    expect(c.removed()).toStrictEqual([]) // ["A", "B", "C", "D"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(true)
    s.add("new")
    expect([...s]).toStrictEqual(["new"])
    expect([...a]).toStrictEqual(["0", "1", "2", "new", "9", "10", "11"])
  })
  test("remove left", () => {
    a.remove(2, 4)
    expect([...a]).toStrictEqual(["0", "1", "C", "D", "8", "9", "10", "11"])
    expect([...s]).toStrictEqual(["C", "D"])
    expect(s.size).toStrictEqual(2)
    expect(c.removed()).toStrictEqual(["A", "B"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toStrictEqual(0)
    expect(event?.removed?.count).toStrictEqual(2)
  })
  test("remove right", () => {
    a.remove(6, 4)
    expect([...a]).toStrictEqual(["0", "1", "2", "3", "A", "B", "10", "11"])
    expect([...s]).toStrictEqual(["A", "B"])
    expect(s.size).toStrictEqual(2)
    expect(c.removed()).toStrictEqual(["C", "D"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toStrictEqual(2)
    expect(event?.removed?.count).toStrictEqual(2)
  })
  test("remove inside", () => {
    a.remove(5, 2)
    expect([...a]).toStrictEqual(["0", "1", "2", "3", "A", "D", "8", "9", "10", "11"])
    expect([...s]).toStrictEqual(["A", "D"])
    expect(s.size).toStrictEqual(2)
    expect(c.removed()).toStrictEqual(["B", "C"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toStrictEqual(1)
    expect(event?.removed?.count).toStrictEqual(2)
  })
  test("remove far left", () => {
    a.remove(1, 3)
    expect([...a]).toStrictEqual(["0", "A", "B", "C", "D", "8", "9", "10", "11"])
    expect([...s]).toStrictEqual(["A", "B", "C", "D"])
    expect(s.size).toStrictEqual(4)
    expect(c.captured()).toBeUndefined()
  })
  test("remove far right", () => {
    a.remove(8, 3)
    expect([...a]).toStrictEqual(["0", "1", "2", "3", "A", "B", "C", "D", "11"])
    expect([...s]).toStrictEqual(["A", "B", "C", "D"])
    expect(s.size).toStrictEqual(4)
    expect(c.captured()).toBeUndefined()
  })
})

describe("reverse facade events", () => {
  let a = La.from([""])
  let s = La.from([""])
  let c = capture<string>()
  beforeEach(() => {
    a = La.from(["0", "1", "2", "3", "E", "D", "C", "B", "A", "8", "9", "10", "11"])
    s = a.slice(8, 4, IN_IN)
    c = capture<string>()
    s.hear(c.ear)
    c.captured() // reset
  })
  test("clear", () => {
    a.clear()
    expect(s.size).toBe(0)
    expect(s.empty).toBe(true)
    const event = c.captured()
    expect(event?.cleared).toBe(true)
    expect(event?.removed).toBeUndefined()
    expect(event?.added).toBeUndefined()
  })
  test("add far", () => {
    a.add("000", 0)
    expect(c.captured()).toBeUndefined()
    a.add("Z")
    expect(c.captured()).toBeUndefined()
  })
  test("remove left and right", () => {
    a.remove(3, 7)
    expect([...a]).toStrictEqual(["0", "1", "2", "9", "10", "11"])
    expect(s.empty).toBe(true)
    expect([...s]).toStrictEqual([])
    expect(c.removed()).toStrictEqual([]) // ["A", "B", "C", "D", "E"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(true)
    expect(event?.removed).toBeUndefined()
    s.add("new")
    expect([...a]).toStrictEqual(["0", "1", "2", "new", "9", "10", "11"])
    expect([...s]).toStrictEqual(["new"])
  })
  test("remove left", () => {
    a.remove(2, 5)
    expect([...a]).toStrictEqual(["0", "1", "B", "A", "8", "9", "10", "11"])
    expect([...s]).toStrictEqual(["A", "B"])
    expect(s.size).toStrictEqual(2)
    expect(c.removed()).toStrictEqual(["C", "D", "E"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toStrictEqual(2)
    expect(event?.removed?.count).toStrictEqual(3)
  })
  test("remove right", () => {
    a.remove(6, 4)
    expect([...a]).toStrictEqual(["0", "1", "2", "3", "E", "D", "9", "10", "11"])
    expect([...s]).toStrictEqual(["D", "E"])
    expect(s.size).toStrictEqual(2)
    expect(c.removed()).toStrictEqual(["A", "B", "C"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toStrictEqual(0)
    expect(event?.removed?.count).toStrictEqual(3)
  })
  test("remove inside", () => {
    a.remove(5, 3)
    expect([...a]).toStrictEqual(["0", "1", "2", "3", "E", "A", "8", "9", "10", "11"])
    expect([...s]).toStrictEqual(["A", "E"])
    expect(s.size).toStrictEqual(2)
    expect(c.removed()).toStrictEqual(["B", "C", "D"])
    const event = c.captured()
    expect(event?.cleared).toStrictEqual(false)
    expect(event?.removed?.at).toStrictEqual(1)
    expect(event?.removed?.count).toStrictEqual(3)
  })
  test("remove far left", () => {
    a.remove(1, 3)
    expect([...a]).toStrictEqual(["0", "E", "D", "C", "B", "A", "8", "9", "10", "11"])
    expect([...s]).toStrictEqual(["A", "B", "C", "D", "E"])
    expect(s.size).toStrictEqual(5)
    expect(c.captured()).toBeUndefined()
  })
  test("remove far right", () => {
    a.remove(10, 3)
    expect([...a]).toStrictEqual(["0", "1", "2", "3", "E", "D", "C", "B", "A", "8"])
    expect([...s]).toStrictEqual(["A", "B", "C", "D", "E"])
    expect(s.size).toStrictEqual(5)
    expect(c.captured()).toBeUndefined()
  })
})

describe("slice", () => {
  test("IN_IN", () => {
    const a = La.from(["a"])
    expect([...a.slice(0, 0, IN_IN)]).toStrictEqual(["a"])
    expect(() => { a.slice(0, 1, IN_IN) }).toThrow("array size is 1 so [0,1] is illegal.")
    expect(() => { a.slice(1, 0, IN_IN) }).toThrow("array size is 1 so [1,0] is illegal.")
    expect(() => { a.slice(0, -1, IN_IN) }).toThrow("array size is 1 so [0,-1] is illegal.")
  })
  test("IN_EX", () => {
    const a = La.from(["a"])
    expect([...a.slice(0, 1, IN_EX)]).toStrictEqual(["a"])
    expect(() => { a.slice(1, 0, IN_EX) }).toThrow("array size is 1 so [1,0) is illegal.")
    const s = a.slice(0, 0, IN_EX)
    expect([...s]).toStrictEqual([])
    s.addAll(["y", "z"])
    expect([...a]).toStrictEqual(["y", "z", "a"])
  })
  test("EX_IN", () => {
    const a = La.from(["a"])
    expect([...a.slice(1, 0, EX_IN)]).toStrictEqual(["a"])
    expect(() => { a.slice(0, 1, EX_IN) }).toThrow("array size is 1 so (0,1] is illegal.")
    const s = a.slice(0, 0, EX_IN)
    expect([...s]).toStrictEqual([])
    s.addAll(["y", "z"])
    expect([...a]).toStrictEqual(["a", "z", "y"])
  })
  test("EX_EX", () => {
    const a = La.from(["a", "b", "c"])
    expect(() => { a.slice(0, 0, EX_EX) }).toThrow("array size is 3 so (0,0) is illegal.")
    expect([...a.slice(0, 1, EX_EX)]).toStrictEqual(["b", "a"])
    expect([...a.slice(0, 2, EX_EX)]).toStrictEqual(["b"])
    expect([...a.slice(0, 3, EX_EX)]).toStrictEqual(["b", "c"])
    expect([...a.slice(2, 1, EX_EX)]).toStrictEqual(["b", "c"])
  })
})

test("from", () => {
  const set = new Set(["A", "B", "C"])
  const a = La.from(set)
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})

test("of", () => {
  const a = La.of("A", "B", "C")
  expect(a.size).toBe(3)
  expect([...a]).toStrictEqual(["A", "B", "C"])
})

test("ify", () => {
  const a1 = La.of("a", "b")
  const a2 = La.ify(a1)
  expect(a1 === a2).toBe(true)
  const a3 = La.ify([...a1])
  expect(a1 === a3).toBe(false)
})
