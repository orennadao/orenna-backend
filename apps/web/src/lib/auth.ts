import { SiweMessage } from 'siwe'
import { apiClient } from './api'

export interface AuthUser {
  id: string
  address: string
  ensName?: string
  chainId?: number
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  error?: string
}

export class AuthService {
  private static instance: AuthService
  private user: AuthUser | null = null
  private listeners: ((user: AuthUser | null) => void)[] = []

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Get current user
  getUser(): AuthUser | null {
    return this.user
  }

  // Set user and notify listeners
  private setUser(user: AuthUser | null) {
    this.user = user
    this.listeners.forEach(listener => listener(user))
  }

  // Subscribe to auth state changes
  subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Get nonce from backend
  async getNonce(): Promise<string> {
    try {
      const response = await apiClient.request<{ nonce: string }>('/auth/nonce')
      return response.nonce
    } catch (error) {
      console.error('Failed to get nonce:', error)
      throw new Error('Failed to get authentication nonce')
    }
  }

  // Create SIWE message
  createSiweMessage(address: string, chainId: number, nonce: string): SiweMessage {
    const domain = window.location.host
    const origin = window.location.origin
    
    return new SiweMessage({
      domain,
      address,
      statement: 'Sign in with Ethereum to access Orenna DAO.',
      uri: origin,
      version: '1',
      chainId,
      nonce,
    })
  }

  // Verify SIWE signature with backend
  async verifySiwe(message: SiweMessage, signature: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.prepareMessage(),
          signature,
        }),
      })

      if (response.success && response.user) {
        this.setUser(response.user)
      }

      return response
    } catch (error) {
      console.error('SIWE verification failed:', error)
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      }
    }
  }

  // Get user profile from backend
  async getProfile(): Promise<AuthUser | null> {
    try {
      const response = await apiClient.request<{ user: AuthUser }>('/auth/profile')
      if (response.user) {
        this.setUser(response.user)
        return response.user
      }
      return null
    } catch (error) {
      console.error('Failed to get user profile:', error)
      return null
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.request('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      this.setUser(null)
    }
  }

  // Initialize auth state on app load
  async initialize(): Promise<void> {
    try {
      await this.getProfile()
    } catch (error) {
      // User not authenticated, which is fine
      this.setUser(null)
    }
  }
}

export const authService = AuthService.getInstance()