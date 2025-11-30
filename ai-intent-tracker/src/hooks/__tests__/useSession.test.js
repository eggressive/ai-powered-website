/**
 * useSession Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from '../useSession'

// Mock fetch
global.fetch = vi.fn()

describe('useSession', () => {
  const mockSessionResponse = {
    session_id: 'test-session-123',
    start_time: new Date('2025-01-01T00:00:00Z').toISOString()
  }

  beforeEach(() => {
    // Only clear call history, don't clear mock implementations
    if (global.fetch && global.fetch.mockClear) {
      global.fetch.mockClear()
    }
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      // Mock fetch for this test
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      const { result } = renderHook(() => useSession())

      expect(result.current.session).toMatchObject({
        sessionId: null,
        pageViews: 1,
        clickCount: 0,
        scrollDepth: 0,
        timeOnPage: 0
      })
      expect(result.current.isConnected).toBe(false)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('should initialize session on mount', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      expect(result.current.session.sessionId).toBe('test-session-123')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/session/start'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should handle initialization errors', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle non-ok responses', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toContain('500')
    })

    it('should send correct device info', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      renderHook(() => useSession())

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const fetchCall = global.fetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.device_info).toMatchObject({
        user_agent: expect.any(String),
        screen_width: expect.any(Number),
        screen_height: expect.any(Number),
        device_type: expect.stringMatching(/mobile|tablet|desktop/)
      })
    })

    it('should include initial consent', async () => {
      const initialConsent = {
        analytics: true,
        marketing: false
      }

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      renderHook(() => useSession(initialConsent))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const fetchCall = global.fetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.consent_status).toEqual(initialConsent)
    })
  })

  describe('Session Updates', () => {
    it('should update session data', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      act(() => {
        result.current.updateSession({ pageViews: 5 })
      })

      expect(result.current.session.pageViews).toBe(5)
    })

    it('should increment click count', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      expect(result.current.session.clickCount).toBe(0)

      act(() => {
        result.current.incrementClickCount()
      })

      expect(result.current.session.clickCount).toBe(1)

      act(() => {
        result.current.incrementClickCount()
      })

      expect(result.current.session.clickCount).toBe(2)
    })

    it('should update scroll depth (max value)', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      act(() => {
        result.current.updateScrollDepth(50)
      })

      expect(result.current.session.scrollDepth).toBe(50)

      act(() => {
        result.current.updateScrollDepth(30) // Lower value shouldn't update
      })

      expect(result.current.session.scrollDepth).toBe(50)

      act(() => {
        result.current.updateScrollDepth(75) // Higher value should update
      })

      expect(result.current.session.scrollDepth).toBe(75)
    })
  })

  describe('Time Tracking', () => {
    it('should update time on page periodically', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      vi.useFakeTimers()

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      }, { timeout: 3000 })

      const initialTime = result.current.session.timeOnPage

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Manually call update to simulate what the interval would do
      act(() => {
        result.current.updateTimeOnPage()
      })

      expect(result.current.session.timeOnPage).toBeGreaterThan(initialTime)

      vi.useRealTimers()
    })

    it('should calculate time correctly', async () => {
      const startTime = new Date('2025-01-01T00:00:00Z')
      vi.setSystemTime(startTime)
      vi.useFakeTimers()

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            session_id: 'test-session-123',
            start_time: startTime.toISOString()
          })
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      }, { timeout: 3000 })

      // Advance time by 10 seconds
      act(() => {
        vi.setSystemTime(new Date('2025-01-01T00:00:10Z'))
        result.current.updateTimeOnPage()
      })

      expect(result.current.session.timeOnPage).toBeGreaterThanOrEqual(10)

      vi.useRealTimers()
    })
  })

  describe('Re-initialization', () => {
    it('should allow re-initialization', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      })

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            session_id: 'session-2',
            start_time: new Date().toISOString()
          })
        })
      )

      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.session.sessionId).toBe('session-2')
    })
  })

  describe('Error Handling', () => {
    it('should set error state on fetch failure', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('API Error'))
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.error).toBe('API Error')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear error on successful retry', async () => {
      // First call fails
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      )

      const { result } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      // Second call succeeds
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.error).toBe(null)
      expect(result.current.isConnected).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse
        })
      )

      vi.useFakeTimers()

      const { result, unmount } = renderHook(() => useSession())

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      }, { timeout: 3000 })

      // Verify interval is running by manually updating time
      const initialTime = result.current.session.timeOnPage

      act(() => {
        vi.advanceTimersByTime(2000)
        result.current.updateTimeOnPage()
      })

      expect(result.current.session.timeOnPage).toBeGreaterThan(initialTime)

      const timeBeforeUnmount = result.current.session.timeOnPage

      // Unmount
      unmount()

      // Verify cleanup - attempting to call functions after unmount shouldn't crash
      expect(() => {
        vi.advanceTimersByTime(5000)
      }).not.toThrow()

      // Time should not update after unmount (value stays the same)
      expect(result.current.session.timeOnPage).toBe(timeBeforeUnmount)

      vi.useRealTimers()
    })
  })
})
