import request from '@/utils/request'

export function getWorkspaces() {
  return request({
    url: '/api/accounting/workspaces',
    method: 'get'
  })
}

export function getSharedWorkspaces() {
  return request({
    url: '/api/accounting/workspaces/shared',
    method: 'get'
  })
}
