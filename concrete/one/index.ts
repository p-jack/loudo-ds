import { mixin, Tin } from "loudo-ds-core"

export class One<T extends {}> {

  constructor(protected readonly v:T) {}

  get size() { return 1 }
  get first() { return this.v }
  get last() { return this.v }
  get only() { return this.v }
  *[Symbol.iterator]() { yield this.v }

  static of<T extends {}>(v:T) { return new One(v) }

}
export interface One<T extends {}> extends Tin<T> {}
mixin(One, [Tin])
