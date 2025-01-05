import { Loud } from "loudo-ds-core"
import { mixin } from "loudo-mixin"
import { expect, test } from "vitest"
import { capture } from "./index"

class Empty<T extends {}> {
  *[Symbol.iterator]():Iterator<T> { }
}
interface Empty<T extends {}> extends Loud<T,undefined> {}
mixin(Empty, [Loud])

class Foo<T extends {},I> {
  constructor(private _value:T, private _first:I) {}
  *[Symbol.iterator]() { yield this._value }
  get firstIndex() { return this._first }
  get value() { return this._value }
  set value(v:T) {
    const old = this._value
    this._value = v
    this.fire({
      cleared:false, 
      removed:{ elements:new Foo(old, this._first), at:this._first },
      added:{ elements:this, at:this._first },
    })
  }
  bad() { this.fire({
    cleared:false,
    added:{ elements: new Empty<T>(), at:this.firstIndex },
  })}
}
interface Foo<T extends {},I> extends Loud<T,I> {}
mixin(Foo, [Loud])

test("capture", () => {
  const foo = new Foo("1", 0)
  const c = capture(foo)
  expect(c.get()).toStrictEqual({
    cleared: false,
    added: { elements:["1"], at:0 },
  })
  expect(c.get()).toBeUndefined()
  foo.value = "2"
  expect(c.get()).toStrictEqual({
    cleared: false,
    removed: { elements:["1"], at:0 },
    added: { elements:["2"], at:0 },
  })
  expect(c.get()).toBeUndefined()
  foo.bad()
  expect(() => { c.get() }).toThrowError()
  expect(c.get()).toBeUndefined()
})

test("no index", () => {
  const foo = new Foo("1", undefined)
  const c = capture(foo)
  expect(c.get()).toStrictEqual({
    cleared: false,
    added: { elements:["1"] },
  })
})

test("entries", () => {
  const foo = new Foo({ key:"1", value:1, extra:"ignored" }, undefined)
  const c = capture(foo)
  expect(c.get()).toStrictEqual({
    cleared: false,
    added: { elements:[{ key:"1", value:1 }] },
  })
})