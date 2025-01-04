import { OnlyError } from "loudo-ds-core"
import { Entry, MapChange, MapInput, MapRemove } from "loudo-ds-map-interfaces"
import { One } from "loudo-ds-one"
import { mixin } from "loudo-mixin"

interface Bucket<K,V> {
  key:K
  value:V
  hashCode: number
  next: B<K,V>
  prev: B<K,V>
  chain: B<K,V>
}

type B<K,V> = Bucket<K,V>|null

export interface Config<K extends {},V extends {}> {
  readonly load?:number
  readonly initial?:number
  readonly hashCode:(key:K)=>number
  readonly keyEq?:(key1:K, key2:K)=>boolean
  readonly valueEq?:(value1:V, value2:V)=>boolean
}

type Conf<K extends {},V extends {}> = Required<Config<K,V>>

function confize<K extends {},V extends {}>(config:Config<K,V>):Conf<K,V> {
  return {
    load: config.load ?? 0.75,
    initial: config.initial ?? 4,
    keyEq: config.keyEq ?? Object.is,
    valueEq: config.valueEq ?? Object.is,
    hashCode: config.hashCode
  }
}

export const conf = Symbol("conf")
export const firstB = Symbol("firstB")
export const lastB = Symbol("lastB")
export const buckets = Symbol("buckets")
export const size = Symbol("size")

export class LMap<K extends {},V extends {}> {

  protected [conf]:Conf<K,V>
  protected [buckets]:B<K,V>[] = []

  protected [firstB]:B<K,V> = null
  protected [lastB]:B<K,V> = null
  protected [size] = 0

  constructor(input:MapInput<K,V>, _config:Config<K,V>) {
    const c = confize(_config)
    if (c.load <= 0 || c.load >= 1) throw new TypeError("illegal load factor " + c.load)
    if (!Number.isSafeInteger(c.initial) || c.initial <= 0) throw new TypeError("illegal capacity " + c.initial)
    this[conf] = c
    this[buckets] = new Array(c.initial)
    this[buckets].fill(null)
    this.putAll(input)
  }

  static from<K extends {},V extends {}>(input:MapInput<K,V>, config:Config<K,V>) {
    return new LMap(input, config)
  }

  get size() { return this[size] }
  get capacity() { return this[buckets].length }
  get first():Entry<K,V>|undefined { return this[firstB] ?? undefined }
  get last():Entry<K,V>|undefined { return this[lastB] ?? undefined }
  get only():Entry<K,V> {
    if (this[size] !== 1) throw new OnlyError()
    return this[firstB]!
  }

  get keyEq():(k1:K,k2:K)=>boolean { return this[conf].keyEq }
  get valueEq():(v1:V,v2:V)=>boolean { return this[conf].valueEq }

  hasKey(key:K):boolean {
    return this.bucket(key) !== null
  }

  get(key:K):V|undefined {
    const bucket = this.bucket(key)
    this.afterGet(bucket)
    return bucket?.value
  }

  protected afterGet(bucket:B<K,V>) {}

  *[Symbol.iterator]():Iterator<Entry<K,V>> {
    for (let bucket = this[firstB]; bucket !== null; bucket = bucket.next) {
      yield bucket
    }
  }

  private grow() {
    const old = this[buckets]
    const n:B<K,V>[] = new Array(old.length * 2)
    n.fill(null)
    this[buckets] = n
    for (let bucket = this[firstB]; bucket != null; bucket = bucket.next) {
      const i = Math.abs(bucket.hashCode) % n.length
      const chain = n[i]
      n[i] = bucket
      bucket.chain = chain ?? null
    }
  }

  private bucket(key:K):B<K,V> {
    const hash = this[conf].hashCode(key)
    let bucket:B<K,V> = this[buckets][Math.abs(hash) % this[buckets].length] as B<K,V>
    while (bucket !== null) {
      if (bucket.hashCode === hash && this.keyEq(key, bucket.key)) return bucket
      bucket = bucket.chain
    }
    return null
  }

  put(key:K, value:V):V|undefined {
    if (this[size] / this[buckets].length >= this[conf].load) this.grow()
    const hashCode = this[conf].hashCode(key)
    const bucket:Bucket<K,V> = {
      key, value, hashCode, prev:null, next:null, chain:null,
    }
    const i = Math.abs(hashCode) % this[buckets].length
    let b = this[buckets][i] as B<K,V>
    while (b !== null) {
      if (b.hashCode === hashCode && this.keyEq(key, b.key)) {
        const r = b.value
        b.value = value
        this.afterGet(b)
        const elements = One.of(bucket as Entry<K,V>)
        this.fire({
          cleared:false, 
          added:{ elements:One.of(bucket as Entry<K,V>), at:undefined },
          removed:{ elements:One.of({ key:key, value:r }), at:undefined }
        })
        return r
      }
      b = b.chain
    }
    bucket.chain = this[buckets][i] as B<K,V>
    this[buckets][i] = bucket
    if (this[firstB] === null) {
      this[firstB] = bucket
      this[lastB] = bucket
    } else {
      this[lastB]!.next = bucket
      bucket.prev = this[lastB]
      this[lastB] = bucket
    }
    this[size]++
    this.fire({ cleared:false, added:{ elements:One.of(bucket as Entry<K,V>), at:undefined }})
    return undefined
  }

  removeKey(key:K):V|undefined {
    const hash = this[conf].hashCode(key)
    let prev:B<K,V> = null
    const i = Math.abs(hash) % this[buckets].length
    let bucket:B<K,V> = this[buckets][i] as B<K,V>
    while (bucket !== null) {
      if (bucket.hashCode === hash && this.keyEq(key, bucket.key)) break;
      prev = bucket
      bucket = bucket.chain
    }
    if (bucket === null) return undefined
    this[size]--
    if (prev === null) this[buckets][i] = bucket.chain
    else prev.chain = bucket.chain
    if (this[firstB] === bucket) this[firstB] = bucket.next
    if (this[lastB] === bucket) this[lastB] = bucket.prev
    if (bucket.next !== null) {
      bucket.next.prev = bucket.prev
    }
    if (bucket.prev !== null) {
      bucket.prev.next = bucket.next
    }
    const elements = One.of(bucket as Entry<K,V>)
    this.fire({ cleared:false, removed:{ elements, at:undefined }})
    return bucket.value
  }

  clear() {
    if (this.size === 0) return
    this[firstB] = null
    this[lastB] = null
    this[size] = 0
    this[buckets] = new Array(this[conf].initial)
    this[buckets].fill(null)
    this.fire({ cleared:true })
  }

}
export interface LMap<K extends {},V extends {}> extends MapChange<K,V>, MapRemove<K,V> {}
mixin(LMap, [MapChange, MapRemove])
