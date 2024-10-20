# loudo-ds-core

Provides core interfaces and base classes for loud data structures.

## `BigIterable`

The `BigIterable` interface extends a standard `Iterable` with the
`map`, `filter`, and `reduce` functions, allowing you to easily chain
them. You can make a regular iterable big via the `embiggen` function:

```TypeScript
const set = new Set([1, 2, 3, 4, 5])
const big = embiggen(set)
const sum = big.filter(x => x % 2 === 1).reduce(0, (a,x) => a + x)
console.log(sum) // 9
```

## `DataStructure`

The abstract `DataStructure` class is the basis for every data structure
in the `loudo-ds` family. Data structures have two type parameters:
`T` which indicates the type of element the data structure contains,
and `I` which indicates the type of index for the data structure.
(Note that `I` might be `undefined` for unindexed data structures such
as hash tables or heaps.)

At minimum, a data structure consists of an iterator and a size property.
Specific subclasses of `DataStructure` provide additional properties
and methods appropriate to the data structures they implement. The base 
`DataStructure` provides `map`, `filter`, and `reduce` operations.

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

## `Reversible`

The abstract `Reversible` class is the base class for reversible data
structures, such as arrays. It provides the following:

* `first`: Returns the first element in the data structure, or undefined
if the data structure is empty.
* `last`: Returns the last element in the data structure, or undefined
if the data structure is empty.
* `reversed`: Returns a view of the data structure whose iterators
return the data structure's elements in reverse order.

Note that `reversed` returns a _view_, meaning that changes to the
original data structure are reflected in the original and vice-versa.
The view has a separate list of event handlers than the original, but
changes to either will fire events for both. When events are fired
in a reversed view, their indices are reversed.

## `Ordered`

The abstract `Ordered` class represents a data structure that is
well-ordered, such as a binary tree. `Ordered` has an additional
type parameter, `K`, representing the type that provides the order.
`K` can be the same as `T` for sets, the same as `I` for arrays,
and something completely different for dictionaries.

The `Ordered` class provides one operation, `slice`. Slice takes
three parameters: the starting key, the ending key, and an object
that specifies whether or not the starting key and ending key are
inclusive or exclusive. Four constants are provided to cover the
four cases:

1. `IN_IN`: Both the starting key and the ending key are inclusive.
2. `IN_EX`: The starting key is inclusive, but the ending key is
exclusive. This is the default if none is specified.
3. `EX_IN`: The starting key is exclusive, and the ending key is
inclusive. This is useful for creating a reversed slice.
4. `EX_EX`: Both the starting and ending keys are exclusive.

The `slice` method returns a view of the data structure's elements,
starting at (or just above) the starting key and continuing to 
(or just below) the ending key. If the starting key is greater than
the ending key, then a reversed slice view will be returned.

Again, the views reflect changes to the original data structure and
vice-versa. And again, each view has its own list of event handlers,
and events triggered for either the original or a view are sent to
both. However, events that lie outside the range of the slice view
will be discarded for that view.

## `ArrayLike`

The abstract `ArrayLike` is a base class for data structures that
are similar to arrays, such as ring buffers. `ArrayLike` implementations
are `Ordered` whose `K` and `I` types are both `number`.

`ArrayLike` provides one operation, `at`, which returns the element
at the specified index. This operation should be O(1) for all
implementations of `ArrayLike`.
