const test = require('brittle')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const PythonHyperschema = require('.')

require('./test/skeleton.test.js')

const FIXTURES_DIR = path.join(
  path.dirname(require.resolve('hyperschema-test/package')),
  'fixtures'
)
const PYTHON = process.env.HYPERSCHEMA_PYTHON || path.join(__dirname, '.venv', 'bin', 'python')
const RUNNER = path.join(__dirname, 'test', 'runner.py')

// Fixtures this cut is expected to cover end to end.
const EXPECTED = ['1', '5', '11', '14', '16', '32', '21', '22', '3', '27', '28']

function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical)
  if (v && typeof v === 'object') {
    if (v.type === 'Buffer') return v.data.length ? { type: 'Buffer', data: v.data } : undefined
    const out = {}
    for (const k of Object.keys(v).sort()) {
      const c = canonical(v[k])
      if (c !== undefined && c !== null && c !== 0 && c !== '' && c !== false) out[k] = c
    }
    return out
  }
  if (v === null || v === 0 || v === '' || v === false) return undefined
  return v
}

function eq(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}

function runFixture(t, id) {
  const fixtureDir = path.join(FIXTURES_DIR, id)
  const hs = PythonHyperschema.from(fixtureDir)
  hs.linkAll()

  let code
  try {
    code = hs.toCode()
  } catch (err) {
    if (err.code === 'UNSUPPORTED_TYPE') {
      t.comment(`skip fixture ${id}: ${err.message}`)
      return false
    }
    throw err
  }

  const name = hs.typesByPosition.get(hs.schema.length - 1)
  const testJson = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'test.json'), 'utf-8'))

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `hsp-${id}-`))
  fs.writeFileSync(path.join(dir, 'schema.py'), code)

  const input = JSON.stringify({
    name,
    values: testJson.values,
    encoded: testJson.encoded
  })
  const res = spawnSync(PYTHON, [RUNNER, dir], { input, encoding: 'utf-8' })
  t.is(res.status, 0, `fixture ${id} runner exited 0\n${res.stderr}`)
  if (res.status !== 0) return true

  const out = JSON.parse(res.stdout)
  for (let i = 0; i < testJson.encoded.length; i++) {
    t.is(out.encoded[i], testJson.encoded[i], `fixture ${id} encode[${i}]`)
  }
  for (let i = 0; i < testJson.values.length; i++) {
    t.ok(eq(out.decoded[i], testJson.values[i]), `fixture ${id} decode[${i}]`)
  }
  return true
}

test('conformance over hyperschema-test fixtures', (t) => {
  const ran = []
  // The fixtures dir also contains non-directory files (e.g. index.json) that
  // ship in the npm package; only iterate fixture directories.
  const ids = fs
    .readdirSync(FIXTURES_DIR)
    .filter((id) => fs.statSync(path.join(FIXTURES_DIR, id)).isDirectory())
    .sort()
  for (const id of ids) {
    if (runFixture(t, id)) ran.push(id)
  }
  for (const id of EXPECTED) {
    t.ok(ran.includes(id), `expected fixture ${id} to run`)
  }
})
