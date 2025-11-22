import api from './api'

export interface Application {
  id?: number
  user_id: number
  job_offer_id: number
  cv_id?: number
  status: 'pending' | 'submitted' | 'reviewed' | 'accepted' | 'rejected'
  match_score?: number
  customized_cv_path?: string
  application_date?: string
  response_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
  // Données jointes depuis la base
  job_title?: string
  company?: string
  platform?: 'linkedin' | 'indeed'
  job_url?: string
}

class ApplicationService {
  async getAll(): Promise<Application[]> {
    const response = await api.get('/applications')
    return response.data
  }

  async getById(id: number): Promise<Application> {
    const response = await api.get(`/applications/${id}`)
    return response.data
  }

  async create(data: {
    job_offer_id: number
    cv_id?: number
    match_score?: number
  }): Promise<Application> {
    const response = await api.post('/applications', data)
    return response.data
  }

  async update(id: number, data: Partial<Application>): Promise<Application> {
    const response = await api.put(`/applications/${id}`, data)
    return response.data
  }

  async submit(id: number): Promise<{ message: string; result: any }> {
    const response = await api.post(`/applications/${id}/submit`)
    return response.data
  }
}

export default new ApplicationService()

