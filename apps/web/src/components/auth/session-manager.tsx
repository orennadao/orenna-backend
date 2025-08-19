'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  LogOut,
  Monitor,
  Smartphone,
  Laptop
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface SessionInfo {
  id: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser: string
  location: string
  lastActive: Date
  current: boolean
  ipAddress: string
}

interface SessionManagerProps {
  autoLogoutTime?: number // in minutes
  warningTime?: number // in minutes before auto-logout
  onSessionExpired?: () => void
}

export function SessionManager({ 
  autoLogoutTime = 30,
  warningTime = 5,
  onSessionExpired 
}: SessionManagerProps) {
  const { signOut } = useAuth()
  
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [timeRemaining, setTimeRemaining] = useState(autoLogoutTime * 60)
  const [showWarning, setShowWarning] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  const warningShownRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    loadSessions()
    startSessionTimer()
    setupActivityListeners()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      removeActivityListeners()
    }
  }, [])
  
  useEffect(() => {
    const warningThreshold = warningTime * 60
    
    if (timeRemaining <= warningThreshold && !warningShownRef.current) {
      setShowWarning(true)
      warningShownRef.current = true
    }
    
    if (timeRemaining <= 0) {
      handleAutoLogout()
    }
  }, [timeRemaining, warningTime])
  
  const loadSessions = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }
  
  const startSessionTimer = () => {
    intervalRef.current = setInterval(() => {
      const timeSinceLastActivity = (Date.now() - lastActivity) / 1000
      const remaining = Math.max(0, autoLogoutTime * 60 - timeSinceLastActivity)
      setTimeRemaining(remaining)
    }, 1000)
  }
  
  const setupActivityListeners = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      setLastActivity(Date.now())
      setTimeRemaining(autoLogoutTime * 60)
      setShowWarning(false)
      warningShownRef.current = false
    }
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })
    
    // Store cleanup function
    window.removeActivityListeners = () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }
  
  const removeActivityListeners = () => {
    if (window.removeActivityListeners) {
      window.removeActivityListeners()
    }
  }
  
  const handleAutoLogout = async () => {
    try {
      await signOut()
      if (onSessionExpired) {
        onSessionExpired()
      }
    } catch (error) {
      console.error('Auto-logout failed:', error)
    }
  }
  
  const extendSession = async () => {
    setIsExtending(true)
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST'
      })
      
      if (response.ok) {
        setLastActivity(Date.now())
        setTimeRemaining(autoLogoutTime * 60)
        setShowWarning(false)
        warningShownRef.current = false
      }
    } catch (error) {
      console.error('Failed to extend session:', error)
    } finally {
      setIsExtending(false)
    }
  }
  
  const terminateSession = async (sessionId: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('Failed to terminate session:', error)
    }
  }
  
  const terminateAllOtherSessions = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/sessions/terminate-others', {
        method: 'POST'
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.current))
        loadSessions() // Reload to get updated list
      }
    } catch (error) {
      console.error('Failed to terminate other sessions:', error)
    }
  }
  
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Smartphone className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }
  
  const getSessionStatus = (session: SessionInfo) => {
    const hoursAgo = (Date.now() - session.lastActive.getTime()) / (1000 * 60 * 60)
    
    if (session.current) return 'current'
    if (hoursAgo < 1) return 'active'
    if (hoursAgo < 24) return 'recent'
    return 'inactive'
  }
  
  return (
    <div className="space-y-6">
      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                Session Expiring Soon
              </CardTitle>
              <CardDescription>
                Your session will expire in {formatTimeRemaining(timeRemaining)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Clock className="w-4 h-4" />
                <AlertDescription>
                  For security reasons, you'll be automatically logged out due to inactivity.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  onClick={extendSession}
                  disabled={isExtending}
                  className="flex-1"
                >
                  {isExtending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  {isExtending ? 'Extending...' : 'Stay Logged In'}
                </Button>
                <Button variant="outline" onClick={handleAutoLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Current Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Current Session
          </CardTitle>
          <CardDescription>
            Your session will automatically expire after {autoLogoutTime} minutes of inactivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Time Remaining</p>
              <p className="text-sm text-gray-600">
                {formatTimeRemaining(timeRemaining)} until automatic logout
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-mono ${
                timeRemaining <= warningTime * 60 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatTimeRemaining(timeRemaining)}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeRemaining <= warningTime * 60 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.max(0, (timeRemaining / (autoLogoutTime * 60)) * 100)}%` 
              }}
            />
          </div>
          
          <Button onClick={extendSession} disabled={isExtending} className="w-full">
            {isExtending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Clock className="w-4 h-4 mr-2" />
            )}
            {isExtending ? 'Extending Session...' : 'Extend Session'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across different devices
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={terminateAllOtherSessions}
            >
              <LogOut className="w-4 h-4 mr-2" />
              End All Others
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No active sessions found
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.deviceType)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.browser}</p>
                      {session.current && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      <Badge 
                        variant={
                          getSessionStatus(session) === 'current' ? 'default' :
                          getSessionStatus(session) === 'active' ? 'secondary' :
                          getSessionStatus(session) === 'recent' ? 'outline' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {getSessionStatus(session)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.location} • {session.ipAddress}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last active: {session.lastActive.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
              <p>Always log out when using shared or public computers</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
              <p>Review and terminate suspicious sessions regularly</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
              <p>Enable two-factor authentication for enhanced security</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
              <p>Use secure networks when accessing water benefit transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using session management in other components
export function useSessionManager(options?: {
  autoLogoutTime?: number
  warningTime?: number
  onSessionExpired?: () => void
}) {
  const [timeRemaining, setTimeRemaining] = useState(options?.autoLogoutTime ? options.autoLogoutTime * 60 : 1800)
  const [showWarning, setShowWarning] = useState(false)
  
  useEffect(() => {
    // Implementation would go here
  }, [])
  
  return {
    timeRemaining,
    showWarning,
    extendSession: () => {},
    logout: () => {}
  }
}

// Declare global for cleanup function
declare global {
  interface Window {
    removeActivityListeners?: () => void
  }
}