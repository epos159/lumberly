import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'
import type {
  BetaInput,
  BetaZone,
  BetaStory,
  BetaRoom,
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

const STORAGE_KEY = 'lumberly-beta-form-state-v2'

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

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultRoom(): BetaRoom {
  return {
    id: generateId(),
    lengthFt: 0,
    lengthIn: 0,
    widthFt: 0,
    widthIn: 0,
    partitionWalls: 0,
  }
}

function defaultStory(ceilingHeightFt = 9): BetaStory {
  return {
    areaSqFt: 0,
    exteriorWallLf: 0,
    ceilingHeightFt,
    rooms: [],
    differentSize: false,
  }
}

function defaultZone(name: string): BetaZone {
  return {
    id: generateId(),
    name,
    tieInLf: 0,
    firstFloor: defaultStory(9),
    hasSecondFloor: false,
  }
}

function DimensionInput({
  label,
  feet,
  inches,
  onFeetChange,
  onInchesChange,
}: {
  label: string
  feet: number
  inches: number
  onFeetChange: (v: number) => void
  onInchesChange: (v: number) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="dimension-inputs">
        <input
          type="number"
          min={0}
          max={100}
          value={feet || ''}
          onChange={(e) => onFeetChange(parseInt(e.target.value, 10) || 0)}
          placeholder="ft"
        />
        <span className="dimension-sep">′</span>
        <input
          type="number"
          min={0}
          max={11}
          value={inches || ''}
          onChange={(e) => onInchesChange(Math.min(11, parseInt(e.target.value, 10) || 0))}
          placeholder="in"
        />
        <span className="dimension-sep">″</span>
      </div>
    </div>
  )
}

/** Instructional plan diagram: red = exterior, blue = interior */
function MeasureDiagram() {
  return (
    <div className="beta-measure-guide">
      <svg
        viewBox="0 0 260 200"
        width="260"
        height="200"
        aria-label="How to measure: red exterior walls, blue interior partitions"
        className="beta-svg-diagram"
      >
        {/* Existing house */}
        <rect x="4" y="50" width="70" height="120" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
        <text x="39" y="115" textAnchor="middle" fontSize="9" fill="#6b7280">Existing</text>

        {/* Floor area fill */}
        <rect x="74" y="50" width="170" height="120" fill="#fef2f2" opacity="0.5" />

        {/* Tie-in (not measured as new exterior) */}
        <line x1="74" y1="50" x2="74" y2="170" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,4" />
        <text x="74" y="42" textAnchor="middle" fontSize="8" fill="#6b7280">Tie-in</text>

        {/* Red — new exterior walls */}
        <polyline
          points="74,50 244,50 244,170 74,170"
          fill="none"
          stroke="#dc2626"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Don't draw red on tie-in side — mask with gray dashed overlay */}
        <line x1="74" y1="50" x2="74" y2="170" stroke="#f3f4f6" strokeWidth="5" />

        {/* Blue — interior partitions */}
        <line x1="150" y1="55" x2="150" y2="165" stroke="#2563eb" strokeWidth="2.5" />
        <line x1="79" y1="110" x2="239" y2="110" stroke="#2563eb" strokeWidth="2.5" />

        {/* Labels */}
        <text x="160" y="95" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="600">Rooms</text>
        <text x="195" y="38" fontSize="9" fill="#dc2626" fontWeight="600">← walk red walls</text>
        <text x="195" y="48" fontSize="9" fill="#dc2626">for exterior LF</text>
      </svg>
      <ul className="beta-measure-legend">
        <li><span className="beta-legend-swatch beta-legend-red" /> Red — new exterior walls (measure lineal feet)</li>
        <li><span className="beta-legend-swatch beta-legend-blue" /> Blue — interior partitions (enter as rooms below)</li>
        <li><span className="beta-legend-swatch beta-legend-fill" /> Shaded — floor area (measure sq ft)</li>
        <li>Sq ft drives joists &amp; subfloor; exterior LF drives wall studs &amp; sheathing — both needed for L-shapes.</li>
      </ul>
    </div>
  )
}

const CEILING_OPTIONS = [8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 14, 16]

function BetaRoomRow({
  room,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  room: BetaRoom
  index: number
  onChange: (r: BetaRoom) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <div className="beta-room-row">
      <div className="room-label">Room {index + 1}</div>
      <div className="room-fields">
        <div className="field">
          <label>Name (optional)</label>
          <input
            type="text"
            value={room.name ?? ''}
            onChange={(e) => onChange({ ...room, name: e.target.value })}
            placeholder="e.g. Bedroom, Bath"
            className="beta-room-name-input"
          />
        </div>
        <DimensionInput
          label="Length"
          feet={room.lengthFt}
          inches={room.lengthIn}
          onFeetChange={(v) => onChange({ ...room, lengthFt: v })}
          onInchesChange={(v) => onChange({ ...room, lengthIn: v })}
        />
        <DimensionInput
          label="Width"
          feet={room.widthFt}
          inches={room.widthIn}
          onFeetChange={(v) => onChange({ ...room, widthFt: v })}
          onInchesChange={(v) => onChange({ ...room, widthIn: v })}
        />
        <div className="field">
          <label>Partition walls</label>
          <select
            value={room.partitionWalls}
            onChange={(e) =>
              onChange({ ...room, partitionWalls: parseInt(e.target.value, 10) as 0 | 1 | 2 | 3 })
            }
          >
            <option value={0}>0 (open)</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3 (e.g. bathroom)</option>
          </select>
          <span className="field-hint-inline">Blue lines on diagram — 1–2 shared; 3 = enclosed room</span>
        </div>
      </div>
      {canRemove && (
        <button type="button" className="btn-remove" onClick={onRemove} aria-label="Remove room">×</button>
      )}
    </div>
  )
}

function FloorSection({
  story,
  floorLabel,
  isSecond,
  firstFloor,
  onChange,
}: {
  story: BetaStory
  floorLabel: string
  isSecond: boolean
  firstFloor?: BetaStory
  onChange: (s: BetaStory) => void
}) {
  const showSizeFields = !isSecond || story.differentSize === true
  const inheritedNote = isSecond && !story.differentSize && firstFloor
    ? `Using 1st floor: ${firstFloor.areaSqFt} sq ft, ${firstFloor.exteriorWallLf} LF exterior`
    : null

  function addRoom() {
    onChange({ ...story, rooms: [...story.rooms, defaultRoom()] })
  }

  function updateRoom(updated: BetaRoom) {
    onChange({ ...story, rooms: story.rooms.map((r) => (r.id === updated.id ? updated : r)) })
  }

  function removeRoom(id: string) {
    onChange({ ...story, rooms: story.rooms.filter((r) => r.id !== id) })
  }

  return (
    <div className="beta-floor-section">
      {isSecond && (
        <div className="radio-group beta-diff-size-toggle">
          <label>
            <input
              type="checkbox"
              checked={story.differentSize === true}
              onChange={(e) => {
                const differentSize = e.target.checked
                onChange({
                  ...story,
                  differentSize,
                  ...(differentSize || !firstFloor
                    ? {}
                    : {
                        areaSqFt: firstFloor.areaSqFt,
                        exteriorWallLf: firstFloor.exteriorWallLf,
                      }),
                })
              }}
            />
            2nd floor different size than 1st
          </label>
        </div>
      )}

      {inheritedNote && (
        <p className="field-hint beta-inherited-note">{inheritedNote}</p>
      )}

      {showSizeFields && (
        <div className="beta-story-inputs beta-story-inputs-compact">
          <div className="field">
            <label>{floorLabel} — Floor area</label>
            <div className="beta-input-row">
              <input
                type="number"
                min={0}
                step={1}
                value={story.areaSqFt || ''}
                onChange={(e) => onChange({ ...story, areaSqFt: parseFloat(e.target.value) || 0 })}
                placeholder="320"
                className="beta-number-input"
              />
              <span className="beta-unit-label">sq ft</span>
            </div>
            <span className="field-hint-inline">Measured from plan — actual area for L-shapes</span>
          </div>
          <div className="field">
            <label>{floorLabel} — New exterior wall LF</label>
            <div className="beta-input-row">
              <input
                type="number"
                min={0}
                step={0.5}
                value={story.exteriorWallLf || ''}
                onChange={(e) => onChange({ ...story, exteriorWallLf: parseFloat(e.target.value) || 0 })}
                placeholder="72"
                className="beta-number-input"
              />
              <span className="beta-unit-label">lin ft</span>
            </div>
            <span className="field-hint-inline">Walk the red walls — exclude tie-in</span>
          </div>
        </div>
      )}

      <div className="field">
        <label>{floorLabel} — Ceiling height</label>
        <select
          value={story.ceilingHeightFt}
          onChange={(e) => onChange({ ...story, ceilingHeightFt: parseFloat(e.target.value) })}
        >
          {CEILING_OPTIONS.map((h) => (
            <option key={h} value={h}>{h === Math.floor(h) ? `${h}′` : `${Math.floor(h)}′${(h % 1) * 12}″`}</option>
          ))}
        </select>
      </div>

      <div className="beta-rooms-block">
        <div className="beta-story-label">Rooms on {floorLabel.toLowerCase()}</div>
        <p className="field-hint">Interior partitions for this floor — drives 2×4 stud count.</p>
        {story.rooms.map((room, index) => (
          <BetaRoomRow
            key={room.id}
            room={room}
            index={index}
            onChange={updateRoom}
            onRemove={() => removeRoom(room.id)}
            canRemove={story.rooms.length > 0}
          />
        ))}
        <button type="button" className="btn-add" onClick={addRoom}>+ Add room</button>
      </div>
    </div>
  )
}

function ZoneCard({
  zone,
  index,
  total,
  cardRef,
  onChange,
  onRemove,
}: {
  zone: BetaZone
  index: number
  total: number
  cardRef?: RefObject<HTMLDivElement>
  onChange: (z: BetaZone) => void
  onRemove: () => void
}) {
  function addSecondFloor() {
    onChange({
      ...zone,
      hasSecondFloor: true,
      secondFloor: {
        areaSqFt: zone.firstFloor.areaSqFt,
        exteriorWallLf: zone.firstFloor.exteriorWallLf,
        ceilingHeightFt: 8,
        rooms: [],
        differentSize: false,
      },
    })
  }

  function removeSecondFloor() {
    onChange({
      ...zone,
      hasSecondFloor: false,
      secondFloor: undefined,
    })
  }

  return (
    <div className="beta-zone-card" ref={cardRef} data-zone-index={index}>
      <div className="beta-zone-header">
        <span className="beta-zone-number">Zone {index + 1}</span>
        <input
          type="text"
          value={zone.name}
          onChange={(e) => onChange({ ...zone, name: e.target.value })}
          className="beta-zone-name-input"
          placeholder="e.g. Main addition, Garage wing"
        />
        {total > 1 && (
          <button type="button" className="btn-remove" onClick={onRemove} aria-label="Remove zone">×</button>
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
        <span className="field-hint-inline">Dashed tie-in on diagram. Enter 0 if standalone.</span>
      </div>

      <div className="beta-story-section">
        <div className="beta-story-label">1st floor</div>
        <FloorSection
          story={zone.firstFloor}
          floorLabel="1st floor"
          isSecond={false}
          onChange={(s) => onChange({ ...zone, firstFloor: s })}
        />
      </div>

      {zone.hasSecondFloor && zone.secondFloor ? (
        <div className="beta-second-floor">
          <div className="beta-second-floor-header">
            <div className="beta-story-label">2nd floor</div>
            <button type="button" className="beta-remove-link" onClick={removeSecondFloor}>
              Remove 2nd floor
            </button>
          </div>
          <FloorSection
            story={zone.secondFloor}
            floorLabel="2nd floor"
            isSecond={true}
            firstFloor={zone.firstFloor}
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

function normalizeRoom(r: Partial<BetaRoom> & { id?: string }): BetaRoom {
  return {
    id: r.id || generateId(),
    name: r.name,
    lengthFt: r.lengthFt ?? 0,
    lengthIn: r.lengthIn ?? 0,
    widthFt: r.widthFt ?? 0,
    widthIn: r.widthIn ?? 0,
    partitionWalls: (r.partitionWalls ?? 0) as 0 | 1 | 2 | 3,
  }
}

function normalizeStory(s: Partial<BetaStory> | undefined, ceilingDefault: number): BetaStory {
  return {
    areaSqFt: s?.areaSqFt ?? 0,
    exteriorWallLf: s?.exteriorWallLf ?? 0,
    ceilingHeightFt: s?.ceilingHeightFt ?? ceilingDefault,
    rooms: Array.isArray(s?.rooms) ? s.rooms.map(normalizeRoom) : [],
    differentSize: s?.differentSize ?? false,
  }
}

function normalizeZone(z: Partial<BetaZone> & { id?: string }, index: number): BetaZone {
  const firstFloor = normalizeStory(z.firstFloor, 9)
  const hasSecondFloor = z.hasSecondFloor === true || !!z.secondFloor
  return {
    id: z.id || generateId(),
    name: z.name || (index === 0 ? 'Addition' : `Zone ${index + 1}`),
    tieInLf: z.tieInLf ?? 0,
    firstFloor,
    hasSecondFloor,
    secondFloor: hasSecondFloor
      ? normalizeStory(z.secondFloor, 8)
      : undefined,
  }
}

function getDefaultState(): BetaInput {
  return {
    projectName: '',
    zones: [defaultZone('Addition')],
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
      const zones = Array.isArray(parsed.zones) && parsed.zones.length > 0
        ? parsed.zones.map((z, i) => normalizeZone(z, i))
        : def.zones
      return {
        ...def,
        ...parsed,
        zones,
        openings: Array.isArray(parsed.openings)
          ? parsed.openings.map((o) => ({ ...o, id: o.id || generateId() }))
          : [],
        roof: { ...defaultRoof, ...parsed.roof },
      }
    }
  } catch { /* ignore */ }
  return getDefaultState()
}

export default function BetaForm({ onSubmit }: BetaFormProps) {
  const initialState = useRef(loadState()).current
  const [projectName, setProjectName] = useState(initialState.projectName ?? '')
  const [zones, setZones] = useState<BetaZone[]>(initialState.zones)
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
  const lastZoneRef = useRef<HTMLDivElement>(null)
  const scrollToNewZoneRef = useRef(false)

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projectName, zones, openings, floorSpacing, wallSpacing,
        roofSpacing, joistDirection, roof, wasteFactorPct, ptRimJoistAtGrade,
      }))
    } catch { /* ignore */ }
  }, [projectName, zones, openings, floorSpacing, wallSpacing, roofSpacing, joistDirection, roof, wasteFactorPct, ptRimJoistAtGrade])

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(saveToStorage, 500)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [saveToStorage])

  useEffect(() => {
    if (scrollToNewZoneRef.current && lastZoneRef.current) {
      scrollToNewZoneRef.current = false
      lastZoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [zones.length])

  const addZone = useCallback(() => {
    scrollToNewZoneRef.current = true
    setZones((prev) => [...prev, defaultZone(`Zone ${prev.length + 1}`)])
  }, [])

  const removeZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id))
  }, [])

  const updateZone = useCallback((updated: BetaZone) => {
    setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)))
  }, [])

  const addOpening = useCallback(() => {
    setOpenings((prev) => [...prev, {
      id: generateId(),
      type: 'door' as const,
      widthFt: 3, widthIn: 0,
      heightFt: 6, heightIn: 8,
      sillHeightFt: 0, sillHeightIn: 0,
      quantity: 1,
    }])
  }, [])

  const removeOpening = useCallback((id: string) => {
    setOpenings((prev) => prev.filter((o) => o.id !== id))
  }, [])

  const updateOpening = useCallback((updated: Opening) => {
    setOpenings((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  }, [])

  function validateStory(story: BetaStory, firstFloor: BetaStory | undefined, label: string): string | null {
    const effective = firstFloor && story.differentSize === false
      ? { ...story, areaSqFt: firstFloor.areaSqFt, exteriorWallLf: firstFloor.exteriorWallLf }
      : story
    if (effective.areaSqFt <= 0 || effective.exteriorWallLf <= 0) {
      return `${label}: enter floor area and exterior wall LF.`
    }
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    for (const zone of zones) {
      const err1 = validateStory(zone.firstFloor, undefined, `"${zone.name}" 1st floor`)
      if (err1) { setValidationError(err1); return }
      if (zone.hasSecondFloor && zone.secondFloor) {
        const err2 = validateStory(zone.secondFloor, zone.firstFloor, `"${zone.name}" 2nd floor`)
        if (err2) { setValidationError(err2); return }
      }
    }
    onSubmit({
      projectName: projectName.trim() || undefined,
      zones,
      openings,
      floorSpacing,
      wallSpacing,
      roofSpacing,
      joistDirection,
      roof,
      wasteFactorPct,
      ptRimJoistAtGrade,
    })
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
          One zone = one addition or wing (e.g. main addition + separate garage).
          Each zone has a 1st floor and optional 2nd floor with its own rooms.
        </p>
        <MeasureDiagram />
        {zones.map((zone, index) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            index={index}
            total={zones.length}
            cardRef={index === zones.length - 1 ? lastZoneRef : undefined}
            onChange={updateZone}
            onRemove={() => removeZone(zone.id)}
          />
        ))}
        <button type="button" className="btn-add" onClick={addZone}>
          + Add another zone (garage, wing, etc.)
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
