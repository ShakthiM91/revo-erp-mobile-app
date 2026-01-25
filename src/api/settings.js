import request from '@/utils/request'

export function getSettings() {
  return request({
    url: '/api/settings',
    method: 'get'
  })
}

export function updateSettings(data) {
  return request({
    url: '/api/settings',
    method: 'put',
    data
  })
}

// Tenant-specific settings (uses tenant context from headers)
export function getTenantSettings(tenantId) {
  return request({
    url: `/api/tenants/${tenantId}`,
    method: 'get'
  })
}

export function updateTenantSettings(tenantId, data) {
  return request({
    url: `/api/tenants/${tenantId}`,
    method: 'put',
    data
  })
}
