import type { MaterialItem } from '../types'
import { exportToCsv, exportToPdf } from '../utils/export'

interface MaterialListProps {
  materials: MaterialItem[]
  projectName?: string
}

/** Group materials by zone for summary (floor, walls, ceiling, second-floor) */
function buildZoneSummary(materials: MaterialItem[]) {
  const zoneOrder: Array<'floor' | 'walls' | 'ceiling' | 'second-floor'> = [
    'floor',
    'walls',
    'ceiling',
    'second-floor',
  ]
  const byZone = new Map<string, Array<{ description: string; qty: number; unit: string }>>()
  for (const m of materials) {
    if (!m.zone) continue
    if (!byZone.has(m.zone)) byZone.set(m.zone, [])
    byZone.get(m.zone)!.push({ description: m.description, qty: m.quantity, unit: m.unit })
  }
  return { byZone, zoneOrder }
}

const ZONE_LABELS: Record<string, string> = {
  floor: 'Floor',
  walls: 'Walls',
  ceiling: 'Ceiling / Roof',
  'second-floor': 'Second floor (floor/ceiling separation)',
}

export default function MaterialList({ materials, projectName }: MaterialListProps) {
  if (materials.length === 0) return null

  const { byZone, zoneOrder } = buildZoneSummary(materials)
  const hasZoneSummary = byZone.size > 0

  return (
    <section className="material-list">
      <div className="print-header">
        <img src="/lumberly.png" alt="Lumberly" className="print-header-banner" />
        <h1>Lumberly{projectName ? ` – ${projectName}` : ''}</h1>
        <p>Material List – {new Date().toLocaleDateString()}</p>
      </div>
      <div className="material-list-header">
        <h2>Material list{projectName ? ` – ${projectName}` : ''}</h2>
        <div className="export-buttons">
          <button type="button" className="btn-export" onClick={() => exportToCsv(materials, projectName)}>
            Export to CSV
          </button>
          <button type="button" className="btn-export" onClick={exportToPdf}>
            Export to PDF
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th className="col-qty">Qty</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((item, i) => (
            <tr key={i}>
              <td>
                <span className="desc">{item.description}</span>
                {item.notes && <span className="notes">{item.notes}</span>}
              </td>
              <td className="col-qty">{item.quantity}</td>
              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasZoneSummary && (
        <div className="lumber-summary">
          <h3>Breakdown by zone</h3>
          <p className="lumber-summary-hint">
            If a package looks light, check which zone might be missing.
          </p>
          {zoneOrder.filter((z) => byZone.has(z)).map((zone) => (
            <div key={zone} className="zone-section">
              <h4>{ZONE_LABELS[zone]}</h4>
              <table>
                <tbody>
                  {(byZone.get(zone) ?? []).map((row, i) => (
                    <tr key={`${zone}-${i}`}>
                      <td>{row.description}</td>
                      <td className="col-qty">{row.qty}</td>
                      <td>{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      <div className="disclaimer-box">
        <strong>Estimate only.</strong> Verify against plans and applicable code (e.g. IRC span tables).
        Sizes assume #2 SYP or equivalent—verify for species and grade.{' '}
        <a
          href="https://awc.org/resources/span-options-calculator-for-wood-joists-and-rafters/"
          target="_blank"
          rel="noopener noreferrer"
        >
          AWC Span Calculator
        </a>
      </div>
    </section>
  )
}
