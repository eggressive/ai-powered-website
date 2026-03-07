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
    let originalFetch

    beforeEach(() => {
      originalFetch = global.fetch
      global.fetch = vi.fn()
    })

    afterEach(() => {
      global.fetch = originalFetch
    })

    it('prepends API_BASE_URL to the path', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch, API_BASE_URL } = await import('../api.js')
      await apiFetch('/session/start', { method: 'POST', body: '{}' })

      const base = API_BASE_URL.replace(/\/+$/, '')
      expect(global.fetch).toHaveBeenCalledWith(
        `${base}/session/start`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('normalizes URL when base has trailing slash and path has no leading slash', async () => {
      const { apiFetch, API_BASE_URL } = await import('../api.js')
      global.fetch.mockResolvedValueOnce({ ok: true })

      await apiFetch('session/start')

      const base = API_BASE_URL.replace(/\/+$/, '')
      const calledUrl = global.fetch.mock.calls[0][0]
      expect(calledUrl).toBe(`${base}/session/start`)
      // Ensure no double slashes in path portion
      const urlPath = new URL(calledUrl).pathname
      expect(urlPath).not.toMatch(/\/\//)
    })

    it('sets Content-Type to application/json when body is present', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      await apiFetch('/test', { method: 'POST', body: JSON.stringify({ a: 1 }) })

      const callHeaders = global.fetch.mock.calls[0][1].headers
      expect(callHeaders.get('Content-Type')).toBe('application/json')
    })

    it('does not set Content-Type when there is no body', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      await apiFetch('/test', { method: 'GET' })

      const callHeaders = global.fetch.mock.calls[0][1].headers
      expect(callHeaders.has('Content-Type')).toBe(false)
    })

    it('does not override an existing Content-Type header', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      await apiFetch('/test', {
        method: 'POST',
        body: 'raw',
        headers: { 'Content-Type': 'text/plain' }
      })

      const callHeaders = global.fetch.mock.calls[0][1].headers
      expect(callHeaders.get('Content-Type')).toBe('text/plain')
    })

    it('preserves Headers instances passed as options.headers', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      const inputHeaders = new Headers({ 'X-Custom': 'value' })
      await apiFetch('/test', {
        method: 'POST',
        body: '{}',
        headers: inputHeaders
      })

      const callHeaders = global.fetch.mock.calls[0][1].headers
      expect(callHeaders.get('X-Custom')).toBe('value')
      expect(callHeaders.get('Content-Type')).toBe('application/json')
    })

    it('preserves tuple array headers', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true })

      const { apiFetch } = await import('../api.js')
      await apiFetch('/test', {
        method: 'POST',
        body: '{}',
        headers: [['X-Token', 'abc123']]
      })

      const callHeaders = global.fetch.mock.calls[0][1].headers
      expect(callHeaders.get('X-Token')).toBe('abc123')
    })

    it('throws on non-ok response with status', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 })

      const { apiFetch } = await import('../api.js')

      await expect(apiFetch('/missing')).rejects.toThrow('API error: 404')
    })

    it('returns the response on success', async () => {
      const fakeResponse = { ok: true, json: () => Promise.resolve({ id: 1 }) }
      global.fetch.mockResolvedValueOnce(fakeResponse)

      const { apiFetch } = await import('../api.js')
      const res = await apiFetch('/data')

      expect(res).toBe(fakeResponse)
    })
  })
})
