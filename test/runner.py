import json
import sys

sys.path.insert(0, sys.argv[1])  # temp dir holding the generated schema.py

import compact_encoding as c  # noqa: E402
import schema  # noqa: E402


def prepare(value):
    # Fixture buffers arrive as {"type": "Buffer", "data": [...]}; encoding
    # needs bytes.
    if isinstance(value, dict) and value.get("type") == "Buffer":
        return bytes(value["data"])
    if isinstance(value, dict):
        return {k: prepare(v) for k, v in value.items()}
    return value


def main():
    cases = json.load(sys.stdin)
    codec = schema.resolve(cases["name"])
    encoded = [c.encode(codec, prepare(v)).hex() for v in cases["values"]]
    reencoded = [
        c.encode(codec, c.decode(codec, bytes.fromhex(h))).hex()
        for h in cases["encoded"]
    ]
    json.dump({"encoded": encoded, "reencoded": reencoded}, sys.stdout)


main()
