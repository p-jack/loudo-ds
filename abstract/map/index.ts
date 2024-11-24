import { Loud, Tin, mixin } from "loudo-ds-core"

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
}
export interface MapChange<K extends {},V extends {}> extends BaseMap<K,V>, Loud<Entry<K,V>> {}
mixin(MapChange, [BaseMap, Loud])

export abstract class MapRemove<K extends {},V extends {}> {
  abstract remove(key:K):V|undefined
  abstract clear():void
}
export interface MapRemove<K extends {},V extends {}> extends BaseMap<K,V>, Loud<Entry<K,V>> {}
mixin(MapRemove, [BaseMap, Loud])
