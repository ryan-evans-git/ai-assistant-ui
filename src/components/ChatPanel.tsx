import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatPanelProps } from '../types'
import { cn } from '../utils/cn'
import { ConfirmToolCall } from './ConfirmToolCall'
import { MessageList } from './MessageList'

const DEFAULT_PLACEHOLDER = 'Ask anything… type / for commands.'

export function ChatPanel({
  open,
  onClose,
  messages,
  isStreaming = false,
  isLoading = false,
  onSendMessage,
  onCancelStream,
  pendingConfirmation,
  onResolveConfirmation,
  onSlashCommand,
  title = 'Assistant',
  placeholder = DEFAULT_PLACEHOLDER,
  emptyState,
  className,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Autofocus on open.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 120)
      return () => window.clearTimeout(t)
    }
  }, [open])

  // Esc handling: cancel mid-stream, otherwise close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isStreaming && onCancelStream) {
        onCancelStream()
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isStreaming, onCancelStream, onClose])

  const submit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    if (onSlashCommand && trimmed.startsWith('/')) {
      const result = await onSlashCommand(trimmed)
      if (result?.consumed) {
        setInput('')
        return
      }
    }
    setInput('')
    await onSendMessage(trimmed)
  }, [input, isStreaming, onSendMessage, onSlashCommand])

  const onTextareaKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void submit()
      }
    },
    [submit],
  )

  return (
    <div
      role="dialog"
      aria-label={title}
      aria-hidden={!open}
      data-testid="chat-panel"
      className={cn(
        'aaui-panel',
        open ? 'aaui-panel--open' : 'aaui-panel--closed',
        className,
      )}
    >
      <header className="aaui-panel__header">
        <div className="aaui-panel__title">{title}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Minimize chat"
          className="aaui-btn aaui-btn--icon"
        >
          ▾
        </button>
      </header>

      <MessageList
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        emptyState={emptyState}
      />

      <ConfirmToolCall
        request={pendingConfirmation}
        onResolve={onResolveConfirmation}
      />

      <footer className="aaui-panel__footer">
        <div className="aaui-input">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onTextareaKey}
            placeholder={placeholder}
            rows={1}
            disabled={isStreaming}
            data-testid="chat-input"
            className="aaui-input__textarea"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            data-testid="chat-send"
            className="aaui-btn aaui-btn--primary aaui-btn--icon"
          >
            ↑
          </button>
        </div>
        <div className="aaui-panel__hint">
          {isStreaming ? (
            <button
              type="button"
              onClick={onCancelStream}
              className="aaui-link"
            >
              Cancel (esc)
            </button>
          ) : (
            'Enter to send · Shift+Enter for newline · Esc to close'
          )}
        </div>
      </footer>
    </div>
  )
}
