/**
 * Shared API configuration for ai-intent-tracker.
 *
 * Uses VITE_API_BASE_URL when set (e.g. in .env or CI),
 * otherwise falls back to window.location.origin + '/api'
 * so the Vite dev-server proxy keeps working out of the box.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api')

/**
 * Thin wrapper around fetch that prepends API_BASE_URL
 * and sets JSON headers for POST/PUT/PATCH.
 *
 * @param {string} path  - API path, e.g. '/session/start'
 * @param {RequestInit} [options] - fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  // Normalize URL joining: strip trailing slash from base, ensure leading slash on path
  const base = API_BASE_URL.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${normalizedPath}`

  // Normalize headers: support Headers instances, tuple arrays, and plain objects
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const err = new Error(`API error: ${response.status}`)
    err.status = response.status
    throw err
  }

  return response
}
