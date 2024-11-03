export interface Mod<T,I> {
  elements: Iterable<T>
  at: I
  count: number
}

export interface LEvent<T,I = undefined> {
  readonly cleared:boolean
  readonly added?:Mod<T,I>
  readonly removed?:Mod<T,I>
}

export type Ear<T,I = undefined> = (event:LEvent<T,I>)=>void

export interface Config<T> {
  readonly compare?:(a:T,b:T)=>boolean
  [key: string]: any
}

export interface DataStructure<T> {
  [Symbol.iterator]():Iterator<T>
  get size():number
  get empty():boolean
  get first():T|undefined
  get last():T|undefined
  get compare():(a:T,b:T)=>boolean
  forEach(f:(v:T)=>void):void
  has(v:T):boolean
  map<R>(f:(v:T)=>R):DataStructure<R>
  filter(f:(v:T)=>boolean):DataStructure<T>
  reduce<A>(a:A, f:(a:A,v:T)=>A):A
  toJSON():T[]
  toString():string
}

export abstract class Base<T> implements DataStructure<T> {

  constructor(protected readonly config:Config<T>) {}

  abstract [Symbol.iterator]():Iterator<T>

  get size() { return this.reduce(0, a => a + 1) }
  get empty() { return this.size === 0 }
  get compare() { return this.config.compare ?? Object.is }
  get first() { for (const x of this) return x; return undefined }
  get last() { 
    let r:T|undefined = undefined;
    for (const x of this) r = x
    return r
  }

  forEach(f:(v:T)=>void) {
    for (const x of this) f(x)
  }

  has(v:T) {
    const c = this.compare
    for (const x of this) if (c(x, v)) return true
    return false
  }

  private *map2<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R>(f:(x:T)=>R):DataStructure<R> {
    return new RO(this.map2(f))
  }

  private *filter2(f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean):DataStructure<T> {
    return new RO(this.filter2(f))
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

class RO<T> extends Base<T> {
  constructor(readonly iterable:Iterable<T>) { super({}) }
  [Symbol.iterator]() { return this.iterable[Symbol.iterator]() }
}

export function toDataStructure<T>(iterable:Iterable<T>):DataStructure<T> {
  return new RO(iterable)
}

export abstract class Mixin<T> implements DataStructure<T> {
  abstract [Symbol.iterator]():Iterator<T>
  abstract get size():number
  abstract get empty():boolean
  abstract get first():T|undefined
  abstract get last():T|undefined
  abstract get compare():(a:T,b:T)=>boolean
  abstract forEach(f:(v:T)=>void):void
  abstract has(v:T):boolean
  abstract map<R>(f:(v:T)=>R):DataStructure<R>
  abstract filter(f:(v:T)=>boolean):DataStructure<T>
  abstract reduce<A>(a:A, f:(a:A,v:T)=>A):A
  abstract toJSON():T[]
  abstract toString():string
}

interface Held {
  ds:Loud<any,any>
  ear:Ear<any,any>
}

/* v8 ignore next 3 */
const registry = new FinalizationRegistry((held:Held) => {
  held.ds.unhear(held.ear)
})

export interface Loud<T,I> extends DataStructure<T> {
  hear(ear:Ear<T,I>):void
  unhear(ear:Ear<T,I>):void
  hearing(ear:Ear<T,I>):void
}

export abstract class BaseLoud<T,I> extends Mixin<T> implements Loud<T,I> {

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
  protected tether(ds:Loud<T,I>, ear:(me:typeof this, event:LEvent<T,I>)=>void) {
    const w = new WeakRef(this)
    const ear2 = (event:LEvent<T,I>) => {
      const s = w.deref()
      if (s !== undefined) ear(s, event)
    }
    ds.hear(ear2)
    registry.register(this, { ds, ear:ear2 })
  }

}

export abstract class LoudMixin<T,I> extends Mixin<T> implements Loud<T,I> {
  protected abstract get firstIndex():I
  protected abstract fire(event:LEvent<T,I>):LEvent<T,I>
  abstract hear(ear:Ear<T,I>):void
  abstract unhear(ear:Ear<T,I>):void
  abstract hearing(ear:Ear<T,I>):boolean
}


const sym = Symbol("mixins")

type Class = abstract new(...args:any[])=>any

export function mixin(c:Class, m:Class[]) {
  let set = (c as any)[sym] as Set<Class>
  if (set === undefined) {
    set = new Set();
    (c as any)[sym] = set
  }
  const p1 = c.prototype
  const d1 = Object.getOwnPropertyDescriptors(p1)
  for (const x of m.filter(x => !set.has(x))) {
    const p2 = x.prototype
    const d2 = Object.getOwnPropertyDescriptors(p2);
    for (const k in d1) delete(d2 as any)[k]
    Object.defineProperties(p1, d2)
    set.add(x)
  }
}

export function mixed(target:Class|object, mixin:Class) {
  if (typeof target === "object") {
    target = target.constructor
  }
  const set = (target as any)[sym] as Set<Class>
  return set ? set.has(mixin) : false
}
