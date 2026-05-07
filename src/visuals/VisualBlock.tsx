import { ChartVisual } from './ChartVisual'
import { ImageVisual } from './ImageVisual'
import { KpiVisual } from './KpiVisual'
import { TableVisual } from './TableVisual'
import { safeParseEnvelope } from './schemas'
import type { VisualBlock as VisualBlockType } from './types'

/**
 * Renders a single `VisualBlock`.  Dispatches by `spec.kind`.
 *
 * Defensively re-validates the spec via Zod — see `schemas.ts` for the
 * rationale.  Invalid specs render a graceful fallback rather than
 * crashing the surrounding message list.
 */
export function VisualBlock({ block }: { block: VisualBlockType }) {
  const parsed = safeParseEnvelope({
    schema_version: block.schema_version,
    spec: block.spec,
  })
  if (!parsed.ok) {
    return (
      <div className="aaui-visual aaui-visual--error" role="alert">
        <strong>Visual rejected:</strong>{' '}
        {parsed.issues.slice(0, 2).join('; ')}
      </div>
    )
  }
  const spec = parsed.envelope.spec
  switch (spec.kind) {
    case 'chart':
      return <ChartVisual spec={spec} />
    case 'table':
      return <TableVisual spec={spec} />
    case 'kpi':
      return <KpiVisual spec={spec} />
    case 'image':
      return <ImageVisual spec={spec} />
  }
}
