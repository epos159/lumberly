import type { ProjectInput, MaterialItem, Room } from '../types'

/**
 * Convert feet and inches to total inches
 */
function toInches(ft: number, inch: number): number {
  return ft * 12 + inch
}

/**
 * Convert inches to feet (decimal)
 */
function toFeet(inches: number): number {
  return inches / 12
}

/**
 * Estimate partition wall lineal feet for a room
 * 0 partitions = 0, 1 partition = one typical wall (shorter dimension), 2 = corner (L+W)
 */
function partitionLinealFt(room: Room): number {
  const lengthFt = room.lengthFt + room.lengthIn / 12
  const widthFt = room.widthFt + room.widthIn / 12
  if (room.partitionWalls === 0) return 0
  if (room.partitionWalls === 1) return Math.min(lengthFt, widthFt)
  return lengthFt + widthFt
}

/**
 * Multi-room framing takeoff
 * Exterior walls 2x6, partition walls 2x4
 */
export function calculateTakeoff(input: ProjectInput): MaterialItem[] {
  const materials: MaterialItem[] = []
  const lengthIn = toInches(input.overallLengthFt, input.overallLengthIn)
  const widthIn = toInches(input.overallWidthFt, input.overallWidthIn)
  const lengthFt = toFeet(lengthIn)
  const widthFt = toFeet(widthIn)
  const areaSqFt = lengthFt * widthFt
  const perimeterFt = input.isAddition
    ? input.tieInDirection === 'length'
      ? lengthFt + 2 * widthFt
      : 2 * lengthFt + widthFt
    : 2 * (lengthFt + widthFt)

  const joistsAlongWidth = input.joistDirection === 'along-width'
  const spanIn = joistsAlongWidth ? lengthIn : widthIn
  const runIn = joistsAlongWidth ? widthIn : lengthIn

  const spacing = input.studSpacing ?? 16
  const numJoists = Math.ceil(runIn / spacing) + 1
  const joistLengthFt = Math.ceil(toFeet(spanIn + 6) / 2) * 2 || 10
  materials.push({
    description: `2x10 x ${joistLengthFt}' floor joists`,
    quantity: numJoists,
    unit: 'pcs',
    notes: '16" OC, span table dependent',
  })

  // Rim/band joist - perimeter
  materials.push({
    description: '2x10 rim joist',
    quantity: Math.ceil(perimeterFt),
    unit: 'lin ft',
    notes: input.isAddition ? '3 walls (addition)' : undefined,
  })

  // Subfloor - 4x8 sheets
  const sheetArea = 32
  const wastePct = input.wasteFactorPct ?? 10
  const wasteFactor = 1 + wastePct / 100
  const numSheets = Math.ceil((areaSqFt * wasteFactor) / sheetArea)
  materials.push({
    description: '4x8 OSB/plywood subfloor',
    quantity: numSheets,
    unit: 'sheets',
    notes: `3/4" T&G, ~${wastePct}% waste`,
  })

  // Exterior walls (2x6)
  const perimeterIn = perimeterFt * 12
  const exteriorStudCount = Math.ceil(perimeterIn / spacing) + 4
  const maxCeilingHeight = Math.max(
    ...input.rooms.map((r) => r.ceilingHeightFt),
    8
  )
  materials.push({
    description: `2x6 x ${maxCeilingHeight}' exterior wall studs`,
    quantity: exteriorStudCount,
    unit: 'pcs',
    notes: input.isAddition
      ? `${spacing}" OC, 3 walls (addition)`
      : `${spacing}" OC, perimeter`,
  })

  // Exterior plates (2x6, double top)
  const exteriorPlateLinealFt = perimeterFt * 3
  materials.push({
    description: `2x6 x 8' exterior top & bottom plates`,
    quantity: Math.ceil(exteriorPlateLinealFt / 8),
    unit: 'pcs',
    notes: input.isAddition ? 'Double top plate, 3 walls (addition)' : 'Double top plate',
  })

  // Partition walls (2x4) - each partition counted by 2 rooms, so divide by 2
  const totalPartitionLinealFt =
    input.rooms.reduce((sum, r) => sum + partitionLinealFt(r), 0) / 2
  if (totalPartitionLinealFt > 0) {
    const partitionStudCount = Math.ceil((totalPartitionLinealFt * 12) / spacing) + 4
    materials.push({
      description: `2x4 x ${maxCeilingHeight}' partition wall studs`,
      quantity: partitionStudCount,
      unit: 'pcs',
      notes: `${spacing}" OC, interior partitions`,
    })
    const partitionPlateLinealFt = totalPartitionLinealFt * 3
    materials.push({
      description: `2x4 x 8' partition top & bottom plates`,
      quantity: Math.ceil(partitionPlateLinealFt / 8),
      unit: 'pcs',
      notes: 'Double top plate',
    })
  }

  // Openings - headers (2-ply 2x12), king studs, jack studs, cripples, sill
  for (const opening of input.openings) {
    const qty = opening.quantity || 1
    const openingWidthIn = toInches(opening.widthFt, opening.widthIn)
    const sillHeightIn = toInches(opening.sillHeightFt ?? 0, opening.sillHeightIn ?? 0)
    const headerLength = openingWidthIn + 6
    const dimStr = `${opening.widthFt}'${opening.widthIn}" × ${opening.heightFt}'${opening.heightIn}"`
    const qtyLabel = qty > 1 ? `${qty}× ` : ''
    materials.push({
      description: `${qtyLabel}${opening.type} opening ${dimStr} - 2-ply 2x12 header`,
      quantity: 2 * qty,
      unit: 'pcs',
      notes: `Two 2x12s, ${headerLength}" rough`,
    })
    materials.push({
      description: `  King studs (2) + Jack studs (2)`,
      quantity: 4 * qty,
      unit: 'pcs',
    })
    if (sillHeightIn > 0) {
      const cripplesBelow = Math.ceil(openingWidthIn / spacing) + 1
      const sillPlateLength = openingWidthIn + 6
      materials.push({
        description: `  Cripple studs below sill`,
        quantity: cripplesBelow * qty,
        unit: 'pcs',
        notes: `Sill ${opening.sillHeightFt ?? 0}'${opening.sillHeightIn ?? 0}" from floor`,
      })
      materials.push({
        description: `  2x4 sill plate`,
        quantity: Math.ceil(toFeet(sillPlateLength) * qty),
        unit: 'lin ft',
      })
    }
  }

  // Roof framing (stick-built)
  if (input.roof?.includeRoof) {
    const roof = input.roof
    const ridgeAlongLength = roof.ridgeDirection === 'length'
    const spanDimFt = ridgeAlongLength ? widthFt : lengthFt
    const ridgeLengthFt = ridgeAlongLength ? lengthFt : widthFt
    const overhangFt = roof.overhang / 12

    const pitchMultiplier: Record<number, number> = {
      3: Math.sqrt(1 + (3 / 12) ** 2),
      4: Math.sqrt(1 + (4 / 12) ** 2),
      5: Math.sqrt(1 + (5 / 12) ** 2),
      6: Math.sqrt(1 + (6 / 12) ** 2),
    }
    const mult = pitchMultiplier[roof.pitch] ?? 1.083

    let rafterRunFt: number
    let rafterCount: number

    if (roof.roofType === 'gable') {
      const halfSpanFt = spanDimFt / 2
      rafterRunFt = halfSpanFt + overhangFt
      const rafterSpaces = Math.ceil((ridgeLengthFt * 12) / spacing)
      rafterCount = (rafterSpaces + 1) * 2
    } else {
      rafterRunFt = spanDimFt + overhangFt
      const rafterSpaces = Math.ceil((ridgeLengthFt * 12) / spacing)
      rafterCount = rafterSpaces + 1
    }

    const rafterLengthFt = rafterRunFt * mult
    const rafterLengthOrder = Math.ceil(rafterLengthFt / 2) * 2 || 10

    materials.push({
      description: `${roof.rafterSize} x ${rafterLengthOrder}' rafters`,
      quantity: rafterCount,
      unit: 'pcs',
      notes: `${roof.roofType}, ${roof.pitch}/12, ${spacing}" OC`,
    })

    if (roof.roofType === 'gable' && roof.ridgeBoard) {
      const ridgeSize = roof.rafterSize === '2x6' ? '2x8' : '2x10'
      materials.push({
        description: `${ridgeSize} ridge board`,
        quantity: Math.ceil(ridgeLengthFt),
        unit: 'lin ft',
      })
    }

    const roofAreaSqFt =
      roof.roofType === 'gable'
        ? 2 * rafterLengthFt * ridgeLengthFt
        : rafterLengthFt * ridgeLengthFt
    const roofWastePct = input.wasteFactorPct ?? 10
    const roofWasteFactor = 1 + roofWastePct / 100
    const roofSheets = Math.ceil((roofAreaSqFt * roofWasteFactor) / 32)
    materials.push({
      description: '4x8 roof sheathing (OSB/plywood)',
      quantity: roofSheets,
      unit: 'sheets',
      notes: `~${roofWastePct}% waste`,
    })

    if (roof.ceilingType === 'flat') {
      const joistSpanFt = spanDimFt
      const joistCount = Math.ceil((ridgeLengthFt * 12) / spacing) + 1
      const joistLengthOrder = Math.ceil(joistSpanFt / 2) * 2 || 10
      materials.push({
        description: `2x6 x ${joistLengthOrder}' ceiling joists`,
        quantity: joistCount,
        unit: 'pcs',
        notes: `${spacing}" OC, flat ceiling`,
      })
    }
  }

  return materials
}
