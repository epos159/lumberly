import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  ProjectInput,
  Room,
  Opening,
  OpeningType,
  RoofType,
  RoofPitch,
  RidgeDirection,
  OverhangInches,
  RafterSize,
  CeilingType,
} from '../types'

interface ProjectFormProps {
  onSubmit: (input: ProjectInput) => void
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

function RoomRow({
  room,
  index,
  onRemove,
  onChange,
  canRemove,
}: {
  room: Room
  index: number
  onRemove: () => void
  onChange: (r: Room) => void
  canRemove: boolean
}) {
  return (
    <div className="room-row">
      <div className="room-label">Room {index + 1}</div>
      <div className="room-fields">
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
          <label>Ceiling height</label>
          <select
            value={room.ceilingHeightFt}
            onChange={(e) =>
              onChange({ ...room, ceilingHeightFt: parseFloat(e.target.value) })
            }
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
          </select>
        </div>
        <div className="field">
          <label>Partition walls</label>
          <select
            value={room.partitionWalls}
            onChange={(e) =>
              onChange({
                ...room,
                partitionWalls: parseInt(e.target.value, 10) as 0 | 1 | 2,
              })
            }
          >
            <option value={0}>0 (all exterior)</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
          <span className="field-hint-inline">walls shared with other rooms</span>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          className="btn-remove"
          onClick={onRemove}
          aria-label="Remove room"
        >
          ×
        </button>
      )}
    </div>
  )
}

function OpeningRow({
  opening,
  onRemove,
  onChange,
}: {
  opening: Opening
  onRemove: () => void
  onChange: (o: Opening) => void
}) {
  return (
    <div className="opening-row">
      <div className="opening-qty">
        <label>Qty</label>
        <input
          type="number"
          min={1}
          max={99}
          value={opening.quantity || 1}
          onChange={(e) =>
            onChange({ ...opening, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
          }
        />
      </div>
      <select
        value={opening.type}
        onChange={(e) => onChange({ ...opening, type: e.target.value as OpeningType })}
      >
        <option value="door">Door</option>
        <option value="window">Window</option>
      </select>
      <div className="opening-dimension">
        <span className="opening-dim-label">W</span>
        <input
          type="number"
          min={0}
          max={12}
          placeholder="ft"
          value={opening.widthFt || ''}
          onChange={(e) => onChange({ ...opening, widthFt: parseInt(e.target.value, 10) || 0 })}
        />
        <span>′</span>
        <input
          type="number"
          min={0}
          max={11}
          placeholder="in"
          value={opening.widthIn || ''}
          onChange={(e) =>
            onChange({ ...opening, widthIn: Math.min(11, parseInt(e.target.value, 10) || 0) })
          }
        />
        <span>″</span>
      </div>
      <div className="opening-dimension">
        <span className="opening-dim-label">H</span>
        <input
          type="number"
          min={0}
          max={12}
          placeholder="ft"
          value={opening.heightFt || ''}
          onChange={(e) => onChange({ ...opening, heightFt: parseInt(e.target.value, 10) || 0 })}
        />
        <span>′</span>
        <input
          type="number"
          min={0}
          max={11}
          placeholder="in"
          value={opening.heightIn || ''}
          onChange={(e) =>
            onChange({ ...opening, heightIn: Math.min(11, parseInt(e.target.value, 10) || 0) })
          }
        />
        <span>″</span>
      </div>
      <div className="opening-dimension">
        <span className="opening-dim-label">Sill</span>
        <input
          type="number"
          min={0}
          max={8}
          placeholder="ft"
          value={opening.sillHeightFt ?? ''}
          onChange={(e) =>
            onChange({ ...opening, sillHeightFt: parseInt(e.target.value, 10) || 0 })
          }
        />
        <span>′</span>
        <input
          type="number"
          min={0}
          max={11}
          placeholder="in"
          value={opening.sillHeightIn ?? ''}
          onChange={(e) =>
            onChange({
              ...opening,
              sillHeightIn: Math.min(11, parseInt(e.target.value, 10) || 0),
            })
          }
        />
        <span>″</span>
      </div>
      {opening.type === 'door' && (
        <span className="sill-hint">Doors typically 0″ sill</span>
      )}
      <button type="button" className="btn-remove" onClick={onRemove} aria-label="Remove opening">
        ×
      </button>
    </div>
  )
}

const STORAGE_KEY = 'lumberly-form-state'

const defaultRoof: ProjectInput['roof'] = {
  includeRoof: false,
  roofType: 'gable',
  pitch: 5,
  ridgeDirection: 'length',
  overhang: 18,
  rafterSize: '2x8',
  ridgeBoard: true,
  ceilingType: 'flat',
}

interface FormState {
  rooms: Room[]
  overallLengthFt: number
  overallLengthIn: number
  overallWidthFt: number
  overallWidthIn: number
  isAddition: boolean
  tieInDirection: 'length' | 'width'
  studSpacing: 12 | 16
  joistDirection: 'along-length' | 'along-width'
  roof: ProjectInput['roof']
  openings: Opening[]
  projectName: string
  wasteFactorPct: number
}

function getDefaultState(): FormState {
  return {
    rooms: [
      {
        id: crypto.randomUUID(),
        lengthFt: 0,
        lengthIn: 0,
        widthFt: 0,
        widthIn: 0,
        ceilingHeightFt: 8,
        partitionWalls: 0,
      },
    ],
    overallLengthFt: 0,
    overallLengthIn: 0,
    overallWidthFt: 0,
    overallWidthIn: 0,
    isAddition: false,
    tieInDirection: 'width',
    studSpacing: 16,
    joistDirection: 'along-width',
    roof: { ...defaultRoof },
    openings: [],
    projectName: '',
    wasteFactorPct: 10,
  }
}

function loadState(): FormState {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) {
      const parsed = JSON.parse(s) as Partial<FormState>
      const def = getDefaultState()
      const rooms: Room[] = Array.isArray(parsed.rooms) && parsed.rooms.length > 0
        ? parsed.rooms.map((r: Room) => ({
            ...def.rooms[0],
            ...r,
            id: r.id || crypto.randomUUID(),
          }))
        : def.rooms
      const openings: Opening[] = Array.isArray(parsed.openings)
        ? parsed.openings.map((o: Opening) => ({ ...o, id: o.id || crypto.randomUUID() }))
        : def.openings
      return {
        ...def,
        ...parsed,
        rooms,
        openings,
        roof: { ...defaultRoof, ...parsed.roof },
        projectName: typeof parsed.projectName === 'string' ? parsed.projectName : '',
        wasteFactorPct: typeof parsed.wasteFactorPct === 'number' ? Math.max(0, Math.min(50, parsed.wasteFactorPct)) : 10,
      }
    }
  } catch { /* ignore */ }
  return getDefaultState()
}

export default function ProjectForm({ onSubmit }: ProjectFormProps) {
  const initialState = useRef(loadState()).current
  const [rooms, setRooms] = useState<Room[]>(initialState.rooms)
  const [overallLengthFt, setOverallLengthFt] = useState(initialState.overallLengthFt)
  const [overallLengthIn, setOverallLengthIn] = useState(initialState.overallLengthIn)
  const [overallWidthFt, setOverallWidthFt] = useState(initialState.overallWidthFt)
  const [overallWidthIn, setOverallWidthIn] = useState(initialState.overallWidthIn)
  const [isAddition, setIsAddition] = useState(initialState.isAddition)
  const [tieInDirection, setTieInDirection] = useState<'length' | 'width'>(initialState.tieInDirection)
  const [studSpacing, setStudSpacing] = useState<12 | 16>(initialState.studSpacing)
  const [joistDirection, setJoistDirection] = useState<'along-length' | 'along-width'>(initialState.joistDirection)
  const [roof, setRoof] = useState<ProjectInput['roof']>(initialState.roof)
  const [openings, setOpenings] = useState<Opening[]>(initialState.openings)
  const [projectName, setProjectName] = useState(initialState.projectName)
  const [wasteFactorPct, setWasteFactorPct] = useState(initialState.wasteFactorPct)
  const [validationError, setValidationError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveToStorage = useCallback(() => {
    const state = {
      rooms,
      overallLengthFt,
      overallLengthIn,
      overallWidthFt,
      overallWidthIn,
      isAddition,
      tieInDirection,
      studSpacing,
      joistDirection,
      roof,
      openings,
      projectName,
      wasteFactorPct,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
  }, [rooms, overallLengthFt, overallLengthIn, overallWidthFt, overallWidthIn, isAddition, tieInDirection, studSpacing, joistDirection, roof, openings, projectName, wasteFactorPct])

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(saveToStorage, 500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [saveToStorage])

  useEffect(() => {
    if (rooms.length === 1 && rooms[0]) {
      setOverallLengthFt(rooms[0].lengthFt)
      setOverallLengthIn(rooms[0].lengthIn)
      setOverallWidthFt(rooms[0].widthFt)
      setOverallWidthIn(rooms[0].widthIn)
    }
  }, [
    rooms.length,
    rooms[0]?.lengthFt,
    rooms[0]?.lengthIn,
    rooms[0]?.widthFt,
    rooms[0]?.widthIn,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    const overallLengthInches = overallLengthFt * 12 + overallLengthIn
    const overallWidthInches = overallWidthFt * 12 + overallWidthIn
    if (overallLengthInches <= 0 || overallWidthInches <= 0) {
      setValidationError('Enter a valid overall footprint (length and width must be greater than zero).')
      return
    }
    const invalidRooms = rooms.filter((r) => (r.lengthFt * 12 + r.lengthIn) <= 0 || (r.widthFt * 12 + r.widthIn) <= 0)
    if (invalidRooms.length > 0) {
      setValidationError('Each room must have length and width greater than zero.')
      return
    }
    onSubmit({
      projectName: projectName.trim() || undefined,
      rooms,
      overallLengthFt,
      overallLengthIn,
      overallWidthFt,
      overallWidthIn,
      isAddition,
      tieInDirection,
      studSpacing,
      joistDirection,
      roof,
      openings,
      wasteFactorPct,
    })
  }

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: crypto.randomUUID(),
        lengthFt: 0,
        lengthIn: 0,
        widthFt: 0,
        widthIn: 0,
        ceilingHeightFt: 8,
        partitionWalls: 1,
      },
    ])
  }

  const removeRoom = (id: string) => {
    setRooms(rooms.filter((r) => r.id !== id))
  }

  const updateRoom = (updated: Room) => {
    setRooms(rooms.map((r) => (r.id === updated.id ? updated : r)))
  }

  const addOpening = () => {
    setOpenings([
      ...openings,
      {
        id: crypto.randomUUID(),
        type: 'door',
        widthFt: 3,
        widthIn: 0,
        heightFt: 6,
        heightIn: 8,
        sillHeightFt: 0,
        sillHeightIn: 0,
        quantity: 1,
      },
    ])
  }

  const removeOpening = (id: string) => {
    setOpenings(openings.filter((o) => o.id !== id))
  }

  const updateOpening = (updated: Opening) => {
    setOpenings(openings.map((o) => (o.id === updated.id ? updated : o)))
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <fieldset className="form-section">
        <legend>Project</legend>
        <div className="field">
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Smith Addition, Lot 42"
            className="project-name-input"
          />
        </div>
      </fieldset>

      {validationError && (
        <div className="validation-error" role="alert">
          {validationError}
        </div>
      )}

      <fieldset className="form-section">
        <legend>Rooms</legend>
        {rooms.map((room, index) => (
          <RoomRow
            key={room.id}
            room={room}
            index={index}
            onRemove={() => removeRoom(room.id)}
            onChange={updateRoom}
            canRemove={rooms.length > 1}
          />
        ))}
        <button type="button" className="btn-add" onClick={addRoom}>
          + Add room
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Structure type</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="structureType"
              checked={!isAddition}
              onChange={() => setIsAddition(false)}
            />
            Standalone (4 exterior walls)
          </label>
          <label>
            <input
              type="radio"
              name="structureType"
              checked={isAddition}
              onChange={() => setIsAddition(true)}
            />
            Addition (tie-in to existing)
          </label>
        </div>
        {isAddition && (
          <div className="field" style={{ marginTop: '0.75rem' }}>
            <label>Tie-in wall runs along</label>
            <select
              value={tieInDirection}
              onChange={(e) => setTieInDirection(e.target.value as 'length' | 'width')}
            >
              <option value="length">Length</option>
              <option value="width">Width</option>
            </select>
            <span className="field-hint-inline">
              The wall that connects to the existing structure
            </span>
          </div>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Overall footprint</legend>
        <p className="field-hint">Used for floor framing (joists, subfloor, rim). Auto-filled from Room 1 when single room.</p>
        <DimensionInput
          label="Length"
          feet={overallLengthFt}
          inches={overallLengthIn}
          onFeetChange={setOverallLengthFt}
          onInchesChange={setOverallLengthIn}
        />
        <DimensionInput
          label="Width"
          feet={overallWidthFt}
          inches={overallWidthIn}
          onFeetChange={setOverallWidthFt}
          onInchesChange={setOverallWidthIn}
        />
      </fieldset>

      <fieldset className="form-section">
        <legend>Framing spacing</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="studSpacing"
              checked={studSpacing === 16}
              onChange={() => setStudSpacing(16)}
            />
            16″ OC (default)
          </label>
          <label>
            <input
              type="radio"
              name="studSpacing"
              checked={studSpacing === 12}
              onChange={() => setStudSpacing(12)}
            />
            12″ OC
          </label>
        </div>
        <p className="field-hint">Applies to floor joists, wall studs, rafters, ceiling joists</p>
        <div className="field" style={{ marginTop: '0.75rem' }}>
          <label htmlFor="waste-factor">Waste factor</label>
          <select
            id="waste-factor"
            value={wasteFactorPct}
            onChange={(e) => setWasteFactorPct(parseInt(e.target.value, 10))}
          >
            <option value={5}>5%</option>
            <option value={10}>10% (default)</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
          </select>
          <span className="field-hint-inline">For subfloor &amp; roof sheathing</span>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Joist direction</legend>
        <p className="field-hint">Joists run perpendicular to span (typically the short dimension)</p>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="joistDirection"
              checked={joistDirection === 'along-width'}
              onChange={() => setJoistDirection('along-width')}
            />
            Along width (span length)
          </label>
          <label>
            <input
              type="radio"
              name="joistDirection"
              checked={joistDirection === 'along-length'}
              onChange={() => setJoistDirection('along-length')}
            />
            Along length (span width)
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Roof framing (stick-built)</legend>
          <div className="radio-group" style={{ marginBottom: '0.75rem' }}>
            <label>
              <input
                type="checkbox"
                checked={roof.includeRoof}
                onChange={(e) => setRoof({ ...roof, includeRoof: e.target.checked })}
              />
              Include roof framing
            </label>
          </div>
          {roof.includeRoof && (
            <div className="roof-fields">
              <div className="field">
                <label>Roof type</label>
                <select
                  value={roof.roofType}
                  onChange={(e) => setRoof({ ...roof, roofType: e.target.value as RoofType })}
                >
                  <option value="shed">Shed</option>
                  <option value="gable">Gable</option>
                </select>
              </div>
              <div className="field">
                <label>Pitch</label>
                <select
                  value={roof.pitch}
                  onChange={(e) =>
                    setRoof({ ...roof, pitch: parseInt(e.target.value, 10) as RoofPitch })
                  }
                >
                  <option value={3}>3/12</option>
                  <option value={4}>4/12</option>
                  <option value={5}>5/12</option>
                  <option value={6}>6/12</option>
                </select>
              </div>
              <div className="field">
                <label>Ridge runs along</label>
                <select
                  value={roof.ridgeDirection}
                  onChange={(e) =>
                    setRoof({ ...roof, ridgeDirection: e.target.value as RidgeDirection })
                  }
                >
                  <option value="length">Length</option>
                  <option value="width">Width</option>
                </select>
              </div>
              <div className="field">
                <label>Overhang</label>
                <select
                  value={roof.overhang}
                  onChange={(e) =>
                    setRoof({ ...roof, overhang: parseInt(e.target.value, 10) as OverhangInches })
                  }
                >
                  <option value={12}>12″</option>
                  <option value={18}>18″</option>
                  <option value={24}>24″</option>
                </select>
              </div>
              <div className="field">
                <label>Rafter size</label>
                <select
                  value={roof.rafterSize}
                  onChange={(e) => setRoof({ ...roof, rafterSize: e.target.value as RafterSize })}
                >
                  <option value="2x6">2×6</option>
                  <option value="2x8">2×8</option>
                  <option value="2x10">2×10</option>
                </select>
              </div>
              {roof.roofType === 'gable' && (
                <div className="field">
                  <label>Ridge board</label>
                  <select
                    value={roof.ridgeBoard ? 'yes' : 'no'}
                    onChange={(e) =>
                      setRoof({ ...roof, ridgeBoard: e.target.value === 'yes' })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              )}
              <div className="field">
                <label>Ceiling</label>
                <select
                  value={roof.ceilingType}
                  onChange={(e) =>
                    setRoof({ ...roof, ceilingType: e.target.value as CeilingType })
                  }
                >
                  <option value="flat">Flat (ceiling joists)</option>
                  <option value="cathedral">Cathedral (exposed)</option>
                </select>
              </div>
            </div>
          )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Openings (doors &amp; windows)</legend>
        {openings.map((opening) => (
          <OpeningRow
            key={opening.id}
            opening={opening}
            onRemove={() => removeOpening(opening.id)}
            onChange={updateOpening}
          />
        ))}
        <button type="button" className="btn-add" onClick={addOpening}>
          + Add opening
        </button>
      </fieldset>

      <button type="submit" className="btn-submit">
        Generate material list
      </button>
    </form>
  )
}
