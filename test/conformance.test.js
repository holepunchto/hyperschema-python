const test = require('brittle')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const PythonHyperschema = require('..')

const FIXTURES_DIR = path.join(
  path.dirname(require.resolve('hyperschema-test/package')),
  'fixtures'
)
const PYTHON =
  process.env.HYPERSCHEMA_PYTHON || path.join(__dirname, '..', '.venv', 'bin', 'python')
const RUNNER = path.join(__dirname, 'runner.py')

// Fixtures this cut is expected to cover end to end.
const EXPECTED = [
  '1',
  '5',
  '11',
  '14',
  '16',
  '32',
  '21',
  '22',
  '3',
  '27',
  '28',
  '13',
  '15',
  '30',
  '31',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '4',
  '17',
  '18',
  '25',
  '9',
  '8',
  '10',
  '12',
  '6',
  '7',
  '23',
  '24',
  '29',
  '20',
  '26'
]

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

  const encodedHex = testJson.encoded.map((e) =>
    typeof e === 'string' ? e : Buffer.from(e.data).toString('hex')
  )

  const input = JSON.stringify({
    name,
    values: testJson.values,
    encoded: encodedHex
  })
  const res = spawnSync(PYTHON, [RUNNER, dir], { input, encoding: 'utf-8' })
  t.is(res.status, 0, `fixture ${id} runner exited 0\n${res.stderr}`)
  if (res.status !== 0) return true

  const out = JSON.parse(res.stdout)
  for (let i = 0; i < encodedHex.length; i++) {
    t.is(out.encoded[i], encodedHex[i], `fixture ${id} encode[${i}]`)
    t.is(out.reencoded[i], encodedHex[i], `fixture ${id} decode->reencode[${i}]`)
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
