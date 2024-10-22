# loudo-ds-reversible

Interface defining reversible data structures, such as arrays.

## `Reversible`

The `Reversible` interface provides the following:

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
