import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { openDatabase } from '../drizzle/db'
import { IPC_CHANNELS } from '../shared/ipc'

let db: ReturnType<typeof openDatabase> | null = null

function resolveDbPath(): string {
  // ponytail: dev = repo-local (gitignored) p/ debug fácil; prod = userData (padrão Electron). Switch via NODE_ENV.
  if (process.env.NODE_ENV === 'production') {
    return join(app.getPath('userData'), 'harbor.db')
  }
  return join(process.cwd(), 'harbor.db')
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  void win.once('ready-to-show', () => win.show())

  // ponytail: electron-vite injeta process.env['ELECTRON_RENDERER_URL'] em dev; prod carrega bundle buildado.
  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  // AC-008: IPC stub tipado (sem lógica de domínio)
  ipcMain.handle(IPC_CHANNELS.PING, () => 'pong')

  // AC-009: SQLite cria harbor.db + WAL pragma
  db = openDatabase(resolveDbPath())

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  db?.close()
  db = null
  if (process.platform !== 'darwin') {
    app.quit()
  }
})