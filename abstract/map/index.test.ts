import { afterEach, test, expect, describe, beforeEach } from "vitest"
import { BaseMap } from "."
import { mixin } from "loudo-ds-core"


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
}
interface Nums extends BaseMap<number,string> {}
mixin(Nums, [BaseMap])

describe("BaseMap", () => {
  let map = new Nums(3)
  beforeEach(() => { 
    map = new Nums(3)
  })
  test("hasKey", () => {
    expect(map.hasKey(-1)).toBe(false)
    expect(map.hasKey(0)).toBe(true)
    expect(map.hasKey(1)).toBe(true)
    expect(map.hasKey(2)).toBe(true)
    expect(map.hasKey(3)).toBe(false)
  })
  test("keys", () => {
    expect([...map.keys]).toStrictEqual([0, 1, 2])
  })
  test("values", () => {
    expect([...map.values]).toStrictEqual(["0", "1", "2"])
  })
})
