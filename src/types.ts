export type JoistDirection = 'along-length' | 'along-width'

export type OpeningType = 'door' | 'window'

export interface RoomDimensions {
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
}

export interface Room {
  id: string
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
  ceilingHeightFt: number
  partitionWalls: 0 | 1 | 2
}

export interface Opening {
  id: string
  type: OpeningType
  widthFt: number
  widthIn: number
  heightFt: number
  heightIn: number
  sillHeightFt: number
  sillHeightIn: number
  quantity: number
}

export type TieInDirection = 'length' | 'width'

export type FramingSpacing = 12 | 16 | 24

export type RoofType = 'shed' | 'gable'
export type RoofPitch = 3 | 4 | 5 | 6
export type RidgeDirection = 'length' | 'width'
export type OverhangInches = 12 | 18 | 24
export type RafterSize = '2x6' | '2x8' | '2x10'
export type CeilingType = 'flat' | 'cathedral'

export interface RoofConfig {
  includeRoof: boolean
  roofType: RoofType
  pitch: RoofPitch
  ridgeDirection: RidgeDirection
  reverseGable?: boolean
  overhang: OverhangInches
  rafterSize: RafterSize
  ridgeBoard: boolean
  ceilingType: CeilingType
}

export interface ProjectInput {
  projectName?: string
  rooms: Room[]
  overallLengthFt: number
  overallLengthIn: number
  overallWidthFt: number
  overallWidthIn: number
  isAddition: boolean
  tieInDirection: TieInDirection
  floorSpacing: FramingSpacing
  wallSpacing: FramingSpacing
  roofSpacing: FramingSpacing
  joistDirection: JoistDirection
  roof: RoofConfig
  openings: Opening[]
  wasteFactorPct?: number
  includeSecondFloor?: boolean
  ptRimJoistAtGrade?: boolean
}

export interface MaterialItem {
  description: string
  quantity: number
  unit: string
  notes?: string
}

export interface TakeoffResult {
  materials: MaterialItem[]
}
