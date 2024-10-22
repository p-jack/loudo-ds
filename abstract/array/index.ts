import { DataStructure, RODataStructure } from "loudo-ds-core"

export const array = Symbol("array")

export interface ROArray<T> extends RODataStructure<T,number> {
  readonly [array]:true
  at(i:number):T
}

export interface Array<T> extends DataStructure<T,number>, ROArray<T> {
  set(i:number,v:T):void
  add(v:T,i?:number):void
  addAll(v:Iterable<T>,i?:number):void
  remove(i?:number):void
}