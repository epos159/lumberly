import type { FramingSpacing, JoistDirection, RoofConfig, Opening } from './types'

export interface BetaStory {
  /** Floor/subfloor area in square feet (measured from plan) */
  areaSqFt: number
  /** New exterior wall lineal feet (walls you are building, not tie-in sides) */
  exteriorWallLf: number
  /** Ceiling height in feet */
  ceilingHeightFt: number
}

export interface BetaZone {
  id: string
  /** User label: "Main addition", "Garage wing", etc. */
  name: string
  /** Lineal feet of existing wall this zone ties into (0 = standalone) */
  tieInLf: number
  firstFloor: BetaStory
  /** If defined, a second floor exists for this zone */
  secondFloor?: BetaStory
}

export interface BetaInteriorWall {
  id: string
  /** Lineal feet of this wall run */
  lf: number
  /** Height in feet (default matches zone ceiling) */
  heightFt: number
  /** 2x4 partition (interior) */
  size: '2x4' | '2x6'
}

export interface BetaInput {
  projectName?: string
  zones: BetaZone[]
  interiorWalls: BetaInteriorWall[]
  openings: Opening[]
  floorSpacing: FramingSpacing
  wallSpacing: FramingSpacing
  roofSpacing: FramingSpacing
  joistDirection: JoistDirection
  roof: RoofConfig
  wasteFactorPct: number
  ptRimJoistAtGrade: boolean
}
