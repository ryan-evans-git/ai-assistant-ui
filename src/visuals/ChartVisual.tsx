import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartSpec } from './types'

/**
 * Chart renderer for `kind: "chart"` visuals.
 *
 * Recharts is React-native, has no canvas dep, and respects parent
 * size via `<ResponsiveContainer>` — which makes it the right fit for
 * a chat surface that may be embedded inside a narrow drawer.
 *
 * Theming notes: the colors and accents below are intentionally
 * opinionated but neutral.  Hosts that need brand-matched palettes
 * can wrap or fork this component — the public surface is just the
 * `<VisualBlock />` dispatcher.
 */

const SERIES_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // violet
  '#ef4444', // red
  '#0ea5e9', // sky
  '#84cc16', // lime
]

export function ChartVisual({ spec }: { spec: ChartSpec }) {
  const isPie = spec.chart_type === 'pie' || spec.chart_type === 'donut'
  const colorFor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length]

  return (
    <figure className="aaui-visual aaui-visual--chart">
      {spec.title && (
        <figcaption className="aaui-visual__title">{spec.title}</figcaption>
      )}
      <div className="aaui-visual__chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          {isPie
            ? renderPie(spec, colorFor)
            : spec.chart_type === 'bar'
              ? renderBar(spec, colorFor)
              : spec.chart_type === 'line'
                ? renderLine(spec, colorFor)
                : spec.chart_type === 'area'
                  ? renderArea(spec, colorFor)
                  : renderScatter(spec, colorFor)}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

function renderBar(spec: ChartSpec, colorFor: (i: number) => string) {
  return (
    <BarChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey={spec.x_key} label={axisLabel(spec.x_label, 'bottom')} />
      <YAxis label={axisLabel(spec.y_label, 'left')} />
      <Tooltip />
      <Legend />
      {(spec.y_keys ?? []).map((k, i) => (
        <Bar
          key={k}
          dataKey={k}
          fill={colorFor(i)}
          stackId={spec.stacked ? 'all' : undefined}
        />
      ))}
    </BarChart>
  )
}

function renderLine(spec: ChartSpec, colorFor: (i: number) => string) {
  return (
    <LineChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey={spec.x_key} label={axisLabel(spec.x_label, 'bottom')} />
      <YAxis label={axisLabel(spec.y_label, 'left')} />
      <Tooltip />
      <Legend />
      {(spec.y_keys ?? []).map((k, i) => (
        <Line
          key={k}
          type="monotone"
          dataKey={k}
          stroke={colorFor(i)}
          dot={{ r: 3 }}
          strokeWidth={2}
        />
      ))}
    </LineChart>
  )
}

function renderArea(spec: ChartSpec, colorFor: (i: number) => string) {
  return (
    <AreaChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey={spec.x_key} label={axisLabel(spec.x_label, 'bottom')} />
      <YAxis label={axisLabel(spec.y_label, 'left')} />
      <Tooltip />
      <Legend />
      {(spec.y_keys ?? []).map((k, i) => (
        <Area
          key={k}
          type="monotone"
          dataKey={k}
          stroke={colorFor(i)}
          fill={colorFor(i)}
          fillOpacity={0.25}
          stackId={spec.stacked ? 'all' : undefined}
        />
      ))}
    </AreaChart>
  )
}

function renderScatter(spec: ChartSpec, colorFor: (i: number) => string) {
  // Scatter takes a single y_key for v1 — using more requires
  // multi-series scatter support which we'll add when the demand
  // shows up.
  const yKey = spec.y_keys?.[0]
  return (
    <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey={spec.x_key} label={axisLabel(spec.x_label, 'bottom')} />
      <YAxis dataKey={yKey} label={axisLabel(spec.y_label, 'left')} />
      <Tooltip />
      <Scatter data={spec.data} fill={colorFor(0)} />
    </ScatterChart>
  )
}

function renderPie(spec: ChartSpec, colorFor: (i: number) => string) {
  const isDonut = spec.chart_type === 'donut'
  // Numeric radii (not percentages) — Recharts' percentage-radius
  // path computes against the *smaller* container dimension, which
  // means a 720×280 frame ends up with a radius bigger than the
  // half-height and the slices clip off the top/bottom.  Pinning
  // pixel values keeps the donut visible regardless of container
  // aspect ratio.
  const outerRadius = 110
  const innerRadius = isDonut ? 70 : 0
  return (
    <PieChart>
      <Tooltip />
      <Legend verticalAlign="bottom" height={28} />
      <Pie
        data={spec.data as Array<{ label: string; value: number }>}
        dataKey="value"
        nameKey="label"
        cx="50%"
        cy="50%"
        outerRadius={outerRadius}
        innerRadius={innerRadius}
        label={(entry: { label?: string; name?: string }) =>
          entry.label ?? entry.name ?? ''
        }
        isAnimationActive={false}
      >
        {(spec.data as Array<unknown>).map((_, i) => (
          <Cell key={i} fill={colorFor(i)} />
        ))}
      </Pie>
    </PieChart>
  )
}

function axisLabel(text: string | undefined, position: 'bottom' | 'left') {
  if (!text) return undefined
  if (position === 'bottom') {
    return { value: text, position: 'insideBottom', offset: -4 }
  }
  return { value: text, angle: -90, position: 'insideLeft' }
}
