import { sized } from "loudo-ds-core"
import { BaseMap, Entry, MapChange, MapInput, MapRemove, forEach } from "loudo-ds-map-interfaces";
import { One } from "loudo-ds-one";
import { mixin } from "loudo-mixin"

export const m = Symbol("m")

export function mapify<K extends {},V extends {}>(input:MapInput<K,V>) {
  if (input instanceof Map) return input
  const r = new Map<K,V>()
  forEach(input, (k,v) => r.set(k,v))
  return r
}

export class RoNMap<K extends {},V extends {}> {

  protected [m]:Map<K,V>

  constructor(input:MapInput<K,V>) {
    this[m] = mapify(input)
  }

  static of<K extends {},V extends {}>(...entries:Entry<K,V>[]|[K,V][]) {
    return new RoNMap(entries)
  }

  static from<K extends {},V extends {}>(input:MapInput<K,V>) {
    return new RoNMap(input)
  }

  get size() { return this[m].size }

  *[Symbol.iterator]():Iterator<Entry<K,V>> {
    for (const x of this[m]) {
      yield { key:x[0], value:x[1] }
    }
  }

  get keyEq():(k1:K,k2:K)=>boolean { return Object.is }

  get valueEq():(v1:V,v2:V)=>boolean { return Object.is }

  get(k:K) { return this[m].get(k) }

  hasKey(k:K) { return this[m].has(k) }

  get keys() {
    const map = this[m]
    return sized(() => map.keys(), () => map.size, this.keyEq)
  }

  get values() {
    const map = this[m]
    return sized(() => map.values(), () => map.size, this.valueEq)
  }

}
export interface RoNMap<K extends {},V extends {}> extends BaseMap<K,V> {}
mixin(RoNMap, [BaseMap])


export class NMap<K extends {},V extends {}> {

  protected [m]:Map<K,V>

  constructor(input:MapInput<K,V>) {
    this[m] = mapify(input)
  }

  static of<K extends {},V extends {}>(...entries:Entry<K,V>[]|[K,V][]) {
    return new NMap(entries)   
  }

  static from<K extends {},V extends {}>(input:MapInput<K,V>) {
    return new NMap(input)
  }

  put(k:K, v:V) {
    const map = this[m]
    const r = map.get(k)
    map.set(k, v)
    if (r === undefined) this.fire({
      cleared:false,
      added:{
        elements:One.of({ key:k, value:v }),
        at:undefined
      }
    })
    else this.fire({
      cleared:false,
      removed:{
        elements:One.of({ key:k, value:r }),
        at:undefined,
      },
      added:{
        elements:One.of({ key:k, value:v }),
        at:undefined
      }
    })
    return r
  }

  removeKey(k:K) {
    const map = this[m]
    const r = this.get(k)
    map.delete(k)
    if (r !== undefined) this.fire({
      cleared: false,
      removed: {
        elements:One.of({ key:k, value:r }),
        at:undefined,
      }
    })
    return r
  }

  clear() {
    const map = this[m]
    if (map.size === 0) return
    map.clear()
    this.fire({ cleared:true })
  }
}
export interface NMap<K extends {},V extends {}> extends RoNMap<K,V>, MapChange<K,V>, MapRemove<K,V> {}
mixin(NMap, [RoNMap, MapChange, MapRemove])
