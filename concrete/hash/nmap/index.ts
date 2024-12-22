import { toTin, mixin } from "loudo-ds-core"
import { BaseMap, Entry, MapChange, MapInput, MapRemove, forEach } from "loudo-ds-map-interfaces";


export class RoNMap<K extends {},V extends {}> {

  protected m:Map<K,V> = new Map<K,V>()

  constructor(input:MapInput<K,V>) {
    if (input instanceof Map) {
      this.m = input
    } else {
      this.m = new Map()
      forEach(input, (k,v) => this.m.set(k,v))
    }
  }

  get size() { return this.m.size }

  *[Symbol.iterator]():Iterator<Entry<K,V>> {
    for (const x of this.m) {
      yield { key:x[0], value:x[1] }
    }
  }

  get keyEq():(k1:K,k2:K)=>boolean { return Object.is }

  get valueEq():(v1:V,v2:V)=>boolean { return Object.is }

  get(k:K) { return this.m.get(k) }

  hasKey(k:K) { return this.m.has(k) }

  get keys() { return toTin(this.m.keys()) }

  get values() { return toTin(this.m.values()) }

}
export interface RoNMap<K extends {},V extends {}> extends BaseMap<K,V> {}
mixin(RoNMap, [BaseMap])


export class NMap<K extends {},V extends {}> {

  constructor(input:MapInput<K,V>) {
    if (input instanceof Map) {
      this.m = input
    } else {
      this.m = new Map()
      forEach(input, (k,v) => this.m.set(k,v))
    }
  }

  put(k:K, v:V) {
    const { m } = this
    const r = m.get(k)
    m.set(k, v)
    if (r === undefined) this.fire({
      cleared:false,
      added:{
        elements:toTin([{ key:k, value:v }]),
        count:1,
        at:undefined
      }
    })
    else this.fire({
      cleared:false,
      removed:{
        elements:toTin([{ key:k, value:r }]),
        count:1,
        at:undefined,
      },
      added:{
        elements:toTin([{ key:k, value:v }]),
        count:1,
        at:undefined
      }
    })
    return r
  }

  removeKey(k:K) {
    const { m } = this
    const r = this.get(k)
    m.delete(k)
    if (r !== undefined) this.fire({
      cleared: false,
      removed: {
        elements:toTin([{ key:k, value:r }]),
        count:1,
        at:undefined,
      }
    })
    return r
  }

  clear() {
    if (this.m.size === 0) return
    this.m.clear()
    this.fire({ cleared:true })
  }
}
export interface NMap<K extends {},V extends {}> extends RoNMap<K,V>, MapChange<K,V>, MapRemove<K,V> {}
mixin(NMap, [RoNMap, MapChange, MapRemove])