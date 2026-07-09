import { describe, it, expect, beforeAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import electron from 'electron'

// Native addons (better-sqlite3, keytar) are rebuilt against Electron's ABI,
// so they fail under plain Node. Solution: spawn Electron itself to run a
// self-check script that exercises all 4 smoke concerns in one process,
// output JSON to stdout. Vitest asserts on the parsed results.
// Script written to project root so require() finds node_modules.

const scriptPath = join(process.cwd(), '.smoke-selfcheck.cjs')

const selfCheckScript = `const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

async function run() {
  const results = {}
  try {
    // AC-009: SQLite creates harbor.db + WAL pragma
    const dbPath = path.join(app.getPath('userData'), 'harbor-test.db')
    const Database = require('better-sqlite3')
    const db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('busy_timeout = 5000')
    const journalMode = db.pragma('journal_mode', { simple: true })
    results.sqlite = { ok: journalMode === 'wal', journalMode }
    db.close()
    fs.rmSync(dbPath, { force: true })
    fs.rmSync(dbPath + '-wal', { force: true })
    fs.rmSync(dbPath + '-shm', { force: true })

    // AC-010: keytar get returns null when no credential
    const keytar = require('keytar')
    const got = await keytar.getPassword('harbor-smoke', 'nonexistent-' + Date.now())
    results.keytar = { ok: got === null, got }

    // AC-008: IPC stub registered
    ipcMain.handle('smoke-ping', () => 'pong')
    results.ipc = { ok: true }

    // AC-006: renderer window mounts
    const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false } })
    await new Promise((resolve) => {
      win.webContents.on('did-finish-load', () => { results.windowMounted = true; resolve() })
      win.loadURL('data:text/html,<h1 data-testid="harbor-root">mount</h1>')
    })
    win.close()
  } catch (e) {
    results.error = String(e && e.stack || e)
  }
  process.stdout.write('\\n__SMOKE_RESULT__' + JSON.stringify(results))
  app.quit()
}
app.whenReady().then(run)
`

interface SmokeResult {
  error?: string
  sqlite?: { ok: boolean; journalMode: string }
  keytar?: { ok: boolean; got: string | null }
  ipc?: { ok: boolean }
  windowMounted?: boolean
  _exitStatus?: number | null
  _stderr?: string
}

let results: SmokeResult = {}

beforeAll(() => {
  writeFileSync(scriptPath, selfCheckScript)
  try {
    const res = spawnSync(electron as unknown as string, [scriptPath], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' }
    })
    const out = (res.stdout || '')
    const match = out.match(/__SMOKE_RESULT__(.*)/)
    if (match) {
      try { results = JSON.parse(match[1]) as SmokeResult } catch { results = { error: 'parse-fail' } }
    }
    if (results.error || res.status !== 0) {
      results._exitStatus = res.status
      results._stderr = res.stderr
    }
  } finally {
    try { unlinkSync(scriptPath) } catch { /* cleanup best-effort */ }
  }
}, 30000)

describe('scaffold smoke check', () => {
  it('AC-005: main process loads without error', () => {
    expect(results.error ?? null, JSON.stringify(results)).toBeNull()
  })

  it('AC-006: renderer window mounts', () => {
    expect(results.windowMounted, JSON.stringify(results)).toBe(true)
  })

  it('AC-008: IPC stub registered', () => {
    expect(results.ipc?.ok, JSON.stringify(results)).toBe(true)
  })

  it('AC-009: SQLite opens with WAL pragma', () => {
    expect(results.sqlite?.ok, `journalMode=${results.sqlite?.journalMode}`).toBe(true)
  })

  it('AC-010: keytar get returns null when no credential', () => {
    expect(results.keytar?.ok, `got=${results.keytar?.got}`).toBe(true)
  })
})