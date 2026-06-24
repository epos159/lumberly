import type { BetaInput, BetaStory, BetaRoom } from '../betaTypes'
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

function roomLengthFt(room: BetaRoom): number {
  return room.lengthFt + room.lengthIn / 12
}

function roomWidthFt(room: BetaRoom): number {
  return room.widthFt + room.widthIn / 12
}

function partitionLinealFt(room: BetaRoom): number {
  const lengthFt = roomLengthFt(room)
  const widthFt = roomWidthFt(room)
  if (room.partitionWalls === 0) return 0
  if (room.partitionWalls === 1) return Math.min(lengthFt, widthFt)
  if (room.partitionWalls === 2) return lengthFt + widthFt
  return 2 * Math.min(lengthFt, widthFt) + Math.max(lengthFt, widthFt)
}

/** Resolve 2nd-floor dimensions when inheriting from 1st floor */
export function effectiveStory(story: BetaStory, firstFloor?: BetaStory): BetaStory {
  if (firstFloor && story.differentSize === false) {
    return {
      ...story,
      areaSqFt: firstFloor.areaSqFt,
      exteriorWallLf: firstFloor.exteriorWallLf,
    }
  }
  return story
}

function storyPartitionItems(
  rooms: BetaRoom[],
  ceilingHeightFt: number,
  label: string,
  wallSpacingIn: number,
  isSecond: boolean,
): MaterialItem[] {
  const items: MaterialItem[] = []
  const sharedLinealFt = rooms
    .filter((r) => r.partitionWalls === 1 || r.partitionWalls === 2)
    .reduce((sum, r) => sum + partitionLinealFt(r), 0)
  const enclosedLinealFt = rooms
    .filter((r) => r.partitionWalls === 3)
    .reduce((sum, r) => sum + partitionLinealFt(r), 0)
  const totalPartitionLinealFt = sharedLinealFt / 2 + enclosedLinealFt
  if (totalPartitionLinealFt <= 0) return items

  const prefix = isSecond ? `${label} 2nd floor ` : `${label} `
  const studCount = Math.ceil((totalPartitionLinealFt * 12) / wallSpacingIn) + 4
  items.push({
    description: `2x4 x ${ceilingHeightFt}' ${prefix}partition studs`,
    quantity: studCount,
    unit: 'pcs',
    notes: `${wallSpacingIn}" OC, interior partitions`,
    zone: isSecond ? 'second-floor' : 'walls',
  })
  const plateLinealFt = totalPartitionLinealFt * 3
  items.push({
    description: `2x4 x 8' ${prefix}partition plates`,
    quantity: Math.ceil(plateLinealFt / 8),
    unit: 'pcs',
    notes: 'Double top plate',
    zone: isSecond ? 'second-floor' : 'walls',
  })
  return items
}

function storyFloorItems(
  story: BetaStory,
  tieInLf: number,
  label: string,
  floorSpacingIn: number,
  wasteFactor: number,
  ptRim: boolean,
  isSecond: boolean,
): MaterialItem[] {
  const items: MaterialItem[] = []
  const { areaSqFt, exteriorWallLf } = story

  const perimeterTotal = exteriorWallLf + tieInLf
  const avgSpanFt = perimeterTotal > 0 ? areaSqFt / (perimeterTotal / 2) : 0
  const avgRunFt = perimeterTotal > 0 ? perimeterTotal / 2 : 0

  const spanIn = toInches(avgSpanFt)
  const runIn = toInches(avgRunFt)

  const numJoists = runIn > 0 ? Math.ceil(runIn / floorSpacingIn) + 1 : 0
  const joistLengthFt = Math.ceil(toFeet(spanIn + 6) / 2) * 2 || 10

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

  const rimLf = ceilLinFt(exteriorWallLf)
  items.push({
    description: `2x10 ${ptRim ? 'PT ' : ''}${prefix}rim joist`,
    quantity: rimLf,
    unit: 'lin ft',
    notes: ptRim ? 'Pressure-treated, at grade' : `${exteriorWallLf.toFixed(1)} LF new exterior`,
    zone: isSecond ? 'second-floor' : 'floor',
  })

  if (!isSecond) {
    items.push({
      description: '2x6 PT sill plate',
      quantity: ceilLinFt(perimeterTotal),
      unit: 'lin ft',
      notes: `Exterior ${exteriorWallLf.toFixed(1)} LF + tie-in ${tieInLf.toFixed(1)} LF`,
      zone: 'floor',
    })
  }

  const numSheets = Math.ceil((areaSqFt * wasteFactor) / 32)
  items.push({
    description: `4x8 OSB/plywood ${prefix}subfloor`,
    quantity: numSheets,
    unit: 'sheets',
    notes: `3/4" T&G, ${areaSqFt} sq ft measured, ~${Math.round((wasteFactor - 1) * 100)}% waste`,
    zone: isSecond ? 'second-floor' : 'floor',
  })

  return items
}

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

  const platePcs = Math.ceil((exteriorWallLf * 3) / 8)
  items.push({
    description: `2x6 x 8' ${prefix}exterior top & bottom plates`,
    quantity: platePcs,
    unit: 'pcs',
    notes: 'Double top plate',
    zone: 'walls',
  })

  const wallAreaSqFt = exteriorWallLf * ceilingHeightFt
  const wallSheets = Math.ceil((wallAreaSqFt * wasteFactor) / 32)
  items.push({
    description: `4x8 OSB/plywood ${prefix}exterior wall sheathing`,
    quantity: wallSheets,
    unit: 'sheets',
    notes: `7/16"–1/2", ${exteriorWallLf.toFixed(1)} LF × ${ceilingHeightFt}', ~${Math.round((wasteFactor - 1) * 100)}% waste`,
    zone: 'walls',
  })

  return items
}

function processStory(
  story: BetaStory,
  tieInLf: number,
  label: string,
  floorSpacingIn: number,
  wallSpacingIn: number,
  wasteFactor: number,
  ptRim: boolean,
  isSecond: boolean,
): MaterialItem[] {
  const materials: MaterialItem[] = []
  materials.push(...storyFloorItems(story, tieInLf, label, floorSpacingIn, wasteFactor, ptRim, isSecond))
  materials.push(...storyWallItems(story, label, wallSpacingIn, wasteFactor, isSecond))
  materials.push(...storyPartitionItems(story.rooms, story.ceilingHeightFt, label, wallSpacingIn, isSecond))
  return materials
}

export function calculateBetaTakeoff(input: BetaInput): MaterialItem[] {
  const materials: MaterialItem[] = []

  const floorSpacingIn = input.floorSpacing
  const wallSpacingIn = input.wallSpacing
  const wasteFactor = 1 + input.wasteFactorPct / 100
  const ptRim = input.ptRimJoistAtGrade

  for (const zone of input.zones) {
    const label = input.zones.length > 1 ? zone.name : ''

    const first = zone.firstFloor
    materials.push(...processStory(first, zone.tieInLf, label, floorSpacingIn, wallSpacingIn, wasteFactor, ptRim, false))

    if (zone.hasSecondFloor && zone.secondFloor) {
      const second = effectiveStory(zone.secondFloor, first)
      materials.push(...processStory(second, 0, label, floorSpacingIn, wallSpacingIn, wasteFactor, false, true))
    }
  }

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

  if (input.roof?.includeRoof) {
    const roof = input.roof
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
