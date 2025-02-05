import { test, expect, describe, beforeEach } from "vitest"
import { LEvent, Sized, Stash } from "loudo-ds-core"
import { AAdd, BaseA, ARemove, AChange } from "./index"
import { mixed, mixin } from "../../mixin"

class R {
  constructor(public readonly count:number) {}
  get size() { return this.count }
  protected get config() { return {} }
  raw(i:number) { return (i + 1) * 11 }
}
interface R extends BaseA<number> {}
mixin(R, [BaseA])

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

describe("BaseA", () => {
  let a = new R(4)
  let c = capture<number>()
  beforeEach(() => {
    a = new R(4)
  })
  test("at", () => {
    expect(a.at(0)).toBe(11)
    expect(a.at(1)).toBe(22)
    expect(a.at(2)).toBe(33)
    expect(a.at(3)).toBe(44)
    expect(() => { a.at(-1) }).toThrow("negative array index: -1")
    expect(() => { a.at(0.5) }).toThrow("invalid array index: 0.5")
    expect(() => { a.at(4) }).toThrow("index 4 >= size 4")
  })
  test("equals", () => {
    expect(a.equals([11, 22, 33, 44])).toBe(true)
    expect(a.equals([11, 2, 33, 44])).toBe(false)
    expect(a.equals(new R(4))).toBe(true)
    expect(a.equals([])).toBe(false)
    expect(a.equals([11, 22, 33, 44, 55])).toBe(false)
    expect(a.equals([11, 22, 33])).toBe(false)
  })
  test("findIndex", () => {
    expect(a.findIndex(x => x === 33)).toBe(2)
    expect(a.findIndex(x => x === 1111)).toBeUndefined()
  })
  test("findLastIndex", () => {
    expect(a.findLastIndex(x => x === 33)).toBe(2)
    expect(a.findLastIndex(x => x === 1111)).toBeUndefined()
  })
  test("first", () => {
    expect(a.first).toBe(11)
    expect(new R(0).first).toBeUndefined()
  })
  test("iterator", () => { expect([...a]).toStrictEqual([11, 22, 33, 44]) })
  test("last", () => {
    expect(a.last).toBe(44)
    expect(new R(0).last).toBeUndefined()
  })
  test("only", () => {
    expect(() => { a.only }).toThrowError()
    const a0 = new R(0)
    expect(() => { a0.only }).toThrowError()
    const a1 = new R(1)
    expect(a1.only).toBe(11)
  })
  test("reversed", () => {
    const r = a.reversed()
    expect([...r]).toStrictEqual([44, 33, 22, 11])
    expect([...r]).toStrictEqual([44, 33, 22, 11])
  })
  test("slice", () => {
    expect([...a.slice(0)]).toStrictEqual([11, 22, 33, 44])
    expect([...a.slice(1)]).toStrictEqual([22, 33, 44])
    expect([...a.slice(2, 3)]).toStrictEqual([33])
    expect([...a.slice(2, 2)]).toStrictEqual([])
    expect(() => { [...a.slice(-1)] }).toThrowError()
    expect(() => { [...a.slice(0, 5)] }).toThrowError()
    expect(() => { [...a.slice(2, 1)] }).toThrowError()
  })
})


class M {

  constructor(readonly a:string[]) {}

  get size(): number {
    return this.a.length
  }

  protected raw(i:number):string {
    return this.a[i]
  }

  get(i:number):string|undefined {
    if (!Number.isSafeInteger(i) || i < 0 || i >= this.size) return undefined
    return this.a[i]
  }

  set(i:number, v:string) {
    this.bounds(i)
    this.a[i] = v
  }

  removeAt(i:number) {
    this.bounds(i)
    return this.a.splice(i, 1)[0]
  }

  add(v:string, i?:number) {
    i = i ?? this.size
    this.bounds(i, true)
    this.a.splice(i, 0, v)
  }

  clear() {
    throw new Error("not needed for unit testing")
  }

}
interface M extends AAdd<string>, ARemove<string>, AChange<string> {}
mixin(M, [BaseA, AAdd, ARemove, AChange])

describe("RemoveA", () => {
  describe("drop", () => {
    describe("by value", () => {
      test("start", () => {
        const a = new M(["z1", "z2", "z3", "A", "B"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("end", () => {
        const a = new M(["A", "B", "z1", "z2", "z3"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("middle", () => {
        const a = new M(["A", "z1", "z2", "z3", "B"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("all", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop(x => x.startsWith("z"))).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("clear", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop(() => true)).toBe(5)
        expect([...a]).toStrictEqual([])
      })
    })
    describe("by index", () => {
      test("start", () => {
        const a = new M(["z1", "z2", "z3", "A", "B"])
        expect(a.drop((_,i) => i < 3)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("end", () => {
        const a = new M(["A", "B", "z1", "z2", "z3"])
        expect(a.drop((_,i) => i >= 2)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("middle", () => {
        const a = new M(["A", "z1", "z2", "z3", "B"])
        expect(a.drop((_,i) => i >= 1 && i <= 3)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("all", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop((_,i) => i === 0 || i === 2 || i === 4)).toBe(3)
        expect([...a]).toStrictEqual(["A", "B"])
      })
      test("clear", () => {
        const a = new M(["z1", "A", "z2", "B", "z3"])
        expect(a.drop(() => true)).toBe(5)
        expect([...a]).toStrictEqual([])
      })
    })
  })
})

describe("SetA", () => {
  test("reverse", () => {
    const m = new M(["A", "B", "C", "D"])
    const c = capture<string>()
    m.hear(c.ear)
    c.captured()
    m.reverse()
    expect([...m]).toStrictEqual(["D", "C", "B", "A"])
    expect(c.added()).toStrictEqual(["D", "C", "B", "A"])
    const event = c.captured()
    expect(event?.cleared).toBe(true)
    expect(event?.added?.at).toBe(0)
  })
})

describe("AddA", () => {
  describe("addAll", () => {
    test("no index", () => {
      const m = new M([])
      m.addAll(["A", "B", "C"])
      expect([...m]).toStrictEqual(["A", "B", "C"])
    })
    test("with index", () => {
      const m = new M(["A", "B", "C"])
      m.addAll(["a", "b", "c"], 1)
      expect([...m]).toStrictEqual(["A", "a", "b", "c", "B", "C"])
    })
    test("invalid index", () => {
      const m = new M(["A", "B", "C"])
      expect(() => { m.addAll(["a", "b", "c"], 4) }).toThrow("index 4 > size 3")
    })
  })
})

// test("mixins", () => {
//   const r = new R(4)
//   expect(mixed(r, BaseA)).toBe(true)
//   expect(mixed(r, Sized)).toBe(true)
//   expect(mixed(r, Stash)).toBe(true)
//   const m = new M(["11", "22"])
//   expect(mixed(m, AAdd)).toBe(true)
//   expect(mixed(m, ARemove)).toBe(true)
//   expect(mixed(m, AChange)).toBe(true)
//   expect(mixed(m, BaseA)).toBe(true)
//   expect(mixed(m, Stash)).toBe(true)
// })

describe("firstIndex", () => {
  test("AAdd", () => {
    class A {}
    interface A extends AAdd<string> {}
    mixin(A, [AAdd])
    const a = new A()
    expect(a.firstIndex).toBe(0)
  })
  test("AChange", () => {
    class C {}
    interface C extends AChange<string> {}
    mixin(C, [AChange])
    const c = new C()
    expect(c.firstIndex).toBe(0)
  })
  test("ARemove", () => {
    class R {}
    interface R extends ARemove<string> {}
    mixin(R, [ARemove])
    const r = new R()
    expect(r.firstIndex).toBe(0)
  })
})