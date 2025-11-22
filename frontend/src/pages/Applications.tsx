import { useState, useEffect } from 'react'
import { applicationService } from '../services/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FaBriefcase, FaBuilding, FaCalendar, FaCheck, FaTimes, FaExternalLinkAlt, FaFilter } from 'react-icons/fa'

interface Application {
  id?: number
  user_id: number
  job_offer_id: number
  status: 'pending' | 'submitted' | 'reviewed' | 'accepted' | 'rejected'
  match_score?: number
  application_date?: string
  job_title?: string
  company?: string
  platform?: 'linkedin' | 'indeed'
  job_url?: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'En attente', color: '#f59e0b', bgColor: '#fef3c7' },
  submitted: { label: 'Soumise', color: '#3b82f6', bgColor: '#dbeafe' },
  reviewed: { label: 'En examen', color: '#8b5cf6', bgColor: '#ede9fe' },
  accepted: { label: 'Acceptée', color: '#10b981', bgColor: '#d1fae5' },
  rejected: { label: 'Refusée', color: '#ef4444', bgColor: '#fee2e2' },
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await applicationService.getAll()
      setApplications(data)
    } catch (error: any) {
      toast.error('Erreur: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter(app => app.status === statusFilter)

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Mes Candidatures
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Suivez l'état de vos demandes et vos opportunités.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        overflowX: 'auto',
        paddingBottom: '8px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginRight: '8px' }}>
          <FaFilter size={14} />
          <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Filtres:</span>
        </div>

        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: statusFilter === 'all' ? 'var(--primary-color)' : 'white',
            color: statusFilter === 'all' ? 'white' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: statusFilter === 'all' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          Toutes
        </button>

        {Object.entries(STATUS_LABELS).map(([status, info]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: statusFilter === status ? info.color : 'white',
              color: statusFilter === status ? 'white' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: statusFilter === status ? `0 2px 4px ${info.bgColor}` : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {info.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : filteredApplications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', color: 'var(--text-secondary)' }}>
          <FaBriefcase size={48} color="#e5e7eb" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>Aucune candidature trouvée.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {app.job_title || 'Poste non spécifié'}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    backgroundColor: STATUS_LABELS[app.status]?.bgColor || '#f3f4f6',
                    color: STATUS_LABELS[app.status]?.color || '#6b7280',
                  }}>
                    {STATUS_LABELS[app.status]?.label || app.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaBuilding color="#9ca3af" />
                    {app.company || 'Entreprise inconnue'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCalendar color="#9ca3af" />
                    {app.application_date ? format(new Date(app.application_date), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                  </div>
                  {app.match_score && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: app.match_score > 70 ? '#10b981' : '#f59e0b'
                      }} />
                      Score: {app.match_score}%
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {app.job_url && (
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#f3f4f6',
                      color: 'var(--text-primary)',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    Voir l'offre <FaExternalLinkAlt size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
