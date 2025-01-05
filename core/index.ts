import { mixin } from "loudo-mixin"

export interface Mod<T extends {},I = undefined> {
  elements: Stash<T>
  at: I
}

export interface LEvent<T extends {},I = undefined> {
  readonly cleared:boolean
  readonly added?:Mod<T,I>
  readonly removed?:Mod<T,I>
}

export type Ear<T extends {},I = undefined> = (event:LEvent<T,I>)=>void

export class OnlyError extends Error {}

export interface Include {
  start: boolean
  end: boolean
}

export const IN_IN = { start:true, end:true }
export const IN_EX = { start:true, end:false }
export const EX_IN = { start:false, end:true }
export const EX_EX = { start:false, end:false }

const map = Symbol("map")
const filter = Symbol("filter")

export abstract class Stash<T extends {}> {

  abstract [Symbol.iterator]():Iterator<T>

  get eq():(v1:T,v2:T)=>boolean { return Object.is }

  get first() {
    for (const x of this) return x;
    return undefined
  }

  get only():T {
    let r:T|undefined = undefined
    for (const x of this) {
      if (r !== undefined) throw new OnlyError()
      r = x
    }
    if (r === undefined) throw new OnlyError()
    return r
  }

  has(v:T) {
    const c = this.eq
    for (const x of this) if (c(x, v)) return true
    return false
  }

  find(f:(v:T)=>boolean) {
    for (const x of this) if (f(x)) return x
    return undefined
  }

  all(f:(v:T)=>boolean) {
    let c = 0
    for (const x of this) {
      c++
      if (!f(x)) return false
    }
    return c === 0 ? false : true
  }

  any(f:(v:T)=>boolean) {
    return this.find(f) !== undefined
  }

  forEach(f:(v:T)=>void) {
    for (const x of this) f(x)
  }

  private *[map]<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R extends {}>(f:(x:T)=>R, eq?:(a:R,b:R)=>boolean):Stash<R> {
    const me = this
    eq = eq ?? Object.is
    return stash(() => me[map](f), eq)
  }

  private *[filter](f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean):Stash<T> {
    const me = this
    const eq = (a:T,b:T) => me.eq(a,b)
    return stash(() => me[filter](f), eq)
  }

  reduce<A>(a:A, f:(a:A, x:T)=>A) {
    for (const x of this) a = f(a, x)
    return a
  }

  toJSON() {
    return [...this]
  }

  toString() {
    return JSON.stringify(this)
  }
  
}

const size = Symbol("size")
const eq = Symbol("eq")
const gen = Symbol("gen")

class StashWrap<T extends {}> {

  [eq]:(a:T,b:T)=>boolean
  [gen]:()=>Iterator<T>

  constructor(iterable:()=>Iterator<T>, equals:(a:T,b:T)=>boolean) {
    this[eq] = equals
    this[gen] = iterable
  }

  get eq():(v1:T,v2:T)=>boolean { return this[eq] }
  [Symbol.iterator]() { return this[gen]() }

}
interface StashWrap<T extends {}> extends Stash<T> {}
mixin(StashWrap, [Stash])

export function stash<T extends {}>(gen:Iterable<T>|(()=>Iterator<T>), eq:(a:T,b:T)=>boolean = Object.is):Stash<T> {
  const g:()=>Iterator<T> = typeof(gen) === "function" ? gen : () => gen[Symbol.iterator]()
  return new StashWrap(g, eq)
}

export abstract class Sized<T extends {}> {
  abstract get size():number
  get empty() { return this.size === 0 }

  map<R extends {}>(f:(x:T)=>R, eq?:(a:R,b:R)=>boolean):Sized<R> {
    const me = this
    return sized(() => me[map](f), () => me.size, eq ?? Object.is)
  }

}
export interface Sized<T extends {}> extends Stash<T> {}
mixin(Sized, [Stash])

class SizedWrap<T extends {}> {

  [eq]:(a:T,b:T)=>boolean
  [size]:()=>number
  [gen]:()=>Iterator<T>

  constructor(iterable:()=>Iterator<T>, equals:(a:T,b:T)=>boolean, getSize:()=>number) {
    this[eq] = equals
    this[size] = getSize
    this[gen] = iterable
  }

  get size():number { return this[size]() }
  get eq():(v1:T,v2:T)=>boolean { return this[eq] }
  [Symbol.iterator]() { return this[gen]() }

}
interface SizedWrap<T extends {}> extends Sized<T> {}
mixin(SizedWrap, [Sized])

export function sized<T extends {}>(gen:Iterable<T>|(()=>Iterator<T>), size:()=>number, eq:(a:T,b:T)=>boolean = Object.is):Sized<T> {
  const g:()=>Iterator<T> = typeof(gen) === "function" ? gen : () => gen[Symbol.iterator]()
  return new SizedWrap(g, eq, size)
}

interface Held {
  ds:Loud<any,any>
  ear:Ear<any,any>
}

/* v8 ignore next 3 */
const registry = new FinalizationRegistry((held:Held) => {
  held.ds.unhear(held.ear)
})

const earSet = Symbol("earSet")
const ears = Symbol("ears")

export abstract class Loud<T extends {},I = undefined> {

  private [earSet]:Set<Ear<T,I>>|undefined
  private get [ears]() {
    if (this[earSet] === undefined) { this[earSet] = new Set() }
    return this[earSet]
  }

  protected abstract get firstIndex():I

  hear(ear:Ear<T,I>) {
    this[ears].add(ear)
    if (this.empty) return
    ear({ cleared:false, added:{ elements:this, at:this.firstIndex }})
  }

  unhear(ear:Ear<T,I>) {
    this[ears].delete(ear)
  }

  hearing(ear:Ear<T,I>) {
    return this[ears].has(ear)
  }

  /* v8 ignore next 6 */
  protected fire(event:LEvent<T,I>) {
    const set = this[earSet]
    if (set === undefined) return
    for (const x of set) { x(event) }
    return
  }

  /* v8 ignore next 9 */
  protected tether<T2 extends {},I2>(ds:Loud<T2,I2>, ear:(me:typeof this, event:LEvent<T2,I2>)=>void) {
    const w = new WeakRef(this)
    const ear2 = (event:LEvent<T2,I2>) => {
      const s = w.deref()
      if (s !== undefined) ear(s, event)
    }
    ds.hear(ear2)
    registry.register(this, { ds, ear:ear2 })
  }

}
export interface Loud<T,I> extends Sized<T> {}
mixin(Loud, [Sized])
