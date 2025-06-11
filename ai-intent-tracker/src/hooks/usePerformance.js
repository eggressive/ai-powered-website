import { memo, useMemo, useCallback, useState, useEffect } from 'react'

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiCalls: 0,
    errorCount: 0
  })

  const startTimer = useCallback(() => {
    return performance.now()
  }, [])

  const endTimer = useCallback((startTime, operation) => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (duration > 100) { // Log slow operations
      console.warn(`Slow ${operation}: ${duration.toFixed(2)}ms`)
    }
    
    setMetrics(prev => ({
      ...prev,
      renderTime: duration
    }))
  }, [])

  const trackApiCall = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      apiCalls: prev.apiCalls + 1
    }))
  }, [])

  const trackError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1
    }))
  }, [])

  return { metrics, startTimer, endTimer, trackApiCall, trackError }
}

// Memoized components for better performance
export const MemoizedCard = memo(({ title, children, ...props }) => (
  <Card {...props}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
))

export const MemoizedChart = memo(({ data, type }) => {
  const chartConfig = useMemo(() => {
    // Expensive chart configuration
    return generateChartConfig(data, type)
  }, [data, type])

  return <Chart config={chartConfig} />
})

// Custom hooks for performance
export function useThrottledCallback(callback, delay) {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  )
  return throttledCallback
}

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Utility functions
function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
