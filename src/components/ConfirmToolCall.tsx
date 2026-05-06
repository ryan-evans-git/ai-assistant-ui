import { useEffect, useState } from 'react'
import type {
  ConfirmationDecision,
  ToolConfirmationRequest,
} from '../types'
import { cn } from '../utils/cn'

interface Props {
  request: ToolConfirmationRequest | null | undefined
  onResolve?: (
    request: ToolConfirmationRequest,
    decision: ConfirmationDecision,
    note: string | null,
  ) => void | Promise<void>
}

/**
 * Modal that surfaces a pending mutation-tool call and asks the
 * user to confirm or decline before the host runs it upstream.
 *
 * Renders nothing when ``request`` is null/undefined.
 */
export function ConfirmToolCall({ request, onResolve }: Props) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<ConfirmationDecision | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    setNote('')
    setBusy(null)
  }, [request?.toolUseId])

  useEffect(() => {
    if (!request?.expiresAtUnix) {
      setSecondsLeft(null)
      return
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round(request.expiresAtUnix! - Date.now() / 1000),
      )
      setSecondsLeft(remaining)
    }
    tick()
    const handle = window.setInterval(tick, 1000)
    return () => window.clearInterval(handle)
  }, [request?.expiresAtUnix])

  if (!request) return null

  const expired = secondsLeft !== null && secondsLeft <= 0

  const resolve = async (decision: ConfirmationDecision) => {
    if (!onResolve || busy) return
    setBusy(decision)
    try {
      await onResolve(request, decision, note.trim() || null)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aaui-confirm-title"
      className="aaui-confirm-backdrop"
      data-testid="confirm-tool-call"
    >
      <div className="aaui-confirm">
        <h2 id="aaui-confirm-title" className="aaui-confirm__title">
          Confirm tool call
        </h2>
        <div className="aaui-confirm__tool">
          <span className="aaui-confirm__tool-name">{request.toolName}</span>
          {request.toolDescription && (
            <span className="aaui-confirm__tool-desc">
              {request.toolDescription}
            </span>
          )}
        </div>
        <div className="aaui-confirm__section">
          <div className="aaui-confirm__section-label">Arguments</div>
          <pre className="aaui-confirm__pre">
            {formatJson(request.toolInput)}
          </pre>
        </div>
        <label className="aaui-confirm__note">
          <span className="aaui-confirm__section-label">Note (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why are you approving / declining?"
            rows={2}
            disabled={busy !== null}
          />
        </label>
        {secondsLeft !== null && (
          <div className={cn('aaui-confirm__timer', expired && 'aaui-confirm__timer--expired')}>
            {expired ? 'Expired' : `Expires in ${secondsLeft}s`}
          </div>
        )}
        <div className="aaui-confirm__actions">
          <button
            type="button"
            className="aaui-btn aaui-btn--ghost"
            onClick={() => resolve('decline')}
            disabled={busy !== null || expired}
          >
            {busy === 'decline' ? 'Declining…' : 'Decline'}
          </button>
          <button
            type="button"
            className="aaui-btn aaui-btn--primary"
            onClick={() => resolve('confirm')}
            disabled={busy !== null || expired}
          >
            {busy === 'confirm' ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
      </div>
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
