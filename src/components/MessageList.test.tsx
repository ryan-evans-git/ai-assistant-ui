import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MessageList } from './MessageList'
import type { ChatMessage } from '../types'

describe('<MessageList />', () => {
  it('renders text + tool_use + tool_result, pairing by id', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        blocks: [
          { type: 'text', text: 'I will search.' },
          {
            type: 'tool_use',
            id: 'tu_1',
            name: 'tool_search',
            input: { query: 'pet' },
          },
        ],
      },
      {
        id: '2',
        role: 'user',
        blocks: [
          {
            type: 'tool_result',
            tool_use_id: 'tu_1',
            content: '- get_pet: Find pet by ID',
          },
        ],
      },
    ]
    render(<MessageList messages={messages} />)
    expect(screen.getByText('I will search.')).toBeInTheDocument()
    expect(screen.getByText('tool_search')).toBeInTheDocument()
    // Tool result is rendered inside the ToolCallBlock, not as a
    // standalone message — so the user-row container shouldn't
    // render anything for it.
    const userRow = screen.queryByTestId('message-user')
    expect(userRow).toBeNull()
  })

  it('renders the loading skeleton when isLoading', () => {
    render(<MessageList messages={[]} isLoading />)
    const list = screen.getByTestId('message-list')
    expect(list).toHaveClass('aaui-list--loading')
  })

  it('renders default empty state when messages is empty', () => {
    render(<MessageList messages={[]} />)
    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument()
  })

  it('shows a streaming cursor on streaming text blocks', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        blocks: [{ type: 'text', text: 'thinking', streaming: true }],
      },
    ]
    const { container } = render(<MessageList messages={messages} isStreaming />)
    expect(container.querySelector('.aaui-cursor')).not.toBeNull()
  })
})
