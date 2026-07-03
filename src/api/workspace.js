import request from '@/utils/request'

export function getWorkspaces() {
  return request({
    url: '/api/members/workspaces',
    method: 'get'
  })
}

export function getSharedWorkspaces() {
  return request({
    url: '/api/members/workspaces/shared',
    method: 'get'
  })
}
