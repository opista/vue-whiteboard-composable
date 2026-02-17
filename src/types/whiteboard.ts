import type { Ref } from 'vue'

/** Brush line cap styles. */
export type LineCap = 'butt' | 'square' | 'round'

/** Brush line join styles. */
export type LineJoin = 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs'

/** Configuration options for the useWhiteboard composable. */
export interface WhiteboardOptions {
  /** Brush color. Can be a reactive Vue Ref or a static string. */
  color?: Ref<string> | string
  /** Background color of the SVG container. */
  backgroundColor?: string
  /** The shape of the end of the lines. Defaults to 'round'. */
  linecap?: LineCap
  /** The shape of the corners where two lines meet. Defaults to 'round'. */
  linejoin?: LineJoin
  /** Additional CSS styles for the stroke paths (e.g. blend mode). */
  lineStyles?: Record<string, string>
  /** Brush size (stroke-width). Can be a reactive Vue Ref or a static string. */
  size?: Ref<string> | string
  /** Scale factor for PNG export (default: devicePixelRatio). Use e.g. 2 or 3 for print. */
  exportScale?: number
  /** Initial state to populate the whiteboard with. */
  initialState?: SerializableRecord[]
}

/** Represents a drawing action in the current session. */
export interface HistoryRecord {
  /** Unique identifier (UUID). */
  id: string
  /** The type of recording (e.g., 'line'). */
  type: 'line'
  /** Creation time (Unix epoch). */
  timestamp: number
  /** The SVG path element(s) rendered on the canvas. */
  data: SVGElement | SVGElement[]
  /** The brush settings (color, size) used at the time of drawing. */
  brush: {
    /** The color of the stroke. */
    color: string
    /** The size/width of the stroke. */
    size: string
  }
}

/** A JSON-serializable version of a drawing record for persistence. */
export interface SerializableRecord {
  /** Unique identifier of the original record. */
  id: string
  /** The type of mark. */
  type: 'line'
  /** Creation time (Unix epoch). */
  timestamp?: number
  /** The SVG path data ('d' attribute). */
  pathData: string
  /** The brush settings used when this mark was created. */
  brush: {
    /** The color of the stroke. */
    color: string
    /** The size/width of the stroke. */
    size: string
  }
}

/** Default configuration values for the whiteboard. */
export const WHITEBOARD_DEFAULTS = {
  /** Default background color: white. */
  backgroundColor: '#ffffff',
  /** Default brush color: charcoal. */
  color: '#333333',
  /** Default line cap: round. */
  linecap: 'round' as LineCap,
  /** Default line join: round. */
  linejoin: 'round' as LineJoin,
  /** Default brush size: 5px. */
  size: '5px',
} as const
