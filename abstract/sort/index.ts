import { Loud, Tin, mixin } from "loudo-ds-core"

export abstract class BaseSort<T extends {}> {
  abstract before(v:T):T|undefined
  abstract after(v:T):T|undefined
  abstract from(v:T):T|undefined
  abstract to(v:T):T|undefined
}
export interface BaseSort<T extends {}> extends Tin<T> {}
mixin(BaseSort, [Tin])

export abstract class SortAdd<T extends {}> {
  abstract add(v:T):boolean
}
export interface SortAdd<T extends {}> extends BaseSort<T>, Loud<T> {}
mixin(SortAdd, [BaseSort, Loud])

export abstract class SortRemove<T extends {}> {
  abstract remove(v:T):boolean
}
export interface SortRemove<T extends {}> extends BaseSort<T>, Loud<T> {}
mixin(SortRemove, [BaseSort, Loud])
