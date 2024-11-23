import { Tin, mixin } from "loudo-ds-core"

export interface Entry<K extends {},V extends {}> {
  key: K
  value: V
}

export abstract class BaseMap<K extends {},V extends {}> {
  abstract get(key:K):V|undefined
  abstract get keyEq():(k1:K,k2:K)=>boolean
  hasKey(key:K):boolean { return this.get(key) !== undefined }
  get keys():Tin<K> { return this.map(x => x.key) }
  get values():Tin<V> { return this.map(x => x.value) }
}
export interface BaseMap<K extends {},V extends {}> extends Tin<Entry<K,V>> {}
mixin(BaseMap, [Tin])

export abstract class MapChange<K extends {},V extends {}> {
  abstract put(key:K):V|undefined
}
export interface MapChange<K extends {},V extends {}> extends BaseMap<K,V> {}
mixin(MapChange, [BaseMap])

export abstract class MapRemove<K extends {},V extends {}> {
  abstract remove(key:K):V|undefined
}
export interface MapRemove<K extends {},V extends {}> extends BaseMap<K,V> {}
mixin(MapRemove, [BaseMap])
