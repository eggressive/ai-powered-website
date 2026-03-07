import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ErrorBoundary } from '../useErrorHandling.jsx'

// A component that throws on demand
function ThrowingChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test explosion')
  }
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  // Suppress React error boundary console.error noise in test output
  const originalConsoleError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalConsoleError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders default fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/try again/i)).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const fallback = (error) => <div>Custom: {error.message}</div>

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom: Test explosion')).toBeInTheDocument()
  })

  it('calls onError callback when a child throws', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test explosion' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('recovers when Try Again is clicked', () => {
    // Use real React state so clicking Try Again (which calls setState
    // inside ErrorBoundary) re-renders the child without remounting.
    let throwControl = { shouldThrow: true }

    function StatefulChild() {
      if (throwControl.shouldThrow) {
        throw new Error('Test explosion')
      }
      return <div>All good</div>
    }

    render(
      <ErrorBoundary>
        <StatefulChild />
      </ErrorBoundary>
    )

    // Error boundary shows fallback
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    // Stop the child from throwing, then click Try Again
    throwControl.shouldThrow = false
    fireEvent.click(screen.getByText(/try again/i))

    // ErrorBoundary resets its state and re-renders children successfully
    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})
