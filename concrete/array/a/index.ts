import { mixin, toTin, OnlyError, Config } from "loudo-ds-core"
import { AAdd, BaseA, ARemove, AChange } from "loudo-ds-array-interfaces";

export class RoA<T extends {}> {

  constructor(protected readonly a:ArrayLike<T>, protected readonly config:Config<T> = { eq:Object.is }) {}

  get first() { return this.a[0] }
  get last() { return this.a[this.a.length - 1] }
  get only():T {
    if (this.a.length !== 1) throw new OnlyError()
    return this.a[0]!
  }

  get eq() { return this.config.eq }

  get size() {
    return this.a.length
  }

  protected raw(i: number):T {
    return this.a[i]!
  }

}
export interface RoA<T extends {}> extends BaseA<T> {}
mixin(RoA, [BaseA])

export class A<T extends {}> {

  constructor(protected readonly a:T[], protected readonly config:Config<T> = { eq:Object.is }) {}

  static of<T extends {}>(...elements:T[]) {
    return new A(elements)
  }

  static from<T extends {}>(elements:Iterable<T>, config?:Config<T>) {
    const a = Array.isArray(elements) ? elements : [...elements]
    return new A(a, config)
  }

  raw(i:number):T {
    return this.a[i]!
  }

  [Symbol.iterator]() { return this.a[Symbol.iterator]() }

  removeAt(at:number):T {
    this.bounds(at)
    const elements = toTin(this.a.splice(at, 1))
    this.fire({cleared:false, removed:{ elements, at, count:1 }})
    return elements.only
  }

  clear() {
    this.a.splice(0, this.a.length)
    this.fire({cleared:true})
  }

  set(at:number, v:T) {
    const { a } = this
    const old = this.at(at)
    this.a[at] = v
    this.fire({
      cleared: false,
      removed: { elements:toTin([old]), at, count:1 },
      added: { elements:toTin([v]), at, count:1 },
    })
  }

  add(v:T, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    this.a.splice(at, 0, v)
    this.fire({ cleared:false, added:{elements:toTin([v]), at, count:1} })
  }

  addAll(elements:Iterable<T>, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    let count = 0
    for (const x of elements) {
      this.a.splice(at + count, 0, x)
      count++
    }
    this.fire({ cleared:false, added:{ elements:toTin(elements), at, count} })
  }

}
export interface A<T extends {}> extends RoA<T>, AAdd<T>, ARemove<T>, AChange<T> {}
mixin(A, [RoA, AAdd, ARemove, AChange])
