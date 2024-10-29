import { DataStructure, Base, Loud, Mixin, mixin, LoudMixin, LoudI, Config } from "loudo-ds-core"

//// Read-Only

interface Found {
  found: boolean
  index: number
}

export interface RoLaI<T> extends DataStructure<T> {
  at(i:number):T
  findIndex(f:(x:T)=>boolean):number|undefined
  binarySearch(v:T, cmp:(a:T,b:T)=>number):Found
  lowerBound(v:T, cmp:(a:T,b:T)=>number):number
  upperBound(v:T, cmp:(a:T,b:T)=>number):number
}

export abstract class RoLaMixin<T> extends Mixin<T> {
  abstract at(i:number):T
  abstract findIndex(f:(x:T)=>boolean):number|undefined
  abstract binarySearch(v:T, cmp:(a:T,b:T)=>number):Found
  abstract lowerBound(v:T, cmp:(a:T,b:T)=>number):number
  abstract upperBound(v:T, cmp:(a:T,b:T)=>number):number
}

export abstract class BaseRoLa<T> extends Base<T> {

  constructor(config:Config<T>) { super(config) }

  protected bounds(i:number, extra = false) {
    if (i < 0) throw new TypeError("negative array index: " + i)
    if (!Number.isSafeInteger(i)) throw new TypeError("invalid array index: " + i)
    const size = this.size
    if (extra && i > size) {
      throw new TypeError(`${i} is invalid insertion index for array of size ${size}`)
    } else if (i >= size) {
      throw new TypeError(`${i} is an invalid index for array of size ${size}`)
    }
  }

  abstract at(i:number):T

  override *[Symbol.iterator]():Iterator<T> {
    for (let i = 0; i < this.size; i++) {
      yield this.at(i)
    }
  }

  override get first() { return this.empty ? undefined : this.at(0) }
  override get last() { return this.empty ? undefined : this.at(this.size - 1) }

  findIndex(f:(x:T)=>boolean) {
    for (let i = 0; i < this.size; i++) if (f(this.at(i))) return i
    return undefined
  }

  private search(f:(x:T)=>boolean):number {
    let lo = -1, hi = this.size;
    while (1 + lo < hi) {
      const m = lo + ((hi - lo) >> 1);
      if (f(this.at(m))) {
        hi = m;
      } else {
        lo = m;
      }
    }
    return hi;
  }

  binarySearch(v:T, cmp:(a:T,b:T)=>number):Found {
    let found = false
    const index = this.search(x => {
      const r = cmp(v, x)
      if (r === 0) found = true
      return r <= 0
    })
    return { found, index }
  }

  lowerBound(v:T, cmp:(a:T,b:T)=>number) {
    return this.search(x => cmp(v, x) <= 0)
  }

  upperBound(v:T, cmp:(a:T,b:T)=>number) {
    return this.search(x => cmp(v, x) < 0)
  }

}


//// Removable

export interface RemLaI<T> extends RoLaI<T>, LoudI<T,number> {
  clear():void
  remove(i:number, count?:number):void
  drop(f:(x:T,i:number)=>boolean):void
}

export abstract class RemLaMixin<T> extends RoLaMixin<T> {
  abstract clear():void
  abstract remove(i:number, count?:number):void
  abstract drop(f:(x:T,i:number)=>boolean):void
}
export interface RemLaMixin<T> extends LoudMixin<T,number> {}
mixin(RemLaMixin, [Loud])

export abstract class BaseRemLa<T> extends BaseRoLa<T> {

  constructor(config:Config<T>) { super(config) }

  get firstIndex():number { return 0 }
  abstract clear():void
  abstract remove(i:number, count?:number):void

  drop(f:(x:T,i:number)=>boolean):void {
    let i = 0
    while (i < this.size) {
      const x = this.at(i)
      if (f(x,i)) {
        this.remove(i)
      } else {
        i++
      }
    }
  }

}
export interface BaseRemLa<T> extends LoudMixin<T,number> {}
mixin(BaseRemLa, [Loud])


//// Fully Mutable

type Cmp<T> = (a:T,b:T)=>number

export interface LaI<T> extends RemLaI<T> {
  set(i:number, v:T):void
  add(v:T,i?:number):void
  addAll(v:Iterable<T>,i?:number):void
  sort(f:(a:T,b:T)=>number):void
}

export abstract class LaMixin<T> extends RemLaMixin<T> implements LaI<T> {
  abstract set(i:number, v:T):void
  abstract add(v:T,i?:number):void
  abstract addAll(v:Iterable<T>,i?:number):void
  abstract sort(f:(a:T,b:T)=>number):void
}

export abstract class BaseLa<T> extends BaseRemLa<T> implements LaI<T> {

  constructor(config:Config<T>) { super(config) }

  abstract set(i:number, v:T):void
  abstract add(v:T,i?:number):void
  abstract addAll(v:Iterable<T>,i?:number):void

  divide(f:Cmp<T>, left:number, right:number) {
    const pi = (left + right) >>> 1
    const pivot = this.at(pi)
    while (left <= right) {
      while (f(this.at(left), pivot) < 0) left++
      while (f(this.at(right), pivot) > 0) right--
      if (left <= right) {
        const temp = this.at(left)
        this.set(left++, this.at(right))
        this.set(right--, temp)
      }
    }
    return left;
  }

  quicksort(f:Cmp<T>, left:number, right:number) {
    var mid = this.divide(f, left, right);
    if (left < mid - 1) this.quicksort(f, left, mid - 1);
    if (right > mid) this.quicksort(f, mid, right);
  }

  sort(f:(a:T,b:T)=>number) {
    this.quicksort(f, 0, this.size - 1)
    this.fire({cleared:true, added:{elements:this, at:0, count:this.size}})
  }

}