import { test, expect, describe } from "vitest"
import { DataStructure, LEvent, toDataStructure } from "./index"

const to = toDataStructure

describe("RODataStructure", () => {
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


// const A1Sym = Symbol("A1Sym")
// const BSym = Symbol("BSym")

// class Root {
//   readonly root = "root"
//   static staticRoot() { return "staticRoot"}
// }

// class A extends Root {
//   readonly A = "A"
// }

// class A1 extends A {
//   readonly A1 = "A1";
//   readonly [A1Sym] = "A1Sym"
//   static staticA1() { return "staticA1" }
// }

// abstract class A1a extends A1 {
//   readonly A1a = "A1a"
//   abstract abstractA1a():string
// }

// class B extends Root {
//   readonly B = "B";
//   [BSym] = "BSym"
//   static staticB() { return "staticB" }
// }

// abstract class B1<T> extends B {
//   readonly B1 = "B1"
//   abstract abstractB1(x:T):T
//   static staticB1() { return "staticB1" }
// }

// class C extends Root {}

// class D extends Root {}

// interface Z<T> extends A1a, B1<T> {}
// class Z<T> extends mixin(B1, A1a, B, C, D) {
//   abstractA1a() { return "ABC" }
//   abstractB1(x:T) { return x }
//   readonly C = "C"
//   x:number
//   constructor() { 
//     super()
//     this.x = 1000
//   }
//   static staticZ() { return "staticZ" }
// }

// type t = ReturnType<typeof mixin>

// function getSuper(c:new(...args:any[])=>any) {
//   return Object.getPrototypeOf(c.prototype).constructor
// }

// test("mixin", () => {
//   expect(Z.staticRoot()).toBe("staticRoot")
//   expect(Z.staticA1()).toBe("staticA1")
//   expect(Z.staticB()).toBe("staticB")
//   console.log(getSuper(Z))
// //  expect(Z.staticB1()).toBe("staticB")
//   expect(Z.staticZ()).toBe("staticZ")
//   const x = new Z<number>()
//   expect(x.root).toBe("root")
//   expect(x.A).toBe("A")
//   expect(x.A1).toBe("A1")
//   expect(x[A1Sym]).toBe("A1Sym")
//   expect(x.A1a).toBe("A1a")
//   expect(x.B).toBe("B")
//   expect(x[BSym]).toBe("BSym")
//   expect(x.B1).toBe("B1")
//   expect(x.abstractA1a()).toBe("ABC")
//   expect(x.abstractB1(55)).toBe(55)
//   expect(x.C).toBe("C")
//   expect(x.x).toBe(1000)
//   expect(Object.getPrototypeOf(A1) === A).toBe(true)
//   const root = getSuper(getSuper(Z))
//   expect(root === Root).toBe(true)
//   expect(x instanceof Z).toBe(true)
//   expect(x instanceof Root).toBe(true)
// })

// type Class<I extends {}, S extends {}, A extends any[]> 
//  = (abstract new(...args:A)=>I)&S

// class Concrete {
//   constructor() {}
//   concreteMethod() { return 100 }
//   static staticMethod() { return 500 }
// }

// function staticPart<S extends {}>(cls:Class<any,S,any>):S {
//   return cls
// }

// staticPart(Concrete).staticMethod()

// abstract class Abstract {
//   abstract abstractMethod():number;
//   static staticMethod() { return 500 }
// }

// staticPart(Abstract).staticMethod()
