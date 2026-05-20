import { useEffect, useMemo, useRef } from 'react'
import type {
  ChatMessage,
  ContentBlock,
  TextBlock,
  ToolResultBlock,
  ToolUseBlock,
  VisualBlock as VisualBlockType,
} from '../types'
import { cn } from '../utils/cn'
import { VisualBlock } from '../visuals/VisualBlock'
import { ToolCallBlock } from './ToolCallBlock'

interface Props {
  messages: ChatMessage[]
  isLoading?: boolean
  isStreaming?: boolean
  emptyState?: React.ReactNode
}

/**
 * Renders the conversation. Auto-scrolls to bottom while a
 * stream is in flight; respects manual scroll otherwise.
 */
export function MessageList({
  messages,
  isLoading = false,
  isStreaming = false,
  emptyState,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const wasNearBottomRef = useRef<boolean>(true)

  // Index tool_results by tool_use_id so ToolCallBlock can pair them.
  const resultsByToolId = useMemo(() => {
    const map = new Map<string, ToolResultBlock>()
    for (const msg of messages) {
      for (const block of msg.blocks) {
        if (block.type === 'tool_result') {
          map.set(block.tool_use_id, block)
        }
      }
    }
    return map
  }, [messages])

  // Auto-scroll while streaming if the user is already near the
  // bottom — preserves intent if they've scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isStreaming && wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isStreaming])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    wasNearBottomRef.current = distance < 64
  }

  if (isLoading) {
    return (
      <div className="aaui-list aaui-list--loading" data-testid="message-list">
        <div className="aaui-skeleton" />
        <div className="aaui-skeleton aaui-skeleton--narrow" />
      </div>
    )
  }
  if (messages.length === 0) {
    return (
      <div className="aaui-list aaui-list--empty" data-testid="message-list">
        {emptyState ?? <DefaultEmptyState />}
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="aaui-list"
      data-testid="message-list"
    >
      {messages.map((msg) => (
        <MessageRow key={msg.id} message={msg} resultsByToolId={resultsByToolId} />
      ))}
    </div>
  )
}

interface MessageRowProps {
  message: ChatMessage
  resultsByToolId: Map<string, ToolResultBlock>
}

function MessageRow({ message, resultsByToolId }: MessageRowProps) {
  const visibleBlocks = message.blocks.filter(
    // tool_results are rendered inside ToolCallBlock, not standalone.
    // tool_use of name "render_visual" is hidden because the
    // VisualBlock that the host appends from the corresponding
    // `visual` event is the user-facing form — showing both would
    // be noise.
    (b): b is TextBlock | ToolUseBlock | VisualBlockType => {
      if (b.type === 'tool_result') return false
      if (b.type === 'tool_use' && b.name === 'render_visual') return false
      return true
    },
  )

  if (visibleBlocks.length === 0) return null

  return (
    <div
      data-testid={`message-${message.role}`}
      className={cn(
        'aaui-msg',
        message.role === 'user' ? 'aaui-msg--user' : 'aaui-msg--assistant',
      )}
    >
      {visibleBlocks.map((block, i) => (
        <BlockRenderer
          key={i}
          block={block}
          resultsByToolId={resultsByToolId}
        />
      ))}
    </div>
  )
}

interface BlockRendererProps {
  block: ContentBlock
  resultsByToolId: Map<string, ToolResultBlock>
}

function BlockRenderer({ block, resultsByToolId }: BlockRendererProps) {
  if (block.type === 'text') {
    return (
      <div className="aaui-text">
        {block.text}
        {block.streaming && <span className="aaui-cursor" aria-hidden />}
      </div>
    )
  }
  if (block.type === 'tool_use') {
    return (
      <ToolCallBlock
        toolUse={block}
        result={resultsByToolId.get(block.id)}
      />
    )
  }
  if (block.type === 'visual') {
    return <VisualBlock block={block} />
  }
  return null
}

function DefaultEmptyState() {
  return (
    <div className="aaui-empty">
      <div className="aaui-empty__title">Start a conversation</div>
      <div className="aaui-empty__body">
        Ask anything — I'll search the available tools and use the right ones
        to answer.
      </div>
    </div>
  )
}
