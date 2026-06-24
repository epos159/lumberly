import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  BetaInput,
  BetaZone,
  BetaInteriorWall,
  BetaStory,
} from '../betaTypes'
import type {
  Opening,
  OpeningType,
  FramingSpacing,
  JoistDirection,
  RoofType,
  RoofPitch,
  OverhangInches,
  RafterSize,
  CeilingType,
} from '../types'

interface BetaFormProps {
  onSubmit: (input: BetaInput) => void
}

const STORAGE_KEY = 'lumberly-beta-form-state'

const defaultRoof: BetaInput['roof'] = {
  includeRoof: false,
  roofType: 'gable',
  pitch: 5,
  ridgeDirection: 'length',
  overhang: 18,
  rafterSize: '2x8',
  ridgeBoard: true,
  ceilingType: 'flat',
}

function defaultZone(name: string): BetaZone {
  return {
    id: crypto.randomUUID(),
    name,
    tieInLf: 0,
    firstFloor: { areaSqFt: 0, exteriorWallLf: 0, ceilingHeightFt: 9 },
  }
}

/** 1st-floor diagram: existing house + addition with floor area + exterior LF labeled */
function FirstFloorDiagram() {
  return (
    <svg viewBox="0 0 220 170" width="220" height="170" aria-label="1st floor exterior wall diagram" className="beta-svg-diagram">
      <defs>
        <marker id="arr1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" />
        </marker>
        <marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#059669" />
        </marker>
      </defs>

      {/* Existing house */}
      <rect x="2" y="35" width="78" height="100" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
      <text x="41" y="89" textAnchor="middle" fontSize="10" fill="#6b7280">Existing</text>

      {/* Tie-in wall — dashed, labeled */}
      <line x1="80" y1="35" x2="80" y2="135" stroke="#059669" strokeWidth="2" strokeDasharray="5,4" />
      <text x="80" y="22" textAnchor="middle" fontSize="9" fill="#059669" fontWeight="600">Tie-in</text>
      <path d="M80,26 L80,33" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arr2)" />

      {/* Addition */}
      <rect x="80" y="35" width="132" height="100" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />

      {/* Floor area shading */}
      <rect x="82" y="37" width="128" height="96" fill="#bfdbfe" opacity="0.35" />
      <text x="146" y="83" textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="600">Floor area</text>
      <text x="146" y="97" textAnchor="middle" fontSize="10" fill="#1d4ed8">(measured sq ft)</text>

      {/* Exterior LF bracket — right + top + bottom */}
      <line x1="216" y1="35" x2="216" y2="135" stroke="#1d4ed8" strokeWidth="1.5" />
      <line x1="212" y1="35" x2="218" y2="35" stroke="#1d4ed8" strokeWidth="1.5" />
      <line x1="212" y1="135" x2="218" y2="135" stroke="#1d4ed8" strokeWidth="1.5" />
      <text x="219" y="88" fontSize="8.5" fill="#1d4ed8" fontWeight="600">New</text>
      <text x="219" y="99" fontSize="8.5" fill="#1d4ed8" fontWeight="600">ext. LF</text>
    </svg>
  )
}

/** 2nd-floor diagram: shows upper level can step out past 1st floor */
function SecondFloorDiagram() {
  return (
    <svg viewBox="0 0 220 180" width="220" height="180" aria-label="2nd floor exterior wall diagram" className="beta-svg-diagram">
      <defs>
        <marker id="arr3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#7c3aed" />
        </marker>
      </defs>

      {/* 1st floor footprint (faded) */}
      <rect x="30" y="95" width="140" height="75" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="100" y="138" textAnchor="middle" fontSize="9" fill="#818cf8">1st floor</text>

      {/* 2nd floor — steps out on one side */}
      <rect x="10" y="20" width="175" height="80" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" />
      <rect x="12" y="22" width="171" height="76" fill="#ddd6fe" opacity="0.35" />
      <text x="97" y="58" textAnchor="middle" fontSize="11" fill="#6d28d9" fontWeight="600">2nd floor area</text>
      <text x="97" y="72" textAnchor="middle" fontSize="10" fill="#6d28d9">(can be larger)</text>

      {/* Bracket showing 2nd floor extends past 1st */}
      <line x1="10" y1="100" x2="30" y2="100" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3,2" />
      <line x1="10" y1="20" x2="10" y2="100" stroke="#7c3aed" strokeWidth="1.5" />
      <text x="2" y="62" fontSize="8" fill="#7c3aed" textAnchor="middle" transform="rotate(-90,2,62)">cantilever</text>

      <text x="5" y="15" fontSize="9" fill="#7c3aed" fontWeight="600">2nd-floor ext. LF →</text>
    </svg>
  )
}

function StoryFields({
  story,
  label,
  isSecond = false,
  onChange,
}: {
  story: BetaStory
  label: string
  isSecond?: boolean
  onChange: (s: BetaStory) => void
}) {
  const exampleArea = isSecond ? '300' : '320'
  const exampleLf = isSecond ? '68' : '72'
  const exampleNote = isSecond
    ? `e.g. a 2nd floor 15×20 = 300 sq ft, 70 LF — can differ from 1st floor`
    : `e.g. a 16×20 addition = 320 sq ft, 72 LF new walls`

  return (
    <div className="beta-story-fields">
      <div className="beta-diagram-col">
        {isSecond ? <SecondFloorDiagram /> : <FirstFloorDiagram />}
        <p className="beta-diagram-caption">{exampleNote}</p>
      </div>
      <div className="beta-story-inputs">
        <div className="field">
          <label>{label} — Floor area</label>
          <div className="beta-input-row">
            <input
              type="number"
              min={0}
              step={1}
              value={story.areaSqFt || ''}
              onChange={(e) => onChange({ ...story, areaSqFt: parseFloat(e.target.value) || 0 })}
              placeholder={exampleArea}
              className="beta-number-input"
            />
            <span className="beta-unit-label">sq ft</span>
          </div>
          <span className="field-hint-inline">
            {isSecond
              ? 'Measured from plan — 2nd floor can be larger or smaller than 1st'
              : 'Measured from plan — for L-shapes use actual sq ft, not bounding box'}
          </span>
        </div>
        <div className="field">
          <label>{label} — New exterior wall LF</label>
          <div className="beta-input-row">
            <input
              type="number"
              min={0}
              step={0.5}
              value={story.exteriorWallLf || ''}
              onChange={(e) => onChange({ ...story, exteriorWallLf: parseFloat(e.target.value) || 0 })}
              placeholder={exampleLf}
              className="beta-number-input"
            />
            <span className="beta-unit-label">lin ft</span>
          </div>
          <span className="field-hint-inline">
            {isSecond
              ? 'Walk the 2nd-floor walls on your plan — not the tie-in or existing walls below'
              : 'Walk the new walls on your plan — exclude existing walls you tie into'}
          </span>
        </div>
        <div className="field">
          <label>{label} — Ceiling height</label>
          <select
            value={story.ceilingHeightFt}
            onChange={(e) => onChange({ ...story, ceilingHeightFt: parseFloat(e.target.value) })}
          >
            <option value={8}>8′</option>
            <option value={8.5}>8′6″</option>
            <option value={9}>9′</option>
            <option value={9.5}>9′6″</option>
            <option value={10}>10′</option>
            <option value={10.5}>10′6″</option>
            <option value={11}>11′</option>
            <option value={11.5}>11′6″</option>
            <option value={12}>12′</option>
            <option value={14}>14′</option>
            <option value={16}>16′</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function ZoneCard({
  zone,
  index: _zoneIndex,
  total,
  onChange,
  onRemove,
}: {
  zone: BetaZone
  index: number
  total: number
  onChange: (z: BetaZone) => void
  onRemove: () => void
}) {
  const hasSecond = !!zone.secondFloor

  function addSecondFloor() {
    onChange({
      ...zone,
      secondFloor: { areaSqFt: 0, exteriorWallLf: 0, ceilingHeightFt: 8 },
    })
  }

  function removeSecondFloor() {
    const { secondFloor: _, ...rest } = zone
    onChange(rest as BetaZone)
  }

  return (
    <div className="beta-zone-card">
      <div className="beta-zone-header">
        <input
          type="text"
          value={zone.name}
          onChange={(e) => onChange({ ...zone, name: e.target.value })}
          className="beta-zone-name-input"
          placeholder="Zone name (e.g. Main addition)"
        />
        {total > 1 && (
          <button type="button" className="btn-remove" onClick={onRemove} aria-label="Remove zone">
            ×
          </button>
        )}
      </div>

      <div className="field beta-tiein-field">
        <label>Existing wall this zone ties into</label>
        <div className="beta-input-row">
          <input
            type="number"
            min={0}
            step={0.5}
            value={zone.tieInLf || ''}
            onChange={(e) => onChange({ ...zone, tieInLf: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="beta-number-input"
          />
          <span className="beta-unit-label">lin ft</span>
        </div>
        <span className="field-hint-inline">
          The dashed line in the diagram — the existing wall you're attaching to.
          Enter 0 if standalone (no existing wall). Used for sill plate total only.
        </span>
      </div>

      <div className="beta-story-section">
        <div className="beta-story-label">1st floor</div>
        <StoryFields
          story={zone.firstFloor}
          label="1st floor"
          isSecond={false}
          onChange={(s) => onChange({ ...zone, firstFloor: s })}
        />
      </div>

      {hasSecond && zone.secondFloor ? (
        <div className="beta-second-floor">
          <div className="beta-second-floor-header">
            <div className="beta-story-label">2nd floor</div>
            <button type="button" className="beta-remove-link" onClick={removeSecondFloor}>
              Remove 2nd floor
            </button>
          </div>
          <StoryFields
            story={zone.secondFloor}
            label="2nd floor"
            isSecond={true}
            onChange={(s) => onChange({ ...zone, secondFloor: s })}
          />
        </div>
      ) : (
        <button type="button" className="btn-add beta-add-second" onClick={addSecondFloor}>
          + Add 2nd floor to this zone
        </button>
      )}
    </div>
  )
}

function InteriorWallRow({
  wall,
  index,
  onChange,
  onRemove,
}: {
  wall: BetaInteriorWall
  index: number
  onChange: (w: BetaInteriorWall) => void
  onRemove: () => void
}) {
  return (
    <div className="beta-interior-wall-row">
      <div className="field">
        <label>Wall {index + 1} — LF</label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={wall.lf || ''}
          onChange={(e) => onChange({ ...wall, lf: parseFloat(e.target.value) || 0 })}
          placeholder="e.g. 14"
          className="beta-number-input"
        />
      </div>
      <div className="field">
        <label>Height</label>
        <select value={wall.heightFt} onChange={(e) => onChange({ ...wall, heightFt: parseFloat(e.target.value) })}>
          <option value={8}>8′</option>
          <option value={9}>9′</option>
          <option value={10}>10′</option>
          <option value={14}>14′</option>
        </select>
      </div>
      <div className="field">
        <label>Size</label>
        <select value={wall.size} onChange={(e) => onChange({ ...wall, size: e.target.value as '2x4' | '2x6' })}>
          <option value="2x4">2×4</option>
          <option value="2x6">2×6</option>
        </select>
      </div>
      <button type="button" className="btn-remove" onClick={onRemove} aria-label="Remove wall">×</button>
    </div>
  )
}

function OpeningRow({
  opening,
  onChange,
  onRemove,
}: {
  opening: Opening
  onChange: (o: Opening) => void
  onRemove: () => void
}) {
  return (
    <div className="opening-row">
      <select value={opening.type} onChange={(e) => onChange({ ...opening, type: e.target.value as OpeningType })}>
        <option value="door">Door</option>
        <option value="window">Window</option>
      </select>
      <div className="opening-dimension">
        <span className="opening-dim-label">W</span>
        <input type="number" min={0} max={20} value={opening.widthFt || ''} onChange={(e) => onChange({ ...opening, widthFt: parseInt(e.target.value, 10) || 0 })} />
        <span className="opening-dim-label">′</span>
        <input type="number" min={0} max={11} value={opening.widthIn || ''} onChange={(e) => onChange({ ...opening, widthIn: parseInt(e.target.value, 10) || 0 })} />
        <span className="opening-dim-label">″</span>
      </div>
      <div className="opening-dimension">
        <span className="opening-dim-label">H</span>
        <input type="number" min={0} max={20} value={opening.heightFt || ''} onChange={(e) => onChange({ ...opening, heightFt: parseInt(e.target.value, 10) || 0 })} />
        <span className="opening-dim-label">′</span>
        <input type="number" min={0} max={11} value={opening.heightIn || ''} onChange={(e) => onChange({ ...opening, heightIn: parseInt(e.target.value, 10) || 0 })} />
        <span className="opening-dim-label">″</span>
      </div>
      <div className="opening-qty">
        <label>Qty</label>
        <input type="number" min={1} max={99} value={opening.quantity} onChange={(e) => onChange({ ...opening, quantity: parseInt(e.target.value, 10) || 1 })} />
      </div>
      <button type="button" className="btn-remove" onClick={onRemove} aria-label="Remove opening">×</button>
    </div>
  )
}

function getDefaultState(): BetaInput {
  return {
    projectName: '',
    zones: [defaultZone('Addition')],
    interiorWalls: [],
    openings: [],
    floorSpacing: 16,
    wallSpacing: 16,
    roofSpacing: 16,
    joistDirection: 'along-width',
    roof: { ...defaultRoof },
    wasteFactorPct: 10,
    ptRimJoistAtGrade: false,
  }
}

function loadState(): BetaInput {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) {
      const parsed = JSON.parse(s) as Partial<BetaInput>
      const def = getDefaultState()
      return { ...def, ...parsed, roof: { ...defaultRoof, ...parsed.roof } }
    }
  } catch { /* ignore */ }
  return getDefaultState()
}

export default function BetaForm({ onSubmit }: BetaFormProps) {
  const initialState = useRef(loadState()).current
  const [projectName, setProjectName] = useState(initialState.projectName ?? '')
  const [zones, setZones] = useState<BetaZone[]>(initialState.zones)
  const [interiorWalls, setInteriorWalls] = useState<BetaInteriorWall[]>(initialState.interiorWalls)
  const [openings, setOpenings] = useState<Opening[]>(initialState.openings)
  const [floorSpacing, setFloorSpacing] = useState<FramingSpacing>(initialState.floorSpacing)
  const [wallSpacing, setWallSpacing] = useState<FramingSpacing>(initialState.wallSpacing)
  const [roofSpacing, setRoofSpacing] = useState<FramingSpacing>(initialState.roofSpacing)
  const [joistDirection, setJoistDirection] = useState<JoistDirection>(initialState.joistDirection)
  const [roof, setRoof] = useState<BetaInput['roof']>(initialState.roof)
  const [wasteFactorPct, setWasteFactorPct] = useState(initialState.wasteFactorPct)
  const [ptRimJoistAtGrade, setPtRimJoistAtGrade] = useState(initialState.ptRimJoistAtGrade)
  const [validationError, setValidationError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projectName, zones, interiorWalls, openings, floorSpacing, wallSpacing,
        roofSpacing, joistDirection, roof, wasteFactorPct, ptRimJoistAtGrade,
      }))
    } catch { /* ignore */ }
  }, [projectName, zones, interiorWalls, openings, floorSpacing, wallSpacing, roofSpacing, joistDirection, roof, wasteFactorPct, ptRimJoistAtGrade])

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(saveToStorage, 500)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [saveToStorage])

  function addZone() {
    setZones([...zones, defaultZone(`Zone ${zones.length + 1}`)])
  }

  function removeZone(id: string) {
    setZones(zones.filter((z) => z.id !== id))
  }

  function updateZone(updated: BetaZone) {
    setZones(zones.map((z) => (z.id === updated.id ? updated : z)))
  }

  function addInteriorWall() {
    setInteriorWalls([...interiorWalls, {
      id: crypto.randomUUID(),
      lf: 0,
      heightFt: 8,
      size: '2x4',
    }])
  }

  function removeInteriorWall(id: string) {
    setInteriorWalls(interiorWalls.filter((w) => w.id !== id))
  }

  function updateInteriorWall(updated: BetaInteriorWall) {
    setInteriorWalls(interiorWalls.map((w) => (w.id === updated.id ? updated : w)))
  }

  function addOpening() {
    setOpenings([...openings, {
      id: crypto.randomUUID(),
      type: 'door',
      widthFt: 3, widthIn: 0,
      heightFt: 6, heightIn: 8,
      sillHeightFt: 0, sillHeightIn: 0,
      quantity: 1,
    }])
  }

  function removeOpening(id: string) {
    setOpenings(openings.filter((o) => o.id !== id))
  }

  function updateOpening(updated: Opening) {
    setOpenings(openings.map((o) => (o.id === updated.id ? updated : o)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    for (const zone of zones) {
      if (zone.firstFloor.areaSqFt <= 0 || zone.firstFloor.exteriorWallLf <= 0) {
        setValidationError(`"${zone.name}": enter floor area and exterior wall LF for the 1st floor.`)
        return
      }
      if (zone.secondFloor) {
        if (zone.secondFloor.areaSqFt <= 0 || zone.secondFloor.exteriorWallLf <= 0) {
          setValidationError(`"${zone.name}": enter floor area and exterior wall LF for the 2nd floor.`)
          return
        }
      }
    }
    onSubmit({ projectName: projectName.trim() || undefined, zones, interiorWalls, openings, floorSpacing, wallSpacing, roofSpacing, joistDirection, roof, wasteFactorPct, ptRimJoistAtGrade })
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <fieldset className="form-section">
        <legend>Project</legend>
        <div className="field">
          <label htmlFor="beta-project-name">Project name</label>
          <input
            id="beta-project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Smith L-Addition, Johnson Garage"
            className="project-name-input"
          />
        </div>
        <div className="radio-group">
          <label>
            <input type="checkbox" checked={ptRimJoistAtGrade} onChange={(e) => setPtRimJoistAtGrade(e.target.checked)} />
            PT rim joist at grade
          </label>
          <span className="field-hint-inline">Pressure-treated for ground contact</span>
        </div>
      </fieldset>

      {validationError && (
        <div className="validation-error" role="alert">{validationError}</div>
      )}

      <fieldset className="form-section">
        <legend>Building zones</legend>
        <p className="field-hint">
          One zone = one addition or wing. Add a second zone for a separate garage, second wing, etc.
          Each zone can have a 1st floor and an optional 2nd floor with its own dimensions.
        </p>
        {zones.map((zone, index) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            index={index}
            total={zones.length}
            onChange={updateZone}
            onRemove={() => removeZone(zone.id)}
          />
        ))}
        <button type="button" className="btn-add" onClick={addZone}>
          + Add another zone (garage, wing, etc.)
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Interior walls</legend>
        <p className="field-hint">
          Add each new interior wall run measured from your plan — across all zones combined.
          Typical uses: partition walls, bathroom enclosures, bedroom separations, closets.
          Each run gets its own row (e.g. one 14 LF bathroom wall, one 22 LF bedroom partition).
        </p>
        {interiorWalls.map((wall, index) => (
          <InteriorWallRow
            key={wall.id}
            wall={wall}
            index={index}
            onChange={updateInteriorWall}
            onRemove={() => removeInteriorWall(wall.id)}
          />
        ))}
        <button type="button" className="btn-add" onClick={addInteriorWall}>
          + Add interior wall
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Framing</legend>
        <div className="spacing-grid">
          <div className="field">
            <label>Floor joists</label>
            <select value={floorSpacing} onChange={(e) => setFloorSpacing(parseInt(e.target.value, 10) as FramingSpacing)}>
              <option value={12}>12″ OC</option>
              <option value={16}>16″ OC</option>
              <option value={24}>24″ OC</option>
            </select>
          </div>
          <div className="field">
            <label>Wall studs</label>
            <select value={wallSpacing} onChange={(e) => setWallSpacing(parseInt(e.target.value, 10) as FramingSpacing)}>
              <option value={12}>12″ OC</option>
              <option value={16}>16″ OC</option>
              <option value={24}>24″ OC</option>
            </select>
          </div>
          <div className="field">
            <label>Roof</label>
            <select value={roofSpacing} onChange={(e) => setRoofSpacing(parseInt(e.target.value, 10) as FramingSpacing)}>
              <option value={12}>12″ OC</option>
              <option value={16}>16″ OC</option>
              <option value={24}>24″ OC</option>
            </select>
          </div>
          <div className="field">
            <label>Waste factor</label>
            <select value={wasteFactorPct} onChange={(e) => setWasteFactorPct(parseInt(e.target.value, 10))}>
              <option value={5}>5%</option>
              <option value={10}>10% (default)</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: '1rem' }}>
          <label>Joist direction</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="betaJoistDir" checked={joistDirection === 'along-width'} onChange={() => setJoistDirection('along-width')} />
              Along width (span length)
            </label>
            <label>
              <input type="radio" name="betaJoistDir" checked={joistDirection === 'along-length'} onChange={() => setJoistDirection('along-length')} />
              Along length (span width)
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Openings (doors &amp; windows)</legend>
        {openings.map((opening) => (
          <OpeningRow
            key={opening.id}
            opening={opening}
            onChange={updateOpening}
            onRemove={() => removeOpening(opening.id)}
          />
        ))}
        <button type="button" className="btn-add" onClick={addOpening}>+ Add opening</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Roof framing (stick-built)</legend>
        <div className="radio-group" style={{ marginBottom: '0.75rem' }}>
          <label>
            <input type="checkbox" checked={roof.includeRoof} onChange={(e) => setRoof({ ...roof, includeRoof: e.target.checked })} />
            Include roof framing
          </label>
        </div>
        {roof.includeRoof && (
          <div className="roof-fields">
            <div className="field">
              <label>Roof type</label>
              <select value={roof.roofType} onChange={(e) => setRoof({ ...roof, roofType: e.target.value as RoofType })}>
                <option value="shed">Shed</option>
                <option value="gable">Gable</option>
              </select>
            </div>
            <div className="field">
              <label>Pitch</label>
              <select value={roof.pitch} onChange={(e) => setRoof({ ...roof, pitch: parseInt(e.target.value, 10) as RoofPitch })}>
                <option value={3}>3/12</option>
                <option value={4}>4/12</option>
                <option value={5}>5/12</option>
                <option value={6}>6/12</option>
              </select>
            </div>
            <div className="field">
              <label>Overhang</label>
              <select value={roof.overhang} onChange={(e) => setRoof({ ...roof, overhang: parseInt(e.target.value, 10) as OverhangInches })}>
                <option value={12}>12″</option>
                <option value={18}>18″</option>
                <option value={24}>24″</option>
              </select>
            </div>
            <div className="field">
              <label>Rafter size</label>
              <select value={roof.rafterSize} onChange={(e) => setRoof({ ...roof, rafterSize: e.target.value as RafterSize })}>
                <option value="2x6">2×6</option>
                <option value="2x8">2×8</option>
                <option value="2x10">2×10</option>
              </select>
            </div>
            <div className="field">
              <label>Ceiling</label>
              <select value={roof.ceilingType} onChange={(e) => setRoof({ ...roof, ceilingType: e.target.value as CeilingType })}>
                <option value="flat">Flat (ceiling joists)</option>
                <option value="cathedral">Cathedral (exposed)</option>
              </select>
            </div>
            {roof.roofType === 'gable' && (
              <div className="field">
                <label>Ridge board</label>
                <select value={roof.ridgeBoard ? 'yes' : 'no'} onChange={(e) => setRoof({ ...roof, ridgeBoard: e.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            )}
          </div>
        )}
      </fieldset>

      <div className="beta-submit-bar">
        <button type="submit" className="btn-submit">Generate material list</button>
      </div>
    </form>
  )
}
