import { test, expect, describe, beforeEach } from "vitest"
import { Base, LEvent, Loud } from "loudo-ds-core"
import { BaseLa, BaseRemLa, BaseRoLa } from "./index"


class R extends BaseRoLa<number> {
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

describe("RoLa", () => {
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
    expect(() => { a.at(4) }).toThrow("4 is an invalid index for array of size 4")
    expect(() => { a.bounds(5, true) }).toThrow("5 is invalid insertion index for array of size 4")
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
  test("binarySearch", () => {
    expect(a.binarySearch(11, cmp)).toStrictEqual({ found:true, index: 0})
    expect(a.binarySearch(22, cmp)).toStrictEqual({ found:true, index: 1})
    expect(a.binarySearch(33, cmp)).toStrictEqual({ found:true, index: 2})
    expect(a.binarySearch(44, cmp)).toStrictEqual({ found:true, index: 3})
    expect(a.binarySearch(-1000, cmp)).toStrictEqual({ found:false, index: 0 })
    expect(a.binarySearch(1000, cmp)).toStrictEqual({ found:false, index: 4 })
  })
  test("lowerBound", () => {
    expect(a.lowerBound(30, cmp)).toBe(2)
  })
  test("upperBound", () => {
    expect(a.upperBound(30, cmp)).toBe(2)
  })
})


class M extends BaseLa<string> {

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

interface M extends Loud<string,number> {}


describe("BaseLa", () => {
  describe("drop", () => {
    test("start", () => {
      const a = new M(["z1", "z2", "z3", "A", "B"])
      a.drop(x => x.startsWith("z"))
      expect([...a]).toStrictEqual(["A", "B"])
    })
    test("end", () => {
      const a = new M(["A", "B", "z1", "z2", "z3"])
      a.drop(x => x.startsWith("z"))
      expect([...a]).toStrictEqual(["A", "B"])
    })
    test("middle", () => {
      const a = new M(["A", "z1", "z2", "z3", "B"])
      a.drop(x => x.startsWith("z"))
      expect([...a]).toStrictEqual(["A", "B"])
    })
    test("all", () => {
      const a = new M(["z1", "A", "z2", "B", "z3"])
      a.drop(x => x.startsWith("z"))
      expect([...a]).toStrictEqual(["A", "B"])
    })
    test("clear", () => {
      const a = new M(["z1", "A", "z2", "B", "z3"])
      a.drop(() => true)
      expect([...a]).toStrictEqual([])
    })
  })
  test("firstIndex", () => {
    expect(new M([]).firstIndex).toBe(0)
  })
  test("sort", () => {
    const a = new M(["C", "A", "B", "E", "D"])
    a.sort((a,b) => a.localeCompare(b))
    expect([...a]).toStrictEqual(["A", "B", "C", "D", "E"])
  })
})

