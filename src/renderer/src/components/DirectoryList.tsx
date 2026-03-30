import React from 'react'
import type { ScanEntry } from '../types'
import { formatSize, formatPercent, CHART_COLORS } from '../utils/formatSize'

interface Props {
  entries: ScanEntry[]
  totalSize: number
  selectedPath: string | null
  onSelect: (entry: ScanEntry) => void
  onNavigate: (entry: ScanEntry) => void
  onDelete: (entry: ScanEntry) => void
  onRename: (entry: ScanEntry) => void
}

const FolderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 3.5A1.5 1.5 0 012.5 2h3.086a1.5 1.5 0 011.06.44l.915.914A1.5 1.5 0 008.62 4H13.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-9z"
      fill="currentColor" fillOpacity={0.7} />
  </svg>
)

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M4 1h6l4 4v10H4V1z" fill="currentColor" fillOpacity={0.4} />
    <path d="M10 1l4 4h-4V1z" fill="currentColor" fillOpacity={0.6} />
  </svg>
)

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
    <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function DirectoryList({
  entries, totalSize, selectedPath, onSelect, onNavigate, onDelete, onRename
}: Props) {
  const selected = entries.find(e => e.path === selectedPath) ?? null
  const maxSize = entries[0]?.size ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 90px 60px 20px',
        gap: 8,
        padding: '0 12px 8px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 4
      }}>
        {['NAME', 'SIZE', '%', ''].map((h) => (
          <div key={h} style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>{h}</div>
        ))}
      </div>

      {/* Entry list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {entries.map((entry, i) => {
          const isSelected = entry.path === selectedPath
          const color = CHART_COLORS[Math.min(i, CHART_COLORS.length - 1)]
          const barPct = maxSize > 0 ? (entry.size / maxSize) * 100 : 0

          return (
            <div
              key={entry.path}
              onClick={() => onSelect(entry)}
              onDoubleClick={() => entry.type === 'directory' && onNavigate(entry)}
              className="animate-in"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 60px 20px',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: isSelected ? 'var(--bg-selected)' : 'transparent',
                border: isSelected ? '1px solid var(--border-bright)' : '1px solid transparent',
                transition: 'background 0.1s',
                animationDelay: `${i * 20}ms`,
                animationFillMode: 'both'
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Name + bar */}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {entry.type === 'directory' ? <FolderIcon /> : <FileIcon />}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 14,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                    opacity: isSelected ? 1 : 0.85
                  }}>
                    {entry.name}
                  </span>
                </div>
                {/* Size bar */}
                <div style={{
                  height: 2,
                  background: 'var(--border)',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${barPct}%`,
                    background: color,
                    borderRadius: 1,
                    opacity: isSelected ? 1 : 0.6,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* Size */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 500,
                color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                alignSelf: 'center'
              }}>
                {formatSize(entry.size)}
              </div>

              {/* Percent */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                alignSelf: 'center'
              }}>
                {formatPercent(entry.size, totalSize)}
              </div>

              {/* Navigate chevron for dirs */}
              <div style={{
                alignSelf: 'center',
                color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                opacity: entry.type === 'directory' ? 1 : 0
              }}>
                <ChevronIcon />
              </div>
            </div>
          )
        })}
      </div>

      {/* Action bar (Phase 2) */}
      {selected && (
        <div style={{
          marginTop: 8,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 8,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            alignSelf: 'center'
          }}>
            {selected.path}
          </div>
          <button
            onClick={() => onRename(selected)}
            style={{
              padding: '6px 14px',
              background: 'var(--sky-dim)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--sky)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--sky-dim)')}
          >
            Rename
          </button>
          <button
            onClick={() => onDelete(selected)}
            style={{
              padding: '6px 14px',
              background: 'var(--danger-dim)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--danger-dim)')}
          >
            Move to Trash
          </button>
        </div>
      )}
    </div>
  )
}
