import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'

// OQ-2: contextIsolation true + preload. Expõe API mínima via contextBridge.
contextBridge.exposeInMainWorld('harbor', {
  ping: () => ipcRenderer.invoke(IPC_CHANNELS.PING)
})