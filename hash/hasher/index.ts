const MAX = 4_294_967_295

function hash(hash:number, adj:number) {
  hash = ((hash << 5) - hash) ^ adj
  return hash & MAX
}

export class Hasher {

  result = 5381

  boolean(x:boolean) {
    this.result = hash(this.result, x ? 1 : 0)
    return this
  }

  double(n:number) {
    const fa = new Float64Array(1)
    const ba = new Uint8Array(fa.buffer)!
    fa[0] = n
    const i1 = ba[0]! | (ba[1]! << 8) | (ba[2]! << 16) | (ba[3]! << 24)
    const i2 = ba[4]! | (ba[5]! << 8) | (ba[6]! << 16) | (ba[7]! << 24)
    this.result = hash(hash(this.result, i1), i2)
    return this
  }

  integer(n:number) {
    this.result = hash(this.result, n)
    return this
  }

  string(s:string) {
    if (s.length === 0) return this;
    let r = this.result
    for (let i = 0; i < s.length; i++) {
      r = hash(r, s.charCodeAt(i))
    }
    this.result = r
    return this
  }
}

export function hashString(s:string) { return new Hasher().string(s).result }
export function hashInteger(n:number) { return new Hasher().integer(n).result }
export function hashDouble(n:number) { return new Hasher().double(n).result }
