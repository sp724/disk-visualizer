import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { ScanEntry } from '../types'
import { formatSize, formatPercent, CHART_COLORS } from '../utils/formatSize'

interface Props {
  entries: ScanEntry[]
  totalSize: number
  selectedPath: string | null
  onSelect: (entry: ScanEntry) => void
}

const MAX_SLICES = 8

export default function StorageChart({ entries, totalSize, selectedPath, onSelect }: Props) {
  const chartData = useMemo(() => {
    const top = entries.slice(0, MAX_SLICES)
    const rest = entries.slice(MAX_SLICES)
    const otherSize = rest.reduce((a, e) => a + e.size, 0)
    const data = top.map((e, i) => ({
      name: e.name,
      value: e.size,
      entry: e,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }))
    if (otherSize > 0) {
      data.push({ name: `+${rest.length} more`, value: otherSize, entry: null as unknown as ScanEntry, color: '#253d58' })
    }
    return data
  }, [entries])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius)',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 13
      }}>
        <div style={{ color: d.color, fontWeight: 600 }}>{d.name}</div>
        <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>{formatSize(d.value)}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatPercent(d.value, totalSize)}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: 16 }}>

      {/* Donut chart */}
      <div style={{ position: 'relative', width: '100%', flex: '1 1 0', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={700}
              onClick={(data) => data.entry && onSelect(data.entry)}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color}
                  stroke={d.entry?.path === selectedPath ? '#fff' : 'transparent'}
                  strokeWidth={d.entry?.path === selectedPath ? 2 : 0}
                  opacity={selectedPath && d.entry?.path !== selectedPath ? 0.55 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px'
          }}>
            {formatSize(totalSize)}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: 2
          }}>
            Total
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        paddingBottom: 8,
        maxHeight: 200,
        overflowY: 'auto'
      }}>
        {chartData.map((d, i) => (
          <div
            key={i}
            onClick={() => d.entry && onSelect(d.entry)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              cursor: d.entry ? 'pointer' : 'default',
              background: d.entry?.path === selectedPath ? 'var(--bg-selected)' : 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (d.entry) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = d.entry?.path === selectedPath ? 'var(--bg-selected)' : 'transparent' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <div style={{
              flex: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 13,
              color: 'var(--text-primary)'
            }}>
              {d.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              flexShrink: 0
            }}>
              {formatPercent(d.value, totalSize)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
