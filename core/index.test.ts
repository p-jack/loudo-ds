import { test, expect, describe } from "vitest"
import { Tin, Loud, LEvent, mixed, mixin, overwrite, tin } from "./index"

describe("Tin", () => {
  test("empty", () => {
    const ds0 = tin([])
    expect(ds0.empty).toStrictEqual(true)
    const ds1 = tin([11])
    expect(ds1.empty).toStrictEqual(false)
    const ds3 = tin([11, 22, 33])
    expect(ds3.empty).toStrictEqual(false)
  })
  test("eq", () => {
    const ds0 = tin<number>([])
    expect(ds0.eq === Object.is).toBe(true)
    expect(ds0.eq(1, 1)).toBe(true)
  })
  test("forEach", () => {
    const ds = tin([1, 2, 3, 4, 5])
    let sum = 0
    ds.forEach(x => sum += x)
    expect(sum).toBe(15)
  })
  test("filter", () => {
    const ds = tin([1, 2, 3, 4, 5, 6])
    const f = ds.filter(x => x % 2 == 0)
    expect([...f]).toStrictEqual([2, 4, 6])
    expect(f.has(4)).toBe(true)
    expect(f.size).toBe(3)
  })
  test("first", () => {
    expect(tin([]).first).toBeUndefined()
    expect(tin([11]).first).toBe(11)
    expect(tin([111, 222, 333]).first).toBe(111)
  })
  test("has", () => {
    const ds = tin([11, 22, 33])
    expect(ds.has(11)).toStrictEqual(true)
    expect(ds.has(22)).toStrictEqual(true)
    expect(ds.has(33)).toStrictEqual(true)
    expect(ds.has(44)).toStrictEqual(false)
  })
  test("last", () => {
    expect(tin([]).last).toBeUndefined()
    expect(tin([11]).last).toBe(11)
    expect(tin([111, 222, 333]).last).toBe(333)
  })
  test("map", () => {
    const ds = tin([1, 2, 3])
    const m = ds.map(x => x * 2)
    expect([...m]).toStrictEqual([2, 4, 6])
    expect(m.has(6)).toBe(true)
    expect(m.size).toBe(3)
  })
  describe("only", () => {
    test("zero", () => {
      expect(() => { tin([]).only }).toThrowError()
    })
    test("one", () => {
      expect(tin([1111]).only).toBe(1111)
    })
    test("many", () => {
      expect(() => { tin([1111, 2222, 3333]).only }).toThrowError()
    })
  })
  test("reduce", () => {
    const ds = tin([1, 2, 3])
    expect(ds.reduce(0, (a,x) => a + x)).toStrictEqual(6)
  })
  test("size", () => {
    expect(tin([]).size).toBe(0)
    expect(tin([11]).size).toBe(1)
    expect(tin([11, 22, 33]).size).toBe(3)    
  })
  test("toJSON", () => {
    const ds = tin([1, 2, 3])
    expect(ds.toJSON()).toStrictEqual([1, 2, 3])
  })
  test("toString", () => {
    const ds = tin([1, 2, 3])
    expect(ds.toString()).toStrictEqual("[1,2,3]")
  })
})

class Arr {
  constructor(private readonly a:number[] = []) { }
  get size() { return this.a.length }
  [Symbol.iterator]() { return this.a[Symbol.iterator]() }
}
interface Arr extends Loud<number,undefined> {}
mixin(Arr, [Loud])

describe("Loud", () => {
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
  const over = Symbol("over")
  class Z {
    over() { return "Z" }
    [over]() { return "Z" }
  }
  abstract class A {
    get field() { return "abc" }
    method() { return "xyz" }
    get [field]() { return "abc" }
    [method]() { return "xyz" }
    [over]() { return "abc" }
    private p:string|undefined
    get p2() { if (this.p === undefined) this.p = "123"; return this.p }
    over() { return "A" }
  }
  const z = new Z()
  const o:object = z
  expect(mixed(z, A)).toBe(false)
  interface Z extends A {}
  mixin(Z, [A])
  expect(mixed(o, A)).toBe(true)
  expect(z.field).toBe("abc")
  expect(z.method()).toBe("xyz")
  expect(z[field]).toBe("abc")
  expect(z[method]()).toBe("xyz")
  expect(z.p2).toBe("123")
  expect(z.over()).toBe("Z")
  expect(z[over]()).toBe("Z")
  abstract class B {
    b() { return "b" }
  }
  mixin(A, [B])
  interface A extends B {}
  expect(z.b()).toBe("b")
  expect(mixed(o, B)).toBe(true)

  class Tin<T extends {}> {}
  class RoA<T extends {}> {}
  interface RoA<T extends {}> extends Tin<T> {}
  mixin(RoA, [Tin])
  class BaseA<T extends {}> {}
  interface BaseA<T extends {}> extends RoA<T> {}
  mixin(BaseA, [RoA])
  const x = new BaseA()
  expect(mixed(x, Tin)).toBe(true)
})

test("overwrite", () => {
  const over = Symbol("over")
  class A {
    count = 0
    baz(n:number, b:string):string {
      return b + ":" + (n + this.count)
    }
    notOverwritten = "notOverwritten"
    notOverwritten2() { return "notOverwritten2" }
    [over]() { return "not overwritten3" }
  }
  abstract class B {
    count = 5
    baz(original:(n:number,b:string)=>string, n:number, b:string) {
      return original.call(this, n + 1, b)
    }
    notOverwritten() {}
    [over]() {}
  }
  const o = new A()
  o.count = 5
  expect(o.baz(1, "A")).toBe("A:6")
  overwrite(A, B)
  expect(o.baz(1, "A")).toBe("A:7")
  expect(o.notOverwritten).toBe("notOverwritten")
  abstract class C {
    get notOverwritten2() { return "overwritten" }
    baz(original:(n:number,b:string)=>string, n:number, b:string) {
      return original.call(this, n, b) + "-C"
    }
    [over]() {}
  }
  overwrite(A, C)
  expect(o.baz(1, "A")).toBe("A:7-C")
  expect(o.notOverwritten2()).toBe("notOverwritten2")
  expect(o[over]()).toBe("not overwritten3")
})


class N extends Tin<number> {
  get size() { return 5 }
  *[Symbol.iterator]() {
    for (let i = 0; i < 5; i++) yield (i + 1) * 11
  }
}

test("default eq", () => {
  expect(new N().eq === Object.is).toBe(true)
})