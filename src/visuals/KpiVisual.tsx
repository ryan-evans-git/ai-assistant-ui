import type { KpiSpec } from './types'

const TREND_GLYPH = { up: '▲', down: '▼', flat: '—' } as const

export function KpiVisual({ spec }: { spec: KpiSpec }) {
  const status = spec.status ?? 'neutral'
  return (
    <figure
      className={`aaui-visual aaui-visual--kpi aaui-kpi aaui-kpi--${status}`}
      aria-label={`${spec.label}: ${spec.value}${spec.unit ? ' ' + spec.unit : ''}`}
    >
      <div className="aaui-kpi__label">{spec.label}</div>
      <div className="aaui-kpi__value-row">
        <span className="aaui-kpi__value">{spec.value}</span>
        {spec.unit && <span className="aaui-kpi__unit">{spec.unit}</span>}
      </div>
      {spec.trend && (
        <div
          className={`aaui-kpi__trend aaui-kpi__trend--${spec.trend.direction}`}
        >
          <span aria-hidden>{TREND_GLYPH[spec.trend.direction]}</span>
          <span className="aaui-kpi__trend-delta">{spec.trend.delta}</span>
          {spec.trend.period && (
            <span className="aaui-kpi__trend-period">
              {' '}
              {spec.trend.period}
            </span>
          )}
        </div>
      )}
    </figure>
  )
}
