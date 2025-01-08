import { test, expect, beforeEach, describe } from "vitest"
import { Avatar, TreeMap, Node, LeveledNode, config } from "./index"
import { capture } from "../../../tools/capture/dist"
import { EX_EX, EX_IN, IN_EX, IN_IN } from "loudo-ds-core"

function compare(n1:number, n2:number) {
  return n1 - n2
}

function check2<K,V>(node?:Node<K,V>):boolean {
  if (node === undefined) return true
  const { left, right, level, key } = (node as LeveledNode<K,V>)
  if (left === undefined && right === undefined && level !== 1) {
    console.log(`leaf node ${key} has level of ${level}, not 1`)
    return false
  }
  if (level > 1 && (left === undefined || right === undefined)) {
    console.log(`node ${key} has level ${level} but not 2 children`)
    return false
  }
  if (left !== undefined && left.level !== level - 1) {
    console.log(`left node ${left.key} has level ${left.level}, not ${level - 1}`)
    return false
  }
  if (right !== undefined && right.level !== level && right.level !== level - 1) {
    console.log(`right node ${right.key} has level ${right.level}, should be ${level} or ${level - 1}`)
    return false
  }
  if (right?.right !== undefined && right.right.level >= level) {
    console.log(`grandchild node ${right.right.key} has level ${level}, which is >= ${level}`)
    return false
  }
  if (!check2(left)) return false
  if (!check2(right)) return false
  return true
}

function check<K,V>(node?:Node<K,V>) {
  if (!check2(node)) throw new Error()
}

let tree = new TreeMap<number,string>([], { compare })
let empty = tree
let c = capture(tree)
beforeEach(() => {
  tree = new TreeMap<number,string>([], { compare })
  tree[config].avatar.check = check
  c = capture(tree)
  empty = new TreeMap<number,string>([], { compare })
})

interface TestCase {
  name: string
  input: number[]
}

const cases:TestCase[] = [
  { name: "random1", input: [7, 6, 15, 5, 10, 9, 11, 13, 2, 8, 14, 3, 4, 1, 12] },
  { name: "random2", input: [12, 1, 4, 3, 14, 8, 2, 13, 11, 9, 10, 5, 15, 6, 7] },
  { name: "random3", input: [5, 14, 9, 13, 11, 8, 15, 6, 1, 2, 10, 7, 3, 4, 12] },
  { name: "ascending", input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { name: "descending", input: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
]

describe("TreeMap", () => { for (const tc of cases) {
  test(tc.name + " init", () => {
    expect(tree.size).toBe(0)
    expect(tree.first).toBeUndefined()
    expect(tree.last).toBeUndefined()
    expect([...tree]).toStrictEqual([])
  })
  describe(tc.name, () => {
    beforeEach(() => {
      tree.clear()
      for (const k of tc.input) tree.put(k, String(k))
      c.get()
    })
    test("after", () => {
      for (let k = 0; k <= 14; k++) expect(tree.after(k)?.key).toBe(k + 1)
      expect(tree.after(15)).toBeUndefined()
      expect(empty.after(1)).toBeUndefined()
    })
    test("before", () => {
      for (let k = 2; k <= 16; k++) expect(tree.before(k)?.key).toBe(k - 1)
      expect(tree.before(1)).toBeUndefined()
      expect(empty.before(1)).toBeUndefined()
    })
    test("compare", () => {
      tree.compare = (a:number,b:number) => b - a
      expect(c.get()).toStrictEqual({
        cleared: 15,
        added: { elements:[
          { key:15, value:"15" },
          { key:14, value:"14" },
          { key:13, value:"13" },
          { key:12, value:"12" },
          { key:11, value:"11" },
          { key:10, value:"10" },
          { key:9, value:"9" },
          { key:8, value:"8" },
          { key:7, value:"7" },
          { key:6, value:"6" },
          { key:5, value:"5" },
          { key:4, value:"4" },
          { key:3, value:"3" },
          { key:2, value:"2" },
          { key:1, value:"1" },
        ]}
      })
    })
    test("first", () => {
      expect(tree.first?.key).toBe(1)
      expect(tree.first?.value).toBe("1")
    })
    test("from", () => {
      for (let k = 1; k <= 15; k++) expect(tree.from(k)?.key).toBe(k)
      expect(tree.from(0)?.key).toBe(1)
      expect(tree.from(16)).toBeUndefined()
      expect(empty.from(1)).toBeUndefined()  
    })
    test("get", () => {
      for (let i = 1; i <= 15; i++) {
        expect(tree.get(i)).toBe(String(i))
      }
    })
    test("has", () => {
      expect(tree.has({ key:10, value:"10" })).toBe(true)
      expect(tree.has({ key:17, value:"17" })).toBe(false)
      expect(tree.has({ key:17, value:"10" })).toBe(false)
      expect(tree.has({ key:10, value:"17" })).toBe(false)
    })
    test("keyEq", () => {
      expect(tree.keyEq(1, 1)).toBe(true)
      expect(tree.keyEq(1, 2)).toBe(false)
    })
    test("keys", () => {
      expect([...tree.keys]).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    })
    test("last", () => {
      expect(tree.last?.key).toBe(15)
      expect(tree.last?.value).toBe("15")
    })
    test("only", () => {
      expect(() => { tree.only }).toThrowError()
    })
    test("put", () => {
      expect(tree.put(5, "FIVE")).toBe("5")
      expect(c.get()).toStrictEqual({
        removed: { elements:[{key:5, value:"5"}]},
        added: { elements:[{key:5, value:"FIVE"}]},
      })
      tree.put(5, "FIVE")
      expect(c.get()).toBeUndefined()
      expect(tree.get(5)).toBe("FIVE")
      expect(tree.size).toBe(15)
      expect(tree.put(5, "5")).toBe("FIVE")
      expect(c.get()).toStrictEqual({
        removed: { elements:[{key:5, value:"FIVE"}]},
        added: { elements:[{key:5, value:"5"}]},
      })
    })
    describe("range", () => {
      test("IN_IN", () => {
        for (let start = 1; start <= 13; start++) {
          const range = tree.range(start, start + 2, IN_IN).map(x => x.key)
          expect([...range]).toStrictEqual([start, start + 1, start + 2])
        }
      })
      test("IN_EX", () => {
        for (let start = 1; start <= 12; start++) {
          const range = tree.range(start, start +3, IN_EX).map(x => x.key)
          expect([...range]).toStrictEqual([start, start + 1, start + 2])
        }
      })
      test("EX_IN", () => {
        for (let start = 1; start <= 12; start++) {
          const range = tree.range(start, start + 3, EX_IN).map(x => x.key)
          expect([...range]).toStrictEqual([start + 1, start + 2, start + 3])
        }
      })
      test("EX_EX", () => {
        for (let start = 1; start <= 12; start++) {
          const range = tree.range(start, start + 4, EX_EX).map(x => x.key)
          expect([...range]).toStrictEqual([start + 1, start + 2, start + 3])
        }
      })
    })
    test("removeKey", () => {
      expect(tree.removeKey(17)).toBeUndefined()
      expect(c.get()).toBeUndefined()
      expect(tree.size).toBe(15)
      let size = tree.size
      for (const k of tc.input) {
        expect(tree.removeKey(k)).toBe(String(k))
        expect(c.get()).toStrictEqual({
          removed: { elements:[{key:k, value:String(k)} ]},
        })
        size--
        expect(tree.size).toBe(size)
      }
      expect(tree.size).toBe(0)
    })
    test("reversed", () => {
      const reversed = [...tree.reversed()]
      const keys = reversed.map(x => x.key)
      const values = reversed.map(x => x.value)
      expect(keys).toStrictEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
      expect(values).toStrictEqual(["15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"])
    })
    test("size", () => {
      expect(tree.size).toBe(15)
    })
    test("to", () => {
      for (let k = 1; k <= 15; k++) expect(tree.to(k)?.key).toBe(k)
      expect(tree.to(16)?.key).toBe(15)
      expect(tree.to(0)).toBeUndefined()
      expect(empty.to(1)).toBeUndefined()  
    })
    test("values", () => {
      expect([...tree.values]).toStrictEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"])
    })
  })
}})

test("clear", () => {
  tree.put(1, "1")
  tree.clear()
  expect([...tree.reversed()]).toStrictEqual([])
})

test("only", () => {
  expect(() => { tree.only }).toThrowError()
  tree.put(1, "1")
  expect(tree.only.key).toBe(1)
  expect(tree.only.value).toBe("1")
  tree.put(2, "2")
  expect(() => { tree.only }).toThrowError()
})

class Unbalanced<K,V> implements Avatar<K,V> {

  leaf(key:K, value:V):Node<K,V> {
    return { key, value }
  }

  afterAdd(node:Node<K,V>):Node<K,V>|undefined {
    return node
  }

  afterRemove(node?:Node<K,V>):Node<K,V>|undefined {
    return node
  }

}

test("leftside removal", () => {
  const tree = new TreeMap([], { compare, avatar: new Unbalanced<number,string>() })
  tree.put(1000, "1000")
  tree.put(100, "100")
  tree.put(10, "10")
  expect(tree.size).toBe(3)
  expect(tree.removeKey(100)).toBe("100")
  expect(tree.size).toBe(2)
})

test("firstIndex", () => {
  const t = new TreeMap<number,string>([{key:1, value:"1"}], { compare })
  const c = capture(t)
  expect(c.get()).toStrictEqual({
    added: { elements:[{key:1, value:"1"}] }
  })
})
