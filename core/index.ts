export interface BigIterable<T> extends Iterable<T> {
  map<R>(f:(x:T)=>R):BigIterable<R>
  filter(f:(x:T)=>boolean):BigIterable<T>
  reduce<A>(a:A, f:(a:A, x:T)=>A):A
}

function* mapGen<T,R>(i:Iterable<T>, f:(x:T)=>R) {
  for (const x of i) yield f(x)
}

function* filter<T,R>(i:Iterable<T>, f:(x:T)=>boolean) {
  for (const x of i) if (f(x)) yield x
}

function reduce<T,A>(i:Iterable<T>, a:A, f:(a:A, x:T)=>A) {
  for (const x of i) a = f(a, x)
  return a
}

export function big<T>(i:Iterable<T>):BigIterable<T> {
  const r:BigIterable<T> = {
    [Symbol.iterator]:() => i[Symbol.iterator](),
    map:<R>(f:(x:T)=>R) => big(mapGen(i, f)),
    filter:(f:(x:T)=>boolean) => big(filter(i, f)),
    reduce:<A>(a:A,f:(a:A,x:T)=>A) => reduce(i, a, f),
  }
  return r
}


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

export abstract class RODataStructure<T,I = undefined> implements BigIterable<T> {

  abstract get size():number
  abstract [Symbol.iterator]():Iterator<T>

  get empty() { return this.size === 0 }

  private *map2<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R>(f:(x:T)=>R) {
    return big(this.map2(f))
  }

  private *filter2(f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean) {
    return big(this.filter2(f))
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

export const mutable = Symbol("mutable")

export abstract class DataStructure<T,I = undefined> extends RODataStructure<T,I> {

  get [mutable]() { return true }

  private readonly ears = new Set<Ear<T,I>>()

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

}
