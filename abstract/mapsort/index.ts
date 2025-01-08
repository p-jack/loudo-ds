import { mixin } from "loudo-mixin"
import { BaseMap, Entry } from "loudo-ds-map-interfaces"
import { Include, Loud, Sized, Stash } from "loudo-ds-core"

export abstract class BaseMapSort<K extends {},V extends {}> {
  abstract get compare():(a:K,b:K)=>number
  abstract get last():Entry<K,V>|undefined
  abstract reversed():Sized<Entry<K,V>>
  abstract range(start:K, end:K, include?:Include):Stash<Entry<K,V>>
  abstract before(v:K):Entry<K,V>|undefined
  abstract after(v:K):Entry<K,V>|undefined
  abstract from(v:K):Entry<K,V>|undefined
  abstract to(v:K):Entry<K,V>|undefined
}
export interface BaseMapSort<K extends {},V extends {}> extends BaseMap<K,V> {}
mixin(BaseMapSort, [BaseMap])

export abstract class MapSortChange<K extends {},V extends {}> {
  abstract set compare(cmp:(a:K,b:K)=>number)
}
export interface MapSortChange<K extends {},V extends {}> extends BaseMapSort<K,V>, Loud<Entry<K,V>> {}
mixin(MapSortChange, [BaseMapSort])