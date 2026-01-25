import request from '@/utils/request'

export function getTenant(tenantId) {
  return request({
    url: `/api/tenants/${tenantId}`,
    method: 'get'
  })
}

export function updateTenant(tenantId, data) {
  return request({
    url: `/api/tenants/${tenantId}`,
    method: 'put',
    data
  })
}

export function createTenantMemberUser(tenantId, data) {
  return request({
    url: `/api/tenants/${tenantId}/member-users`,
    method: 'post',
    data
  })
}
