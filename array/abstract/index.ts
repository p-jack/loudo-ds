import { DataStructure, Base, BaseLoud, Mixin, mixin, LoudMixin, Config, Loud } from "loudo-ds-core"

//// Read-Only

export interface RoA<T> extends DataStructure<T> {
  at(i:number):T
  findIndex(f:(x:T)=>boolean):number|undefined
}

export abstract class RoAMixin<T> extends Mixin<T> {
  abstract at(i:number):T
  abstract findIndex(f:(x:T)=>boolean):number|undefined
}

export abstract class BaseRoA<T> extends Base<T> {

  constructor(config:Config<T>) { super(config) }

  protected bounds(i:number, extra = false) {
    console.log({ i, extra, size:this.size })
    if (i < 0) throw new TypeError("negative array index: " + i)
    if (!Number.isSafeInteger(i)) throw new TypeError("invalid array index: " + i)
    const size = this.size
    if (extra) {
      if (i > size) throw new TypeError(`index ${i} > size ${size}`)
    } else if (i >= size) throw new TypeError(`index ${i} >= size ${size}`)
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

}


//// Removable

export interface RemAI<T> extends RoA<T>, Loud<T,number> {
  clear():void
  remove(i:number, count?:number):void
  drop(f:(x:T,i:number)=>boolean):void
}

export abstract class RemAMixin<T> extends RoAMixin<T> implements RemAI<T> {
  abstract clear():void
  abstract remove(i:number, count?:number):void
  abstract drop(f:(x:T,i:number)=>boolean):number
}
export interface RemAMixin<T> extends LoudMixin<T,number> {}
mixin(RemAMixin, [BaseLoud])

export abstract class BaseRemA<T> extends BaseRoA<T> implements RemAI<T> {

  constructor(config:Config<T>) { super(config) }

  get firstIndex():number { return 0 }
  abstract clear():void
  abstract remove(i:number, count?:number):void

  drop(f:(x:T,i:number)=>boolean):number {
    let i = 0, max = this.size, r = 0
    for (let j = 0; j < max; j++) {
      const x = this.at(i)
      if (f(x,j)) {
        this.remove(i)
        r++
      }
      else i++
    }
    return r
  }

}
export interface BaseRemA<T> extends BaseLoud<T,number> {}
mixin(BaseRemA, [BaseLoud])


//// Fully Mutable

export interface AI<T> extends RemAI<T> {
  set(i:number, v:T):void
  add(v:T,i?:number):void
  addAll(v:Iterable<T>,i?:number):void
  reverse():void
}

export abstract class AMixin<T> extends RemAMixin<T> implements AI<T> {
  abstract set(i:number, v:T):void
  abstract add(v:T,i?:number):void
  abstract addAll(v:Iterable<T>,i?:number):void
  abstract reverse():void
}

export abstract class BaseA<T> extends BaseRemA<T> implements AI<T> {

  constructor(config:Config<T>) { super(config) }

  abstract set(i:number, v:T):void
  abstract add(v:T,i?:number):void
  abstract addAll(v:Iterable<T>,i?:number):void

  reverse() {
    for (let i = 0; i < this.size / 2; i++) {
      const temp = this.at(i)
      const r = this.size - i - 1
      this.set(i, this.at(r))
      this.set(r, temp)
    }
  }

}