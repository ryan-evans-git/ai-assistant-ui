/**
 * VisualSpec wire types.
 *
 * Mirror of `ai-assistant-client/ai_assistant_client/visuals/types.py`.
 * Canonical wire shape lives in `VISUAL_SPEC.md` at the repo root.
 * Bumps to `SCHEMA_VERSION` require a coordinated release of both
 * repos.
 */

export const SCHEMA_VERSION = 1

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'

export interface ChartSpec {
  kind: 'chart'
  chart_type: ChartType
  title?: string
  /**
   * Cartesian (bar/line/area/scatter): rows keyed by `x_key` + each
   * `y_keys` entry. Pie/donut: rows must have `label` (string) and
   * `value` (number).
   */
  data: Array<Record<string, string | number | null>>
  x_key?: string
  y_keys?: string[]
  x_label?: string
  y_label?: string
  /** Bar/area only — ignored for other chart types. */
  stacked?: boolean
}

export type TableColumnType =
  | 'string'
  | 'number'
  | 'currency'
  | 'date'
  | 'boolean'

export interface TableColumn {
  key: string
  label: string
  type?: TableColumnType
  align?: 'left' | 'center' | 'right'
}

export interface TableSpec {
  kind: 'table'
  title?: string
  columns: TableColumn[]
  rows: Array<Record<string, string | number | boolean | null>>
}

export interface KpiTrend {
  direction: 'up' | 'down' | 'flat'
  delta: string | number
  period?: string
}

export interface KpiSpec {
  kind: 'kpi'
  label: string
  value: string | number
  unit?: string
  trend?: KpiTrend
  status?: 'good' | 'warn' | 'bad' | 'neutral'
}

export interface ImageSpec {
  kind: 'image'
  /** https URL or non-SVG data:image/...;base64,... URI. */
  src: string
  alt: string
  width?: number
  height?: number
  caption?: string
}

export type VisualSpec = ChartSpec | TableSpec | KpiSpec | ImageSpec

export interface VisualEnvelope {
  schema_version: number
  spec: VisualSpec
}

/**
 * A `VisualBlock` is added to assistant messages by the host when it
 * receives an `AgentEvent("visual", ...)` from the server.  It pairs
 * with a `tool_use_id` so reload-from-history can re-render visuals
 * by replaying the matching `render_visual` tool_use input.
 */
export interface VisualBlock {
  type: 'visual'
  tool_use_id: string
  schema_version: number
  spec: VisualSpec
}
