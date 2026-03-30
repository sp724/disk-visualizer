# Disk Lens

A macOS disk usage visualizer built with Electron + React + TypeScript.

## Getting started

```bash
npm install
npm run dev        # launch in development mode
```

## Build a distributable

```bash
npm run package    # outputs a .dmg in release/
```

## Features

### Phase 1 (complete)
- Native macOS folder picker (`+ Scan Folder`)
- Animated donut chart showing relative sizes of top-level entries
- Sortable directory list with size bars and percentages
- Drill-down navigation — double-click any directory to explore it
- Breadcrumb trail for navigating back up the tree

### Phase 2 (complete)
- **Rename** — click an entry to select it, press *Rename* to rename in-place
- **Move to Trash** — safely moves selected items to macOS Trash (recoverable)

## Tech stack

- Electron 29 + electron-vite
- React 18 + TypeScript 5
- Recharts (donut chart)
- Node.js `du -d 1` for fast directory sizing
