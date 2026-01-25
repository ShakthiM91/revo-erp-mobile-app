import axios from 'axios'
import { showToast } from '@/utils/ionicFeedback'
import { getToken } from './auth'

let _router = null

export function setRouter(router) {
  _router = router
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success === false) {
      showToast(res.error || 'Request failed')
      return Promise.reject(new Error(res.error || 'Request failed'))
    }
    return res
  },
  (error) => {
    console.error('Response error:', error)
    const status = error.response?.status
    const message = error.response?.data?.error || error.message
    const currentPath = _router?.currentRoute?.value?.path

    if (status === 401) {
      if (currentPath !== '/login') {
        showToast('Session expired. Please login again.')
        if (_router) {
          _router.push('/login')
        } else {
          window.location.href = '/login'
        }
      }
    } else if (status === 403) {
      showToast(message || 'Access denied')
    } else if (status === 404) {
      showToast('Resource not found')
    } else if (status === 500) {
      showToast('Server error. Please try again later.')
    } else {
      showToast(message || 'Network error')
    }
    return Promise.reject(error)
  }
)

export default service
