import { expect, test } from "vitest"
import { BaseSort, SortAdd, SortRemove } from "./index"
import { Loud, Tin, mixed, mixin } from "loudo-ds-core"

test("sets", () => {
  expect(mixed(BaseSort, Tin)).not.toBeUndefined()
  expect(mixed(SortAdd, Loud)).not.toBeUndefined()
  expect(mixed(SortAdd, BaseSort)).not.toBeUndefined()
  expect(mixed(SortRemove, Loud)).not.toBeUndefined()
  expect(mixed(SortRemove, BaseSort)).not.toBeUndefined()
})
