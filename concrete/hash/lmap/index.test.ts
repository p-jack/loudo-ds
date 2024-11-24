import { test, expect, describe, beforeEach } from "vitest"
import { HashConfig, LMap } from "./index"
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

interface Conf extends HashConfig<number,string> {
  name: string
}

const config1:Conf = {
  name: "no collisions",
  hashCode(key) { return key }
}

const config2:Conf = {
  name: "collisions",
  hashCode(key) { return 1 }
}

function strip(a:Iterable<Entry<number,string>>) {
  return [...a].map(x => {return { key:x.key, value:x.value }})
}


for (const config of [config1, config2]) describe(config.name, () => {
  let m = new LMap(config)
  let c = capture<Entry<number,string>>()
  beforeEach(() => {
    const map = new Map<number,string>()
    m = new LMap(config)
    m.put(11, "11")
    m.put(22, "22")
    m.put(33, "33")
    c = capture()
    m.hear(c.ear)
    c.captured()
  })
  test("clear", () => {
    m.clear()
    expect(c.added()).toStrictEqual([])
    expect(c.removed()).toStrictEqual([])
    expect(c.captured()?.cleared).toBe(true)
    m.clear()
    expect(c.captured()).toBeUndefined()
    expect(m.first).toBeUndefined()
    expect(m.last).toBeUndefined()
  })
  test("first", () => {
    expect(m.first?.key).toBe(11)
    expect(m.first?.value).toBe("11")
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
    expect(strip(m)).toStrictEqual([{ key:11, value:"11" }, { key:22, value:"22" }, { key:33, value:"33" }])
  })
  test("keyEq", () => {
    expect(m.keyEq(11, 11)).toBe(true)
    expect(m.keyEq(11, 22)).toBe(false)
  })
  test("keys", () => {
    expect([...m.keys]).toStrictEqual([11, 22, 33])
  })
  test("last", () => {
    expect(m.last?.key).toBe(33)
    expect(m.last?.value).toBe("33")
  })
  test("only", () => {
    expect(() => { new LMap(config).only }).toThrowError()
    expect(() => m.only).toThrowError()
    const m = new LMap(config)
    m.put(1, "one")
    expect(strip([m.only])).toStrictEqual([{ key:1, value:"one" }])
  })
  test("put", () => {
    expect(m.put(44, "44")).toBeUndefined()
    expect(m.size).toBe(4)
    expect(strip(c.added())).toStrictEqual([{ key:44, value:"44" }])
    const evt1 = c.captured()
    expect(evt1?.cleared).toBe(false)
    expect(evt1?.removed).toBeUndefined()
    expect(evt1?.added?.at).toBeUndefined()
    expect(evt1?.added?.count).toBe(1)
    expect(m.put(11, "eleven")).toBe("11")
    expect(m.size).toBe(4)
    expect(strip(c.removed())).toStrictEqual([{ key:11, value:"11" }])
    expect(strip(c.added())).toStrictEqual([{ key:11, value:"eleven" }])
    const evt2 = c.captured()
    expect(evt2?.cleared).toBe(false)
    expect(evt2?.removed?.at).toBeUndefined()
    expect(evt2?.removed?.count).toBe(1)
    expect(evt2?.added?.at).toBeUndefined()
    expect(evt2?.added?.count).toBe(1)
  })
  describe("remove", () => {
    test("missing", () => {
      expect(m.remove(44)).toBeUndefined()
      expect(c.captured()).toBeUndefined()  
    })
    test("first", () => {
      expect(m.size).toBe(3)
      expect(m.remove(11)).toBe("11")
      expect(m.size).toBe(2)
      expect(strip(m)).toStrictEqual([{ key:22, value:"22" }, { key:33, value:"33" }])
      expect(strip(c.removed())).toStrictEqual([{ key:11, value:"11" }])
      const evt = c.captured()
      expect(evt?.cleared).toBe(false)
      expect(evt?.added).toBeUndefined()
      expect(evt?.removed?.at).toBeUndefined()
      expect(evt?.removed?.count).toBe(1)  
    })
    test("middle", () => {
      expect(m.size).toBe(3)
      expect(m.remove(22)).toBe("22")
      expect(m.size).toBe(2)
      expect(strip(m)).toStrictEqual([{ key:11, value:"11" }, { key:33, value:"33" }])
      expect(strip(c.removed())).toStrictEqual([{ key:22, value:"22" }])
      const evt = c.captured()
      expect(evt?.cleared).toBe(false)
      expect(evt?.added).toBeUndefined()
      expect(evt?.removed?.at).toBeUndefined()
      expect(evt?.removed?.count).toBe(1)  
    })
    test("last", () => {
      expect(m.size).toBe(3)
      expect(m.remove(33)).toBe("33")
      expect(m.size).toBe(2)
      expect(strip(m)).toStrictEqual([{ key:11, value:"11" }, { key:22, value:"22" }])
      expect(strip(c.removed())).toStrictEqual([{ key:33, value:"33" }])
      const evt = c.captured()
      expect(evt?.cleared).toBe(false)
      expect(evt?.added).toBeUndefined()
      expect(evt?.removed?.at).toBeUndefined()
      expect(evt?.removed?.count).toBe(1)  
    })
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