import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfirmToolCall } from './ConfirmToolCall'

describe('<ConfirmToolCall />', () => {
  it('renders nothing when request is null', () => {
    const { container } = render(
      <ConfirmToolCall request={null} onResolve={() => {}} />,
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders the tool surface and surfaces both buttons', () => {
    render(
      <ConfirmToolCall
        request={{
          toolUseId: 'tu_1',
          toolName: 'create_widget',
          toolDescription: 'Creates a widget.',
          toolInput: { name: 'wedge' },
        }}
        onResolve={() => {}}
      />,
    )
    expect(screen.getByText('create_widget')).toBeInTheDocument()
    expect(screen.getByText('Creates a widget.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
  })

  it('calls onResolve with confirm + note', async () => {
    const onResolve = vi.fn()
    render(
      <ConfirmToolCall
        request={{
          toolUseId: 'tu_1',
          toolName: 'do_thing',
          toolInput: {},
        }}
        onResolve={onResolve}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'looks good')
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ toolUseId: 'tu_1' }),
      'confirm',
      'looks good',
    )
  })

  it('calls onResolve with decline + null note when blank', async () => {
    const onResolve = vi.fn()
    render(
      <ConfirmToolCall
        request={{ toolUseId: 'tu_1', toolName: 'do_thing', toolInput: {} }}
        onResolve={onResolve}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /decline/i }))
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ toolUseId: 'tu_1' }),
      'decline',
      null,
    )
  })
})
