import { LEvent, Mod as ModI, Loud } from "loudo-ds-core"

export interface Mod<T extends {},I> {
  elements:T[]
  at?:I
}

export interface Evt<T extends {},I> {
  cleared: boolean
  added?: Mod<T,I>
  removed?: Mod<T,I>
}

export interface Capture<T extends {},I> {
  get():Evt<T,I>|undefined
}

function mod<T extends {},I>(mod?:ModI<T,I>):Mod<T,I>|undefined {
  if (mod === undefined) return undefined
  const at = mod.at
  const elements = [...mod.elements]
  if (elements.length === 0) throw new TypeError("mod should have elements")
  const first = elements[0]!
  if (typeof(first) === "object" && "key" in first && "value" in first) {
    return { elements:elements.map((x:any) => { return { key:x.key, value:x.value }}) as never}
  }
  if (at === undefined) return { elements }
  return { at, elements }
}

function evt<T extends {},I>(event?:LEvent<T,I>):Evt<T,I>|undefined {
  if (event === undefined) return undefined
  const e:Evt<T,I> = { cleared: event.cleared }
  const a = mod(event.added)
  if (a) e.added = a
  const r = mod(event.removed)
  if (r) e.removed = r
  return e
}

export function capture<T extends {},I = undefined>(stash:Loud<T,I>):Capture<T,I> {
  let captured:LEvent<T,I>|undefined = undefined
  stash.hear(event => {
    captured = event
  })
  return {
    get:() => {
      const r = captured;
      captured = undefined;
      return evt(r)
    },
  }
}