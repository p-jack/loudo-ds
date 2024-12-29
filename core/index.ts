const kids = Symbol("kids")
const all = Symbol("mixins")

export interface Mod<T extends {},I = undefined> {
  elements: Tin<T>
  at: I
}

export interface LEvent<T extends {},I = undefined> {
  readonly cleared:boolean
  readonly added?:Mod<T,I>
  readonly removed?:Mod<T,I>
}

export type Ear<T extends {},I = undefined> = (event:LEvent<T,I>)=>void

export class OnlyError extends Error {}

const map = Symbol("map")
const filter = Symbol("filter")

export abstract class Tin<T extends {}> {

  abstract [Symbol.iterator]():Iterator<T>

  abstract get size():number
  get empty() { return this.size === 0 }
  get eq():(v1:T,v2:T)=>boolean { return Object.is }

  get first() {
    for (const x of this) return x;
    return undefined
  }

  get last() { 
    let r:T|undefined = undefined
    for (const x of this) r = x
    return r
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

  forEach(f:(v:T)=>void) {
    for (const x of this) f(x)
  }

  has(v:T) {
    const c = this.eq
    for (const x of this) if (c(x, v)) return true
    return false
  }

  private *[map]<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R extends {}>(f:(x:T)=>R, eq?:(a:R,b:R)=>boolean):Tin<R> {
    const me = this
    eq = eq ?? Object.is
    return tin(() => me[map](f), eq, () => this.size)
  }

  private *[filter](f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean):Tin<T> {
    const me = this
    const eq = (a:T,b:T) => me.eq(a,b)
    return tin(() => me[filter](f), eq)
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

class Wrap<T extends {}> {

  [eq]:(a:T,b:T)=>boolean
  [size]?:()=>number
  [gen]:()=>Iterator<T>

  constructor(iterable:()=>Iterator<T>, equals:(a:T,b:T)=>boolean, getSize?:()=>number) {
    this[eq] = equals
    this[size] = getSize
    this[gen] = iterable
  }

  get size():number {
    const r = this[size]
    if (r) return r()
    return this.reduce(0, a => a + 1)
  }

  get eq():(v1:T,v2:T)=>boolean { return this[eq] }
  [Symbol.iterator]() { return this[gen]() }

}
interface Wrap<T extends {}> extends Tin<T> {}
mixin(Wrap, [Tin])

export function tin<T extends {}>(gen:Iterable<T>|(()=>Iterator<T>), eq:(a:T,b:T)=>boolean = Object.is, size?:()=>number):Tin<T> {
  const g:()=>Iterator<T> = typeof(gen) === "function" ? gen : () => gen[Symbol.iterator]()
  return new Wrap(g, eq, size)
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

  /* v8 ignore next 4 */
  protected fire(event:LEvent<T,I>) {
    for (const x of this[ears]) { x(event) }
    return event
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
export interface Loud<T,I> extends Tin<T> {}
mixin(Loud, [Tin])


export type Class = abstract new(...args:any[])=>any

function setFor(c:Class, sym:symbol) {
  let set = (c as any)[sym] as Set<Class>
  if (set === undefined) {
    set = new Set();
    (c as any)[sym] = set
  }
  return set
}

export function mixin(c:Class, m:Iterable<Class>) {
  const p1 = c.prototype
  const allSet = setFor(c, all)
  const kset = setFor(c, kids)
  for (const x of m) {
    const d1 = Object.getOwnPropertyDescriptors(p1)
    allSet.add(x)
    const xkids = setFor(x, kids)
    xkids.add(c)
    for (const a of setFor(x, all)) {
      allSet.add(a)
      xkids.add(a)
    }
    const p2 = x.prototype
    const d2 = Object.getOwnPropertyDescriptors(p2);
    for (const k of Reflect.ownKeys(d1)) delete(d2 as any)[k]
    Object.defineProperties(p1, d2)        
  }
  for (const k of kset) {
    mixin(k, m)
  }
}

export function mixed<C1 extends Class,C2 extends Class>(target:InstanceType<C1>, mixin:C2):boolean {
  const targetC = target.constructor
  const set = targetC[all] as Set<Class>
  return set !== undefined && set.has(mixin)
}

export type Overwrite<T extends {}> = {
  [k in keyof T]: T[k] extends (...args:infer A)=>infer R ? (original:(...args:A)=>R, ...args:A)=>R : never
}

export function overwrite<T extends object>(c:abstract new(...args:any[])=>T, o:abstract new(o:Partial<Overwrite<T>>)=>any):void {
  const p1 = c.prototype
  const d1 = Object.getOwnPropertyDescriptors(p1)
  const p2 = o.prototype
  const d2 = Object.getOwnPropertyDescriptors(p2)
  for (const k in d2) {
    if (k === "constructor") continue
    const original = d1[k]?.value as Function
    if (typeof(original) !== "function") continue
    const n = d2[k]?.value as Function
    if (typeof(n) !== "function") continue
    const f = function(this:any, ...args:any[]):any {
      return n.call(this, original, ...args)
    }
    Object.defineProperty(p1, k, {
      ...d2[k],
      value:f,
    })
  }
}
