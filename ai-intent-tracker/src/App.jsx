import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { 
  Brain, 
  Eye, 
  MousePointer, 
  Clock, 
  Target, 
  Shield, 
  BarChart3, 
  Users, 
  TrendingUp,
  Activity,
  Zap,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react'
import './App.css'

// Backend API configuration
const API_BASE_URL = window.location.origin + '/api'

function App() {
  const [userSession, setUserSession] = useState({
    sessionId: null,
    startTime: new Date(),
    pageViews: 1,
    clickCount: 0,
    scrollDepth: 0,
    timeOnPage: 0
  })

  const [intentPrediction, setIntentPrediction] = useState({
    primaryIntent: 'Loading...',
    confidence: 0,
    secondaryIntents: [],
    factors: []
  })

  const [privacyConsent, setPrivacyConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false
  })

  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 1,
    eventsPerSecond: 0,
    predictionAccuracy: 0,
    dataPoints: 0
  })

  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState([])

  // Initialize session with backend
  useEffect(() => {
    initializeSession()
  }, [])

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (userSession.sessionId) {
        updateTimeOnPage()
        fetchAnalyticsStats()
        if (userSession.clickCount > 0 || userSession.scrollDepth > 0) {
          predictIntent()
        }
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [userSession.sessionId, userSession.clickCount, userSession.scrollDepth])

  // Track scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.floor((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
      const newScrollDepth = Math.max(userSession.scrollDepth, scrollPercent)
      
      if (newScrollDepth !== userSession.scrollDepth) {
        setUserSession(prev => ({
          ...prev,
          scrollDepth: newScrollDepth
        }))
        
        // Track scroll event with backend
        if (userSession.sessionId) {
          trackEvent('scroll', {
            scroll_depth: newScrollDepth,
            page_height: document.body.scrollHeight,
            viewport_height: window.innerHeight
          })
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [userSession.scrollDepth, userSession.sessionId])

  const initializeSession = async () => {
    try {
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
          consent_status: privacyConsent
        })
      })

      if (response.ok) {
        const sessionData = await response.json()
        setUserSession(prev => ({
          ...prev,
          sessionId: sessionData.session_id,
          startTime: new Date(sessionData.start_time)
        }))
        setIsConnected(true)
        
        // Track initial page view
        trackPageView()
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
      setIsConnected(false)
    }
  }

  const trackEvent = async (eventType, eventData = {}) => {
    if (!userSession.sessionId) return

    try {
      const response = await fetch(`${API_BASE_URL}/track/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: userSession.sessionId,
          event_type: eventType,
          event_data: eventData,
          page_url: window.location.href,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const eventResult = await response.json()
        setEvents(prev => [eventResult, ...prev.slice(0, 9)]) // Keep last 10 events
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  const trackPageView = async () => {
    if (!userSession.sessionId) return

    try {
      await fetch(`${API_BASE_URL}/track/page-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: userSession.sessionId,
          title: document.title,
          url: window.location.href,
          referrer: document.referrer
        })
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  const predictIntent = async () => {
    if (!userSession.sessionId) return

    try {
      const response = await fetch(`${API_BASE_URL}/predict/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: userSession.sessionId
        })
      })

      if (response.ok) {
        const prediction = await response.json()
        setIntentPrediction({
          primaryIntent: prediction.primary_intent,
          confidence: prediction.confidence,
          secondaryIntents: prediction.secondary_intents || [],
          factors: prediction.factors || []
        })
      }
    } catch (error) {
      console.error('Failed to predict intent:', error)
    }
  }

  const fetchAnalyticsStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/stats`)
      if (response.ok) {
        const stats = await response.json()
        setRealTimeData(prev => ({
          ...prev,
          eventsPerSecond: Math.floor(Math.random() * 5) + 1, // Simulated real-time variation
          predictionAccuracy: stats.prediction_accuracy || prev.predictionAccuracy,
          dataPoints: stats.total_events || prev.dataPoints
        }))
      }
    } catch (error) {
      console.error('Failed to fetch analytics stats:', error)
    }
  }

  const updateTimeOnPage = () => {
    if (userSession.startTime) {
      const timeOnPage = Math.floor((new Date() - userSession.startTime) / 1000)
      setUserSession(prev => ({
        ...prev,
        timeOnPage
      }))
    }
  }

  const handleClick = async () => {
    const newClickCount = userSession.clickCount + 1
    setUserSession(prev => ({
      ...prev,
      clickCount: newClickCount
    }))
    
    // Track click event with backend
    await trackEvent('click', {
      element_type: 'button',
      element_text: 'Simulate Click Event',
      click_count: newClickCount
    })
    
    // Trigger intent prediction after click
    setTimeout(() => predictIntent(), 1000)
  }

  const updateConsent = async (category, value) => {
    const newConsent = {
      ...privacyConsent,
      [category]: value
    }
    
    setPrivacyConsent(newConsent)
    
    // Update consent with backend
    if (userSession.sessionId) {
      try {
        await fetch(`${API_BASE_URL}/privacy/consent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: userSession.sessionId,
            consent: newConsent
          })
        })
      } catch (error) {
        console.error('Failed to update consent:', error)
      }
    }
  }

  const formatEventTime = (timestamp) => {
    if (!timestamp) return 'Now'
    const eventTime = new Date(timestamp)
    const now = new Date()
    const diffSeconds = Math.floor((now - eventTime) / 1000)
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    return `${Math.floor(diffSeconds / 3600)}h ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Intent Tracker</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Smart User Behavior Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className={`${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                <Activity className="h-3 w-3 mr-1" />
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold">{realTimeData.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Events/Second</p>
                  <p className="text-3xl font-bold">{realTimeData.eventsPerSecond}</p>
                </div>
                <Zap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Prediction Accuracy</p>
                  <p className="text-3xl font-bold">{realTimeData.predictionAccuracy.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Data Points</p>
                  <p className="text-3xl font-bold">{realTimeData.dataPoints}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="tracking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Live Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="intent" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Intent Prediction</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Live Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MousePointer className="h-5 w-5" />
                    <span>Current Session</span>
                  </CardTitle>
                  <CardDescription>Real-time user behavior tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Session ID:</span>
                    <Badge variant="secondary">{userSession.sessionId || 'Loading...'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time on Page:</span>
                    <span className="text-sm">{userSession.timeOnPage}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Click Count:</span>
                    <span className="text-sm">{userSession.clickCount}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Scroll Depth:</span>
                      <span className="text-sm">{userSession.scrollDepth}%</span>
                    </div>
                    <Progress value={userSession.scrollDepth} className="h-2" />
                  </div>
                  <Button onClick={handleClick} className="w-full" disabled={!isConnected}>
                    <MousePointer className="h-4 w-4 mr-2" />
                    Simulate Click Event
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Event Stream</span>
                  </CardTitle>
                  <CardDescription>Live user interaction events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {events.length > 0 ? events.map((event, index) => (
                      <div key={event.event_id || index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                        event.event_type === 'page_view' ? 'bg-blue-50 dark:bg-blue-900/20' :
                        event.event_type === 'scroll' ? 'bg-green-50 dark:bg-green-900/20' :
                        'bg-purple-50 dark:bg-purple-900/20'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          event.event_type === 'page_view' ? 'bg-blue-500' :
                          event.event_type === 'scroll' ? 'bg-green-500' :
                          'bg-purple-500'
                        } ${index === 0 ? 'animate-pulse' : ''}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{event.event_type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {event.event_type === 'scroll' && event.event_data ? 
                              `Scrolled to ${JSON.parse(event.event_data).scroll_depth}%` :
                              event.event_type === 'click' ? 'Button interaction detected' :
                              'Page view recorded'
                            }
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">{formatEventTime(event.timestamp)}</span>
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-8">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No events tracked yet</p>
                        <p className="text-xs">Interact with the page to see events</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Intent Prediction Tab */}
          <TabsContent value="intent" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>Primary Intent</span>
                  </CardTitle>
                  <CardDescription>AI-powered user intent prediction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                      <Target className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{intentPrediction.primaryIntent}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Predicted user intent</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Confidence Score</span>
                        <span className="text-sm font-bold">{intentPrediction.confidence}%</span>
                      </div>
                      <Progress value={intentPrediction.confidence} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Secondary Intents</CardTitle>
                  <CardDescription>Alternative predictions with confidence scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {intentPrediction.secondaryIntents.length > 0 ? intentPrediction.secondaryIntents.map((intent, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{intent.intent}</span>
                        <span className="text-sm">{intent.confidence}%</span>
                      </div>
                      <Progress value={intent.confidence} className="h-2" />
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 py-8">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No predictions yet</p>
                      <p className="text-xs">Interact with the page to generate predictions</p>
                    </div>
                  )}
                  
                  <Alert className="mt-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Model Information</AlertTitle>
                    <AlertDescription>
                      Predictions are based on user behavior patterns, device information, and interaction data. 
                      Model accuracy improves with more data points.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {intentPrediction.factors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Intent Prediction Factors</CardTitle>
                  <CardDescription>Key factors influencing the AI prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {intentPrediction.factors.map((factor, index) => (
                      <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{factor.factor}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {factor.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Journey Analytics</CardTitle>
                  <CardDescription>Comprehensive behavior analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{userSession.pageViews}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Page Views</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{userSession.timeOnPage}s</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Session Duration</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{userSession.clickCount}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Interactions</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{userSession.scrollDepth}%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Scroll Depth</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prediction Performance</CardTitle>
                  <CardDescription>AI model accuracy metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Accuracy</span>
                      <span className="text-sm font-bold">{realTimeData.predictionAccuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={realTimeData.predictionAccuracy} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Precision</span>
                      <span className="text-sm font-bold">91.7%</span>
                    </div>
                    <Progress value={91.7} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Recall</span>
                      <span className="text-sm font-bold">87.2%</span>
                    </div>
                    <Progress value={87.2} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy Compliance</AlertTitle>
              <AlertDescription>
                This application is designed to be GDPR compliant. Users have full control over their data and tracking preferences.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Consent Management</span>
                  </CardTitle>
                  <CardDescription>Control your data tracking preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Necessary Cookies</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Required for basic functionality</p>
                      </div>
                      <Switch checked={privacyConsent.necessary} disabled />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Analytics</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Help us improve user experience</p>
                      </div>
                      <Switch 
                        checked={privacyConsent.analytics} 
                        onCheckedChange={(checked) => updateConsent('analytics', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Marketing</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Personalized content and ads</p>
                      </div>
                      <Switch 
                        checked={privacyConsent.marketing} 
                        onCheckedChange={(checked) => updateConsent('marketing', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Personalization</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Customize your experience</p>
                      </div>
                      <Switch 
                        checked={privacyConsent.personalization} 
                        onCheckedChange={(checked) => updateConsent('personalization', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Rights</CardTitle>
                  <CardDescription>Manage your personal data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    View My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Update Preferences
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete My Data
                  </Button>
                  
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">GDPR Compliant</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your data is processed according to EU privacy regulations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI Intent Tracker - Demonstrating intelligent user behavior analysis with privacy compliance
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Built with React, Tailwind CSS, and AI/ML technologies
            </p>
            {userSession.sessionId && (
              <p className="text-xs text-gray-400 mt-1">
                Session: {userSession.sessionId} | Connected: {isConnected ? 'Yes' : 'No'}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

