import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/api/auth/logout',
    method: 'post'
  })
}

export function getInfo() {
  return request({
    url: '/api/auth/me',
    method: 'get'
  })
}

export function updateProfile(data) {
  return request({
    url: '/api/auth/profile',
    method: 'put',
    data
  })
}

export function changePassword(data) {
  return request({
    url: '/api/auth/password',
    method: 'put',
    data
  })
}

export function getMyPermissions() {
  return request({
    url: '/api/auth/my-permissions',
    method: 'get'
  })
}
