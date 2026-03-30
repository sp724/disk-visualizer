export interface ScanEntry {
  name: string
  path: string
  size: number
  type: 'file' | 'directory'
}

export interface ScanResult {
  path: string
  totalSize: number
  entries: ScanEntry[]
}
