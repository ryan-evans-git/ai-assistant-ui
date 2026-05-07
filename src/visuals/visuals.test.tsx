import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChartVisual } from './ChartVisual'
import { ImageVisual } from './ImageVisual'
import { KpiVisual } from './KpiVisual'
import { TableVisual } from './TableVisual'
import type { ChartSpec, ImageSpec, KpiSpec, TableSpec } from './types'

describe('ChartVisual', () => {
  // Recharts uses `<ResponsiveContainer>` which measures the parent
  // box; in jsdom the parent has no size, so charts render with
  // width(0)/height(0).  We don't assert pixel output — we just
  // assert the renderer doesn't throw and that title text appears.
  // Rendering each chart_type exercises the dispatch branches.
  const dataXY = [
    { q: 'Q1', rev: 100, cost: 40 },
    { q: 'Q2', rev: 150, cost: 70 },
  ]

  it.each(['bar', 'line', 'area', 'scatter'] as const)(
    'renders %s chart without throwing',
    (chart_type) => {
      const spec: ChartSpec = {
        kind: 'chart',
        chart_type,
        title: `${chart_type} chart`,
        data: dataXY,
        x_key: 'q',
        y_keys: ['rev', 'cost'],
        x_label: 'Quarter',
        y_label: 'USD',
      }
      render(<ChartVisual spec={spec} />)
      expect(screen.getByText(`${chart_type} chart`)).toBeInTheDocument()
    },
  )

  it.each(['bar', 'area'] as const)(
    'honors stacked=true on %s',
    (chart_type) => {
      render(
        <ChartVisual
          spec={{
            kind: 'chart',
            chart_type,
            data: dataXY,
            x_key: 'q',
            y_keys: ['rev', 'cost'],
            stacked: true,
          }}
        />,
      )
    },
  )

  it('renders a pie chart', () => {
    render(
      <ChartVisual
        spec={{
          kind: 'chart',
          chart_type: 'pie',
          title: 'Mix',
          data: [
            { label: 'A', value: 30 },
            { label: 'B', value: 70 },
          ],
        }}
      />,
    )
    expect(screen.getByText('Mix')).toBeInTheDocument()
  })

  it('renders a donut chart (innerRadius branch)', () => {
    render(
      <ChartVisual
        spec={{
          kind: 'chart',
          chart_type: 'donut',
          data: [
            { label: 'A', value: 30 },
            { label: 'B', value: 70 },
          ],
        }}
      />,
    )
  })

  it('omits axis labels when not provided (axisLabel undefined branch)', () => {
    render(
      <ChartVisual
        spec={{
          kind: 'chart',
          chart_type: 'line',
          data: dataXY,
          x_key: 'q',
          y_keys: ['rev'],
        }}
      />,
    )
  })

  it('handles empty y_keys gracefully', () => {
    render(
      <ChartVisual
        spec={{
          kind: 'chart',
          chart_type: 'bar',
          data: dataXY,
          x_key: 'q',
        }}
      />,
    )
  })
})

describe('ImageVisual', () => {
  it('renders a data: URI source', () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAA='
    render(
      <ImageVisual
        spec={{ kind: 'image', src: dataUri, alt: 'tiny pixel' }}
      />,
    )
    expect(screen.getByAltText('tiny pixel')).toHaveAttribute('src', dataUri)
  })

  it('renders caption when provided', () => {
    render(
      <ImageVisual
        spec={{
          kind: 'image',
          src: 'https://example.com/x.png',
          alt: 'x',
          caption: 'A caption.',
        }}
      />,
    )
    expect(screen.getByText('A caption.')).toBeInTheDocument()
  })

  it('renders width and height when provided', () => {
    render(
      <ImageVisual
        spec={{
          kind: 'image',
          src: 'https://example.com/x.png',
          alt: 'sized',
          width: 320,
          height: 240,
        }}
      />,
    )
    const img = screen.getByAltText('sized')
    expect(img).toHaveAttribute('width', '320')
    expect(img).toHaveAttribute('height', '240')
  })

  it('rejects non-https, non-data URIs', () => {
    render(<ImageVisual spec={{ kind: 'image', src: 'http://x', alt: 'a' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/rejected/i)
  })
})

describe('KpiVisual', () => {
  it('renders unit when provided', () => {
    const spec: KpiSpec = {
      kind: 'kpi',
      label: 'Latency',
      value: 42,
      unit: 'ms',
    }
    render(<KpiVisual spec={spec} />)
    expect(screen.getByText('ms')).toBeInTheDocument()
  })

  it.each(['up', 'down', 'flat'] as const)(
    'renders %s trend with delta + period',
    (direction) => {
      render(
        <KpiVisual
          spec={{
            kind: 'kpi',
            label: 'Revenue',
            value: '$1.2M',
            trend: { direction, delta: '12%', period: 'vs last month' },
          }}
        />,
      )
      expect(screen.getByText('12%')).toBeInTheDocument()
      expect(screen.getByText(/vs last month/)).toBeInTheDocument()
    },
  )

  it('renders trend without period (period-undefined branch)', () => {
    render(
      <KpiVisual
        spec={{
          kind: 'kpi',
          label: 'Visitors',
          value: 99,
          trend: { direction: 'up', delta: '+5' },
        }}
      />,
    )
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('defaults status to neutral when not provided', () => {
    const { container } = render(
      <KpiVisual spec={{ kind: 'kpi', label: 'X', value: 1 }} />,
    )
    expect(container.querySelector('.aaui-kpi--neutral')).not.toBeNull()
  })
})

describe('TableVisual', () => {
  const baseTable: TableSpec = {
    kind: 'table',
    columns: [
      { key: 'a', label: 'A', type: 'string' },
      { key: 'n', label: 'N', type: 'number' },
      { key: 'c', label: 'C', type: 'currency' },
      { key: 'd', label: 'D', type: 'date' },
      { key: 'b', label: 'B', type: 'boolean' },
    ],
    rows: [
      {
        a: 'hello',
        n: 1234,
        c: 99.5,
        d: '2026-05-01',
        b: true,
      },
      // null/undefined row exercises the em-dash fallback
      { a: null, n: null, c: null, d: null, b: null },
      // boolean-false branch
      { a: 'x', n: 0, c: 0, d: 'invalid-date', b: false },
    ],
  }

  it('formats number, currency, date, and boolean cells', () => {
    render(<TableVisual spec={baseTable} />)
    // Number locale-formatted.
    expect(screen.getByText('1,234')).toBeInTheDocument()
    // Currency with $ sign.
    expect(screen.getByText(/\$99\.50/)).toBeInTheDocument()
    // Boolean → "Yes" / "No".
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    // Date → locale-short month (any 3-letter month name; exact value
    // depends on the runner's timezone since "2026-05-01" is UTC
    // midnight and may render as the previous day in negative-offset
    // zones).
    expect(screen.getByText(/\b(Apr|May)\b.*2026/)).toBeInTheDocument()
    // Null fallback.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('passes invalid date strings through as-is', () => {
    render(<TableVisual spec={baseTable} />)
    expect(screen.getByText('invalid-date')).toBeInTheDocument()
  })

  it('honors explicit column align over the type default', () => {
    const spec: TableSpec = {
      kind: 'table',
      columns: [{ key: 'n', label: 'N', type: 'number', align: 'center' }],
      rows: [{ n: 1 }],
    }
    const { container } = render(<TableVisual spec={spec} />)
    const th = container.querySelector('th')!
    expect(th.getAttribute('style')).toContain('center')
  })
})
