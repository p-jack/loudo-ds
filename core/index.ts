export interface BigIterable<T> extends Iterable<T> {
  map<R>(f:(x:T)=>R):BigIterable<R>
  filter(f:(x:T)=>boolean):BigIterable<T>
  reduce<A>(a:A, f:(a:A, x:T)=>A):A
}

function* map<T,R>(i:Iterable<T>, f:(x:T)=>R) {
  for (const x of i) yield f(x)
}

function* filter<T,R>(i:Iterable<T>, f:(x:T)=>boolean) {
  for (const x of i) if (f(x)) yield x
}

function reduce<T,A>(i:Iterable<T>, a:A, f:(a:A, x:T)=>A) {
  for (const x of i) a = f(a, x)
  return a
}

export function embiggen<T>(i:Iterable<T>):BigIterable<T> {
  const big:BigIterable<T> = {
    [Symbol.iterator]:() => i[Symbol.iterator](),
    map:<R>(f:(x:T)=>R) => embiggen(map(i, f)),
    filter:(f:(x:T)=>boolean) => embiggen(filter(i, f)),
    reduce:<A>(a:A,f:(a:A,x:T)=>A) => reduce(i, a, f),
  }
  return big
}


export interface Mod<T,I> {
  elements: Iterable<T>
  at: I
  count: number
}

export interface LEvent<T,I> {
  readonly cleared:boolean
  readonly added?:Mod<T,I>
  readonly removed?:Mod<T,I>
}

export type Ear<T,I> = (event:LEvent<T,I>)=>void

export abstract class DataStructure<T,I> implements Iterable<T> {

  private readonly ears = new Set<Ear<T,I>>()

  protected abstract get firstIndex():I

  hear(ear:Ear<T,I>) {
    this.ears.add(ear)
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

  abstract get size():number
  abstract [Symbol.iterator]():Iterator<T>

  get empty() { return this.size === 0 }

  private *map2<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R>(f:(x:T)=>R) {
    return embiggen(this.map2(f))
  }

  private *filter2(f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean) {
    return embiggen(this.filter2(f))
  }

  reduce<A>(a:A, f:(a:A, x:T)=>A) {
    for (const x of this) a = f(a, x)
    return a
  }

  toJSON() {
    return [...this]
  }

  static from<T>(iterable:Iterable<T>) {
    return new Wrap(iterable)
  }

}

export abstract class Reversible<T,I> extends DataStructure<T,I> {

  abstract get first():T|undefined
  abstract get last():T|undefined
  abstract get reversed():this

}

export interface Exclude {
  start: boolean
  end: boolean
}

export const IN_IN:Exclude = { start:false, end:false }
export const IN_EX:Exclude = { start:false, end:true }
export const EX_IN:Exclude = { start:true, end:false }
export const EX_EX:Exclude = { start:true, end:true }


export abstract class Ordered<K,T,I> extends Reversible<T,I> {
  abstract slice(start:K, end:K, exclude?:Exclude):this
}

export abstract class ArrayLike<T> extends Ordered<number,T,number> {
  abstract at(i:number):T
}

class Wrap<T> extends DataStructure<T,undefined> {

  constructor(readonly iterable:Iterable<T>) { super() }

  override get size() { return this.reduce(0, a => a + 1) }
  override get firstIndex() { return undefined }
  override [Symbol.iterator]() { return this.iterable[Symbol.iterator]() }

}