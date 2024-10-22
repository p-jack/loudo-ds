import { test, expect, describe } from "vitest"
import { DataStructure, LEvent, big } from "."


class A extends DataStructure<number> {

  constructor(private readonly a:number[] = []) { super() }
  get firstIndex() { return undefined }
  get size() { return this.a.length }
  [Symbol.iterator]() { return this.a[Symbol.iterator]() }

}

describe("DataStructure", () => {
  test("empty", () => {
    const ds0 = new A([])
    expect(ds0.empty).toStrictEqual(true)
    const ds1 = new A([11])
    expect(ds1.empty).toStrictEqual(false)
    const ds3 = new A([11, 22, 33])
    expect(ds3.empty).toStrictEqual(false)
  })
  test("filter", () => {
    const ds = new A([1, 2, 3, 4, 5, 6])
    expect([...ds.filter(x => x % 2 == 0)]).toStrictEqual([2, 4, 6])
  })
  test("map", () => {
    const ds = new A([1, 2, 3])
    expect([...ds.map(x => x * 2)]).toStrictEqual([2, 4, 6])
  })
  test("reduce", () => {
    const ds = new A([1, 2, 3])
    expect(ds.reduce(0, (a,x) => a + x)).toStrictEqual(6)
  })
  test("toJSON", () => {
    const ds = new A([1, 2, 3])
    expect(ds.toJSON()).toStrictEqual([1, 2, 3])
  })
  test("toString", () => {
    const ds = new A([1, 2, 3])
    expect(ds.toString()).toStrictEqual("[1,2,3]")
  })
  describe("hear", () => {
    test("no existing elements", () => {
      const ds = new A([])
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
      const ds = new A([1, 2, 3])
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



test("big", () => {
  const b = big([1, 2, 3, 4, 5])
  expect([...b.filter(x => x % 2 === 0)]).toStrictEqual([2, 4])
  expect([...b.map(x => x * 2)]).toStrictEqual([2, 4, 6, 8, 10])
  expect(b.reduce(0, (a,x) => a+x)).toBe(15)
})

