import { test, expect } from "vitest"
import { BaseMapSort } from "./index"
import { mixed, mixin } from "loudo-ds-core"
import { BaseMap } from "loudo-ds-map-interfaces"

class X {}
interface X extends BaseMapSort<number,string> {}
mixin(X, [BaseMapSort])

test("mapsorts", () => {
  const m = new X()
  expect(mixed(m, BaseMap)).not.toBeUndefined()
})
