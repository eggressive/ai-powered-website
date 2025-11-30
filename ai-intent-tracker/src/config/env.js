/**
 * Environment Configuration
 * Centralized access to environment variables with defaults and validation
 */

const ENV = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),

  // Application Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AI Intent Tracker',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'AI-powered user intent prediction',

  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ENABLE_CONSENT_BANNER: import.meta.env.VITE_ENABLE_CONSENT_BANNER !== 'false',

  // Analytics Configuration
  ANALYTICS_UPDATE_INTERVAL: parseInt(import.meta.env.VITE_ANALYTICS_UPDATE_INTERVAL || '5000', 10),
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000', 10),

  // Development Settings
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',

  // Environment Info
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
}

// Validate required environment variables
const validateEnv = () => {
  const required = ['API_BASE_URL']
  const missing = required.filter(key => !ENV[key])

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    if (ENV.IS_PROD) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}

// Run validation
validateEnv()

// Log configuration in development
if (ENV.IS_DEV && ENV.ENABLE_DEBUG) {
  console.log('Environment Configuration:', ENV)
}

export default ENV
