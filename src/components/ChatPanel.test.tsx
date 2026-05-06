import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ChatPanel } from './ChatPanel'
import type { ChatMessage } from '../types'

function basicMessages(): ChatMessage[] {
  return [
    {
      id: 'm1',
      role: 'user',
      blocks: [{ type: 'text', text: 'Hello?' }],
    },
    {
      id: 'm2',
      role: 'assistant',
      blocks: [{ type: 'text', text: 'Hi there.' }],
    },
  ]
}

describe('<ChatPanel />', () => {
  it('renders messages', () => {
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={basicMessages()}
        onSendMessage={() => {}}
      />,
    )
    expect(screen.getByText('Hello?')).toBeInTheDocument()
    expect(screen.getByText('Hi there.')).toBeInTheDocument()
  })

  it('disables send when input empty', () => {
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={() => {}}
      />,
    )
    expect(screen.getByTestId('chat-send')).toBeDisabled()
  })

  it('calls onSendMessage on Enter', async () => {
    const send = vi.fn()
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={send}
      />,
    )
    const ta = screen.getByTestId('chat-input')
    await userEvent.type(ta, 'hi there{Enter}')
    expect(send).toHaveBeenCalledWith('hi there')
  })

  it('Shift+Enter inserts a newline rather than sending', async () => {
    const send = vi.fn()
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={send}
      />,
    )
    const ta = screen.getByTestId('chat-input') as HTMLTextAreaElement
    await userEvent.type(ta, 'a{Shift>}{Enter}{/Shift}b')
    expect(send).not.toHaveBeenCalled()
    expect(ta.value).toBe('a\nb')
  })

  it('intercepts slash commands when handler is provided', async () => {
    const send = vi.fn()
    const slash = vi.fn().mockReturnValue({ consumed: true })
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={send}
        onSlashCommand={slash}
      />,
    )
    const ta = screen.getByTestId('chat-input')
    await userEvent.type(ta, '/help{Enter}')
    expect(slash).toHaveBeenCalledWith('/help')
    expect(send).not.toHaveBeenCalled()
  })

  it('falls through to onSendMessage when slash handler returns null', async () => {
    const send = vi.fn()
    const slash = vi.fn().mockReturnValue(null)
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={send}
        onSlashCommand={slash}
      />,
    )
    const ta = screen.getByTestId('chat-input')
    await userEvent.type(ta, '/unknown{Enter}')
    expect(send).toHaveBeenCalledWith('/unknown')
  })

  it('cancels stream on Esc when streaming', async () => {
    const cancel = vi.fn()
    const close = vi.fn()
    render(
      <ChatPanel
        open
        onClose={close}
        messages={[]}
        isStreaming
        onSendMessage={() => {}}
        onCancelStream={cancel}
      />,
    )
    await userEvent.keyboard('{Escape}')
    expect(cancel).toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
  })

  it('closes on Esc when not streaming', async () => {
    const close = vi.fn()
    render(
      <ChatPanel
        open
        onClose={close}
        messages={[]}
        onSendMessage={() => {}}
      />,
    )
    await userEvent.keyboard('{Escape}')
    expect(close).toHaveBeenCalled()
  })

  it('shows the empty state when there are no messages', () => {
    render(
      <ChatPanel
        open
        onClose={() => {}}
        messages={[]}
        onSendMessage={() => {}}
        emptyState={<div>nothing yet</div>}
      />,
    )
    expect(screen.getByText('nothing yet')).toBeInTheDocument()
  })
})
