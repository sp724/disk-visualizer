import React, { useState, useCallback } from 'react'
import type { ScanEntry, ScanResult } from './types'
import StorageChart from './components/StorageChart'
import DirectoryList from './components/DirectoryList'
import { formatSize } from './utils/formatSize'

// ─── Modals ───────────────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  entry, onConfirm, onCancel
}: { entry: ScanEntry; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Move to Trash</h2>
        <p style={styles.modalBody}>
          Are you sure you want to move <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{entry.name}</span> to the Trash?
        </p>
        <p style={{ ...styles.modalMeta, marginTop: 4 }}>{formatSize(entry.size)}</p>
        <div style={styles.modalActions}>
          <button style={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button style={styles.btnDanger} onClick={onConfirm}>Move to Trash</button>
        </div>
      </div>
    </div>
  )
}

function RenameModal({
  entry, onConfirm, onCancel
}: { entry: ScanEntry; onConfirm: (newName: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(entry.name)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed && trimmed !== entry.name) onConfirm(trimmed)
  }

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Rename</h2>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            style={styles.input}
            spellCheck={false}
          />
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnCancel} onClick={onCancel}>Cancel</button>
            <button type="submit" style={styles.btnPrimary} disabled={!name.trim() || name.trim() === entry.name}>
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Navigation stack: each entry is a ScanResult for a level
  const [navStack, setNavStack] = useState<ScanResult[]>([])

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScanEntry | null>(null)
  const [renameTarget, setRenameTarget] = useState<ScanEntry | null>(null)

  const currentResult = navStack.length > 0 ? navStack[navStack.length - 1] : result

  const scan = useCallback(async (dirPath: string) => {
    setScanning(true)
    setError(null)
    setSelectedPath(null)
    try {
      const res = await window.diskAPI.scanDirectory(dirPath)
      setResult(res)
      setNavStack([])
    } catch (e) {
      setError(String(e))
    } finally {
      setScanning(false)
    }
  }, [])

  const handleSelectFolder = useCallback(async () => {
    const folder = await window.diskAPI.selectFolder()
    if (folder) await scan(folder)
  }, [scan])

  const handleNavigate = useCallback(async (entry: ScanEntry) => {
    if (entry.type !== 'directory') return
    setScanning(true)
    setSelectedPath(null)
    try {
      const res = await window.diskAPI.scanDirectory(entry.path)
      setNavStack(prev => [...prev, res])
    } catch (e) {
      setError(String(e))
    } finally {
      setScanning(false)
    }
  }, [])

  const handleBreadcrumbNav = useCallback((idx: number) => {
    if (idx === -1) {
      // go to root result
      setNavStack([])
    } else {
      setNavStack(prev => prev.slice(0, idx + 1))
    }
    setSelectedPath(null)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !currentResult) return
    try {
      await window.diskAPI.deleteItem(deleteTarget.path)
      // Refresh current level
      const res = await window.diskAPI.scanDirectory(currentResult.path)
      if (navStack.length === 0) {
        setResult(res)
      } else {
        setNavStack(prev => [...prev.slice(0, -1), res])
      }
      setSelectedPath(null)
    } catch (e) {
      setError(`Delete failed: ${e}`)
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, currentResult, navStack])

  const handleRename = useCallback(async (newName: string) => {
    if (!renameTarget || !currentResult) return
    try {
      await window.diskAPI.renameItem(renameTarget.path, newName)
      // Refresh current level
      const res = await window.diskAPI.scanDirectory(currentResult.path)
      if (navStack.length === 0) {
        setResult(res)
      } else {
        setNavStack(prev => [...prev.slice(0, -1), res])
      }
      setSelectedPath(null)
    } catch (e) {
      setError(`Rename failed: ${e}`)
    } finally {
      setRenameTarget(null)
    }
  }, [renameTarget, currentResult, navStack])

  // Build breadcrumb segments
  const breadcrumb: { label: string; idx: number }[] = []
  if (result) {
    const rootParts = result.path.replace(/^\//, '').split('/')
    breadcrumb.push({ label: rootParts[rootParts.length - 1] || result.path, idx: -1 })
    navStack.forEach((s, i) => {
      const parts = s.path.split('/')
      breadcrumb.push({ label: parts[parts.length - 1], idx: i })
    })
  }

  return (
    <div style={styles.root}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={styles.header} className="titlebar-drag">
        {/* Traffic light spacer */}
        <div style={{ width: 76 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M10 4v6l4 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="1.5" fill="var(--accent)" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
            DISK LENS BY SURESH
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {currentResult && !scanning && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            maxWidth: 320,
            alignSelf: 'center'
          }}>
            {currentResult.path}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button
          className="no-drag"
          onClick={handleSelectFolder}
          disabled={scanning}
          style={{
            ...styles.btnPrimary,
            opacity: scanning ? 0.5 : 1,
            minWidth: 120
          }}
        >
          {scanning
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Scanning...
              </span>
            : '+ Scan Folder'
          }
        </button>
      </header>

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      {breadcrumb.length > 0 && (
        <div style={styles.breadcrumb}>
          <span style={{ color: 'var(--text-muted)', marginRight: 4, fontSize: 11 }}>›</span>
          {breadcrumb.map((seg, i) => (
            <React.Fragment key={seg.idx}>
              {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 6px', fontSize: 11 }}>/</span>}
              <button
                onClick={() => handleBreadcrumbNav(seg.idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-display)',
                  fontWeight: i === breadcrumb.length - 1 ? 600 : 400,
                  fontSize: 13,
                  color: i === breadcrumb.length - 1 ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: i === breadcrumb.length - 1 ? 'default' : 'pointer',
                  padding: 0
                }}
              >
                {seg.label}
              </button>
            </React.Fragment>
          ))}
          {currentResult && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)'
            }}>
              {currentResult.entries.length} items · {formatSize(currentResult.totalSize)}
            </span>
          )}
        </div>
      )}

      {/* ── Main content ───────────────────────────────────── */}
      <main style={styles.main}>
        {!result && !scanning && (
          <div style={styles.empty}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ opacity: 0.3 }}>
              <circle cx="32" cy="32" r="30" stroke="var(--accent)" strokeWidth="2" />
              <circle cx="32" cy="32" r="20" stroke="var(--accent)" strokeWidth="1.5" />
              <circle cx="32" cy="32" r="10" stroke="var(--accent)" strokeWidth="1" />
              <line x1="32" y1="2" x2="32" y2="62" stroke="var(--accent)" strokeWidth="0.5" />
              <line x1="2" y1="32" x2="62" y2="32" stroke="var(--accent)" strokeWidth="0.5" />
            </svg>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginTop: 20 }}>
              NO DIRECTORY SELECTED
            </h2>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
              Click <strong style={{ color: 'var(--accent)' }}>+ Scan Folder</strong> to analyze disk usage
            </p>
          </div>
        )}

        {scanning && !currentResult && (
          <div style={styles.empty}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-secondary)', marginTop: 20 }}>
              Scanning…
            </p>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--danger-dim)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 'var(--radius)', padding: '10px 20px',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)',
            display: 'flex', gap: 12, alignItems: 'center'
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {currentResult && (
          <div style={styles.grid} className="animate-in">
            {/* Left: chart */}
            <div style={styles.card}>
              <div style={styles.cardLabel}>STORAGE BREAKDOWN</div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <StorageChart
                  entries={currentResult.entries}
                  totalSize={currentResult.totalSize}
                  selectedPath={selectedPath}
                  onSelect={e => setSelectedPath(e.path === selectedPath ? null : e.path)}
                />
              </div>
            </div>

            {/* Right: list */}
            <div style={{ ...styles.card, overflow: 'hidden' }}>
              <div style={styles.cardLabel}>DIRECTORY CONTENTS</div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <DirectoryList
                  entries={currentResult.entries}
                  totalSize={currentResult.totalSize}
                  selectedPath={selectedPath}
                  onSelect={e => setSelectedPath(e.path === selectedPath ? null : e.path)}
                  onNavigate={handleNavigate}
                  onDelete={e => setDeleteTarget(e)}
                  onRename={e => setRenameTarget(e)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────── */}
      {deleteTarget && (
        <ConfirmDeleteModal
          entry={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {renameTarget && (
        <RenameModal
          entry={renameTarget}
          onConfirm={handleRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  header: {
    height: 52,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 16,
    borderBottom: '1px solid var(--border)',
    background: 'rgba(6,11,16,0.95)',
    backdropFilter: 'blur(12px)',
    flexShrink: 0,
  },
  breadcrumb: {
    height: 34,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 0,
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    position: 'relative',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: 0,
    minHeight: 0,
    width: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 20px',
    borderRight: '1px solid var(--border)',
    minHeight: 0,
    overflow: 'hidden',
  },
  cardLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.15em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: 12,
    flexShrink: 0,
  },
  btnPrimary: {
    padding: '7px 18px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnCancel: {
    padding: '7px 18px',
    background: 'transparent',
    border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '7px 18px',
    background: 'var(--danger-dim)',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--danger)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 32px',
    minWidth: 380,
    maxWidth: 480,
    animation: 'fadeIn 0.2s ease forwards',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '0.05em',
    color: 'var(--text-primary)',
    marginBottom: 12,
  },
  modalBody: {
    fontFamily: 'var(--font-display)',
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  modalMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    outline: 'none',
    marginTop: 4,
  },
}
