import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

let messageApi: {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
  warning: (msg: string) => void
} | null = null

export const setMessageApi = (api: typeof messageApi) => {
  messageApi = api
}

const instance: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const errorMsg = data?.detail || data?.message || '请求失败'

      if (status === 401) {
        if (error.config?.url?.includes('/auth/login')) {
          messageApi?.error(errorMsg || '用户名或密码错误')
        } else {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      } else if (status === 403) {
        messageApi?.error('没有权限访问')
      } else if (status === 404) {
        messageApi?.error('请求的资源不存在')
      } else if (status === 422) {
        const validationErrors = data?.detail
        if (Array.isArray(validationErrors)) {
          const msg = validationErrors.map(e => e.msg).join(', ')
          messageApi?.error(msg || '参数错误')
        } else {
          messageApi?.error(errorMsg)
        }
      } else if (status === 500) {
        messageApi?.error(`服务器错误: ${errorMsg}`)
      } else if (status === 400) {
        messageApi?.error(errorMsg)
      } else {
        messageApi?.error(errorMsg)
      }
    } else if (error.request) {
      messageApi?.error('服务器无响应，请检查网络连接')
    } else {
      messageApi?.error(`请求失败: ${error.message}`)
    }
    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.get<T>(url, config) as Promise<T>,

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.post<T>(url, data, config) as Promise<T>,

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.put<T>(url, data, config) as Promise<T>,

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.delete<T>(url, config) as Promise<T>,
}

export default instance
