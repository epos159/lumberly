import type { MaterialItem } from '../types'
import { exportToCsv, exportToPdf } from '../utils/export'

interface MaterialListProps {
  materials: MaterialItem[]
  projectName?: string
}

export default function MaterialList({ materials, projectName }: MaterialListProps) {
  if (materials.length === 0) return null

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
      <div className="disclaimer-box">
        <strong>Estimate only.</strong> Verify against plans and applicable code (e.g. IRC span tables).
      </div>
    </section>
  )
}
