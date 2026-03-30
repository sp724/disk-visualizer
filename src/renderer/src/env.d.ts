import type { ScanResult } from './types'

declare global {
  interface Window {
    diskAPI: {
      selectFolder: () => Promise<string | null>
      scanDirectory: (path: string) => Promise<ScanResult>
      renameItem: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath: string }>
      deleteItem: (itemPath: string) => Promise<{ success: boolean }>
    }
  }
}
