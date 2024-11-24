const kids = Symbol("kids")
const all = Symbol("mixins")

export interface Mod<T extends {},I = undefined> {
  elements: Tin<T>
  at: I
  count: number
}

export interface LEvent<T extends {},I = undefined> {
  readonly cleared:boolean
  readonly added?:Mod<T,I>
  readonly removed?:Mod<T,I>
}

export type Ear<T extends {},I = undefined> = (event:LEvent<T,I>)=>void

export interface Config<T extends {}> {
  readonly eq:(a:T,b:T)=>boolean
}

export class OnlyError extends Error {}

export abstract class Tin<T extends {}> {

  abstract [Symbol.iterator]():Iterator<T>

  get size() { return this.reduce(0, a => a + 1) }
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

  private *map2<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R extends {}>(f:(x:T)=>R, config?:Config<R>):Tin<R> {
    const me = this
    const o = { [Symbol.iterator]() { return me.map2(f) } }
    return new RO(config ?? { eq:Object.is }, o)
  }

  private *filter2(f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean):Tin<T> {
    const me = this
    const o = { [Symbol.iterator]() { return me.filter2(f) } }
    const conf:Config<T> = { eq(a, b) { return me.eq(a, b) } }
    return new RO(conf, o)
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

class RO<T extends {}> {
  constructor(private readonly config:Config<T>, readonly iterable:Iterable<T>) {}
  get eq():(v1:T,v2:T)=>boolean { return this.config.eq }
  [Symbol.iterator]() { return this.iterable[Symbol.iterator]() }
}
interface RO<T extends {}> extends Tin<T> {}
mixin(RO, [Tin])

export function toTin<T extends {}>(iterable:Iterable<T>, config:Config<T> = { eq:Object.is }):Tin<T> {
  return new RO(config, iterable)
}

interface Held {
  ds:Loud<any,any>
  ear:Ear<any,any>
}

/* v8 ignore next 3 */
const registry = new FinalizationRegistry((held:Held) => {
  held.ds.unhear(held.ear)
})

export abstract class Loud<T extends {},I = undefined> {

  private ears_:Set<Ear<T,I>>|undefined
  private get ears() {
    if (this.ears_ === undefined) { this.ears_ = new Set() }
    return this.ears_
  }

  protected abstract get firstIndex():I

  hear(ear:Ear<T,I>) {
    this.ears.add(ear)
    if (this.empty) return
    ear({ cleared:false, added:{ elements:this, at:this.firstIndex, count:this.size }})
  }

  unhear(ear:Ear<T,I>) {
    this.ears.delete(ear)
  }

  hearing(ear:Ear<T,I>) {
    return this.ears.has(ear)
  }

  /* v8 ignore next 4 */
  protected fire(event:LEvent<T,I>) {
    for (const x of this.ears) { x(event) }
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
    setFor(x, kids).add(c)
    const p2 = x.prototype
    const d2 = Object.getOwnPropertyDescriptors(p2);
    for (const k in d1) delete(d2 as any)[k]
    Object.defineProperties(p1, d2)        
  }
  for (const k of kset) {
    mixin(k, m)
  }
}

export function mixed<C1 extends Class,C2 extends Class>(target:InstanceType<C1>, mixin:C2):(InstanceType<C1>&InstanceType<C2>)|undefined {
  const targetC = target.constructor
  const set = (targetC as any)[all] as Set<Class>
  return set && set.has(mixin) ? target as never : undefined
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
