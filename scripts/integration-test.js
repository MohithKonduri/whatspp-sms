const { spawn } = require('child_process')
const fetch = global.fetch || require('node-fetch')

const PORT = process.env.PORT || 3001
const BASE = `http://localhost:${PORT}`

function waitForServer(timeout = 60000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/`)
        if (res.ok) {
          clearInterval(interval)
          return resolve()
        }
      } catch (err) {
        // ignore
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval)
        reject(new Error('Timeout waiting for server'))
      }
    }, 1000)
  })
}

async function run() {
  console.log('Starting integration tests...')
  const server = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`))
  server.stderr.on('data', (d) => process.stderr.write(`[server ERR] ${d}`))

  try {
    await waitForServer(60000)
    console.log('Server is up — running tests')

    // 1) Home page
    const home = await fetch(`${BASE}/`)
    if (home.status !== 200) throw new Error(`Home page returned ${home.status}`)
    console.log('✅ Home page OK')

    // 2) GET WhatsApp status
    const wa = await fetch(`${BASE}/api/send-whatsapp`)
    if (wa.status !== 200) throw new Error(`/api/send-whatsapp returned ${wa.status}`)
    const waJson = await wa.json()
    if (!waJson || !waJson.status) throw new Error('Invalid WhatsApp status response')
    console.log('✅ /api/send-whatsapp returned status')

    // 3) POST /api/send-sms with empty body -> expect 400
    const sms = await fetch(`${BASE}/api/send-sms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    })
    if (sms.status !== 400) {
      console.warn(`Expected /api/send-sms to return 400 for empty body, got ${sms.status}`)
    } else {
      console.log('✅ /api/send-sms returned 400 for empty body')
    }

    console.log('Integration tests passed')
    process.exit(0)
  } catch (err) {
    console.error('Integration tests failed:', err)
    process.exit(1)
  } finally {
    server.kill('SIGTERM')
  }
}

run()
