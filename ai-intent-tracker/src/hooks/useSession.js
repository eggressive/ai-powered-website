import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generate a unique session ID
 * Uses crypto.randomUUID() when available for better randomness
 * Falls back to Math.random() for older browsers
 */
const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID().replace(/-/g, '').slice(0, 9)}`
  }
  return `sess_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get the API base URL from window location or default
 */
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api'
  }
  return '/api'
}

/**
 * Custom hook for session management with tracking capabilities
 * 
 * @param {Object} initialConsent - Initial privacy consent settings
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoInit - Whether to auto-initialize session on mount (default: true)
 * @returns {Object} Session state and methods
 */
export function useSession(initialConsent = {}, { autoInit = true } = {}) {
  const [session, setSession] = useState({
    sessionId: null,
    startTime: null,
    pageViews: 1,
    clickCount: 0,
    scrollDepth: 0,
    timeOnPage: 0
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [consent, setConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
    ...initialConsent
  })
  
  // Use ref for startTime to avoid re-renders affecting time calculations
  const startTimeRef = useRef(null)
  const intervalRef = useRef(null)
  
  /**
   * Initialize a new session with the backend
   */
  const initializeSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const sessionId = generateSessionId()
      const apiBaseUrl = getApiBaseUrl()
      
      const response = await fetch(`${apiBaseUrl}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          device_info: {
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
            screen_height: typeof window !== 'undefined' ? window.screen.height : 0,
            device_type: typeof window !== 'undefined' 
              ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
              : 'unknown'
          },
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          consent_status: consent
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const sessionData = await response.json()
      const startTime = new Date(sessionData.start_time)
      startTimeRef.current = startTime
      
      setSession(prev => ({
        ...prev,
        sessionId: sessionData.session_id,
        startTime
      }))
      setIsConnected(true)
      setIsLoading(false)
      
      return sessionData
    } catch (err) {
      console.error('Failed to initialize session:', err)
      setError(err.message || 'Failed to initialize session')
      setIsConnected(false)
      setIsLoading(false)
      throw err
    }
  }, [consent])
  
  /**
   * Update time on page based on start time
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
   * Track a click event
   */
  const trackClick = useCallback(() => {
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
   * Update consent settings
   */
  const updateConsent = useCallback(async (category, value) => {
    const newConsent = {
      ...consent,
      [category]: value
    }
    
    setConsent(newConsent)
    
    // Update consent with backend if session exists
    if (session.sessionId) {
      try {
        const apiBaseUrl = getApiBaseUrl()
        await fetch(`${apiBaseUrl}/privacy/consent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: session.sessionId,
            consent: newConsent
          })
        })
      } catch (err) {
        console.error('Failed to update consent:', err)
      }
    }
    
    return newConsent
  }, [consent, session.sessionId])
  
  /**
   * Update session data with the backend
   */
  const updateSession = useCallback(async (sessionData) => {
    if (!session.sessionId) return
    
    try {
      const apiBaseUrl = getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/session/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.sessionId,
          ...sessionData
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (err) {
      console.error('Failed to update session:', err)
      throw err
    }
  }, [session.sessionId])
  
  /**
   * End the current session
   */
  const endSession = useCallback(async () => {
    if (!session.sessionId) return
    
    try {
      const apiBaseUrl = getApiBaseUrl()
      await fetch(`${apiBaseUrl}/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.sessionId,
          end_time: new Date().toISOString(),
          final_stats: {
            timeOnPage: session.timeOnPage,
            clickCount: session.clickCount,
            scrollDepth: session.scrollDepth
          }
        })
      })
    } catch (err) {
      console.error('Failed to end session:', err)
    }
  }, [session])
  
  // Auto-initialize session on mount if autoInit is true
  useEffect(() => {
    if (autoInit) {
      // We catch the error here because initializeSession already handles errors
      // and sets the error state, but we need to prevent unhandled promise rejection
      initializeSession().catch(() => {
        // Error already handled in initializeSession
      })
    }
  }, [autoInit, initializeSession])
  
  // Set up time tracking interval
  useEffect(() => {
    if (session.sessionId) {
      intervalRef.current = setInterval(() => {
        updateTimeOnPage()
      }, 1000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [session.sessionId, updateTimeOnPage])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  
  return {
    session,
    isConnected,
    isLoading,
    error,
    consent,
    initializeSession,
    updateTimeOnPage,
    trackClick,
    updateScrollDepth,
    updateConsent,
    updateSession,
    endSession
  }
}

export default useSession
