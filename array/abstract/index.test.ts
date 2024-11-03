import { test, expect, describe, beforeEach } from "vitest"
import { LEvent } from "loudo-ds-core"
import { BaseA, BaseRoA } from "./index"


class R extends BaseRoA<number> {
  constructor(public readonly count:number) { super({}) }
  get size() { return this.count }
  override at(i:number) {
    this.bounds(i)
    return (i + 1) * 11
  }
  public bounds(i:number, extra?:boolean) {
    super.bounds(i, extra)
  }
}

const cmp = (a:number, b:number) => a - b

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
  })
  test("bounds", () => {
    expect(() => { a.at(-1) }).toThrow("negative array index: -1")
    expect(() => { a.at(0.5) }).toThrow("invalid array index: 0.5")
    expect(() => { a.at(4) }).toThrow("index 4 >= size 4")
    expect(() => { a.bounds(5, true) }).toThrow("index 5 > size 4")
  })
  test("findIndex", () => {
    expect(a.findIndex(x => x === 33)).toBe(2)
    expect(a.findIndex(x => x === 1111)).toBeUndefined()
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
})


class M extends BaseA<string> {

  constructor(readonly a:string[]) { super({}) }

  get size(): number {
    return this.a.length
  }

  override at(i:number):string {
    this.bounds(i)
    return this.a[i]
  }

  override set(i:number, v:string) {
    this.bounds(i)
    this.a[i] = v
  }

  remove(i:number, count?:number) {
    count = count ?? 1
    this.a.splice(i, count)
  }

  override add(v:string, i?:number) {
    throw new Error("not needed for unit testing")
  }

  override addAll(v: Iterable<string>, i?:number) {
    throw new Error("not needed for unit testing")
  }

  override clear() {
    throw new Error("not needed for unit testing")
  }

}

describe("BaseA", () => {
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
  test("firstIndex", () => {
    expect(new M([]).firstIndex).toBe(0)
  })
  test("reverse", () => {
    const m = new M(["A", "B", "C", "D"])
    m.reverse()
    expect([...m]).toStrictEqual(["D", "C", "B", "A"])
  })
})

