/**
 * Environment Configuration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Clear module cache to get fresh ENV on each test
    vi.resetModules()
  })

  it('should have default API_BASE_URL', async () => {
    const { default: ENV } = await import('../env.js')
    expect(ENV.API_BASE_URL).toBeDefined()
    expect(typeof ENV.API_BASE_URL).toBe('string')
  })

  it('should parse boolean feature flags correctly', async () => {
    const { default: ENV } = await import('../env.js')
    expect(typeof ENV.ENABLE_ANALYTICS).toBe('boolean')
    expect(typeof ENV.ENABLE_DEBUG).toBe('boolean')
    expect(typeof ENV.ENABLE_CONSENT_BANNER).toBe('boolean')
  })

  it('should parse numeric values correctly', async () => {
    const { default: ENV } = await import('../env.js')
    expect(typeof ENV.API_TIMEOUT).toBe('number')
    expect(typeof ENV.ANALYTICS_UPDATE_INTERVAL).toBe('number')
    expect(typeof ENV.SESSION_TIMEOUT).toBe('number')
    expect(ENV.API_TIMEOUT).toBeGreaterThan(0)
  })

  it('should have correct environment mode', async () => {
    const { default: ENV } = await import('../env.js')
    expect(ENV.MODE).toBeDefined()
    expect(typeof ENV.IS_DEV).toBe('boolean')
    expect(typeof ENV.IS_PROD).toBe('boolean')
  })

  it('should have application info', async () => {
    const { default: ENV } = await import('../env.js')
    expect(ENV.APP_NAME).toBeDefined()
    expect(ENV.APP_VERSION).toBeDefined()
    expect(ENV.APP_DESCRIPTION).toBeDefined()
  })

  it('should have valid log level', async () => {
    const { default: ENV } = await import('../env.js')
    const validLevels = ['debug', 'info', 'warn', 'error']
    expect(validLevels).toContain(ENV.LOG_LEVEL)
  })
})
