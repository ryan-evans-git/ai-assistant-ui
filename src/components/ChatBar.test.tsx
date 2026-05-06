import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ChatBar } from './ChatBar'

describe('<ChatBar />', () => {
  it('fires onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<ChatBar onClick={onClick} />)
    await userEvent.click(screen.getByTestId('chat-bar'))
    expect(onClick).toHaveBeenCalled()
  })

  it('reflects open=true via aria-expanded', () => {
    render(<ChatBar onClick={() => {}} open />)
    const bar = screen.getByTestId('chat-bar')
    expect(bar).toHaveAttribute('aria-expanded', 'true')
    expect(bar.className).toMatch(/aaui-bar--open/)
  })

  it('honors custom placeholder', () => {
    render(<ChatBar onClick={() => {}} placeholder="What's on your mind?" />)
    expect(screen.getByText("What's on your mind?")).toBeInTheDocument()
  })
})
