import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('diskAPI', {
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openFolder'),

  scanDirectory: (path: string): Promise<unknown> =>
    ipcRenderer.invoke('disk:scan', path),

  renameItem: (oldPath: string, newName: string): Promise<{ success: boolean; newPath: string }> =>
    ipcRenderer.invoke('fs:rename', oldPath, newName),

  deleteItem: (itemPath: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('fs:delete', itemPath)
})
