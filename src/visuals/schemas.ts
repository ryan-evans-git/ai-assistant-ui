/**
 * Runtime Zod schemas for VisualEnvelope.
 *
 * The server side (`ai-assistant-client`) already validates with
 * Pydantic before emitting the `visual` event, so under normal
 * conditions the UI won't see malformed specs.  These schemas exist
 * for defense-in-depth — a misbehaving custom backend, a manually
 * forged event, or a future schema-version drift shouldn't be able
 * to crash the UI library.
 *
 * The image-src allowlist mirrors the server-side rules in
 * `ai_assistant_client/visuals/validate.py`:
 *   - `https://...` accepted
 *   - `data:image/(png|jpeg|jpg|gif|webp);base64,...` accepted
 *   - SVG and other schemes rejected
 */

import { z } from 'zod'
import { SCHEMA_VERSION } from './types'

const dataUriRe =
  /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/

const imageSrc = z.string().refine(
  (v) => v.startsWith('https://') || dataUriRe.test(v),
  {
    message:
      'src must be an https:// URL or a data:image/(png|jpeg|jpg|gif|webp);base64,... URI',
  },
)

const chartTypeEnum = z.enum([
  'bar',
  'line',
  'area',
  'pie',
  'donut',
  'scatter',
])

const dataRow = z.record(z.union([z.string(), z.number(), z.null()]))

export const chartSpec = z
  .object({
    kind: z.literal('chart'),
    chart_type: chartTypeEnum,
    title: z.string().optional(),
    data: z.array(dataRow),
    x_key: z.string().optional(),
    y_keys: z.array(z.string()).optional(),
    x_label: z.string().optional(),
    y_label: z.string().optional(),
    stacked: z.boolean().optional(),
  })
  .strict()

export const tableColumn = z
  .object({
    key: z.string(),
    label: z.string(),
    type: z
      .enum(['string', 'number', 'currency', 'date', 'boolean'])
      .optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
  })
  .strict()

export const tableSpec = z
  .object({
    kind: z.literal('table'),
    title: z.string().optional(),
    columns: z.array(tableColumn),
    rows: z.array(
      z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
    ),
  })
  .strict()

export const kpiSpec = z
  .object({
    kind: z.literal('kpi'),
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    trend: z
      .object({
        direction: z.enum(['up', 'down', 'flat']),
        delta: z.union([z.string(), z.number()]),
        period: z.string().optional(),
      })
      .strict()
      .optional(),
    status: z.enum(['good', 'warn', 'bad', 'neutral']).optional(),
  })
  .strict()

export const imageSpec = z
  .object({
    kind: z.literal('image'),
    src: imageSrc,
    alt: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    caption: z.string().optional(),
  })
  .strict()

export const visualSpec = z.discriminatedUnion('kind', [
  chartSpec,
  tableSpec,
  kpiSpec,
  imageSpec,
])

export const visualEnvelope = z
  .object({
    schema_version: z.number().int(),
    spec: visualSpec,
  })
  .strict()
  .superRefine((env, ctx) => {
    if (env.schema_version !== SCHEMA_VERSION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `unsupported schema_version ${env.schema_version}; this client speaks v${SCHEMA_VERSION}`,
      })
    }
  })

/** Returns the parsed envelope on success, or `null` on any failure. */
export function safeParseEnvelope(payload: unknown):
  | { ok: true; envelope: z.infer<typeof visualEnvelope> }
  | { ok: false; issues: string[] } {
  const result = visualEnvelope.safeParse(payload)
  if (result.success) {
    return { ok: true, envelope: result.data }
  }
  return {
    ok: false,
    issues: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  }
}
