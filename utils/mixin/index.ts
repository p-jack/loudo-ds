const sym = Symbol("mixins")

type Class = abstract new(...args:any[])=>any

export function mixin(c:Class, m:Class[]) {
  let set = (c as any)[sym] as Set<Class>|undefined
  if (set === undefined) {
    set = new Set();
    (c as any)[sym] = set
  }
  const p1 = c.prototype
  for (const x of m.filter(x => !set.has(x))) {
    const p2 = x.prototype
    const d = Object.getOwnPropertyDescriptors(p2);
    delete (d as any)["constructor"]
    delete (d as any)["prototype"]
    Object.defineProperties(p1, d)
    set.add(x)
  }
}

export function mixed(target:Class, mixin:Class) {
  const set = (target as any)[sym] as Set<Class>
  return set ? set.has(mixin) : false
}
