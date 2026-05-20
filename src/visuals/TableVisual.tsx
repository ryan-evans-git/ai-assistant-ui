import type { TableColumn, TableSpec } from './types'

export function TableVisual({ spec }: { spec: TableSpec }) {
  return (
    <figure className="aaui-visual aaui-visual--table">
      {spec.title && (
        <figcaption className="aaui-visual__title">{spec.title}</figcaption>
      )}
      <div className="aaui-visual__table-frame">
        <table className="aaui-table">
          <thead>
            <tr>
              {spec.columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="aaui-table__th"
                  style={{ textAlign: alignFor(col) }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, ri) => (
              <tr key={ri} className="aaui-table__row">
                {spec.columns.map((col) => (
                  <td
                    key={col.key}
                    className="aaui-table__td"
                    style={{ textAlign: alignFor(col) }}
                  >
                    {formatCell(row[col.key], col.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

function alignFor(col: TableColumn): 'left' | 'center' | 'right' {
  if (col.align) return col.align
  if (col.type === 'number' || col.type === 'currency') return 'right'
  return 'left'
}

function formatCell(
  value: unknown,
  type: TableColumn['type'] = 'string',
): string {
  if (value === null || value === undefined) return '—'
  if (type === 'currency' && typeof value === 'number') {
    // Locale-default currency formatting; assume USD until the spec
    // adds a currency code. Hosts that need other currencies can
    // pre-format in the cell value as a string.
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
    })
  }
  if (type === 'number' && typeof value === 'number') {
    return value.toLocaleString()
  }
  if (type === 'date' && typeof value === 'string') {
    const dt = new Date(value)
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
  }
  if (type === 'boolean' && typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}
