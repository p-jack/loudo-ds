# loudo-ds-ordered

Base interfaces for ordered data structures. Ordered data structures
are also `Reversible`.

## `Ordered`

The `Ordered` interface represents a data structure that is
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
