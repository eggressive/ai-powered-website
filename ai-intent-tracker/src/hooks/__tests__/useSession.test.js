import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from '../useSession'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create a successful session response
const createSessionResponse = (overrides = {}) => ({
  session_id: 'test-session-123',
  start_time: new Date().toISOString(),
  ...overrides
})

describe('useSession Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    
    // Set up default successful mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createSessionResponse())
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      // Render with autoInit: false to prevent auto-initialization
      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      expect(result.current.session).toEqual({
        sessionId: null,
        startTime: null,
        pageViews: 1,
        clickCount: 0,
        scrollDepth: 0,
        timeOnPage: 0
      })
      expect(result.current.isConnected).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should initialize session on mount when autoInit is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createSessionResponse())
      })

      const { result } = renderHook(() => useSession({}, { autoInit: true }))

      // Initial state should show loading
      expect(result.current.isLoading).toBe(true)

      // Wait for session initialization
      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/session/start'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should send correct device info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createSessionResponse())
      })

      renderHook(() => useSession({}, { autoInit: true }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const fetchCall = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.device_info).toBeDefined()
      expect(requestBody.device_info).toHaveProperty('user_agent')
      expect(requestBody.device_info).toHaveProperty('screen_width')
      expect(requestBody.device_info).toHaveProperty('screen_height')
      expect(requestBody.device_info).toHaveProperty('device_type')
    })

    it('should include initial consent in session start', async () => {
      const initialConsent = { analytics: true, marketing: true }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createSessionResponse())
      })

      renderHook(() => useSession(initialConsent, { autoInit: true }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const fetchCall = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.consent_status.analytics).toBe(true)
      expect(requestBody.consent_status.marketing).toBe(true)
    })

    it('should not auto-initialize when autoInit is false', () => {
      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      // With autoInit: false, initialization should not occur synchronously
      expect(result.current.session.sessionId).toBe(null)
      expect(result.current.isConnected).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useSession({}, { autoInit: true }))

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const { result } = renderHook(() => useSession({}, { autoInit: true }))

      await waitFor(() => {
        expect(result.current.error).toBe('HTTP error! status: 500')
      })

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('Session Updates', () => {
    it('should track clicks correctly', async () => {
      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      act(() => {
        result.current.trackClick()
      })

      expect(result.current.session.clickCount).toBe(1)

      act(() => {
        result.current.trackClick()
        result.current.trackClick()
      })

      expect(result.current.session.clickCount).toBe(3)
    })

    it('should update scroll depth correctly', () => {
      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      act(() => {
        result.current.updateScrollDepth(25)
      })

      expect(result.current.session.scrollDepth).toBe(25)

      // Should keep the max scroll depth
      act(() => {
        result.current.updateScrollDepth(50)
      })

      expect(result.current.session.scrollDepth).toBe(50)

      // Should not decrease scroll depth
      act(() => {
        result.current.updateScrollDepth(30)
      })

      expect(result.current.session.scrollDepth).toBe(50)
    })

    it('should send session updates to backend', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createSessionResponse())
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ updated: true })
        })

      const { result } = renderHook(() => useSession({}, { autoInit: true }))

      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      })

      await act(async () => {
        await result.current.updateSession({ customData: 'test' })
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/session/update'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('Time Tracking', () => {
    it('should update time on page periodically', async () => {
      vi.useFakeTimers()
      const startTime = new Date('2025-01-01T00:00:00Z')
      vi.setSystemTime(startTime)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session_id: 'test-session-123',
          start_time: startTime.toISOString()
        })
      })

      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      // Manually initialize
      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.session.sessionId).toBe('test-session-123')

      // Advance time by 5 seconds
      vi.setSystemTime(new Date('2025-01-01T00:00:05Z'))
      
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.session.timeOnPage).toBeGreaterThanOrEqual(5)
    })

    it('should calculate time correctly with manual updateTimeOnPage call', async () => {
      vi.useFakeTimers()
      const startTime = new Date('2025-01-01T00:00:00Z')
      vi.setSystemTime(startTime)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session_id: 'test-session-123',
          start_time: startTime.toISOString()
        })
      })

      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      // Manually initialize
      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.session.sessionId).toBe('test-session-123')

      // Advance time by 10 seconds
      vi.setSystemTime(new Date('2025-01-01T00:00:10Z'))
      
      act(() => {
        result.current.updateTimeOnPage()
      })

      expect(result.current.session.timeOnPage).toBe(10)
    })

    it('should cleanup interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createSessionResponse())
      })

      const { result, unmount } = renderHook(() => useSession({}, { autoInit: true }))

      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      })

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })
  })

  describe('Consent Management', () => {
    it('should update consent locally', async () => {
      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      await act(async () => {
        await result.current.updateConsent('analytics', true)
      })

      expect(result.current.consent.analytics).toBe(true)
    })

    it('should send consent update to backend when session exists', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createSessionResponse())
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ updated: true })
        })

      const { result } = renderHook(() => useSession({}, { autoInit: true }))

      await waitFor(() => {
        expect(result.current.session.sessionId).toBe('test-session-123')
      })

      await act(async () => {
        await result.current.updateConsent('marketing', true)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/privacy/consent'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('Manual Initialization', () => {
    it('should allow manual initialization with autoInit false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createSessionResponse())
      })

      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      // Initially not initialized
      expect(result.current.session.sessionId).toBe(null)

      // Manually trigger initialization
      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.session.sessionId).toBe('test-session-123')
      expect(result.current.isConnected).toBe(true)
    })

    it('should allow re-initialization', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ session_id: 'session-1', start_time: new Date().toISOString() })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ session_id: 'session-2', start_time: new Date().toISOString() })
        })

      const { result } = renderHook(() => useSession({}, { autoInit: false }))

      // First initialization
      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.session.sessionId).toBe('session-1')

      // Re-initialize
      await act(async () => {
        await result.current.initializeSession()
      })

      expect(result.current.session.sessionId).toBe('session-2')
    })
  })
})
