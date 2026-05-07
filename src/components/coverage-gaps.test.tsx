/**
 * Targeted tests to fill remaining coverage gaps in component code.
 *
 * Each block is named for the exact uncovered branch / line it
 * exercises so future-you can prune the redundancy if a more
 * natural test ends up covering the same path.
 */
import { fireEvent, render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChatPanel } from './ChatPanel'
import { ConfirmToolCall } from './ConfirmToolCall'
import { ConversationSwitcher } from './ConversationSwitcher'
import { MessageList } from './MessageList'
import { ToolCallBlock } from './ToolCallBlock'
import type { ChatMessage, ToolUseBlock } from '../types'

// ---------------------------------------------------------------------------
// ConversationSwitcher — outside-click + Escape close (lines 49-50, 53-54)
// ---------------------------------------------------------------------------

describe('ConversationSwitcher / outside-close paths', () => {
  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <ConversationSwitcher
        conversations={[{ id: 'a', title: 'A' }]}
        currentConversationId="a"
      />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    expect(screen.queryByTestId('conversation-switcher-menu')).not.toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('conversation-switcher-menu')).toBeNull()
  })

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button data-testid="outside">outside</button>
        <ConversationSwitcher
          conversations={[{ id: 'a', title: 'A' }]}
          currentConversationId="a"
        />
      </div>,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    expect(screen.queryByTestId('conversation-switcher-menu')).not.toBeNull()
    // Use raw fireEvent (mousedown) — that's what the component listens for.
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByTestId('conversation-switcher-menu')).toBeNull()
  })

  it('renders Untitled fallback when a conversation has no title', async () => {
    const user = userEvent.setup()
    render(
      <ConversationSwitcher
        conversations={[{ id: 'a', title: '' }]}
        currentConversationId="a"
      />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    expect(screen.getByText('Untitled')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// ChatPanel — header with conversation switcher (lines 96-102)
// ---------------------------------------------------------------------------

describe('ChatPanel / conversation switcher in header', () => {
  it('renders ConversationSwitcher when conversations prop is supplied', () => {
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={() => {}}
        conversations={[{ id: 'a', title: 'My session' }]}
        currentConversationId="a"
      />,
    )
    expect(screen.getByTestId('conversation-switcher-trigger')).toHaveTextContent(
      'My session',
    )
  })
})

// ---------------------------------------------------------------------------
// ConfirmToolCall — timer display + formatJson fallback (101-103, 132-133)
// ---------------------------------------------------------------------------

describe('ConfirmToolCall / timer + JSON fallback', () => {
  it('renders the timer when expiresAtUnix is provided', () => {
    const now = Math.floor(Date.now() / 1000)
    render(
      <ConfirmToolCall
        request={{
          toolUseId: 'tu_1',
          toolName: 't',
          toolInput: {},
          expiresAtUnix: now + 30,
        }}
      />,
    )
    expect(screen.getByText(/Expires in/)).toBeInTheDocument()
  })

  it('shows "Expired" when the timer hits zero', () => {
    const now = Math.floor(Date.now() / 1000)
    render(
      <ConfirmToolCall
        request={{
          toolUseId: 'tu_2',
          toolName: 't',
          toolInput: {},
          expiresAtUnix: now - 5,
        }}
      />,
    )
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('falls back to String(value) for unserializable inputs', () => {
    // Circular reference makes JSON.stringify throw.
    const cyclic: Record<string, unknown> = { name: 'x' }
    cyclic.self = cyclic
    render(
      <ConfirmToolCall
        request={{
          toolUseId: 'tu_3',
          toolName: 'circular',
          toolInput: cyclic,
        }}
      />,
    )
    // String(cyclic) → "[object Object]" — assert the dialog mounted
    // and didn't crash on the circular ref.
    expect(screen.getByTestId('confirm-tool-call')).toBeInTheDocument()
    expect(screen.getByText('[object Object]')).toBeInTheDocument()
  })

  it('runs onResolve when Confirm is clicked', async () => {
    const onResolve = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmToolCall
        request={{ toolUseId: 'tu_4', toolName: 't', toolInput: {} }}
        onResolve={onResolve}
      />,
    )
    await user.click(screen.getByText('Confirm'))
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ toolUseId: 'tu_4' }),
      'confirm',
      null,
    )
  })

  it('passes the trimmed note when one is typed', async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(
      <ConfirmToolCall
        request={{ toolUseId: 'tu_5', toolName: 't', toolInput: {} }}
        onResolve={onResolve}
      />,
    )
    await user.type(screen.getByPlaceholderText(/approving/i), '  yes please  ')
    await user.click(screen.getByText('Decline'))
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ toolUseId: 'tu_5' }),
      'decline',
      'yes please',
    )
  })
})

// ---------------------------------------------------------------------------
// ToolCallBlock — running status + JSON fallback (24, 84-85)
// ---------------------------------------------------------------------------

describe('ToolCallBlock / running + circular input', () => {
  it('renders the "running" status when toolUse.streaming is true', () => {
    const tu: ToolUseBlock = {
      type: 'tool_use',
      id: 'tu_1',
      name: 'fetch',
      input: { url: 'https://x' },
      streaming: true,
    }
    render(<ToolCallBlock toolUse={tu} compact={false} />)
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText('Tool is running…')).toBeInTheDocument()
  })

  it('falls back to String(value) for circular input', () => {
    const cyclic: Record<string, unknown> = { ok: true }
    cyclic.self = cyclic
    const tu: ToolUseBlock = {
      type: 'tool_use',
      id: 'tu_2',
      name: 'echo',
      input: cyclic,
    }
    render(<ToolCallBlock toolUse={tu} compact={false} />)
    expect(screen.getByText('[object Object]')).toBeInTheDocument()
  })

  it('renders the error result branch', () => {
    const tu: ToolUseBlock = {
      type: 'tool_use',
      id: 'tu_3',
      name: 'fetch',
      input: {},
    }
    render(
      <ToolCallBlock
        toolUse={tu}
        compact={false}
        result={{
          type: 'tool_result',
          tool_use_id: 'tu_3',
          content: 'failed',
          isError: true,
        }}
      />,
    )
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('toggles expanded state when the header is clicked', async () => {
    const user = userEvent.setup()
    const tu: ToolUseBlock = {
      type: 'tool_use',
      id: 'tu_4',
      name: 'fetch',
      input: { url: 'x' },
    }
    render(<ToolCallBlock toolUse={tu} compact />)
    // Compact starts closed — input pre is hidden.
    expect(screen.queryByText('Input')).toBeNull()
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Input')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// MessageList — onScroll + visual block render (58-62, 156-160)
// ---------------------------------------------------------------------------

describe('MessageList / scroll + visual block', () => {
  it('runs onScroll without throwing', () => {
    const messages: ChatMessage[] = [
      { id: 'm1', role: 'user', blocks: [{ type: 'text', text: 'hi' }] },
    ]
    render(<MessageList messages={messages} />)
    const list = screen.getByTestId('message-list')
    fireEvent.scroll(list, { target: { scrollTop: 0 } })
    // No assertion needed beyond "didn't throw" — the handler updates
    // an internal ref and has no observable side effect from outside.
  })

  it('renders a visual block within a message', () => {
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        role: 'assistant',
        blocks: [
          {
            type: 'visual',
            tool_use_id: 'tu_1',
            schema_version: 1,
            spec: { kind: 'kpi', label: 'Latency', value: '42ms' },
          },
        ],
      },
    ]
    render(<MessageList messages={messages} />)
    expect(screen.getByText('Latency')).toBeInTheDocument()
  })

  it('shows the loading skeleton when isLoading=true', () => {
    render(<MessageList messages={[]} isLoading />)
    const el = screen.getByTestId('message-list')
    expect(el.className).toContain('aaui-list--loading')
  })

  it('renders the streaming cursor when a text block is streaming', () => {
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        role: 'assistant',
        blocks: [{ type: 'text', text: 'partial', streaming: true }],
      },
    ]
    const { container } = render(
      <MessageList messages={messages} isStreaming />,
    )
    expect(container.querySelector('.aaui-cursor')).not.toBeNull()
  })
})

// Defensive: keep the unused-import suppression honest.
void act
