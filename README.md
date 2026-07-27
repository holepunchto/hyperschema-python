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

Generates codecs for these top-level constructs: structs (compact and non-compact, including optional fields), enums (numeric and string), arrays, records, versioned types, and aliases.

Field types cover the `compact-encoding` primitives - `uint`, `uint32`, `int`, `string`, `buffer`, `json`, the sized integers (`uint8`-`uint56`, `int24`-`int56`), `float32`/`float64`, and `fixed32`/`fixed64` - plus nested structs/enums, arrays of those, and `bool` (encoded as a flags bit). Anything outside this set - an external type, or an unlisted primitive - raises `UNSUPPORTED_TYPE` rather than emitting broken Python.
