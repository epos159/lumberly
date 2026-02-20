import type { MaterialItem } from '../types'

/**
 * Export material list to CSV (opens in Excel)
 */
export function exportToCsv(materials: MaterialItem[], projectName?: string) {
  const headers = ['Description', 'Quantity', 'Unit', 'Notes']
  const rows = materials.map((m) => [
    m.description,
    m.quantity,
    m.unit,
    m.notes ?? '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const baseName = projectName?.trim()
    ? `lumberly-${projectName.trim().replace(/[^a-zA-Z0-9-_]/g, '-')}`
    : 'lumberly-materials'
  a.download = `${baseName}-${formatDate()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Open print dialog (user can Save as PDF)
 */
export function exportToPdf() {
  window.print()
}
