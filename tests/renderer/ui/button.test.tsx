import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  FocusHeading,
  IconButton,
  SemanticIcon,
  SkipLink,
  SkipTarget,
  StatusMessage,
  TextField
} from '../../../src/renderer/src/ui'

describe('shared UI primitives', () => {
  it('exposes a native disabled action and ignores a pointer click', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <Button disabled onClick={onClick}>
        Save changes
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Save changes' })
    expect(button).toBeDisabled()

    await user.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not invoke a disabled action on Enter', () => {
    const onClick = vi.fn()

    render(
      <Button disabled onClick={onClick}>
        Save changes
      </Button>
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Save changes' }), {
      key: 'Enter'
    })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not invoke a disabled action on Space', () => {
    const onClick = vi.fn()

    render(
      <Button disabled onClick={onClick}>
        Save changes
      </Button>
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Save changes' }), {
      key: ' '
    })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('associates field help and errors without relying on color', () => {
    render(
      <TextField
        label="Project name"
        hint="Shown in the workspace switcher."
        error="Enter a project name."
        defaultValue=""
      />
    )

    const field = screen.getByRole('textbox', { name: 'Project name' })
    expect(field).toHaveAccessibleDescription(
      'Shown in the workspace switcher. Enter a project name.'
    )
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a project name.')
  })

  it('provides status, focus orientation, skip target, and semantic icon names', () => {
    render(
      <>
        <SkipLink targetId="workspace-content">Skip to workspace content</SkipLink>
        <SkipTarget id="workspace-content">
          <FocusHeading focusOnMount>Overview</FocusHeading>
          <StatusMessage>Workspace updated.</StatusMessage>
          <SemanticIcon label="Active sessions">
            <svg />
          </SemanticIcon>
          <SemanticIcon decorative>
            <svg data-testid="decorative-icon" />
          </SemanticIcon>
        </SkipTarget>
      </>
    )

    expect(screen.getByRole('heading', { name: 'Overview' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('img', { name: 'Active sessions' })).toBeInTheDocument()
    expect(screen.getByTestId('decorative-icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(screen.getByRole('link', { name: 'Skip to workspace content' })).toHaveAttribute(
      'href',
      '#workspace-content'
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'workspace-content')
  })

  it('requires an accessible name for an icon-only button and exposes expansion', () => {
    render(
      <IconButton aria-expanded="false" aria-label="Open Design Lab">
        <SemanticIcon decorative>
          <svg />
        </SemanticIcon>
      </IconButton>
    )

    expect(screen.getByRole('button', { name: 'Open Design Lab' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })
})
