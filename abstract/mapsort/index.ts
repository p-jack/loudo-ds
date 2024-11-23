import { mixin } from "loudo-ds-core"
import { BaseMap } from "loudo-ds-map-interfaces"

export interface Entry<K extends {},V extends {}> {
  key: K
  value: V
}

export abstract class BaseMapSort<K extends {},V extends {}> {
  abstract before(v:K):K|undefined
  abstract after(v:K):K|undefined
  abstract from(v:K):K|undefined
  abstract to(v:K):K|undefined
}
export interface BaseMapSort<K extends {},V extends {}> extends BaseMap<K,V> {}
mixin(BaseMapSort, [BaseMap])
