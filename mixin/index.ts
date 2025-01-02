const kids = Symbol("kids")

export type Class<T> = Function & { prototype:T }

function setFor(c:Class<any>, sym:symbol) {
  let set = (c as any)[sym] as Set<Class<any>>
  if (set === undefined) {
    set = new Set();
    (c as any)[sym] = set
  }
  return set
}

export interface Options<T extends object> {
  overrides: (keyof T)[]
}

export function mixin<T extends object>(c:Class<T>, m:Class<any>, options:Options<T>):void
export function mixin(c:Class<any>, m:Iterable<Class<any>>):void
export function mixin<T extends object>(c:Class<T>, m:Class<any>|Iterable<Class<any>>, options?:Options<T>):void {
  if (!("prototype" in c)) throw new TypeError("mixin target has no prototype")
  if (!(Symbol.iterator in m)) m = [m as Class<any>]
  const overrides = new Set<any>(options?.overrides ?? [])
  const p1 = c.prototype
  for (const x of m) {
    if (!("prototype" in x)) throw new TypeError("mixin has no prototype")
    if (mixed2(x, c)) throw new TypeError(`can't mix ${x.name} into its parent ${c.name}`)
  }
  for (const x of m) {
    const kidSet = setFor(x, kids)
    kidSet.add(c)
    const d1 = Object.getOwnPropertyDescriptors(p1)
    const d2 = Object.getOwnPropertyDescriptors(x.prototype);
    Reflect.ownKeys(d1).filter(x => !overrides.has(x)).forEach(x => delete (d2 as any)[x])
    Object.defineProperties(p1, d2)      
  }
}

function mixed2<T extends object,M extends object>(targetC:Class<T>, mixin:Class<M>):boolean {
  const set = (mixin as any)[kids] as Set<Class<any>>
  if (set === undefined) return false
  if (set.has(targetC)) return true
  for (const kid of set) if (mixed2(targetC, kid)) return true
  return false
}

export function mixed<T extends object,M extends object>(target:T, mixin:Function & { prototype:M }):target is T&M {
  return mixed2(target.constructor, mixin)
}

export type Augment<T extends {},K extends keyof T> =
  T[K] extends (...args:infer A)=>infer R 
  ? (original:(...args:A)=>R, ths:T, ...args:A)=>R 
  : never

export function augment<T extends object,K extends keyof T>(c:Function & { prototype:T }, k:K, o:Augment<T,K>) {
  const p = c.prototype
  const d = Object.getOwnPropertyDescriptor(p, k)
  const original = d?.value as Function
  const f = function(this:any, ...args:any[]):any {
    return o(original as never, this, ...args)
  }
  Object.defineProperty(p, k, { ...d, value:f })
}
