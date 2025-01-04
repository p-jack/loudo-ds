import { OnlyError, sized } from "loudo-ds-core"
import { AAdd, BaseA, ARemove, AChange } from "loudo-ds-array-interfaces";
import { mixin, mixed } from "loudo-mixin"
import { One } from "loudo-ds-one";

export const a = Symbol("a")
export const config = Symbol("config")

export interface Config<T> {
  readonly eq:(a:T,b:T)=>boolean
}

export class RoA<T extends {}> {

  protected readonly [a]:ArrayLike<T>
  protected readonly [config]:Config<T>

  constructor(_a:ArrayLike<T>, _config:Config<T>) {
    this[a] = _a
    this[config] = _config
  }

  static of<T extends {}>(...elements:T[]) {
    return new RoA(elements, { eq:Object.is })
  }

  static from<T extends {}>(elements:ArrayLike<T>, config:Config<T> = { eq:Object.is }) {
    return new RoA(elements, config)
  }

  static fromJSON<T extends {}>(sample:RoA<T>, json:any) {
    if (!Array.isArray(json)) throw new TypeError("can't make RoA from " + typeof(json))
    return new RoA<T>(json as T[], sample[config])
  }

  get first() { return this[a][0] }
  get last() { return this[a][this[a].length - 1] }
  get only():T {
    if (this[a].length !== 1) throw new OnlyError()
    return this[a][0]!
  }

  get eq() { return this[config].eq }

  get size() {
    return this[a].length
  }

  protected raw(i: number):T {
    return this[a][i]!
  }

}
export interface RoA<T extends {}> extends BaseA<T> {}
mixin(RoA, [BaseA])

export class A<T extends {}> {

  protected readonly [a]:T[]
  protected readonly [config]:Config<T>

  constructor(_a:Iterable<T>, _config:Config<T> = { eq:Object.is }) {
    this[a] = Array.isArray(_a) ? _a : [..._a]
    this[config] = _config
  }

  static of<T extends {}>(...elements:T[]) {
    return new A(elements)
  }

  static from<T extends {}>(elements:ArrayLike<T>, config:Config<T> = { eq:Object.is }) {
    return new RoA(elements, config)
  }

  static fromJSON<T extends {}>(sample:A<T>, json:any) {
    if (!Array.isArray(json)) throw new TypeError("can't make A from " + typeof(json))
    return new A<T>(json as T[], sample[config])
  }

  protected raw(i:number):T {
    return this[a][i]!
  }

  [Symbol.iterator]() { return this[a][Symbol.iterator]() }

  removeAt(at:number):T {
    this.bounds(at)
    const r = this[a].splice(at, 1)[0]!
    this.fire({cleared:false, removed:{ elements:One.of(r), at  }})
    return r
  }

  clear() {
    this[a].splice(0, this[a].length)
    this.fire({cleared:true})
  }

  set(at:number, v:T) {
    const old = this.at(at)
    this[a][at] = v
    this.fire({
      cleared: false,
      removed: { elements:One.of(old), at },
      added: { elements:One.of(v), at },
    })
  }

  add(v:T, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    this[a].splice(at, 0, v)
    this.fire({cleared:false, added:{elements:One.of(v), at }})
  }

  addAll(i:Iterable<T>, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    let count = 0
    for (const x of i) {
      this[a].splice(at + count, 0, x)
      count++
    }
    const elements = sized(() => i[Symbol.iterator](), () => count, this.eq)
    this.fire({cleared:false, added:{ elements, at}})
  }

}
export interface A<T extends {}> extends RoA<T>, AAdd<T>, ARemove<T>, AChange<T> {}
mixin(A, [RoA, AAdd, ARemove, AChange])
