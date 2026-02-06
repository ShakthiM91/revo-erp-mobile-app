import request from '@/utils/request'

// Dashboard
export function getDashboardSummary() {
  return request({
    url: '/api/work/dashboard/summary',
    method: 'get'
  })
}

export function getDashboardStats() {
  return request({
    url: '/api/work/dashboard/stats',
    method: 'get'
  })
}

// Projects
export function getProjects(params) {
  return request({
    url: '/api/work/projects',
    method: 'get',
    params
  })
}

export function getProjectById(id) {
  return request({
    url: `/api/work/projects/${id}`,
    method: 'get'
  })
}

export function createProject(data) {
  return request({
    url: '/api/work/projects',
    method: 'post',
    data
  })
}

export function updateProject(id, data) {
  return request({
    url: `/api/work/projects/${id}`,
    method: 'put',
    data
  })
}

export function deleteProject(id) {
  return request({
    url: `/api/work/projects/${id}`,
    method: 'delete'
  })
}

// Vendors
export function getVendors(params) {
  return request({
    url: '/api/work/vendors',
    method: 'get',
    params
  })
}

export function getVendorById(id) {
  return request({
    url: `/api/work/vendors/${id}`,
    method: 'get'
  })
}

export function createVendor(data) {
  return request({
    url: '/api/work/vendors',
    method: 'post',
    data
  })
}

export function updateVendor(id, data) {
  return request({
    url: `/api/work/vendors/${id}`,
    method: 'put',
    data
  })
}

export function deleteVendor(id) {
  return request({
    url: `/api/work/vendors/${id}`,
    method: 'delete'
  })
}

// Vendor Categories
export function getVendorCategories(params) {
  return request({
    url: '/api/work/vendor-categories',
    method: 'get',
    params
  })
}

export function getVendorCategoryById(id) {
  return request({
    url: `/api/work/vendor-categories/${id}`,
    method: 'get'
  })
}

export function createVendorCategory(data) {
  return request({
    url: '/api/work/vendor-categories',
    method: 'post',
    data
  })
}

export function updateVendorCategory(id, data) {
  return request({
    url: `/api/work/vendor-categories/${id}`,
    method: 'put',
    data
  })
}

export function deleteVendorCategory(id) {
  return request({
    url: `/api/work/vendor-categories/${id}`,
    method: 'delete'
  })
}
