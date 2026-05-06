import { useState } from 'react'
import type { ToolResultBlock, ToolUseBlock } from '../types'
import { cn } from '../utils/cn'

interface Props {
  toolUse: ToolUseBlock
  /** Matched ``tool_result`` block, if one has arrived. */
  result?: ToolResultBlock
  /** Render compactly (one-line summary, expandable). */
  compact?: boolean
}

/**
 * Renders a tool_use block paired with its tool_result.
 *
 * Closed: one-line "▶ tool_name(...)" with status badge.
 * Open:   formatted JSON of input + result body.
 */
export function ToolCallBlock({ toolUse, result, compact = true }: Props) {
  const [expanded, setExpanded] = useState(!compact)

  const status = !result
    ? toolUse.streaming
      ? 'running'
      : 'pending'
    : result.isError
    ? 'error'
    : 'ok'

  return (
    <div
      data-testid="tool-call-block"
      className={cn(
        'aaui-tool',
        status === 'error' && 'aaui-tool--error',
        status === 'ok' && 'aaui-tool--ok',
        status === 'running' && 'aaui-tool--running',
      )}
    >
      <button
        type="button"
        className="aaui-tool__header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`Tool call ${toolUse.name}, ${status}`}
      >
        <span className="aaui-tool__chevron" aria-hidden>
          {expanded ? '▼' : '▶'}
        </span>
        <span className="aaui-tool__name">{toolUse.name}</span>
        <span className={cn('aaui-tool__badge', `aaui-tool__badge--${status}`)}>
          {status}
        </span>
      </button>
      {expanded && (
        <div className="aaui-tool__body">
          <div className="aaui-tool__section">
            <div className="aaui-tool__section-label">Input</div>
            <pre className="aaui-tool__pre">{formatJson(toolUse.input)}</pre>
          </div>
          {result && (
            <div className="aaui-tool__section">
              <div className="aaui-tool__section-label">
                {result.isError ? 'Error' : 'Result'}
              </div>
              <pre className="aaui-tool__pre">{result.content}</pre>
            </div>
          )}
          {!result && (
            <div className="aaui-tool__section aaui-tool__pending">
              {toolUse.streaming ? 'Tool is running…' : 'Waiting for result…'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
