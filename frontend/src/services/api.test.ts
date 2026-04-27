import { describe, it, expect, vi } from 'vitest'
import { request } from '../services/api'

// Mock axios
vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  }
})

describe('API request module', () => {
  it('should export request methods', () => {
    expect(request.get).toBeDefined()
    expect(request.post).toBeDefined()
    expect(request.put).toBeDefined()
    expect(request.delete).toBeDefined()
  })
})