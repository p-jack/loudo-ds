import { describe, expect, test } from "vitest"
import { BaseSet, SetAdd, SetRemove } from "./index"
import { Loud, Tin, mixed, mixin } from "loudo-ds-core"

test("sets", () => {
  expect(mixed(BaseSet, Tin)).not.toBeUndefined()
  expect(mixed(SetAdd, Loud)).not.toBeUndefined()
  expect(mixed(SetAdd, BaseSet)).not.toBeUndefined()
  expect(mixed(SetRemove, Loud)).not.toBeUndefined()
  expect(mixed(SetRemove, BaseSet)).not.toBeUndefined()
})
