import { mixin, toTin, OnlyError } from "loudo-ds-core"
import { Entry, MapChange, MapInput, MapRemove } from "loudo-ds-map-interfaces"

interface Bucket<K,V> {
  key:K
  value:V
  hashCode: number
  next: B<K,V>
  prev: B<K,V>
  chain: B<K,V>
}

type B<K,V> = Bucket<K,V>|null

export interface LMapConfig<K extends {},V extends {}> {
  readonly load?:number
  hashCode(key:K):number
  keyEq?(key1:K, key2:K):boolean
  valueEq?(value1:V, value2:V):boolean
}

export class LMap<K extends {},V extends {}> {

  protected _config:LMapConfig<K,V>
  protected buckets:B<K,V>[] = []

  protected firstB:B<K,V> = null
  protected lastB:B<K,V> = null
  protected _size = 0

  constructor(input:MapInput<K,V>, config:LMapConfig<K,V>) {
    this._config = config
    for (let i = 0; i < 4; i++) {
      this.buckets.push(null)
    }
    this.putAll(input)
  }

  get size() { return this._size }
  get config() { return this._config }
  get first():Entry<K,V>|undefined { return this.firstB ?? undefined }
  get last():Entry<K,V>|undefined { return this.lastB ?? undefined }
  get only():Entry<K,V> {
    if (this._size !== 1) throw new OnlyError()
    return this.firstB!
  }

  get keyEq():(k1:K,k2:K)=>boolean { return this.config.keyEq ?? Object.is }
  get valueEq():(v1:V,v2:V)=>boolean { return this.config.valueEq ?? Object.is }
  get load() { return this.config.load ?? 0.75 }

  hasKey(key:K):boolean {
    return this.bucket(key) !== null
  }

  get(key:K):V|undefined {
    const bucket = this.bucket(key)
    this.afterGet(bucket)
    return bucket?.value
  }

  protected afterGet(bucket:B<K,V>) {}

  *[Symbol.iterator]():IterableIterator<Entry<K,V>> {
    for (let bucket = this.firstB; bucket !== null; bucket = bucket.next) {
      yield bucket
    }
  }

  private grow() {
    const buckets:B<K,V>[] = []
    for (let i = 0; i < this.buckets.length; i++) buckets.push(null)
    this.buckets = buckets
    for (let bucket = this.firstB; bucket != null; bucket = bucket.next) {
      const i = Math.abs(bucket.hashCode) % buckets.length
      const chain = buckets[i]
      buckets[i] = bucket
      bucket.chain = chain as B<K,V>
    }
  }

  private bucket(key:K):B<K,V> {
    const hash = this.config.hashCode(key)
    let bucket:B<K,V> = this.buckets[Math.abs(hash) % this.buckets.length] as B<K,V>
    while (bucket !== null) {
      if (bucket.hashCode === hash && this.keyEq(key, bucket.key)) return bucket
      bucket = bucket.chain
    }
    return null
  }

  put(key:K, value:V):V|undefined {
    if (this._size / this.buckets.length >= this.load) this.grow()
    const hashCode = this.config.hashCode(key)
    const bucket:Bucket<K,V> = {
      key, value, hashCode, prev:null, next:null, chain:null,
    }
    const i = Math.abs(hashCode) % this.buckets.length
    let b = this.buckets[i] as B<K,V>
    while (b !== null) {
      if (b.hashCode === hashCode && this.keyEq(key, b.key)) {
        const r = b.value
        b.value = value
        this.afterGet(b)
        const elements = toTin([bucket as Entry<K,V>])
        this.fire({
          cleared:false, 
          added:{ elements:toTin([bucket as Entry<K,V>]), at:undefined, count:1 },
          removed:{ elements:toTin([{ key:key, value:r }]), at:undefined, count:1 }
        })
        return r
      }
      b = b.chain
    }
    bucket.chain = this.buckets[i] as B<K,V>
    this.buckets[i] = bucket
    if (this.firstB === null) {
      this.firstB = bucket
      this.lastB = bucket
    } else {
      this.lastB!.next = bucket
      bucket.prev = this.lastB
      this.lastB = bucket
    }
    this._size++
    this.fire({ cleared:false, added:{ elements:toTin([bucket as Entry<K,V>]), at:undefined, count:1 }})
    return undefined
  }

  removeKey(key:K):V|undefined {
    const hash = this.config.hashCode(key)
    let prev:B<K,V> = null
    const i = Math.abs(hash) % this.buckets.length
    let bucket:B<K,V> = this.buckets[i] as B<K,V>
    while (bucket !== null) {
      if (bucket.hashCode === hash && this.keyEq(key, bucket.key)) break;
      prev = bucket
      bucket = bucket.chain
    }
    if (bucket === null) return undefined
    this._size--
    if (prev === null) this.buckets[i] = bucket.chain
    else prev.chain = bucket.chain
    if (this.firstB === bucket) this.firstB = bucket.next
    if (this.lastB === bucket) this.lastB = bucket.prev
    if (bucket.next !== null) {
      bucket.next.prev = bucket.prev
    }
    if (bucket.prev !== null) {
      bucket.prev.next = bucket.next
    }
    const elements = toTin([bucket as Entry<K,V>])
    this.fire({ cleared:false, removed:{ elements, at:undefined, count:1 }})
    return bucket.value
  }

  clear() {
    if (this.size === 0) return
    this.firstB = null
    this.lastB = null
    this._size = 0
    this.fire({ cleared:true })
  }

}
export interface LMap<K extends {},V extends {}> extends MapChange<K,V>, MapRemove<K,V> {}
mixin(LMap, [MapChange, MapRemove])
