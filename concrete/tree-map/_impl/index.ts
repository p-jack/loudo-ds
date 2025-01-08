// TODO: set "compare" property and resort

import { IN_EX, Include, OnlyError, Sized, sized, stash } from "loudo-ds-core"
import { MapChange, MapInput, MapRemove } from "loudo-ds-map-interfaces"
import { BaseMapSort, MapSortChange } from "loudo-ds-mapsort-interfaces"
import { One } from "loudo-ds-one"
import { mixin } from "loudo-mixin"

export interface Node<K,V> {
  key: K
  value: V
  left?: Node<K,V>
  right?: Node<K,V>
}

function rightMost<K,V>(n:Node<K,V>) {
  while (n.right !== undefined) n = n.right; return n
}

function leftMost<K,V>(n:Node<K,V>) {
  while (n.left !== undefined) n = n.left; return n
}

export interface Avatar<K,V> {
  leaf(key:K, value:V):Node<K,V>
  afterAdd(node:Node<K,V>):Node<K,V>|undefined
  afterRemove(node?:Node<K,V>):Node<K,V>|undefined
  check?:(node?:Node<K,V>)=>void
}

export interface LeveledNode<K,V> extends Node<K,V> {
  level:number
  left?:LeveledNode<K,V>
  right?:LeveledNode<K,V>
}

function level<K,V>(node?:Node<K,V>) {
  return node === undefined ? 0 : (node as LeveledNode<K,V>).level
}

function skew<K,V>(root?:Node<K,V>) {
  if (root === undefined) return root
  if (level(root.left) === level(root)) {
    const save = root;
    root = root.left!;
    save.left = root.right;
    root.right = save;
  }
  root.right = skew(root.right);
  return root
}

function split<K,V>(root?:Node<K,V>) {
  /* v8 ignore next 1 */
  if (root === undefined) return undefined
  if (level(root.right?.right) === level(root)) {
    const t = root;
    root = root.right!;
    t.right = root.left;
    root.left = t;
    (root as any).level += 1;
    root.right = split(root.right);
  }
  return root;
}


class AA<K,V> implements Avatar<K,V> {

  leaf(key:K, value:V):LeveledNode<K,V> {
    return { key, value, level:1 }
  }

  afterAdd(node:Node<K,V>):Node<K,V>|undefined {
    return split(skew(node))
  }

  afterRemove(n?:Node<K,V>):Node<K,V>|undefined {
    if (n === undefined) return undefined
    const root = n as LeveledNode<K,V>
    const ll = root.left?.level ?? 0
    const rl = root.right?.level ?? 0
    if (ll < root.level - 1 || rl < root.level - 1) {
      root.level -= 1
      if (rl > root.level) {
        root.right!.level = root.level
      }
      return split(skew(root))
    }
    return root
  }

}

interface Conf<K,V> {
  compare:(k1:K, k2:K)=>number
  avatar:Avatar<K,V>
  keyEq:(a:K,b:K)=>boolean
  valueEq:(a:V,b:V)=>boolean
}

export interface Config<K,V> {
  readonly compare:(k1:K, k2:K)=>number
  readonly avatar?:Avatar<K,V>
  readonly valueEq?:(a:V,b:V)=>boolean
}

interface Put<K,V> {
  node: Node<K,V>
  old?: V
}

interface Remove<K,V> {
  node?:Node<K,V>
  old?:V
}

interface Entry<K,V> {
  key: K
  value: V
}

const inIn = (from:number, to:number) => from <= 0 && to >= 0
const inEx = (from:number, to:number) => from <= 0 && to > 0
const exIn = (from:number, to:number) => from < 0 && to >= 0
const exEx = (from:number, to:number) => from < 0 && to > 0

function includer(include:Include):(from:number,to:number)=>boolean {
  const { start, end } = include
  if (start && end) return inIn
  if (start && !end) return inEx
  if (!start && end) return exIn
  return exEx
}

export const root = Symbol("root")
export const config = Symbol("config")
export const size = Symbol("size")
const compare = Symbol("compare")
const put = Symbol("put")
const remove = Symbol("remove")
const reversed = Symbol("reversed")
const range = Symbol("range")
const after = Symbol("after")
const before = Symbol("before")
const from = Symbol("from")
const to = Symbol("to")
const resort = Symbol("resort")

function one<K extends {},V extends {}>(key:K, value:V) {
  return One.of({ key, value })
}

export class TreeMap<K extends {},V extends {}> {

  protected [root]:Node<K,V>|undefined
  readonly [config]:Conf<K,V>
  protected [size]:number = 0
  private [compare]:(a:K,b:K)=>number

  constructor(entries:MapInput<K,V>, c:Config<K,V>) {
    this[config] = {
      compare:c.compare,
      keyEq:(a:K,b:K)=>c.compare(a,b) === 0,
      valueEq:c.valueEq ?? Object.is,
      avatar:c.avatar ?? new AA()
    }
    this[compare] = c.compare
    this.putAll(entries)
  }

  get size() { return this[size] }
  get keyEq() { return this[config].keyEq }
  get valueEq() { return this[config].valueEq }

  get compare() { return this[compare] }
  set compare(f:(a:K,b:K)=>number) {
    this[compare] = f
    const n = this[root]
    const oldSize = this[size]
    this[root] = undefined
    this[size] = 0
    this[resort](n)
    console.log([...this])
    this.fire({
      cleared:oldSize,
      added:{ elements:this, at:-1 },
    })
  }

  private [resort](n?:Node<K,V>) {
    if (n === undefined) return
    this[resort](n.left)
    this[resort](n.right)
    const f = this[put](n.key, n.value, this[root])
    this[root] = this[config].avatar.afterAdd(f.node)
  }

  protected get firstIndex() { return -1 }

  get first():Entry<K,V>|undefined {
    return this[root] ? leftMost(this[root]) : undefined
  }

  get last():Entry<K,V>|undefined {
    return this[root] ? rightMost(this[root]) : undefined
  }

  get only():Entry<K,V> {
    if (this.size !== 1) throw new OnlyError()
    return this[root]!
  }

  *[Symbol.iterator]():Iterator<Entry<K,V>> {
    let current = this[root]
    if (current === undefined) return
    const stack:Node<K,V>[] = []
    while (stack.length > 0 || current !== undefined) {
      if (current === undefined) {
        current = stack.pop()!
        yield current
        current = current.right
      } else {
        stack.push(current)
        current = current.left
      }
    }
  }

  private *[range](node:Node<K,V>|undefined, start:K, end:K, inc:(fromc:number, toc:number)=>boolean):Generator<Entry<K,V>> {
    if (node === undefined) return
    const cmp = this.compare
    const fromc = cmp(start, node.key)
    const toc = cmp(end, node.key)
    if (fromc < 0) {
      yield* this[range](node.left, start, end, inc)
    }
    if (inc(fromc, toc)) {
      yield node
    }
    if (toc > 0) {
      yield* this[range](node.right, start, end, inc)
    }
  }

  range(start:K, end:K, include = IN_EX) {
    const inc = includer(include)
    const me = this
    return stash(() => me[range](me[root], start, end, inc), me.eq)
  }

  private [after](k:K, n?:Node<K,V>):Entry<K,V>|undefined {
    const cmp = this.compare
    while (n) {
      const c = cmp(n.key, k)
      if (c < 0 && n.right) {
        n = n.right;
      } else if (c > 0) { 
        if (n.left && cmp(rightMost(n.left).key, k) > 0) n = n.left;
        else return n
      } else {
        if (n.right) return leftMost(n.right)
        else return undefined
      }
    }
    return undefined;
  }

  after(k:K):Entry<K,V>|undefined {
    return this[after](k, this[root])
  }

  private [before](k:K, n?:Node<K,V>):Entry<K,V>|undefined {
    const cmp = this.compare
    while (n) {
      const c = cmp(n.key, k)
      if (c > 0 && n.left) {
        n = n.left;
      } else if (c < 0) { 
        if (n.right && cmp(leftMost(n.right).key, k) < 0) n = n.right;
        else return n
      } else {
        if (n.left) return rightMost(n.left)
        else return undefined
      }
    }
    return undefined;
  }

  before(k:K):Entry<K,V>|undefined {
    return this[before](k, this[root])
  }

  private [from](k:K, n?:Node<K,V>) {
    const cmp = this.compare
    while (n) {
      const c = cmp(n.key, k)
      if (c === 0) return n
      if (c < 0) {
        if (n.right) n = n.right
        else return undefined
      } else if (c > 0) { 
        if (n.left && cmp(rightMost(n.left).key, k) >= 0) n = n.left;
        else return n
      }
    }
    return undefined;
  }

  from(k:K):Entry<K,V>|undefined {
    return this[from](k, this[root])
  }

  private [to](k:K, n?:Node<K,V>) {
    const cmp = this.compare
    while (n) {
      const c = cmp(n.key, k)
      if (c === 0) return n
      if (c > 0) {
        if (n.left) n = n.left
        else return undefined
      } else  { 
        if (n.right && cmp(leftMost(n.right).key, k) <= 0) n = n.right;
        else return n
      }
    }
    return undefined;
  }

  to(k:K):Entry<K,V>|undefined {
    return this[to](k, this[root])
  }

  private *[reversed]() {
    let current = this[root]
    if (current === undefined) return
    const stack:Node<K,V>[] = []
    while (stack.length > 0 || current !== undefined) {
      if (current === undefined) {
        current = stack.pop()!
        yield current
        current = current.left
      } else {
        stack.push(current)
        current = current.right
      }
    }
  }

  reversed():Sized<Entry<K,V>> {
    const me = this
    return sized(() => me[reversed](), () => me.size, me.eq)
  }

  get(key:K):V|undefined {
    let node = this[root]
    const cmp = this.compare
    while (node !== undefined) {
      const c = cmp(key, node.key)
      if (c === 0) {
        return node.value
      } else if (c < 0) {
        node = node.left
      } else {
        node = node.right
      }
    }
    return undefined
  }

  private [put](key:K, value:V, node?:Node<K,V>):Put<K,V> {
    const cmp = this.compare
    const avatar = this[config].avatar
    if (node === undefined) {
      this[size]++
      return { node:avatar.leaf(key, value), old:undefined }
    }
    const r = cmp(key, node.key)
    if (r === 0) {
      const old = node.value
      node.value = value
      return { node, old }
    } else if (r < 0) {
      const f = this[put](key, value, node.left)
      node.left = avatar.afterAdd(f.node)
      return { node, old:f.old }
    } else {
      const f = this[put](key, value, node.right)
      node.right = avatar.afterAdd(f.node)
      return { node, old:f.old }
    }
  }

  put(key:K, value:V):V|undefined {
    const avatar = this[config].avatar
    const f = this[put](key, value, this[root])
    this[root] = avatar.afterAdd(f.node)
    avatar.check?.(this[root])
    if (f.old === undefined) {
      this.fire({added:{elements:one(key, value), at:-1}})
    } else if (!this.valueEq(f.old, value)) {
      this.fire({
        added: { elements:one(key, value), at:-1 },
        removed: { elements:one(key, f.old), at:-1 }
      })
    }
    return f.old
  }

  private [remove](key:K, node?:Node<K,V>):Remove<K,V> {
    if (node === undefined) return {}
    let old
    const c = this.compare(key, node.key)
    if (c === 0) {
      old = node.value
      if (node.left !== undefined && node.right !== undefined) {
        let heir = node.left;
        while (heir.right !== undefined) {
          heir = heir.right;
        }
        node.key = heir.key;
        node.value = heir.value;
        const f = this[remove](node.key, node.left)
        node.left = f.node
      } else if (node.left === undefined) {
        node = node.right;
      } else {
        node = node.left;
      }
    } else if (c > 0) {
      const f = this[remove](key, node.right)
      node.right = f.node
      old = f.old
    } else {
      const f = this[remove](key, node.left)
      node.left = f.node
      old = f.old
    }
    return { node:this[config].avatar.afterRemove(node), old }
  }

  removeKey(key:K):V|undefined {
    const f = this[remove](key, this[root])
    this[root] = f.node
    this[config].avatar.check?.(this[root])
    if (f.old !== undefined) {
      this[size]--
      this.fire({ removed:{ elements:one(key, f.old), at:-1}})
    }
    return f.old
  }

  clear() {
    const old = this[size]
    this[root] = undefined
    this[size] = 0
    if (old > 0) this.fire({ cleared:old })
  }

}
export interface TreeMap<K extends {},V extends {}> extends MapSortChange<K,V>, MapChange<K,V>, MapRemove<K,V> {}
mixin(TreeMap, [BaseMapSort, MapChange, MapRemove])
