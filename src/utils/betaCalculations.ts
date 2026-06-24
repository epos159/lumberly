import type { BetaInput, BetaZone, BetaStory } from '../betaTypes'
import type { MaterialItem } from '../types'

function toInches(ft: number): number {
  return ft * 12
}

function toFeet(inches: number): number {
  return inches / 12
}

function ceilLinFt(ft: number): number {
  return Math.ceil(ft)
}

/**
 * Floor framing for one story slab (joists, rim, subfloor)
 * Uses measured area + exterior LF instead of a rectangle.
 */
function storyFloorItems(
  story: BetaStory,
  tieInLf: number,
  label: string,
  floorSpacingIn: number,
  wasteFactor: number,
  ptRim: boolean,
  _joistDirection: 'along-length' | 'along-width',
  _zone: BetaZone,
  isSecond: boolean,
): MaterialItem[] {
  const items: MaterialItem[] = []
  const { areaSqFt, exteriorWallLf } = story

  // Joist span: estimate from area / exterior LF as a rough average width
  // For a rectangle: area = span × run, run ≈ exteriorWallLf / 2
  // For irregular shapes, this is an approximation. User measures area + LF from plan.
  const perimeterTotal = exteriorWallLf + tieInLf // full enclosing perimeter including tie-in
  // Estimate one span dimension: area / (perimeter/2) ≈ narrower dimension
  const avgSpanFt = perimeterTotal > 0 ? areaSqFt / (perimeterTotal / 2) : 0
  const avgRunFt = perimeterTotal > 0 ? perimeterTotal / 2 : 0

  const spanIn = toInches(avgSpanFt)
  const runIn = toInches(avgRunFt)

  const numJoists = runIn > 0 ? Math.ceil(runIn / floorSpacingIn) + 1 : 0
  const joistLengthFt = Math.ceil(toFeet(spanIn + 6) / 2) * 2 || 10

  // Span warning
  const floorSpanLimit = floorSpacingIn === 12 ? 18 : floorSpacingIn === 24 ? 13 : 15
  const spanWarning = avgSpanFt > floorSpanLimit + 1
    ? ` Span ~${avgSpanFt.toFixed(1)}' may exceed 2x10—verify IRC span tables or consider LVL.`
    : avgSpanFt > floorSpanLimit
      ? ' Verify span against IRC span tables.'
      : ''

  const prefix = isSecond ? `${label} 2nd floor ` : `${label} `

  items.push({
    description: `2x10 x ${joistLengthFt}' ${prefix}floor joists`,
    quantity: numJoists,
    unit: 'pcs',
    notes: `${floorSpacingIn}" OC, measured area ${areaSqFt} sq ft.${spanWarning}`.trim(),
    zone: isSecond ? 'second-floor' : 'floor',
  })

  // Rim / band — exterior LF only (tie-in side not framed)
  const rimLf = ceilLinFt(exteriorWallLf)
  items.push({
    description: `2x10 ${ptRim ? 'PT ' : ''}${prefix}rim joist`,
    quantity: rimLf,
    unit: 'lin ft',
    notes: ptRim ? 'Pressure-treated, at grade' : `${exteriorWallLf.toFixed(1)} LF new exterior`,
    zone: isSecond ? 'second-floor' : 'floor',
  })

  if (!isSecond) {
    // PT sill — full perimeter (exterior + tie-in)
    items.push({
      description: '2x6 PT sill plate',
      quantity: ceilLinFt(perimeterTotal),
      unit: 'lin ft',
      notes: `Exterior ${exteriorWallLf.toFixed(1)} LF + tie-in ${tieInLf.toFixed(1)} LF`,
      zone: 'floor',
    })
  }

  // Subfloor
  const sheetArea = 32
  const numSheets = Math.ceil((areaSqFt * wasteFactor) / sheetArea)
  items.push({
    description: `4x8 OSB/plywood ${prefix}subfloor`,
    quantity: numSheets,
    unit: 'sheets',
    notes: `3/4" T&G, ${areaSqFt} sq ft measured, ~${Math.round((wasteFactor - 1) * 100)}% waste`,
    zone: isSecond ? 'second-floor' : 'floor',
  })

  return items
}

/**
 * Wall framing for one story (studs, plates, sheathing)
 * Uses exterior LF directly — no derived perimeter from a rectangle.
 */
function storyWallItems(
  story: BetaStory,
  label: string,
  wallSpacingIn: number,
  wasteFactor: number,
  isSecond: boolean,
): MaterialItem[] {
  const items: MaterialItem[] = []
  const { exteriorWallLf, ceilingHeightFt } = story
  const prefix = isSecond ? `${label} 2nd floor ` : `${label} `

  const studCount = Math.ceil(toInches(exteriorWallLf) / wallSpacingIn) + 4
  items.push({
    description: `2x6 x ${ceilingHeightFt}' ${prefix}exterior wall studs`,
    quantity: studCount,
    unit: 'pcs',
    notes: `${wallSpacingIn}" OC, ${exteriorWallLf.toFixed(1)} LF exterior`,
    zone: 'walls',
  })

  // Plates: bottom + double top = 3 courses
  const platePcs = Math.ceil((exteriorWallLf * 3) / 8)
  items.push({
    description: `2x6 x 8' ${prefix}exterior top & bottom plates`,
    quantity: platePcs,
    unit: 'pcs',
    notes: 'Double top plate',
    zone: 'walls',
  })

  // Wall sheathing
  const wallAreaSqFt = exteriorWallLf * ceilingHeightFt
  const sheetArea = 32
  const wallSheets = Math.ceil((wallAreaSqFt * wasteFactor) / sheetArea)
  items.push({
    description: `4x8 OSB/plywood ${prefix}exterior wall sheathing`,
    quantity: wallSheets,
    unit: 'sheets',
    notes: `7/16"–1/2", ${exteriorWallLf.toFixed(1)} LF × ${ceilingHeightFt}', ~${Math.round((wasteFactor - 1) * 100)}% waste`,
    zone: 'walls',
  })

  return items
}

export function calculateBetaTakeoff(input: BetaInput): MaterialItem[] {
  const materials: MaterialItem[] = []

  const floorSpacingIn = input.floorSpacing
  const wallSpacingIn = input.wallSpacing
  const wasteFactor = 1 + input.wasteFactorPct / 100
  const ptRim = input.ptRimJoistAtGrade

  for (const zone of input.zones) {
    const label = input.zones.length > 1 ? zone.name : ''

    // First floor
    materials.push(...storyFloorItems(
      zone.firstFloor,
      zone.tieInLf,
      label,
      floorSpacingIn,
      wasteFactor,
      ptRim,
      input.joistDirection,
      zone,
      false,
    ))
    materials.push(...storyWallItems(zone.firstFloor, label, wallSpacingIn, wasteFactor, false))

    // Second floor (if present)
    if (zone.secondFloor) {
      materials.push(...storyFloorItems(
        zone.secondFloor,
        0, // second floor doesn't add sill
        label,
        floorSpacingIn,
        wasteFactor,
        false,
        input.joistDirection,
        zone,
        true,
      ))
      materials.push(...storyWallItems(zone.secondFloor, label, wallSpacingIn, wasteFactor, true))
    }
  }

  // Interior walls (partition LF)
  for (const wall of input.interiorWalls) {
    if (wall.lf <= 0) continue
    const studCount = Math.ceil(toInches(wall.lf) / input.wallSpacing) + 2
    const platePcs = Math.ceil((wall.lf * 3) / 8)
    materials.push({
      description: `${wall.size} x ${wall.heightFt}' partition studs`,
      quantity: studCount,
      unit: 'pcs',
      notes: `${input.wallSpacing}" OC, ${wall.lf} LF`,
      zone: 'walls',
    })
    materials.push({
      description: `${wall.size} x 8' partition plates`,
      quantity: platePcs,
      unit: 'pcs',
      notes: 'Double top plate',
      zone: 'walls',
    })
  }

  // Openings
  for (const opening of input.openings) {
    const qty = opening.quantity || 1
    const openingWidthIn = opening.widthFt * 12 + opening.widthIn
    const headerLength = openingWidthIn + 6
    const dimStr = `${opening.widthFt}'${opening.widthIn}" × ${opening.heightFt}'${opening.heightIn}"`
    const qtyLabel = qty > 1 ? `${qty}× ` : ''
    materials.push({
      description: `${qtyLabel}${opening.type} opening ${dimStr} – 2-ply 2x12 header`,
      quantity: 2 * qty,
      unit: 'pcs',
      notes: `Two 2x12s, ${headerLength}" rough`,
      zone: 'walls',
    })
    materials.push({
      description: `  King studs (2) + Jack studs (2)`,
      quantity: 4 * qty,
      unit: 'pcs',
      zone: 'walls',
    })
    const sillHeightIn = (opening.sillHeightFt ?? 0) * 12 + (opening.sillHeightIn ?? 0)
    if (sillHeightIn > 0) {
      const cripplesBelow = Math.ceil(openingWidthIn / input.wallSpacing) + 1
      materials.push({
        description: `  Cripple studs below sill`,
        quantity: cripplesBelow * qty,
        unit: 'pcs',
        notes: `Sill ${opening.sillHeightFt ?? 0}'${opening.sillHeightIn ?? 0}" from floor`,
        zone: 'walls',
      })
    }
  }

  // Roof framing
  if (input.roof?.includeRoof) {
    const roof = input.roof
    // Use first zone first floor for span; if multiple zones, note limitation
    const primaryZone = input.zones[0]
    if (primaryZone) {
      const story = primaryZone.firstFloor
      const perimeterTotal = story.exteriorWallLf + primaryZone.tieInLf
      const avgSpanFt = perimeterTotal > 0 ? story.areaSqFt / (perimeterTotal / 2) : 0
      const avgRunFt = perimeterTotal > 0 ? perimeterTotal / 2 : 0

      const pitchMultiplier: Record<number, number> = {
        3: Math.sqrt(1 + (3 / 12) ** 2),
        4: Math.sqrt(1 + (4 / 12) ** 2),
        5: Math.sqrt(1 + (5 / 12) ** 2),
        6: Math.sqrt(1 + (6 / 12) ** 2),
      }
      const mult = pitchMultiplier[roof.pitch] ?? 1.083
      const overhangFt = roof.overhang / 12

      let rafterRunFt: number
      let rafterCount: number

      if (roof.roofType === 'gable') {
        rafterRunFt = avgSpanFt / 2 + overhangFt
        const rafterSpaces = Math.ceil(toInches(avgRunFt) / input.roofSpacing)
        rafterCount = (rafterSpaces + 1) * 2
      } else {
        rafterRunFt = avgSpanFt + overhangFt
        const rafterSpaces = Math.ceil(toInches(avgRunFt) / input.roofSpacing)
        rafterCount = rafterSpaces + 1
      }

      const rafterLengthFt = rafterRunFt * mult
      const rafterLengthOrder = Math.ceil(rafterLengthFt / 2) * 2 || 10
      const rafterSpanLimit = roof.rafterSize === '2x6' ? 12 : roof.rafterSize === '2x8' ? 15 : 18
      const rafterHalfSpan = roof.roofType === 'gable' ? avgSpanFt / 2 : avgSpanFt
      const rafterWarning = rafterHalfSpan > rafterSpanLimit + 1
        ? `. Half-span ~${rafterHalfSpan.toFixed(1)}' may exceed ${roof.rafterSize}—verify IRC span tables`
        : rafterHalfSpan > rafterSpanLimit ? '. Verify span against IRC span tables' : ''

      materials.push({
        description: `${roof.rafterSize} x ${rafterLengthOrder}' rafters`,
        quantity: rafterCount,
        unit: 'pcs',
        notes: `${roof.roofType}, ${roof.pitch}/12, ${input.roofSpacing}" OC${rafterWarning}`,
        zone: 'ceiling',
      })

      if (roof.roofType === 'gable' && roof.ridgeBoard) {
        const ridgeSize = roof.rafterSize === '2x6' ? '2x8' : '2x10'
        materials.push({
          description: `${ridgeSize} ridge board`,
          quantity: Math.ceil(avgRunFt),
          unit: 'lin ft',
          zone: 'ceiling',
        })
      }

      const roofAreaSqFt = roof.roofType === 'gable'
        ? 2 * rafterLengthFt * avgRunFt
        : rafterLengthFt * avgRunFt
      const roofSheets = Math.ceil((roofAreaSqFt * wasteFactor) / 32)
      materials.push({
        description: '4x8 roof sheathing (OSB/plywood)',
        quantity: roofSheets,
        unit: 'sheets',
        notes: `~${input.wasteFactorPct}% waste`,
        zone: 'ceiling',
      })

      if (roof.ceilingType === 'flat') {
        const joistCount = Math.ceil(toInches(avgRunFt) / input.roofSpacing) + 1
        const joistLengthOrder = Math.ceil(avgSpanFt / 2) * 2 || 10
        materials.push({
          description: `2x6 x ${joistLengthOrder}' ceiling joists`,
          quantity: joistCount,
          unit: 'pcs',
          notes: `${input.roofSpacing}" OC, flat ceiling`,
          zone: 'ceiling',
        })
      }
    }
  }

  return materials
}
