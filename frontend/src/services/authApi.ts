import { request } from './api'
import type { ApiResponse } from '../types/common'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface UserInfo {
  id: number
  username: string
  created_at: string
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // OAuth2PasswordRequestForm 需要 application/x-www-form-urlencoded 格式
    const params = new URLSearchParams()
    params.append('username', data.username)
    params.append('password', data.password)
    return request.post<LoginResponse>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },

  logout: async (): Promise<ApiResponse> => {
    return request.post('/auth/logout')
  },

  getCurrentUser: async (): Promise<UserInfo> => {
    return request.get<UserInfo>('/auth/me')
  }
}