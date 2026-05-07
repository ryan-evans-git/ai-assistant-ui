import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisualBlock } from './VisualBlock'
import type { VisualBlock as VisualBlockType } from './types'

function block(spec: VisualBlockType['spec']): VisualBlockType {
  return { type: 'visual', tool_use_id: 'tu_1', schema_version: 1, spec }
}

describe('VisualBlock', () => {
  it('renders a KPI tile with label and value', () => {
    render(
      <VisualBlock
        block={block({
          kind: 'kpi',
          label: 'Open invoices',
          value: '$4,340.00',
          status: 'warn',
        })}
      />,
    )
    expect(screen.getByText('Open invoices')).toBeInTheDocument()
    expect(screen.getByText('$4,340.00')).toBeInTheDocument()
  })

  it('renders a table with headers and cells', () => {
    render(
      <VisualBlock
        block={block({
          kind: 'table',
          title: 'Invoices',
          columns: [
            { key: 'id', label: 'ID' },
            { key: 'amt', label: 'Amount', type: 'currency' },
          ],
          rows: [
            { id: '4711', amt: 1250 },
            { id: '4733', amt: 890 },
          ],
        })}
      />,
    )
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('4711')).toBeInTheDocument()
    expect(screen.getByText('4733')).toBeInTheDocument()
    // Currency formatting (locale "USD" — defaults to "$1,250.00").
    expect(screen.getByText(/\$1,250\.00/)).toBeInTheDocument()
  })

  it('renders an https image with the supplied alt text', () => {
    render(
      <VisualBlock
        block={block({
          kind: 'image',
          src: 'https://example.com/x.png',
          alt: 'Quarterly revenue chart',
        })}
      />,
    )
    const img = screen.getByAltText('Quarterly revenue chart')
    expect(img).toHaveAttribute('src', 'https://example.com/x.png')
  })

  it('rejects non-https, non-data image sources', () => {
    render(
      <VisualBlock
        block={block({
          kind: 'image',
          src: 'javascript:alert(1)' as string,
          alt: 'evil',
        })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/rejected/i)
  })

  it('rejects an unsupported schema_version with a graceful fallback', () => {
    const blk: VisualBlockType = {
      type: 'visual',
      tool_use_id: 'tu_x',
      schema_version: 999,
      spec: { kind: 'kpi', label: 'x', value: 1 },
    }
    render(<VisualBlock block={blk} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/schema_version/)
  })

  it('renders chart titles for chart specs', () => {
    render(
      <VisualBlock
        block={block({
          kind: 'chart',
          chart_type: 'bar',
          title: 'Revenue',
          data: [{ q: 'Q1', rev: 100 }],
          x_key: 'q',
          y_keys: ['rev'],
        })}
      />,
    )
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })
})
