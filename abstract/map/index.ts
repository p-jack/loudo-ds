import { Loud, Tin, mixed, mixin } from "loudo-ds-core"

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
  get keys():Tin<K> { return this.map(x => x.key) }
  get values():Tin<V> { return this.map(x => x.value) }
}
export interface BaseMap<K extends {},V extends {}> extends Tin<Entry<K,V>> {}
mixin(BaseMap, [Tin])

export abstract class MapChange<K extends {},V extends {}> {

  abstract put(key:K, value:V):V|undefined

  putAll(input:MapInput<K,V>) {
    putAll(this, input)
  }
}
export interface MapChange<K extends {},V extends {}> extends BaseMap<K,V>, Loud<Entry<K,V>> {}
mixin(MapChange, [BaseMap, Loud])

export abstract class MapRemove<K extends {},V extends {}> {
  abstract removeKey(key:K):V|undefined
  abstract clear():void
}
export interface MapRemove<K extends {},V extends {}> extends BaseMap<K,V>, Loud<Entry<K,V>> {}
mixin(MapRemove, [BaseMap, Loud])

export type Object<K extends {},V extends {}> = K extends string ? Record<string,V> : never
export type MapInput<K extends {},V extends {}> = 
  Map<K,V> | Iterable<Entry<K,V>|[K,V]> | Object<K,V>

export function putAll<K extends {},V extends {}>(map:MapChange<K,V>, input:MapInput<K,V>) {
  if (input instanceof Map) {
    for (const x of input) {
      map.put(x[0], x[1])
    }
    return
  }
  if (Symbol.iterator in input) {
    for (const x of input) {
      if (Array.isArray(x)) {
        map.put(x[0], x[1])
      } else {
        map.put(x.key, x.value)
      }
    }
    return
  }
  for (const k in input) {
    map.put(k as never, (input as any)[k] as never)
  }
}