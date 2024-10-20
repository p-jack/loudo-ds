import { afterEach, test, expect, describe, beforeEach } from "vitest"
import { BigIterable, DataStructure, LEvent, embiggen } from "."


test("embiggen", () => {
  const big = embiggen([1, 2, 3, 4, 5])
  expect([...big.filter(x => x % 2 === 0)]).toStrictEqual([2, 4])
  expect([...big.map(x => x * 2)]).toStrictEqual([2, 4, 6, 8, 10])
  expect(big.reduce(0, (a,x) => a+x)).toBe(15)
})

test("wrap", () => {
  const ds = DataStructure.from([1, 2, 3])
  expect([...ds]).toStrictEqual([1, 2, 3])
  expect(ds.size).toBe(3)
  expect(ds.empty).toBe(false)
  let captured:LEvent<number,undefined>|undefined
  let count = 0
  let ear = (event:LEvent<number,undefined>) => {
    captured = event
    count++
  }
  ds.hear(ear)
  expect(captured?.cleared).toStrictEqual(false)
  expect(captured?.added?.at).toBeUndefined()
  expect(captured?.added?.count).toBe(3)
  expect(captured?.removed).toBeUndefined()
  const a = [...(captured?.added?.elements ?? [])]
  expect(a).toStrictEqual([1, 2, 3])
  expect(ds.hearing(ear)).toBe(true)
  ds.unhear(ear)
  expect(ds.hearing(ear)).toBe(false)
  expect([...ds.filter(x => x % 2 === 1)]).toStrictEqual([1, 3])
  expect([...ds.map(x => x * 2)]).toStrictEqual([2, 4, 6])
  expect(ds.reduce(0, (a,x) => a + x)).toStrictEqual(6)
  expect(ds.toJSON()).toStrictEqual([1, 2, 3])
})