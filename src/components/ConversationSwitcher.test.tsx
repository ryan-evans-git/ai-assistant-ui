import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConversationSwitcher } from './ConversationSwitcher'

const SAMPLE = [
  { id: 'a', title: 'Past-due invoices' },
  { id: 'b', title: 'Q1 wrap-up' },
]

describe('ConversationSwitcher', () => {
  it('shows the current conversation title in the trigger', () => {
    render(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId="a"
      />,
    )
    const trigger = screen.getByTestId('conversation-switcher-trigger')
    expect(trigger).toHaveTextContent('Past-due invoices')
  })

  it('falls back to "New conversation" label when nothing is selected', () => {
    render(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId={null}
      />,
    )
    expect(
      screen.getByTestId('conversation-switcher-trigger'),
    ).toHaveTextContent('New conversation')
  })

  it('opens the menu and lists every conversation', async () => {
    const user = userEvent.setup()
    render(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId="a"
      />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    const menu = screen.getByTestId('conversation-switcher-menu')
    expect(menu).toHaveTextContent('Past-due invoices')
    expect(menu).toHaveTextContent('Q1 wrap-up')
    expect(menu).toHaveTextContent('New conversation')
  })

  it('fires onNewConversation when "+ New" is clicked', async () => {
    const onNew = vi.fn()
    const user = userEvent.setup()
    render(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId="a"
        onNewConversation={onNew}
      />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    await user.click(screen.getByText('New conversation'))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('fires onSelectConversation when a row is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId="a"
        onSelectConversation={onSelect}
      />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    await user.click(screen.getByText('Q1 wrap-up'))
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('renders a delete button only when onDeleteConversation is provided', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId="a"
      />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    expect(screen.queryByLabelText(/^Delete /)).toBeNull()
    rerender(
      <ConversationSwitcher
        conversations={SAMPLE}
        currentConversationId="a"
        onDeleteConversation={onDelete}
      />,
    )
    // Trigger again because the menu closes on rerender? No — open
    // state is internal but persists across rerenders.  The delete
    // button's opacity is 0 by default but still in the tree.
    const deleteBtn = screen.getAllByLabelText(/^Delete /)[0]
    await user.click(deleteBtn)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows an empty-state row when no conversations exist', async () => {
    const user = userEvent.setup()
    render(
      <ConversationSwitcher conversations={[]} currentConversationId={null} />,
    )
    await user.click(screen.getByTestId('conversation-switcher-trigger'))
    expect(screen.getByText('No conversations yet')).toBeInTheDocument()
  })
})
