import { Array as ArrayI, array } from "loudo-ds-array-interfaces"
import { DataStructure, LEvent } from "loudo-ds-core"
import { reversible } from "loudo-ds-reversible"
import { Ordered, Exclude, IN_IN, IN_EX, EX_IN, EX_EX, ordered } from "loudo-ds-ordered"

interface Counted {
  start: number
  count: number
  forward: boolean
}

type Spawn<T> = Set<WeakRef<Base<T>>>

type Cmp<T> = (a:T,b:T)=>number

export abstract class La<T> extends DataStructure<T,number> implements ArrayI<T>,Ordered<number,T,number> {

  protected constructor() {
    super()
  }

  get [array]() { return true as const }
  get [ordered]() { return true as const }
  get [reversible]() { return true as const }

  static ify<T>(elements:Iterable<T>):La<T> {
    if (elements instanceof La) return elements
    return La.from(elements)
  }

  static from<T>(elements:Iterable<T>):La<T> {
    return new FullLa<T>(elements)
  }

  static of<T>(...elements:T[]):La<T> {
    return new FullLa<T>(elements)
  }

  abstract add(v:T, i?:number):void
  abstract addAll(v:Iterable<T>, i?:number):void

  abstract clear():void

  get firstIndex() { return 0 }
  get first():T|undefined { return this.empty ? undefined : this.at(0) }
  get last():T|undefined { return this.empty ? undefined : this.at(this.size - 1) }

  findIndex(f:(x:T)=>boolean) {
    for (let i = 0; i < this.size; i++) {
      const x = this.at(i)
      if (f(x)) return i
    }
    return undefined
  }

  abstract remove(i:number, count?:number):void
  abstract remove(f:(x:T,i:number)=>boolean):void
  abstract remove(first:number|((x:T,i:number)=>boolean), count?:number):void

  get reversed():this { return this.slice(this.size, 0, EX_IN) }
  abstract slice(i1:number, i2:number, exclude?:Exclude):this

  abstract at(i:number):T
  abstract set(i:number, v:T):void

  divide(f:Cmp<T>, left:number, right:number) {
    const pi = (left + right) >>> 1
    const pivot = this.at((left + right) >>> 1)
    while (left <= right) {
      while (f(this.at(left), pivot) < 0) left++
      while (f(this.at(right), pivot) > 0) right--
      if (left <= right) {
        const temp = this.at(left)
        this.set(left++, this.at(right))
        this.set(right--, temp)
      }
    }
    return left;
  }

  quicksort(f:Cmp<T>, left:number, right:number) {
    var mid = this.divide(f, left, right);
    if (left < mid - 1) this.quicksort(f, left, mid - 1);
    if (right > mid) this.quicksort(f, mid, right);
  }

  sort(f:(a:T,b:T)=>number) {
    this.quicksort(f, 0, this.size - 1)
    this.fire({cleared:true,added:{elements:this, at:0, count:this.size}})
  }

  protected bounds(i:number, extra:boolean = false):number {
    if (!Number.isSafeInteger(i) || i < 0) {
      throw new TypeError("invalid array index: " + i)
    }
    const size = this.size
    if (extra) {
      if (i > size) throw new TypeError(`insertion index ${i} > size of ${size}`)
    } else {
      if (i >= size) throw new TypeError(`index ${i} >= size of ${size}`)
    }
    return i
  }

  protected toCounted(start:number, end:number, exclude:Exclude):Counted {
    // you are not expected to understand this
    const s = start
    const e = end
    const size = this.size
    const excludedOne = (exclude.start || exclude.end) && (exclude.start != exclude.end)
    if (excludedOne && s === e) {
      const r = { start:start, count:0, forward: exclude.end }
      console.log({s,e,size,excludedOne,exclude,r})
      return r
    }
    if (start <= end) {
      if (exclude.start) start++
      if (exclude.end) end--
      if ((start < 0) || (start >= size)) throw sliceError(size, s, e, exclude)
      if ((end < 0) || (end >= size)) throw sliceError(size, s, e, exclude)
      if (start > end) return { start:start, count:start - end + 1, forward:false }
      return { start:start, count:end - start + 1, forward:true }
    }
    if (exclude.start) start--
    if (exclude.end) end++
    if ((start < 0) || (start >= size)) throw sliceError(size, s, e, exclude)
    if ((end < 0) || (end >= size)) throw sliceError(size, s, e, exclude)
    if (start < end) return { start:start, count:end - start + 1, forward:true }
    return { start:start, count:start - end + 1, forward:false }
  }

}

function sliceError(size:number, start:number, end:number, exclude:Exclude) {
  return new TypeError("array size is " + size + " so " + (exclude.start ? "(" : "[") + start + "," + end + (exclude.end ? ")" : "]") + " is illegal.")
}


class FullLa<T> extends La<T> {

  private readonly array:T[]
  private readonly kids = new Set<WeakRef<Base<T>>>()

  constructor(values:Iterable<T>) {
    super()
    if (Array.isArray(values)) {
      this.array = values
    } else {
      this.array = [...values]
    }
  }

  protected override fire(event:LEvent<T,number>) {
    super.fire(event)
    Base.fire(event, this.kids)
    return event
  }
  
  override get size() { return this.array.length }
  override [Symbol.iterator]() { return this.array[Symbol.iterator]() }

  override at(i:number):T {
    return this.array[this.bounds(i, false)]!
  }

  override clear() {
    this.array.splice(0, this.array.length)
    this.fire({cleared:true})
  }

  override set(i:number, x:T) {
    this.array[this.bounds(i)] = x
  }

  override add(element:T, at?:number) {
    at = at ?? this.size
    this.bounds(at, true)
    this.array.splice(at, 0, element)
    const event = {cleared:false, added:{ elements:[element], at, count:1 }}
    this.fire(event)
  }

  override addAll(v:Iterable<T>, at?:number) {
    at = at ?? this.size
    let count = 0
    this.bounds(at, true)
    for (const x of v) {
      this.array.splice(at + count, 0, x)
      count++
    }
    this.fire({cleared:false, added:{ elements:v, at, count}})
  }

  override remove(i:number, count?:number):void
  override remove(f:(x:T,i:number)=>boolean):void
  override remove(first:number|((x:T,i:number)=>boolean), count?:number) {
    if (typeof(first) === "number") {
      count = count ?? 1
      this.bounds(first)
      this.bounds(first + count - 1)
      const removed = this.array.splice(first, count)
      this.fire({cleared:false, removed:{elements:removed, at:first, count:removed.length}})
      return
    }
    const set = new Set<number>()
    const a = this.array
    for (let i = 0; i < a.length; i++) {
      const x = a[i]!
      if (first(x,i)) set.add(i)
    }
    let ofs = 0
    for (const i of set) {
      const removed = a.splice(i - ofs, 1)
      this.fire({cleared:false, removed:{elements:removed, at:i - ofs, count:removed.length}})
      ofs++
    }
  }

  private spawn(la:Base<T>):this {
    this.kids.add(new WeakRef(la))
    return la as unknown as this
  }

  override slice(start:number, end:number, exclude = IN_EX) {
    const ii = this.toCounted(start, end, exclude)
    return this.spawn(ii.forward ? new FLa<T>(this, ii.start, ii.count) : new RLa<T>(this, ii.start, ii.count))
  }

}

abstract class Base<T> extends La<T> {

  constructor(protected full:FullLa<T>, protected start:number, protected count:number) {
    super()
  }

  override get size() { return this.count }
  
  override at(i:number):T {
    return this.full.at(this.bounds(i))
  }

  override set(i:number, v:T) {
    this.full.set(this.bounds(i), v)
  }

  protected abstract handle(event:LEvent<T,number>):void

  static fire<T>(event:LEvent<T,number>, spawn:Spawn<T>) {
    for (const w of spawn) {
      const la = w.deref()
      /* v8 ignore next */
      if (la === undefined) spawn.delete(w)
      else la.handle(event)
    }
    return event
  }

}


class FLa<T> extends Base<T> {

  protected override bounds(index:number, extra?:boolean) {
    const i = super.bounds(index, extra)
    return this.start + i
  }

  override *[Symbol.iterator]() {
    const { start, count, full } = this
    const max = start + count
    for (let i = start; i < max; i++) {
      yield full.at(i)
    }
  }

  override clear() {
    this.full.remove(this.start, this.count)
  }

  override slice(x:number, y:number, exclude = IN_EX):this {
    const { start, count, full, size } = this
    const ii = this.toCounted(x, y, exclude)
    if (ii.forward) {
      return new FLa<T>(full, start + ii.start, ii.count) as never
    }
    return new RLa<T>(full, start + ii.start, ii.count) as never
  }

  override add(v:T, at?:number) {
    at = at ?? this.size
    const i = this.bounds(at, true)
    this.full.add(v, i)
  }

  override addAll(v:Iterable<T>, at?:number) {
    at = at ?? this.size
    const i = this.bounds(at, true)
    this.full.addAll(v, i)
  }

  override remove(i:number, count?:number):void
  override remove(f:(x:T,i:number)=>boolean):void
  override remove(first:number|((x:T,i:number)=>boolean), count?:number) {
    if (typeof(first) === "number") {
      count = count ?? 1
      const i = this.bounds(first)
      this.bounds(first + count - 1)
      this.full.remove(i, count)
      return
    }
    const set = new Set<number>()
    for (let i = 0; i < this.count; i++) {
      const x = this.at(i)
      if (first(x, i)) set.add(i)
    }
    for (const i of set) {
      this.full.remove(this.start + i)
    }
  }

  protected handle(event: LEvent<T,number>) {
    // TODO: set
    if (event.cleared && !event.added) {
      this.start = 0
      this.count = 0
      this.fire({cleared:true})
      return
    }
    if (event.removed) {
      const r = handleRemove(this.start, this.start + this.count - 1, this.count, event)
      this.start = r.newStart
      if (r.nop) {
        return
      }
      this.count = r.newCount
      if (r.newCount === 0) {
        this.fire({cleared:true})
        return
      }
      const elements = La.ify(event.removed.elements).slice(r.from, r.to, IN_IN)
      const { at, count } = r
      this.fire({cleared:false, removed:{elements, at, count}})
    }
    if (event.added) {
      const i = event.added.at
      const end = this.start + this.count
      if (i < this.start || i > end) return
      const at = i - this.start
      const count = event.added.count
      this.count += count
      this.fire({cleared:false, added:{ at, count, elements:event.added.elements }})
    }
  }

}

class RLa<T> extends Base<T> {

  override get size() {
    return this.count
  }

  protected override bounds(index:number, extra?:boolean) {
    const i = super.bounds(index, extra)
    return this.start - i
  }

  override *[Symbol.iterator]() {
    const { start, count, full } = this
    const min = start - count
    for (let i = start; i > min; i--) {
      yield full.at(i)
    }
  }

  override slice(x:number, y:number, exclude = IN_EX):this {
    const { start, count, full, size } = this
    const ii = this.toCounted(x, y, exclude)
    if (ii.forward) {
      return new RLa<T>(full, start - ii.start, ii.count) as never
    }
    return new FLa<T>(full, start - ii.start, ii.count) as never
  }

  override add(element:T, at?:number) {
    at = at ?? this.count
    this.bounds(at, true)
    this.full.add(element, this.start - at + 1)
  }

  override addAll(v:Iterable<T>, at?:number) {
    at = at ?? this.count
    this.bounds(at, true)
    this.full.addAll(reverse(v), this.start - at + 1)
  }
  
  override clear() {
    const i = this.start - this.count + 1
    this.full.remove(i, this.count)
  }

  override remove(i:number, count?:number):void
  override remove(f:(x:T,i:number)=>boolean):void
  override remove(first:number|((x:T,i:number)=>boolean), count?:number) {
    if (typeof(first) === "number") {
      count = count ?? 1
      this.bounds(first)
      this.bounds(first + count - 1)
      const i = this.bounds(first) - count + 1
      this.full.remove(i, count)
      return
    }
    const set = new Set<number>()
    for (let i = 0; i < this.count; i++) {
      const x = this.at(i)
      if (first(x, i)) {
        set.add(i)
      }
    }
    for (const i of set) {
      this.full.remove(this.bounds(i))
    }
  }

  protected handle(event: LEvent<T,number>) {
    if (event.cleared && !event.added) {
      this.start = 0
      this.count = 0
      this.fire({cleared:true})
      return
    }
    if (event.removed) {
      const thisStart = this.start - this.count + 1
      const thisEnd = this.start
      const r = handleRemove(thisStart, thisEnd, this.count, event)
      if (r.nop) {
        this.start = r.newStart + this.count - 1
        return
      }
      r.at = this.count - r.at - r.count
      const eventEnd = event.removed.at + event.removed.count - 1
      if (event.removed.at <= thisStart) {
        this.start = event.removed.at + r.newCount - 1
      } else {
        this.start = thisStart + r.newCount - 1
      }
      this.count = r.newCount
      if (r.newCount === 0) {
        this.fire({cleared:true})
        return
      }
      const elements = La.ify(event.removed.elements).slice(r.to, r.from, IN_IN)
      this.fire({cleared:false, removed:{elements, at:r.at, count:r.count}})
    }
    if (event.added) {
      const i = event.added.at
      const start = this.start - this.count + 1
      const end = this.start + 1
      if (i < start || i > end) return
      const at = this.start - i + 1
      const count = event.added.count
      const elements = reverse(event.added.elements)
      this.count += count
      this.start += count
      this.fire({cleared:false, added:{ at, count, elements }})
    }
  }

}

function reverse<T>(elements:Iterable<T>) {
  if (Array.isArray(elements)) return La.from(elements).reversed
  if ("reversed" in elements) return elements.reversed as Iterable<T>
  return La.ify(elements).reversed
}


interface Nop {
  nop: true
  newStart: number
}

interface Fire {
  nop: false
  at: number
  count: number
  from: number
  to: number
  newCount: number
  newStart: number
}

type RemoveResult = Nop | Fire

function handleRemove<T>(thisStart:number, thisEnd:number, thisCount:number, event:LEvent<T,number>):RemoveResult {
  const { at, count, elements } = event.removed!
  const eventEnd = at + count - 1
  if (at > thisEnd) return { nop:true, newStart:thisStart }
  let fire:Fire = { nop:false, at:0, count:0, from:0, to:0, newCount:0, newStart:0 }
  if (at >= thisStart) {
    fire.newStart = thisStart
    fire.from = 0
    if (eventEnd <= thisEnd) {
      fire.at = at - thisStart
      fire.count = count
    } else {
      fire.at = at - thisStart
      fire.count = thisEnd - at + 1
    }
  } else if (eventEnd >= thisStart) {
    const c = eventEnd - thisStart + 1
    fire.count = Math.min(c, thisCount)
    fire.at = 0
    fire.from = count - c
    fire.newStart = thisStart - fire.from
  } else {
    return { nop:true, newStart: thisStart - count }
  }
  fire.newCount = thisCount - fire.count
  fire.to = fire.from + fire.count - 1
  return fire
}
