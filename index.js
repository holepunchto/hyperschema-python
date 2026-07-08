const fs = require('fs')
const path = require('path')
const Hyperschema = require('hyperschema')
const generatePython = require('./lib/codegen')

class PythonHyperschema extends Hyperschema {
  toCode() {
    this.linkAll()
    return generatePython(this)
  }

  // Generates the code string first so an UNSUPPORTED_TYPE throw leaves
  // nothing on disk, then writes schema.json + schema.py.
  static toDisk(hyperschema, dir, opts) {
    if (typeof dir === 'object' && dir) {
      opts = dir
      dir = null
    }
    if (!dir) dir = hyperschema.dir

    hyperschema.linkAll()
    const code = hyperschema.toCode()

    const root = path.resolve(dir)
    fs.mkdirSync(root, { recursive: true })
    fs.writeFileSync(
      path.join(root, 'schema.json'),
      JSON.stringify(hyperschema.toJSON(), null, 2) + '\n',
      { encoding: 'utf-8' }
    )
    fs.writeFileSync(path.join(root, 'schema.py'), code, { encoding: 'utf-8' })
  }
}

module.exports = PythonHyperschema
