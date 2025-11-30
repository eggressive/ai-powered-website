/**
 * Test Utilities
 * Common testing helpers and wrappers
 */

import { render } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Custom render function that wraps components with providers
 * Usage: const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => {
    // Add any providers here (Router, Theme, etc.)
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Mock fetch API
 */
export const mockFetch = (data, ok = true) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  )
}

/**
 * Create mock API response
 */
export const createMockResponse = (data, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  statusText: ok ? 'OK' : 'Internal Server Error',
  json: async () => data,
  text: async () => JSON.stringify(data),
})

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Mock console methods
 */
export const mockConsole = () => {
  const originalConsole = { ...console }

  beforeEach(() => {
    global.console = {
      ...console,
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    }
  })

  afterEach(() => {
    global.console = originalConsole
  })

  return () => global.console
}

/**
 * Create mock session data
 */
export const createMockSession = (overrides = {}) => ({
  sessionId: 'test-session-123',
  startTime: new Date('2025-01-01T00:00:00Z'),
  pageViews: 1,
  clickCount: 0,
  scrollDepth: 0,
  timeOnPage: 0,
  ...overrides,
})

/**
 * Create mock prediction data
 */
export const createMockPrediction = (overrides = {}) => ({
  primaryIntent: 'Information',
  confidence: 85.5,
  secondaryIntents: [
    { intent: 'Research', confidence: 45.2 },
    { intent: 'Learning', confidence: 35.8 },
  ],
  factors: [
    {
      factor: 'Time Patterns',
      description: 'Extended session duration indicates learning intent',
      weight: 'High',
    },
  ],
  ...overrides,
})

/**
 * Create mock event data
 */
export const createMockEvent = (overrides = {}) => ({
  eventId: 'event-123',
  sessionId: 'test-session-123',
  eventType: 'click',
  timestamp: new Date('2025-01-01T00:00:00Z'),
  pageUrl: 'http://localhost:3000/',
  ...overrides,
})

// Re-export testing library utilities
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
