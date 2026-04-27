import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({ token: null, isLoggedIn: false })
    vi.clearAllMocks()
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
  })

  it('setToken should update state and localStorage', () => {
    const { setToken } = useAuthStore.getState()

    setToken('test-token-123')

    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token-123')
    expect(state.isLoggedIn).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token-123')
  })

  it('setToken with null should clear token', () => {
    const { setToken } = useAuthStore.getState()

    setToken(null)

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
  })

  it('logout should clear token', () => {
    // First set a token
    useAuthStore.setState({ token: 'existing-token', isLoggedIn: true })

    const { logout } = useAuthStore.getState()
    logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
  })
})