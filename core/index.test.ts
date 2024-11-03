import { test, expect, describe } from "vitest"
import { Base, BaseLoud, DataStructure, LEvent, mixed, mixin, toDataStructure } from "./index"

const to = toDataStructure

describe("Base", () => {
  test("empty", () => {
    const ds0 = to([])
    expect(ds0.empty).toStrictEqual(true)
    const ds1 = to([11])
    expect(ds1.empty).toStrictEqual(false)
    const ds3 = to([11, 22, 33])
    expect(ds3.empty).toStrictEqual(false)
  })
  test("forEach", () => {
    const ds = to([1, 2, 3, 4, 5])
    let sum = 0
    ds.forEach(x => sum += x)
    expect(sum).toBe(15)
  })
  test("filter", () => {
    const ds = to([1, 2, 3, 4, 5, 6])
    expect([...ds.filter(x => x % 2 == 0)]).toStrictEqual([2, 4, 6])
  })
  test("first", () => {
    expect(to([]).first).toBeUndefined()
    expect(to([11]).first).toBe(11)
    expect(to([111, 222, 333]).first).toBe(111)
  })
  test("has", () => {
    const ds = to([11, 22, 33])
    expect(ds.has(11)).toStrictEqual(true)
    expect(ds.has(22)).toStrictEqual(true)
    expect(ds.has(33)).toStrictEqual(true)
    expect(ds.has(44)).toStrictEqual(false)
  })
  test("last", () => {
    expect(to([]).last).toBeUndefined()
    expect(to([11]).last).toBe(11)
    expect(to([111, 222, 333]).last).toBe(333)
  })
  test("map", () => {
    const ds = to([1, 2, 3])
    expect([...ds.map(x => x * 2)]).toStrictEqual([2, 4, 6])
  })
  test("reduce", () => {
    const ds = to([1, 2, 3])
    expect(ds.reduce(0, (a,x) => a + x)).toStrictEqual(6)
  })
  test("size", () => {
    expect(to([]).size).toBe(0)
    expect(to([11]).size).toBe(1)
    expect(to([11, 22, 33]).size).toBe(3)    
  })
  test("toJSON", () => {
    const ds = to([1, 2, 3])
    expect(ds.toJSON()).toStrictEqual([1, 2, 3])
  })
  test("toString", () => {
    const ds = to([1, 2, 3])
    expect(ds.toString()).toStrictEqual("[1,2,3]")
  })
})

class Arr extends Base<number> {
  constructor(private readonly a:number[] = []) { super({}) }
  [Symbol.iterator]() { return this.a[Symbol.iterator]() }
}
interface Arr extends BaseLoud<number,undefined> {}
mixin(Arr, [BaseLoud])

describe("BaseLoud", () => {
  describe("hear", () => {
    test("no existing elements", () => {
      const ds = new Arr([])
      let captured:LEvent<number>|undefined = undefined
      const ear = (event:LEvent<number>) => {
        captured = event
      }
      ds.hear(ear)
      expect(captured).toBeUndefined()
      expect(ds.hearing(ear)).toStrictEqual(true)
      ds.unhear(ear)
      expect(ds.hearing(ear)).toStrictEqual(false)
    })
    test("with existing elements", () => {
      const ds = new Arr([1, 2, 3])
      let captured:LEvent<number>|undefined = undefined
      const ear = (event:LEvent<number>) => {
        captured = event
      }
      ds.hear(ear)
      expect(captured).not.toBeUndefined()
      expect(captured!.cleared).toStrictEqual(false)
      expect(captured!.removed).toBeUndefined()
      expect(captured!.added).not.toBeUndefined()
      expect(captured!.added!.at).toBeUndefined()
      expect(captured!.added!.count).toBe(3)
      expect([...captured!.added!.elements]).toStrictEqual([1, 2, 3])
      expect(ds.hearing(ear)).toStrictEqual(true)
      ds.unhear(ear)
      expect(ds.hearing(ear)).toStrictEqual(false)
    })
  })
})

test("mixin", () => {
  const field = Symbol("field")
  const method = Symbol("method")
  class Z {
    over() { return "Z" }
  }
  interface AI {
    readonly field:string
    method():string
    [method]():string
    readonly [field]:string
    readonly p2:string|undefined
    over():string
  }
  abstract class A extends Z implements AI {
    get field() { return "abc" }
    method() { return "xyz" }
    get [field]() { return "abc" }
    [method]() { return "xyz" }
    private p:string|undefined
    get p2() { if (this.p === undefined) this.p = "123"; return this.p }
    over() { return "A" }
  }
  interface Z extends AI {}
  expect(mixed(Z, A)).toBe(false)
  mixin(Z, [A])
  expect(mixed(Z, A)).toBe(true)
  const z = new Z()
  expect(mixed(z, A)).toBe(true)
  expect(z.field).toBe("abc")
  expect(z.method()).toBe("xyz")
  expect(z[field]).toBe("abc")
  expect(z[method]()).toBe("xyz")
  expect(z.p2).toBe("123")
  expect(z.over()).toBe("Z")
})
