import type { FramingSpacing, JoistDirection, RoofConfig, Opening } from './types'

export interface BetaRoom {
  id: string
  name?: string
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
  partitionWalls: 0 | 1 | 2 | 3
}

export interface BetaStory {
  /** Floor/subfloor area in square feet (measured from plan) */
  areaSqFt: number
  /** New exterior wall lineal feet (walls you are building, not tie-in sides) */
  exteriorWallLf: number
  /** Ceiling height in feet for this story */
  ceilingHeightFt: number
  /** Interior rooms / partitions on this story */
  rooms: BetaRoom[]
  /** 2nd floor only: when false, inherits 1st-floor area and exterior LF */
  differentSize?: boolean
}

export interface BetaZone {
  id: string
  /** User label: "Main addition", "Garage wing", etc. */
  name: string
  /** Lineal feet of existing wall this zone ties into (0 = standalone) */
  tieInLf: number
  firstFloor: BetaStory
  /** When true, second floor section is shown */
  hasSecondFloor?: boolean
  secondFloor?: BetaStory
}

export interface BetaInput {
  projectName?: string
  zones: BetaZone[]
  openings: Opening[]
  floorSpacing: FramingSpacing
  wallSpacing: FramingSpacing
  roofSpacing: FramingSpacing
  joistDirection: JoistDirection
  roof: RoofConfig
  wasteFactorPct: number
  ptRimJoistAtGrade: boolean
}
