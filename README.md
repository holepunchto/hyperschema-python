# hyperschema-python

Python code generation for [Hyperschema](https://github.com/holepunchto/hyperschema): emits `compact-encoding-python` codecs for a schema, wire-compatible with the JavaScript reference. The Python analog of [hyperschema-swift](https://github.com/holepunchto/hyperschema-swift).

## Usage

```js
const Hyperschema = require('hyperschema')
const PythonHyperschema = require('hyperschema-python')

const schema = Hyperschema.from('./spec/hyperschema')
// ... register namespaces/types ...

PythonHyperschema.toDisk(schema, './spec/python')
// writes ./spec/python/schema.json and ./spec/python/schema.py
```

The generated `schema.py` imports `compact_encoding` and exposes `resolve(name)` returning a codec: `c.encode(resolve('@ns/item'), {...})`.

### Scope

This first cut supports flat non-compact structs and enums over the `uint`, `uint32`, `int`, `string`, and `buffer` primitives (plus enum-typed struct fields). Anything else raises `UNSUPPORTED_TYPE`.
