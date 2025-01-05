import { test, expect } from "vitest"
import { BaseMapSort } from "./index"
import { mixed, mixin } from "loudo-mixin"
import { BaseMap } from "loudo-ds-map-interfaces"
import { Sized, Stash } from "../../core"
import { Loud } from "loudo-ds-core"

class X {}
interface X extends BaseMapSort<number,string> {}
mixin(X, [BaseMapSort])

test("mapsorts", () => {
  const m = new X()
  expect(mixed(m, BaseMapSort)).not.toBeUndefined()
  expect(mixed(m, BaseMap)).not.toBeUndefined()
  expect(mixed(m, Loud)).not.toBeUndefined()
  expect(mixed(m, Sized)).not.toBeUndefined()
  expect(mixed(m, Stash)).not.toBeUndefined()
})
