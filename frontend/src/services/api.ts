import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),

  register: (data: any) =>
    api.post('/auth/register', data).then((res) => res.data),

  verifyToken: () =>
    api.post('/auth/refresh').then((res) => res.data),
}

export const cvService = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('cv', file)
    return api.post('/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data)
  },

  getAll: () => api.get('/cv').then((res) => res.data),

  parse: (id: number) => api.post(`/cv/${id}/parse`).then((res) => res.data),

  delete: (id: number) => api.delete(`/cv/${id}`).then((res) => res.data),
}

export const jobService = {
  search: (params: any) => api.get('/jobs/search', { params }).then((res) => res.data),

  getById: (id: number) => api.get(`/jobs/${id}`).then((res) => res.data),

  sync: (data: any) => api.post('/jobs/sync', data).then((res) => res.data),
}

export const applicationService = {
  getAll: () => api.get('/applications').then((res) => res.data),

  getById: (id: number) => api.get(`/applications/${id}`).then((res) => res.data),

  create: (data: any) => api.post('/applications', data).then((res) => res.data),

  update: (id: number, data: any) => api.put(`/applications/${id}`, data).then((res) => res.data),

  submit: (id: number) => api.post(`/applications/${id}/submit`).then((res) => res.data),
}

export const matchingService = {
  match: (data: any) => api.post('/matching/match', data).then((res) => res.data),

  getResults: (cvId: number) => api.get(`/matching/results/${cvId}`).then((res) => res.data),

  getJobScore: (jobId: number, cvId: number) =>
    api.get(`/matching/job/${jobId}/score`, { params: { cv_id: cvId } }).then((res) => res.data),
}

export const userService = {
  getProfile: () => api.get('/users/profile').then((res) => res.data),

  updateProfile: (data: any) => api.put('/users/profile', data).then((res) => res.data),

  getPreferences: () => api.get('/users/preferences').then((res) => res.data),

  updatePreferences: (data: any) => api.put('/users/preferences', data).then((res) => res.data),

  changePassword: (data: any) => api.put('/users/password', data).then((res) => res.data),

  deleteAccount: () => api.delete('/users/account').then((res) => res.data),
}

export default api

