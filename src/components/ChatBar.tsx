import type { ChatBarProps } from '../types'
import { cn } from '../utils/cn'

/**
 * The pill-shaped trigger that opens the <ChatPanel>. Designed
 * to live in a top-bar / header. The panel hangs below it.
 */
export function ChatBar({
  onClick,
  open = false,
  placeholder = 'Ask the assistant…',
  className,
}: ChatBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label="Open AI assistant"
      data-testid="chat-bar"
      className={cn(
        'aaui-bar',
        open && 'aaui-bar--open',
        className,
      )}
    >
      <span className="aaui-bar__icon" aria-hidden>
        ✨
      </span>
      <span className="aaui-bar__placeholder">{placeholder}</span>
      <span className="aaui-bar__shortcut" aria-hidden>
        ⌘K
      </span>
    </button>
  )
}
