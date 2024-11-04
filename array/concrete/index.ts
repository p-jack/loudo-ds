import { mixin } from "loudo-ds-core"
import { BaseA, BaseRemA, BaseRoA } from "loudo-ds-array-interfaces";

export interface Config<T> {
  compare?:(a:T,b:T)=>boolean
}

export class RoA<T> extends BaseRoA<T> {
  constructor(protected readonly a:T[], config?:Config<T>) { super(config ?? {}) }
  override [Symbol.iterator]():Iterator<T> { return this.a[Symbol.iterator]() }
  override get size() { return this.a.length }
  override at(i: number):T {
    this.bounds(i)
    return this.a[i]!
  }
}

export class A<T> extends RoA<T> implements BaseA<T> {

  constructor(a:T[], config?:Config<T>) { super(a, config) }

  static of<T>(...elements:T[]) {
    return new A(elements)
  }

  static from<T>(elements:Iterable<T>, config?:Config<T>) {
    const a = Array.isArray(elements) ? elements : [...elements]
    return new A(a, config)
  }

  remove(at:number, count?:number) {
    count = count ?? 1
    if (count === 0) return
    this.bounds(at)
    this.bounds(at + count - 1)
    const elements = this.a.splice(at, count)
    this.fire({cleared:false, removed:{ elements, at, count }})
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
      removed: { elements:[old], at, count:1 },
      added: { elements:[v], at, count:1 },
    })
  }

  add(v:T, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    this.a.splice(at, 0, v)
    this.fire({ cleared:false, added:{elements:[v], at, count:1} })
  }

  addAll(elements:Iterable<T>, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    let count = 0
    for (const x of elements) {
      this.a.splice(at + count, 0, x)
      count++
    }
    this.fire({ cleared:false, added:{ elements, at, count} })
  }

  sort(f:(a:T,b:T)=>number): void {
    this.a.sort(f)
    this.fire({ cleared:true, added: { elements:this, at:0, count:this.size }})
  }

}

export interface A<T> extends BaseA<T> {}
mixin(A, [BaseRemA, BaseA])
