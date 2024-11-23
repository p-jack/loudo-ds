import { Loud, Tin, mixin } from "loudo-ds-core"

export abstract class BaseSet<T extends {}> {}
export interface BaseSet<T extends {}> extends Tin<T> {}
mixin(BaseSet, [Tin])

export abstract class SetAdd<T extends {}> {
  abstract add(v:T):boolean
}
export interface SetAdd<T extends {}> extends BaseSet<T>, Loud<T> {}
mixin(SetAdd, [BaseSet, Loud])

export abstract class SetRemove<T extends {}> {
  abstract remove(v:T):boolean
}
export interface SetRemove<T extends {}> extends BaseSet<T>, Loud<T> {}
mixin(SetRemove, [BaseSet, Loud])
