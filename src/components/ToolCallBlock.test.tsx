import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ToolCallBlock } from './ToolCallBlock'

describe('<ToolCallBlock />', () => {
  it('renders pending status when no result', () => {
    render(
      <ToolCallBlock
        toolUse={{
          type: 'tool_use',
          id: 'tu_1',
          name: 'do_something',
          input: { x: 1 },
        }}
      />,
    )
    expect(screen.getByText('do_something')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('renders ok status with result content', async () => {
    render(
      <ToolCallBlock
        toolUse={{ type: 'tool_use', id: 'tu_1', name: 'echo', input: { x: 1 } }}
        result={{
          type: 'tool_result',
          tool_use_id: 'tu_1',
          content: 'hello',
        }}
        compact={false}
      />,
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders error status when isError=true', () => {
    render(
      <ToolCallBlock
        toolUse={{ type: 'tool_use', id: 'tu_1', name: 'broken', input: {} }}
        result={{
          type: 'tool_result',
          tool_use_id: 'tu_1',
          content: 'boom',
          isError: true,
        }}
        compact={false}
      />,
    )
    expect(screen.getByText('error')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('toggles open/closed on header click', async () => {
    render(
      <ToolCallBlock
        toolUse={{ type: 'tool_use', id: 'tu_1', name: 'echo', input: { x: 1 } }}
      />,
    )
    // Compact: input not visible until expanded.
    expect(screen.queryByText(/"x": 1/)).toBeNull()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/"x": 1/)).toBeInTheDocument()
  })
})
