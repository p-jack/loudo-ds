# loudo-ds-array

`La` is a "loud array."

## Creation

### `of`

The simplest way to create a `La` is to use the variadic `La.of`:

```TypeScript
const a = La.of("A", "B", "C")
const empty = La.of()
```

### `from`

To create a `La` that contains the elements of an iterable, pass it to
`La.from`:

```TypeScript
const a = La.from(["A", "B", "C"])
```

If you pass a raw array to `La.from`, it will use that array directly
as its data source, because otherwise deserialization would be slow.
You shouldn't modify an array that you passed to `La.from`, or the
`La` instance will get confused.

### `ify`

If you have an iterable that may or may not already be a `La`, you can
use `La.ify` to convert it. `La.ify` will either return the iterable
itself if it's a `La` or pass the iterable to `La.from`:

```TypeScript
const a1 = La.of("A", "B", "C")
const a2 = La.ify(a1)
console.log(a1 === a2) // true

const a3 = La.ify(["A", "B", "C"])
console.log(a1 === a3) // false
```
