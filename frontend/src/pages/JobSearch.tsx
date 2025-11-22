import { useState, useEffect } from 'react'
import { jobService } from '../services/api'
import { toast } from 'react-toastify'
import AutocompleteInput from '../components/AutocompleteInput'
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaLaptopHouse, FaSync, FaMoneyBillWave } from 'react-icons/fa'

interface JobOffer {
  id: number
  external_id: string
  platform: 'linkedin' | 'indeed'
  title: string
  company: string
  location?: string
  description?: string
  requirements?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  job_type?: string
  remote?: boolean
  url?: string
  posted_date?: string
  created_at?: string
}

const KEYWORD_SUGGESTIONS = [
  'developer', 'développeur', 'engineer', 'ingénieur', 'designer', 'manager',
  'data scientist', 'product manager', 'marketing', 'sales', 'consultant'
]

const LOCATION_SUGGESTIONS = [
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
  'Bordeaux, France', 'Nantes, France', 'Lille, France', 'Remote', 'Télétravail'
]

export default function JobSearch() {
  const [allJobs, setAllJobs] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const jobsPerPage = 12

  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    platform: '' as '' | 'linkedin' | 'indeed',
    remote: false,
    datePosted: ''
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 500 }

      if (filters.keywords?.trim()) params.keywords = filters.keywords.trim()
      if (filters.location?.trim()) params.location = filters.location.trim()
      if (filters.platform) params.platform = filters.platform
      if (filters.remote) params.remote = 'true'

      const response = await jobService.search(params)
      setAllJobs(response.jobs || [])
      setCurrentPage(1)
    } catch (error: any) {
      toast.error('Erreur chargement offres: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await jobService.sync({
        platform: filters.platform || '',
        keywords: filters.keywords || 'developer',
        location: filters.location || 'Paris, France',
        limit: 500,
        period: filters.datePosted || 'month' // Pass date filter as period
      })

      toast.success(`${response.count || 0} offres synchronisées!`)

      setTimeout(async () => {
        const savedFilters = { ...filters }
        setFilters({ keywords: '', location: '', platform: '', remote: false, datePosted: '' })
        await loadJobs()
        setTimeout(() => setFilters(savedFilters), 500)
      }, 1500)
    } catch (error: any) {
      toast.error('Erreur synchro: ' + (error.response?.data?.error || error.message))
    } finally {
      setSyncing(false)
    }
  }

  const currentJobs = allJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage)
  const totalPages = Math.ceil(allJobs.length / jobsPerPage)

  const formatSalary = (job: JobOffer) => {
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency || 'EUR'}`
    } else if (job.salary_min) {
      return `> ${job.salary_min.toLocaleString()} ${job.salary_currency || 'EUR'}`
    }
    return null
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Offres d'emploi
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Explorez les opportunités et trouvez votre prochain poste.
          </p>
        </div>
      </div>

      {/* Search Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '24px',
        position: 'sticky',
        top: '20px',
        zIndex: 10
      }}>
        {/* Main Search Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '1.2rem' }} />
            <div style={{ marginLeft: '40px' }}>
              <AutocompleteInput
                value={filters.keywords}
                onChange={(value) => setFilters(prev => ({ ...prev, keywords: value }))}
                placeholder="Intitulé du poste, mots-clés ou entreprise"
                suggestions={KEYWORD_SUGGESTIONS}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.1rem',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            <div style={{ position: 'absolute', right: '0', top: '10%', height: '80%', width: '1px', backgroundColor: '#e5e7eb' }} />
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <FaMapMarkerAlt style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '1.2rem' }} />
            <div style={{ marginLeft: '40px' }}>
              <AutocompleteInput
                value={filters.location}
                onChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                placeholder="Ville, région ou code postal"
                suggestions={LOCATION_SUGGESTIONS}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.1rem',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
          </div>

          <button
            onClick={() => { setCurrentPage(1); loadJobs(); }}
            disabled={loading}
            style={{
              padding: '0 32px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Helper for custom arrow */}
          <style>
            {`
                    .filter-select {
                        appearance: none;
                        -webkit-appearance: none;
                        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
                        background-repeat: no-repeat;
                        background-position: right 12px center;
                        background-size: 10px;
                        padding-right: 32px !important;
                    }
                    .filter-pill:hover {
                        background-color: #f3f4f6;
                        border-color: #9ca3af;
                    }
                `}
          </style>

          {/* Date Posted Filter */}
          <select
            className="filter-select filter-pill"
            value={filters.datePosted}
            onChange={(e) => setFilters(prev => ({ ...prev, datePosted: e.target.value }))}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: filters.datePosted ? '1px solid var(--primary-color)' : '1px solid #e5e7eb',
              backgroundColor: filters.datePosted ? '#eff6ff' : 'white',
              color: filters.datePosted ? 'var(--primary-color)' : '#374151',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <option value="">Date de publication</option>
            <option value="24h">Dernières 24h</option>
            <option value="week">Semaine dernière</option>
            <option value="month">Mois dernier</option>
          </select>

          {/* Job Type Filter */}
          <select
            className="filter-select filter-pill"
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <option value="">Type de poste</option>
            <option value="fulltime">CDI</option>
            <option value="contract">CDD / Intérim</option>
            <option value="internship">Stage</option>
            <option value="freelance">Freelance</option>
          </select>

          {/* Platform Filter */}
          <select
            className="filter-select"
            value={filters.platform}
            onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value as any }))}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: filters.platform ? '1px solid var(--primary-color)' : '1px solid #e5e7eb',
              backgroundColor: filters.platform ? '#eff6ff' : 'white',
              color: filters.platform ? 'var(--primary-color)' : '#374151',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <option value="">Toutes les plateformes</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
          </select>

          {/* Remote Toggle */}
          <button
            className="filter-pill"
            onClick={() => setFilters(prev => ({ ...prev, remote: !prev.remote }))}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: filters.remote ? '1px solid #10b981' : '1px solid #e5e7eb',
              backgroundColor: filters.remote ? '#d1fae5' : 'white',
              color: filters.remote ? '#059669' : '#374151',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FaLaptopHouse />
            Télétravail
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: syncing ? '#9ca3af' : 'var(--primary-color)',
              border: 'none',
              fontWeight: '600',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <FaSync className={syncing ? 'spin' : ''} />
            {syncing ? 'Synchronisation...' : 'Synchroniser les offres'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Chargement des offres...</div>
      ) : allJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', color: 'var(--text-secondary)' }}>
          <FaBriefcase size={48} color="#e5e7eb" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>Aucune offre trouvée.</p>
          <p style={{ fontSize: '0.875rem' }}>Essayez de modifier vos filtres ou synchronisez les offres.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {currentJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: job.platform === 'linkedin' ? '#e0f2fe' : '#dbeafe',
                      color: job.platform === 'linkedin' ? '#0284c7' : '#2563eb',
                      textTransform: 'uppercase',
                    }}>
                      {job.platform}
                    </span>
                    {job.job_type && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: '#f3f4f6',
                        color: '#4b5563',
                        textTransform: 'uppercase',
                        border: '1px solid #e5e7eb'
                      }}>
                        {job.job_type}
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {job.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '16px' }}>
                  {job.company}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.875rem' }}>
                    <FaMapMarkerAlt size={14} />
                    {job.location || 'Non spécifié'}
                  </div>
                  {formatSalary(job) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.9rem', fontWeight: '600', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                      <FaMoneyBillWave size={14} />
                      {formatSalary(job)}
                    </div>
                  )}
                  {job.remote && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>
                      <FaLaptopHouse size={14} />
                      Télétravail
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '10px',
                        textAlign: 'center',
                        backgroundColor: '#f3f4f6',
                        color: 'var(--text-primary)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      Voir
                    </a>
                  )}
                  <button
                    style={{
                      flex: 2,
                      padding: '10px',
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
                  >
                    Postuler
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingBottom: '40px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#9ca3af' : 'var(--text-primary)',
                }}
              >
                Précédent
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? '#9ca3af' : 'var(--text-primary)',
                }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
