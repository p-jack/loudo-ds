import { test, expect, describe } from "vitest"
import { DataStructure, LEvent, toDataStructure } from "./index"

const to = toDataStructure

describe("RoDataStructure", () => {
  test("empty", () => {
    const ds0 = to([])
    expect(ds0.empty).toStrictEqual(true)
    const ds1 = to([11])
    expect(ds1.empty).toStrictEqual(false)
    const ds3 = to([11, 22, 33])
    expect(ds3.empty).toStrictEqual(false)
  })
  test("has", () => {
    const ds = to([11, 22, 33])
    expect(ds.has(11)).toStrictEqual(true)
    expect(ds.has(22)).toStrictEqual(true)
    expect(ds.has(33)).toStrictEqual(true)
    expect(ds.has(44)).toStrictEqual(false)
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

class Arr extends DataStructure<number> {
  constructor(private readonly a:number[] = []) { super() }
  [Symbol.iterator]() { return this.a[Symbol.iterator]() }
}

describe("DataStructure", () => {
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
  test("readOnly", () => {
    const a = [11, 22, 33]
    const ds = new Arr(a)
    const ro = ds.readOnly
    expect([...ro]).toStrictEqual([11, 22, 33])
    a.push(44)
    expect([...ro]).toStrictEqual([11, 22, 33, 44])
  })
})
