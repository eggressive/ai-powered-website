import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to test apiFetch in isolation, so we dynamically import after
// setting up the env variable mock.

describe('api utility', () => {
  describe('API_BASE_URL', () => {
    it('falls back to window.location.origin + /api when VITE_API_BASE_URL is not set', async () => {
      // Default import (env var is empty in test)
      const { API_BASE_URL } = await import('../api.js')
      // In jsdom window.location.origin is 'http://localhost:3000' (or similar)
      expect(API_BASE_URL).toContain('/api')
    })
  })

  describe('apiFetch', () => {
    const mockFetch = vi.fn()

    beforeEach(() => {
      mockFetch.mockClear()
      global.fetch = mockFetch
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('prepends API_BASE_URL to the path', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch, API_BASE_URL } = await import('../api.js')
      await apiFetch('/session/start', { method: 'POST', body: '{}' })

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/session/start`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('sets Content-Type to application/json when body is present', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      await apiFetch('/test', { method: 'POST', body: JSON.stringify({ a: 1 }) })

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders['Content-Type']).toBe('application/json')
    })

    it('does not override an existing Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      await apiFetch('/test', {
        method: 'POST',
        body: 'raw',
        headers: { 'Content-Type': 'text/plain' }
      })

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders['Content-Type']).toBe('text/plain')
    })

    it('throws on non-ok response with status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

      const { apiFetch } = await import('../api.js')

      await expect(apiFetch('/missing')).rejects.toThrow('API error: 404')
    })

    it('returns the response on success', async () => {
      const fakeResponse = { ok: true, json: () => Promise.resolve({ id: 1 }) }
      mockFetch.mockResolvedValueOnce(fakeResponse)

      const { apiFetch } = await import('../api.js')
      const res = await apiFetch('/data')

      expect(res).toBe(fakeResponse)
    })
  })
})
