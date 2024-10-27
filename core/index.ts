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

export abstract class RoDataStructure<T,I = undefined> {

  abstract [Symbol.iterator]():Iterator<T>

  get size() { return this.reduce(0, a => a + 1) }
  get empty() { return this.size === 0 }
  get first() { for (const x of this) return x; return undefined }
  has(v:T) { for (const x of this) if (x === v) return true; return false }

  private *map2<R>(f:(x:T)=>R) {
    for (const x of this) yield f(x)
  }

  map<R>(f:(x:T)=>R):RoDataStructure<R> {
    return new RO(this.map2(f))
  }

  private *filter2(f:(x:T)=>boolean) {
    for (const x of this) if (f(x)) yield x
  }

  filter(f:(x:T)=>boolean):RoDataStructure<T> {
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

class RO<T> extends RoDataStructure<T> {
  constructor(readonly iterable:Iterable<T>) { super() }
  [Symbol.iterator]() { return this.iterable[Symbol.iterator]() }
}

export function toDataStructure<T>(iterable:Iterable<T>):RoDataStructure<T> {
  return new RO(iterable)
}


export abstract class LoudDataStructure<T,I = undefined> extends RoDataStructure<T,I> {

  private readonly ears = new Set<Ear<T,I>>()

  protected get firstIndex():I { return undefined as never }

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

export abstract class DataStructure<T,I = undefined> extends LoudDataStructure<T,I> {

  get readOnly():RoDataStructure<T,I> { return new RO(this) }

}
