const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '—'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${i === 0 ? value.toFixed(0) : value.toFixed(1)} ${UNITS[i]}`
}

export function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

export const CHART_COLORS = [
  '#f59e0b', // amber
  '#38bdf8', // sky
  '#4ade80', // green
  '#f87171', // red
  '#a78bfa', // purple
  '#fb923c', // orange
  '#34d399', // emerald
  '#e879f9', // fuchsia
  '#facc15', // yellow
  '#60a5fa', // blue
]
