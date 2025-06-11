import { useState, useCallback } from 'react'
import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

// Enhanced Error boundary component
export function ErrorBoundary({ children, fallback, onError }) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  )
}

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
    
    this.setState({ errorInfo })
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  logErrorToService = (error, errorInfo) => {
    // In production, send error to monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // Example: Send to error tracking service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }
      
      return (
        <div className="m-4 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>Something went wrong. Please try refreshing the page.</div>
              <div className="text-xs text-muted-foreground">
                Error ID: {this.state.errorId}
              </div>
              <button 
                onClick={this.handleRetry}
                className="mt-2 px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                Try Again
              </button>
            </AlertDescription>
          </Alert>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <details className="mt-2">
                  <summary className="cursor-pointer">Error Details (Development)</summary>
                  <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Toast notification system
export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...toast, id }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

// Toast component
export function Toast({ toast, onRemove }) {
  const icons = {
    success: CheckCircle,
    error: AlertTriangle,
    info: Info
  }
  
  const Icon = icons[toast.type] || Info
  
  return (
    <Alert className={`mb-2 ${toast.type === 'error' ? 'border-red-500' : ''}`}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex justify-between items-center">
        {toast.message}
        <button onClick={() => onRemove(toast.id)} className="ml-2">
          <X className="h-4 w-4" />
        </button>
      </AlertDescription>
    </Alert>
  )
}

// Loading spinner component
export function LoadingSpinner({ size = 'default' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  }
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
    </div>
  )
}

// API error handling hook
export function useApiRequest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { addToast } = useToast()

  const request = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiCall()
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      addToast({
        type: 'error',
        message: errorMessage
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [addToast])

  return { request, loading, error }
}
