import { AChange, BaseA } from "loudo-ds-array-interfaces";
import { One } from "loudo-ds-one";
import { mixin, mixed } from "loudo-mixin"

const array = Symbol("array")
const size = Symbol("size")
const start = Symbol("start")
const eq = Symbol("eq")

export class Ring<T extends {}> {

  protected readonly [eq]:(a:T,b:T)=>boolean
  protected readonly [array]:T[]
  protected [size] = 0
  protected [start] = 0

  constructor(elements:Iterable<T>, limit:number, _eq:(a:T,b:T)=>boolean = Object.is) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new TypeError("invalid Ring limit")
    this[array] = new Array(limit)
    this[eq] = _eq
    this.pushAll(elements)
  }

  get size() { return this[size] }
  get full() { return this[size] === this[array].length }
  get eq() { return this[eq] }

  protected ring(i:number):number {
    const strt = this[start]
    const len = this[size]
    return i >= len - strt ? i - (len - strt) : strt + i
  }

  protected raw(i:number):T {
    return this[array][this.ring(i)]!
  }

  set(i:number, v:T) {
    this.bounds(i)
    const old = this.raw(i)
    if (this.eq(old, v)) return
    this[array][this.ring(i)] = v
    this.fire({
      cleared: false,
      removed: { at: i, elements: One.of(old) },
      added: { at:i, elements: One.of(v) }
    })
  }

  *[Symbol.iterator]() {
    for (let i = this[start]; i < this[size]; i++) yield this[array][i]!
    for (let i = 0; i < this[start]; i++) yield this[array][i]!
  }

  private doPush(v:T):T|undefined {
    const len = this[size]
    const a = this[array]
    const strt = this[start]
    if (len < a.length) {
      a[len] = v
      this[size] = this[size] + 1
      return undefined
    } else {
      const removed = this.raw(0)
      a[strt] = v
      const s = strt + 1
      if (s >= a.length) this[start] = 0
      else this[start] = s
      return removed
    }
  }

  push(v:T) {
    const len = this[size]
    const old = this.doPush(v)
    const removed = old ? { at:0, elements:One.of(old) } : undefined
    const added = { at:len - (old ? 1 : 0), elements:One.of(v) }
    this.fire({ cleared:false, removed, added })
  }

  pushAll(t:Iterable<T>) {
    const len = this[size]
    const a = this[array]
    const all = aize(t, this.eq)
    if (all.empty) return
    if (all.size + len <= a.length) {
      const added = { at:len, elements:all }
      for (const x of all) this.doPush(x)
      this.fire({cleared:false, added})
      return
    }
    if (all.size < len) {
      const removed = { at:0, elements:aize(a.slice(0, all.size), this.eq) }
      const added = { at:len - all.size, elements:all }
      for (const x of all) this.doPush(x)
      this.fire({cleared:false, removed, added})
      return
    }
    const s = all.size - len
    for (const x of all.slice(s)) this.doPush(x)
    this.fire({cleared:true, added:{at:0, elements:this}})
  }

  private doUnshift(v:T) {
    const len = this[size]
    const a = this[array]
    const strt = this[start]
    if (len < a.length) {
      a.splice(0, 0, v)
      this[size]++
      return undefined
    }
    const removed = this.raw(len - 1)
    const s = strt === 0 ? len - 1 : strt - 1
    a[s] = v
    this[start] = s
    return removed
  }

  unshift(v:T) {
    const len = this[size]
    const old = this.doUnshift(v)
    const removed = old ? { at:len - 1, elements:One.of(old) } : undefined
    const added = { at:0, elements:One.of(v) }
    this.fire({ cleared:false, removed, added })
  }

  unshiftAll(t:Iterable<T>) {
    const len = this[size]
    const a = this[array]
    const all = aize(t, this.eq)
    if (all.empty) return
    if (all.size + len <= a.length) {
      const added = { at:0, elements:all }
      for (const x of all.reversed()) this.doUnshift(x)
      this.fire({cleared:false, added })
      return
    }
    if (all.size < len) {
      const removed = { at:len - all.size, elements:aize(a.slice(len - all.size), this.eq)}
      const added = { at:0, elements:all }
      for (const x of all.reversed()) this.doUnshift(x)
      this.fire({cleared:false, removed, added})
      return
    }
    const s = all.size - len
    for (const x of all.slice(s)) this.doPush(x)
    this.fire({cleared:true, added:{at:0, elements:this}})
  }
}
export interface Ring<T extends {}> extends AChange<T> {}
mixin(Ring, [AChange])

function aize<T extends {}>(i:Iterable<T>, eq:(a:T, b:T)=>boolean):BaseA<T> {
  if (mixed(i, BaseA)) return new AWrap(i as BaseA<T>, eq)
  const a = Array.isArray(i) ? i : [...i]
  return new Arr(a, eq)
}

class Arr<T extends {}> {

  [eq]:(a:T,b:T)=>boolean

  constructor(private readonly a:T[], _eq:(a:T,b:T)=>boolean) {
    this[eq] = _eq
  }

  get size() { return this.a.length }
  get eq() { return this[eq] }
  raw(i:number) { return this.a[i]! }
  
}
interface Arr<T extends {}> extends BaseA<T> {}
mixin(Arr, [BaseA])

class AWrap<T extends {}> {
  [eq]:(a:T,b:T)=>boolean

  constructor(
    private readonly a:BaseA<T>,
    _eq:(a:T,b:T)=>boolean
  ) { this[eq] = _eq }

  get size() { return this.a.size }
  get eq() { return this[eq] }
  raw(i:number) { return this.a.at(i) }

}
interface AWrap<T extends {}> extends BaseA<T> {}
mixin(AWrap, [BaseA])
