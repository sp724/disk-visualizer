import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ScanEntry {
  name: string
  path: string
  size: number
  type: 'file' | 'directory'
}

interface ScanResult {
  path: string
  totalSize: number
  entries: ScanEntry[]
}

async function scanDirectory(dirPath: string): Promise<ScanResult> {
  const dirSizes = new Map<string, number>()

  // Use du -d 1 to get subdirectory totals in one fast pass
  try {
    const safePath = dirPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    const { stdout } = await execAsync(
      `du -d 1 -k "${safePath}" 2>/dev/null || true`,
      { maxBuffer: 50 * 1024 * 1024 }
    )
    for (const line of stdout.trim().split('\n')) {
      const tabIdx = line.indexOf('\t')
      if (tabIdx === -1) continue
      const sizeKb = parseInt(line.substring(0, tabIdx))
      const entryPath = line.substring(tabIdx + 1).trim()
      if (entryPath !== dirPath && !isNaN(sizeKb)) {
        dirSizes.set(entryPath, sizeKb * 1024)
      }
    }
  } catch {
    // du not available, fall back to 0 sizes for directories
  }

  const entries: ScanEntry[] = []

  const dirEntries = await fs.readdir(dirPath, { withFileTypes: true })

  await Promise.all(
    dirEntries.map(async (entry) => {
      const entryPath = join(dirPath, entry.name)
      try {
        if (entry.isDirectory()) {
          const size = dirSizes.get(entryPath) ?? 0
          entries.push({ name: entry.name, path: entryPath, size, type: 'directory' })
        } else if (entry.isFile()) {
          const stat = await fs.stat(entryPath)
          entries.push({ name: entry.name, path: entryPath, size: stat.size, type: 'file' })
        }
      } catch {
        // Skip inaccessible entries
      }
    })
  )

  entries.sort((a, b) => b.size - a.size)
  const totalSize = entries.reduce((acc, e) => acc + e.size, 0)

  return { path: dirPath, totalSize, entries }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#060b10',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Register IPC handlers
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select a Folder to Analyze'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('disk:scan', async (_event, dirPath: string) => {
    return await scanDirectory(dirPath)
  })

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newName: string) => {
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/'))
    const newPath = join(dir, newName)
    await fs.rename(oldPath, newPath)
    return { success: true, newPath }
  })

  ipcMain.handle('fs:delete', async (_event, itemPath: string) => {
    await shell.trashItem(itemPath)
    return { success: true }
  })

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
