import { test, expect, describe, beforeEach } from "vitest"
import { RoNMap, NMap } from "./index"
import { LEvent } from "loudo-ds-core"
import { Entry } from "loudo-ds-map-interfaces"

interface Capture<T extends {}> {
  captured():LEvent<T>|undefined
  added():T[]
  removed():T[]
  ear(event:LEvent<T>):void
}

function capture<T extends {}>():Capture<T> {
  let captured:LEvent<T>|undefined = undefined
  return {
    captured:() => { const r = captured; captured = undefined; return r },
    added:() => captured?.added ? [...captured.added.elements] : [],
    removed:() => captured?.removed ? [...captured.removed.elements] : [],
    ear(event:LEvent<T>) {
      captured = event
    }
  }
}


describe("RoNMap", () => {
  let m = new RoNMap(new Map<number,string>())
  beforeEach(() => {
    const map = new Map<number,string>()
    map.set(11, "11")
    map.set(22, "22")
    map.set(33, "33")
    m = new RoNMap(map)
  })
  test("constructor", () => {
    const m = new RoNMap<string,number>({
      "one":11,
      "two":22,
      "three":33,
    })
    expect(m.size).toBe(3)
    expect([...m.keys]).toStrictEqual(["one", "two", "three"])
    expect([...m.values]).toStrictEqual([11, 22, 33])
  })
  test("get", () => {
    expect(m.get(11)).toBe("11")
    expect(m.get(22)).toBe("22")
    expect(m.get(33)).toBe("33")
    expect(m.get(44)).toBeUndefined()
  })
  test("has", () => {
    expect(m.has({key:11, value:"11"})).toBe(true)
    expect(m.has({key:44, value:"44"})).toBe(false)
    expect(m.has({key:11, value:"22"})).toBe(false)
  })
  test("hasKey", () => {
    expect(m.hasKey(11)).toBe(true)
    expect(m.hasKey(22)).toBe(true)
    expect(m.hasKey(33)).toBe(true)
    expect(m.hasKey(44)).toBe(false)
  })
  test("iterator", () => {
    expect([...m]).toStrictEqual([{ key:11, value:"11" }, { key:22, value:"22" }, { key:33, value:"33" }])
  })
  test("keyEq", () => {
    expect(m.keyEq(11, 11)).toBe(true)
    expect(m.keyEq(11, 22)).toBe(false)
  })
  test("keys", () => {
    expect([...m.keys]).toStrictEqual([11, 22, 33])
  })
  test("size", () => {
    expect(m.size).toBe(3)
  })
  test("valueEq", () => {
    expect(m.valueEq("11", "11")).toBe(true)
    expect(m.valueEq("11", "22")).toBe(false)
  })
  test("values", () => {
    expect([...m.values]).toStrictEqual(["11", "22", "33"])
  })
})

describe("NMap", () => {
  let m = new NMap(new Map<number,string>())
  let c = capture<Entry<number,string>>()
  beforeEach(() => {
    const map = new Map<number,string>()
    map.set(11, "11")
    map.set(22, "22")
    map.set(33, "33")
    m = new NMap(map)
    c = capture()
    m.hear(c.ear)
    c.captured()
  })
  test("constructor", () => {
    const m = new NMap<string,number>({
      "one":11,
      "two":22,
      "three":33,
    })
    expect(m.size).toBe(3)
    expect([...m.keys]).toStrictEqual(["one", "two", "three"])
    expect([...m.values]).toStrictEqual([11, 22, 33])
  })
  test("put", () => {
    expect(m.put(44, "44")).toBeUndefined()
    expect(m.size).toBe(4)
    expect(c.added()).toStrictEqual([{ key:44, value:"44" }])
    const evt1 = c.captured()
    expect(evt1?.cleared).toBe(false)
    expect(evt1?.removed).toBeUndefined()
    expect(evt1?.added?.at).toBeUndefined()
    expect(evt1?.added?.count).toBe(1)
    expect(m.put(11, "eleven")).toBe("11")
    expect(m.size).toBe(4)
    expect(c.removed()).toStrictEqual([{ key:11, value:"11" }])
    expect(c.added()).toStrictEqual([{ key:11, value:"eleven" }])
    const evt2 = c.captured()
    expect(evt2?.cleared).toBe(false)
    expect(evt2?.removed?.at).toBeUndefined()
    expect(evt2?.removed?.count).toBe(1)
    expect(evt2?.added?.at).toBeUndefined()
    expect(evt2?.added?.count).toBe(1)
  })
  test("remove", () => {
    expect(m.removeKey(44)).toBeUndefined()
    expect(c.captured()).toBeUndefined()
    expect(m.size).toBe(3)
    expect(m.removeKey(11)).toBe("11")
    expect(m.size).toBe(2)
    expect(c.removed()).toStrictEqual([{ key:11, value:"11" }])
    const evt = c.captured()
    expect(evt?.cleared).toBe(false)
    expect(evt?.added).toBeUndefined()
    expect(evt?.removed?.at).toBeUndefined()
    expect(evt?.removed?.count).toBe(1)
  })
  test("clear", () => {
    m.clear()
    expect(c.added()).toStrictEqual([])
    expect(c.removed()).toStrictEqual([])
    expect(c.captured()?.cleared).toBe(true)
    m.clear()
    expect(c.captured()).toBeUndefined()
  })
})