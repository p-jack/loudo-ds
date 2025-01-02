# loudo-mixin

A simple, small mixin library. It is just over 1K minified and has
no dependencies.

This library works with:
* both abstract and concrete classes
* generic and non-generic classes
* private, protected, and public constructors
* both string and symbol property keys

This library does *not* copy static class properties from a mixin to
a target class. I couldn't think of a good use case for that, and I'm
trying to keep the library small.

## Example

```TypeScript
import mixin, mixed from "loudo-mixin"

class Mixin {
  get mixinField() { return "mixin" }
}

class Target {
  get targetField() { return "target" }
}
const target = new Target()

// For type safety, we need to manually tell the compiler that
// our Target class will extend the Mixin class's interface.
interface Target extends Mixin {}
// Then the `mixin` function actually applies the mixin.
mixin(Target, [Mixin])

console.log(target.mixinField) // "mixin"

const o:object = target
if (mixed(o, Mixin)) console.log(o.mixinField) // "mixin"
```

## The First Rule of Mixin Club

You can use *either* classical prototype inheritance *or* this mixin
library, *but never both on the same class*. Doing so will lead to
strange behavior. Fire and brimstone coming down from the skies! Rivers
and seas boiling! Forty years of darkness! Earthquakes, volcanoes!
The dead rising from the grave! Human sacrifice, cats and dogs living
together, mass hysteria!

So please don't do that. *Every* target class and *every* mixin class
should have no superclass, as in the example above.

## The `mixin` Function

```TypeScript
mixin(target:Class, mixins:Iterable<Class>):void
mixin(target:Class, mixin:Class, options:Options):void
```

The `mixin` function has two signatures. The first applies a list of
mixins to a target class. The second only applies one mixin, but allows
you to specify overrides.

The `mixin` function copies class fields and methods from the mixin to
the target. Constructors are not copied, nor are static members.

Also, by default, `mixin` will not overwrite a property that already
exists on the target. If you do want to overwrite a pre-existing
property, you have to use the second call signature and specify the
properties you want to override:

```TypeScript
class Foo {
  get foo() { return "foo" }
}

const foo = new Foo()
console.log(foo.foo) // foo

class Foo2 {
  get foo() { return "foo2" }
}
interface Foo extends Foo2 {}
mixin(Foo, [Foo2])

console.log(foo.foo) // foo

class Fubar {
  get foo() { return "fubar" }
}
interface Bar extends Foo {}
mixin(Foo, Fubar, { overrides:"foo" })

console.log(foo.foo) // "fubar"
```

## The `mixed` Function

```TypeScript
mixed<M>(o:object, mixin:Class<M>):o is M
```

The `mixed` function takes an object and a mixin class, and returns
`true` if the object's class has the mixin applied. It's a type guard,
so if it returns `true`, the compiler will know that the object has
the mixin's interface. You can therefore use it as a replacement for
`instanceof` for mixed classes.

## Augments

Since there's no superclasses, you can't create a method that wraps
another method by calling `super`. Instead, you can use the `augment`
function. You can augment any class, including those using classical
inheritance.

Here's an example that adds a limit to the native `Set` class:

```TypeScript
declare global {
  interface Set<T> {
    limit?:number
  }
}

augment(Set, "add", (original, set, value) => {
  if (set.limit && set.size >= set.limit) throw new Error("limit reached")
  return original.call(set, value)
})

const set = new Set([1,2,3])
set.limit = 4
set.add(4) // fine
set.add(5) // throws "limit reached"
```
