/**
 * useSession Hook
 * Manages user session state and initialization
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import ENV from '@/config/env'

const API_BASE_URL = ENV.API_BASE_URL

export function useSession(initialConsent = {}) {
  const [session, setSession] = useState({
    sessionId: null,
    startTime: new Date(),
    pageViews: 1,
    clickCount: 0,
    scrollDepth: 0,
    timeOnPage: 0
  })

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use ref to track start time to avoid dependency issues
  const startTimeRef = useRef(new Date())

  /**
   * Initialize session with backend
   */
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          device_info: {
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
          },
          referrer: document.referrer,
          consent_status: initialConsent
        })
      })

      if (response.ok) {
        const sessionData = await response.json()
        const newStartTime = new Date(sessionData.start_time)
        startTimeRef.current = newStartTime

        setSession(prev => ({
          ...prev,
          sessionId: sessionData.session_id,
          startTime: newStartTime
        }))
        setIsConnected(true)
      } else {
        throw new Error(`Session initialization failed: ${response.status}`)
      }
    } catch (err) {
      console.error('Failed to initialize session:', err)
      setError(err.message)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [initialConsent])

  /**
   * Update time on page
   */
  const updateTimeOnPage = useCallback(() => {
    if (startTimeRef.current) {
      const timeOnPage = Math.floor((new Date() - startTimeRef.current) / 1000)
      setSession(prev => ({
        ...prev,
        timeOnPage
      }))
    }
  }, [])

  /**
   * Update session data
   */
  const updateSession = useCallback((updates) => {
    setSession(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  /**
   * Increment click count
   */
  const incrementClickCount = useCallback(() => {
    setSession(prev => ({
      ...prev,
      clickCount: prev.clickCount + 1
    }))
  }, [])

  /**
   * Update scroll depth
   */
  const updateScrollDepth = useCallback((depth) => {
    setSession(prev => ({
      ...prev,
      scrollDepth: Math.max(prev.scrollDepth, depth)
    }))
  }, [])

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  /**
   * Track scroll events
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.floor(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )
      const newScrollDepth = Math.max(session.scrollDepth, scrollPercent)

      if (newScrollDepth !== session.scrollDepth) {
        updateScrollDepth(newScrollDepth)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [session.scrollDepth, updateScrollDepth])

  /**
   * Update time on page periodically
   */
  useEffect(() => {
    if (!session.sessionId) return

    const interval = setInterval(updateTimeOnPage, 1000) // Update every second
    return () => clearInterval(interval)
  }, [session.sessionId, updateTimeOnPage])

  return {
    session,
    isConnected,
    isLoading,
    error,
    initializeSession,
    updateSession,
    incrementClickCount,
    updateScrollDepth,
    updateTimeOnPage
  }
}
