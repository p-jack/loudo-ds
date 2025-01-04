import { Loud, Sized } from "loudo-ds-core"
import { mixin } from "loudo-mixin"

export interface Entry<K extends {},V extends {}> {
  key: K
  value: V
}

export abstract class BaseMap<K extends {},V extends {}> {
  abstract get(key:K):V|undefined
  abstract get keyEq():(k1:K,k2:K)=>boolean
  abstract get valueEq():(v1:V,v2:V)=>boolean
  get eq():(e1:Entry<K,V>, e2:Entry<K,V>)=>boolean {
    const me = this
    return (e1,e2) => {
      if (!me.keyEq(e1.key, e2.key)) return false
      return me.valueEq(e1.value, e2.value)
    }
  }
  hasKey(key:K):boolean { return this.get(key) !== undefined }
  get keys():Sized<K> { return this.map(x => x.key) }
  get values():Sized<V> { return this.map(x => x.value) }
}
export interface BaseMap<K extends {},V extends {}> extends Sized<Entry<K,V>> {}
mixin(BaseMap, [Sized])

export abstract class MapChange<K extends {},V extends {}> {

  abstract put(key:K, value:V):V|undefined

  putAll(input:MapInput<K,V>) {
    const me = this
    forEach(input, (k,v) => me.put(k,v))
  }
}
export interface MapChange<K extends {},V extends {}> extends BaseMap<K,V>, Loud<Entry<K,V>> {}
mixin(MapChange, [BaseMap, Loud])

export abstract class MapRemove<K extends {},V extends {}> {
  abstract removeKey(key:K):V|undefined
  abstract clear():void
  drop(f:(k:K,v:V)=>boolean) {
    const set = new Set(this.filter(x => f(x.key, x.value)).map(x => x.key))
    for (const x of set) {
      this.removeKey(x)
    }
    return set.size
  }
}
export interface MapRemove<K extends {},V extends {}> extends BaseMap<K,V>, Loud<Entry<K,V>> {}
mixin(MapRemove, [BaseMap, Loud])

export type Object<K extends {},V extends {}> = K extends string ? Record<string,V> : never
export type MapInput<K extends {},V extends {}> = 
  Map<K,V> | Iterable<Entry<K,V>|[K,V]> | Object<K,V>

export function forEach<K extends {},V extends {}>(input:MapInput<K,V>, f:(k:K, v:V)=>void) {
  if (input instanceof Map) {
    for (const x of input) {
      f(x[0], x[1])
    }
    return
  }
  if (Symbol.iterator in input) {
    for (const x of input) {
      if (Array.isArray(x)) {
        f(x[0], x[1])
      } else {
        f(x.key, x.value)
      }
    }
    return
  }
  for (const [k, v] of Object.entries(input)) f(k as never, v)
}