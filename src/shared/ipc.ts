export const IPC_CHANNELS = {
  PING: 'ping'
} as const

export type IpcChannels = typeof IPC_CHANNELS

declare global {
  interface Window {
    harbor: {
      ping: () => Promise<string>
    }
  }
}

export {}