import { RODataStructure } from "loudo-ds-core"

export const reversible = Symbol("reversible")

export interface Reversible<T,I = undefined> extends RODataStructure<T,I> {
  readonly [reversible]:true
  readonly first:T|undefined
  readonly last:T|undefined
  readonly reversed:this
}
