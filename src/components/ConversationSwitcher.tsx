import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConversationSummary } from '../types'
import { cn } from '../utils/cn'

export interface ConversationSwitcherProps {
  conversations: ConversationSummary[]
  /** ``null`` means "new, unsaved conversation". */
  currentConversationId?: string | null
  onNewConversation?: () => void
  onSelectConversation?: (id: string) => void
  onDeleteConversation?: (id: string) => void
  /** Optional className passed to the trigger button. */
  className?: string
}

/**
 * Header dropdown that lists prior conversations and exposes a
 * "+ New conversation" action.  Mirrors the surface ca-web's
 * SessionSwitcher provides — dropdown trigger shows the current
 * conversation's title (or "New conversation"), menu lists recent.
 *
 * Built without a UI library — just a button + popover panel — so
 * ai-assistant-ui doesn't have to take a Radix / Headless UI
 * dependency for one menu.  Closes on outside click, Esc, and
 * after any action.
 */
export function ConversationSwitcher({
  conversations,
  currentConversationId = null,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  className,
}: ConversationSwitcherProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const current = conversations.find((c) => c.id === currentConversationId)
  const triggerLabel = current?.title || 'New conversation'

  // Outside-click + Esc-to-close.  We attach to document so the
  // menu also closes when the user clicks somewhere else inside the
  // chat panel header.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleNew = useCallback(() => {
    setOpen(false)
    onNewConversation?.()
  }, [onNewConversation])

  const handleSelect = useCallback(
    (id: string) => {
      setOpen(false)
      onSelectConversation?.(id)
    },
    [onSelectConversation],
  )

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      // Stop the click from also bubbling up to the row's "select"
      // handler.  We don't close the menu — letting the user delete
      // multiple in a row is friendlier.
      e.preventDefault()
      e.stopPropagation()
      onDeleteConversation?.(id)
    },
    [onDeleteConversation],
  )

  return (
    <div className="aaui-switcher" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="conversation-switcher-trigger"
        className={cn('aaui-switcher__trigger', className)}
      >
        <span className="aaui-switcher__title">{triggerLabel}</span>
        <span className="aaui-switcher__chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          data-testid="conversation-switcher-menu"
          className="aaui-switcher__menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleNew}
            className="aaui-switcher__item aaui-switcher__item--action"
          >
            <span className="aaui-switcher__plus" aria-hidden>
              +
            </span>
            New conversation
          </button>

          <div className="aaui-switcher__sep" role="separator" />
          <div className="aaui-switcher__label">Recent</div>

          {conversations.length === 0 ? (
            <div className="aaui-switcher__empty">No conversations yet</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(c.id)}
                className={cn(
                  'aaui-switcher__item',
                  c.id === currentConversationId && 'aaui-switcher__item--active',
                )}
              >
                <span className="aaui-switcher__row-title">
                  {c.title || 'Untitled'}
                </span>
                {onDeleteConversation && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(c.id, e)}
                    aria-label={`Delete ${c.title || 'conversation'}`}
                    className="aaui-switcher__delete"
                  >
                    ×
                  </button>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
