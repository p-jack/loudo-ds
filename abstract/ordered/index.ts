import { Reversible } from "loudo-ds-reversible"

export const ordered = Symbol("ordered")

export interface Ordered<K,T,I = undefined> extends Reversible<T,I> {
  readonly [ordered]:true
  slice(start:K, end:K, exclude?:Exclude):this
}

export interface Exclude {
  start: boolean
  end: boolean
}

export const IN_IN:Exclude = { start:false, end:false }
export const IN_EX:Exclude = { start:false, end:true }
export const EX_IN:Exclude = { start:true, end:false }
export const EX_EX:Exclude = { start:true, end:true }
