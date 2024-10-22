# loudo-ds-core

Provides core interfaces and base classes for loud data structures.

## `BigIterable`

The `BigIterable` interface extends a standard `Iterable` with the
`map`, `filter`, and `reduce` functions, allowing you to easily chain
them. You can make a regular iterable big via the `big` function:

```TypeScript
const set = new Set([1, 2, 3, 4, 5])
const big = big(set)
const sum = big.filter(x => x % 2 === 1).reduce(0, (a,x) => a + x)
console.log(sum) // 9
```

## `DataStructure`

The abstract `RODataStructure` class is the basis for every data structure
in the `loudo-ds` family. Data structures have two type parameters:
`T` which indicates the type of element the data structure contains,
and `I` which indicates the type of index for the data structure.
(Note that `I` might be `undefined` for unindexed data structures such
as hash tables or heaps.)

At minimum, a data structure consists of an iterator and a size property.
Specific subclasses of `RODataStructure` provide additional properties
and methods appropriate to the data structures they implement.

Note that `RODataStructure` extends `BigIterable`, so all data structures
support the `map`, `filter`, and `reduce` operations.

The `RO` stands for read-only. The abstract `DataStructure` class extends
`RODataStructure`, adding support for mutations and events.

## LEvent

The data structures provided by `loudo-ds` are _loud_, meaning they
can broadcast changes made to them to interested parties. Such changes
are represented by the `LEvent` class, which consists of three fields:

* `cleared`: This is set to true if the entire data structure was cleared.
In that case, `removed` will not be present.
* `removed`: An iterable of elements that were removed, as well as the
index they were removed from (if the data structure is indexed.)
* `added`: An iterable of elements that were added, as well as the index
they were added at (if the data structure is indexed.)

It is possible for both `removed` and `added` to be present in the same
event. In that case, a listener should process the `removed` iterable
first, then process the `added` iterable.

It's also possible for both `cleared` and `added` to be present in the
same event. That occurs during bulk operations that necessarily alter
the entire data structure, such as sorting an array.

## Event Handlers

An event handler is simply a function that takes an `LEvent`. You can
register an event handler via a `DataStructure` instance's `hear`
method, and you can unregister via the `unhear` method. You can use
the `hearing` method to determine if a particular event handler is
registered or not.
