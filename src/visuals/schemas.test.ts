import { describe, expect, it } from 'vitest'
import { safeParseEnvelope } from './schemas'
import { SCHEMA_VERSION } from './types'

const env = (spec: unknown) => ({ schema_version: SCHEMA_VERSION, spec })

describe('safeParseEnvelope', () => {
  it('accepts a valid bar chart envelope', () => {
    const result = safeParseEnvelope(
      env({
        kind: 'chart',
        chart_type: 'bar',
        data: [{ q: 'Q1', rev: 100 }],
        x_key: 'q',
        y_keys: ['rev'],
      }),
    )
    expect(result.ok).toBe(true)
  })

  it('rejects unknown chart_type', () => {
    const result = safeParseEnvelope(
      env({
        kind: 'chart',
        chart_type: 'donut-3d',
        data: [],
      }),
    )
    expect(result.ok).toBe(false)
  })

  it('accepts an https image src', () => {
    const result = safeParseEnvelope(
      env({ kind: 'image', src: 'https://example.com/a.png', alt: 'a' }),
    )
    expect(result.ok).toBe(true)
  })

  it('rejects http image src', () => {
    const result = safeParseEnvelope(
      env({ kind: 'image', src: 'http://example.com/a.png', alt: 'a' }),
    )
    expect(result.ok).toBe(false)
  })

  it('rejects svg data URIs', () => {
    const result = safeParseEnvelope(
      env({
        kind: 'image',
        src: 'data:image/svg+xml;base64,PHN2Zy8+',
        alt: 'a',
      }),
    )
    expect(result.ok).toBe(false)
  })

  it('accepts a png data URI', () => {
    const result = safeParseEnvelope(
      env({
        kind: 'image',
        src: 'data:image/png;base64,aGVsbG8=',
        alt: 'a',
      }),
    )
    expect(result.ok).toBe(true)
  })

  it('rejects unknown schema_version', () => {
    const result = safeParseEnvelope({
      schema_version: 999,
      spec: { kind: 'kpi', label: 'x', value: 1 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.join(' ')).toMatch(/schema_version/)
    }
  })

  it('accepts a kpi with optional trend', () => {
    const result = safeParseEnvelope(
      env({
        kind: 'kpi',
        label: 'x',
        value: 1,
        trend: { direction: 'up', delta: '+1' },
      }),
    )
    expect(result.ok).toBe(true)
  })
})
