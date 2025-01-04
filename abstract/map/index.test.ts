import { test, expect, describe, beforeEach } from "vitest"
import { BaseMap, MapChange, MapRemove } from "./index"
import { mixin } from "loudo-mixin"

class Nums {
  constructor(readonly limit = 5) {}
  get size() { return this.limit }
  get(key:number):string|undefined {
    if (key < 0 || key >= this.size) return undefined
    return String(key)
  }
  *[Symbol.iterator]() {
    for (let i = 0; i < this.size; i++) {
      yield { key:i, value:String(i) }
    }
  }
  get keyEq():(n1:number,n2:number)=>boolean { return Object.is }
  get valueEq():(s1:string,s2:string)=>boolean { return Object.is }
}
interface Nums extends BaseMap<number,string> {}
mixin(Nums, [BaseMap])

describe("BaseMap", () => {
  let map = new Nums(3)
  beforeEach(() => { 
    map = new Nums(3)
  })
  test("eq", () => {
    expect(map.eq({ key:1, value:"1"}, { key:1, value:"1" })).toBe(true)
    expect(map.eq({ key:1, value:"1"}, { key:1, value:"2" })).toBe(false)
    expect(map.eq({ key:1, value:"1"}, { key:2, value:"1" })).toBe(false)
  })
  test("hasKey", () => {
    expect(map.hasKey(-1)).toBe(false)
    expect(map.hasKey(0)).toBe(true)
    expect(map.hasKey(1)).toBe(true)
    expect(map.hasKey(2)).toBe(true)
    expect(map.hasKey(3)).toBe(false)
  })
  test("hasAllKeys", () => {
    expect(map.hasAllKeys([0, 2])).toBe(true)
    expect(map.hasAllKeys([5, 2])).toBe(false)
  })
  test("keys", () => {
    expect([...map.keys]).toStrictEqual([0, 1, 2])
    expect([...map.keys]).toStrictEqual([0, 1, 2])
  })
  test("values", () => {
    expect([...map.values]).toStrictEqual(["0", "1", "2"])
    expect([...map.values]).toStrictEqual(["0", "1", "2"])
  })
})


class TestMap {

  readonly m = new Map<string,number>()

  get keyEq():(n1:string,n2:string)=>boolean { return Object.is }
  get valueEq():(s1:number,s2:number)=>boolean { return Object.is }
  get size() { return this.m.size }
  *[Symbol.iterator]() {
    for (const x of this.m) {
      yield({ key:x[0], value:x[1] })
    }
  }
  get(key:string) {
    return this.m.get(key)
  }
  put(key:string, value:number) {
    const r = this.m.get(key)
    this.m.set(key, value)
    return r
  }
  removeKey(key:string) {
    const r = this.m.get(key)
    if (r) this.m.delete(key)
    return r
  }
}
interface TestMap extends MapChange<string,number>, MapRemove<string,number> {}
mixin(TestMap, [MapChange, MapRemove])

describe("MapChange", () => {
  describe("putAll", () => {
    test("native map", () => {
      const map = new Map<string,number>()
      map.set("11", 11)
      map.set("22", 22)
      map.set("33", 33)
      const m = new TestMap()
      m.putAll(map)
      expect([...m.keys]).toStrictEqual(["11", "22", "33"])
      expect([...m.values]).toStrictEqual([11, 22, 33])
    })
    test("iterable of entries", () => {
      const a1 = [{ key:"11", value:11 }, { key:"22", value:22 }, { key:"33", value:33 }]
      const m = new TestMap()
      m.putAll(a1)
      expect([...m.keys]).toStrictEqual(["11", "22", "33"])
      expect([...m.values]).toStrictEqual([11, 22, 33])
    })
    test("iterable of tuples", () => {
      const m = new TestMap()
      m.putAll([["11", 11], ["22", 22], ["33", 33]])
      expect([...m.keys]).toStrictEqual(["11", "22", "33"])
      expect([...m.values]).toStrictEqual([11, 22, 33])
    })
    test("object record", () => {
      const m = new TestMap()
      m.putAll({
        "11": 11,
        "22": 22,
        "33": 33,
      })
      expect([...m.keys]).toStrictEqual(["11", "22", "33"])
      expect([...m.values]).toStrictEqual([11, 22, 33])
    })
  })
  test("drop", () => {
    const m = new TestMap()
    m.putAll({"11":11, "22":22, "33":33, "44":44, "55":55})
    expect(m.drop((k,v) => k === "22" || v % 2 === 0)).toBe(2)
    expect([...m.keys]).toStrictEqual(["11", "33", "55"])
  })
})