import { useState, useEffect } from 'react'
import { jobService, applicationService, cvService } from '../services/api'
import { linkedinService } from '../services/linkedinService'
import { toast } from 'react-toastify'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaLaptopHouse, FaSync, FaMoneyBillWave, FaCheckSquare, FaSquare, FaPaperPlane, FaTrash, FaFileAlt, FaLinkedin, FaExclamationTriangle } from 'react-icons/fa'

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
  'data scientist', 'product manager', 'marketing', 'sales', 'consultant',
  'financial analyst', 'analyste financier', 'accountant', 'comptable',
  'auditor', 'auditeur', 'trader', 'economist', 'économiste', 'investment banking',
  'risk manager', 'controller', 'contrôleur de gestion', 'finance manager'
]

const LOCATION_SUGGESTIONS = [
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
  'Bordeaux, France', 'Nantes, France', 'Lille, France', 'Remote', 'Télétravail'
]

interface CV {
  id: number
  file_name: string
  file_type: string
  created_at: string
}

export default function JobSearch() {
  const [allJobs, setAllJobs] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedJobs, setSelectedJobs] = useState<number[]>([])
  const [cvs, setCvs] = useState<CV[]>([])
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null)
  const [showCvSelector, setShowCvSelector] = useState(false)
  const [linkedInConnected, setLinkedInConnected] = useState<boolean | null>(null)
  const jobsPerPage = 12

  const [filters, setFilters] = useState({
    keywords: [] as string[],
    location: [] as string[],
    platform: '' as '' | 'linkedin' | 'indeed',
    remote: false,
    datePosted: ''
  })

  useEffect(() => {
    loadJobs()
    loadCVs()
    checkLinkedInConnection()
    
    // Vérifier le statut LinkedIn périodiquement (toutes les 10 secondes)
    const interval = setInterval(() => {
      checkLinkedInConnection()
    }, 10000)
    
    // Écouter les événements de connexion LinkedIn depuis d'autres pages
    const handleLinkedInConnected = () => {
      checkLinkedInConnection()
    }
    window.addEventListener('linkedin-connected', handleLinkedInConnected)
    
    // Vérifier quand la page redevient visible (après retour depuis Settings)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLinkedInConnection()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('linkedin-connected', handleLinkedInConnected)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const checkLinkedInConnection = async () => {
    try {
      const status = await linkedinService.getTokenStatus()
      setLinkedInConnected(status.connected)
    } catch (error) {
      setLinkedInConnected(false)
    }
  }

  const handleConnectLinkedIn = async () => {
    try {
      const { authorization_url } = await linkedinService.getAuthorizationUrl()
      
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        authorization_url,
        'LinkedIn Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
          const { code } = event.data
          try {
            await linkedinService.connect(code)
            toast.success('LinkedIn connecté avec succès!')
            await checkLinkedInConnection()
            // Notifier toutes les pages que LinkedIn est connecté
            window.dispatchEvent(new CustomEvent('linkedin-connected'))
          } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur de connexion LinkedIn')
          } finally {
            window.removeEventListener('message', messageListener)
            if (popup) popup.close()
          }
        } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
          toast.error('Erreur lors de la connexion LinkedIn')
          window.removeEventListener('message', messageListener)
          if (popup) popup.close()
        }
      }

      window.addEventListener('message', messageListener)

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
        }
      }, 1000)
    } catch (error: any) {
      toast.error('Erreur lors de la connexion LinkedIn')
    }
  }

  const loadCVs = async () => {
    try {
      const data = await cvService.getAll()
      setCvs(data)
      // Sélectionner automatiquement le CV le plus récent
      if (data.length > 0 && !selectedCvId) {
        setSelectedCvId(data[0].id)
      }
    } catch (error: any) {
      console.error('Error loading CVs:', error)
    }
  }

  const loadJobs = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 500 }

      // Envoyer les arrays directement au lieu de les joindre avec des virgules
      if (filters.keywords.length > 0) params.keywords = filters.keywords
      if (filters.location.length > 0) params.location = filters.location
      if (filters.platform) params.platform = filters.platform
      if (filters.remote) params.remote = 'true'

      const response = await jobService.search(params)
      setAllJobs(response.jobs || [])
      setCurrentPage(1)
      setSelectedJobs([]) // Reset selection on new search
    } catch (error: any) {
      console.error('Erreur chargement offres:', error)
      toast.error('Erreur chargement offres: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSearchAndSync = async () => {
    try {
      setSyncing(true)
      setLoading(true)

      // 1. Sync jobs based on filters
      // 1. Sync jobs based on filters
      const syncResponse = await jobService.sync({
        platform: filters.platform || '',
        keywords: filters.keywords, // Send all keywords
        location: filters.location, // Send all locations
        limit: 50, // Increase limit for "max possible"
        period: filters.datePosted || 'month'
      })

      if (syncResponse.count > 0) {
        toast.success(`${syncResponse.count} nouvelles offres trouvées !`)
      } else {
        // Message plus clair si aucune offre n'est trouvée
        const suggestion = syncResponse.suggestion || 'Essayez avec d\'autres mots-clés ou localisations.'
        toast.warning(`Aucune offre trouvée pour ces critères. ${suggestion}`)
      }

      // 2. Load updated jobs from DB
      await loadJobs()

    } catch (error: any) {
      console.error('Search/Sync error:', error)
      toast.error('Erreur lors de la recherche: ' + (error.response?.data?.error || error.message))
      // Try to load existing jobs anyway
      await loadJobs()
    } finally {
      setSyncing(false)
      setLoading(false)
    }
  }

  const toggleJobSelection = (jobId: number) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedJobs.length === currentJobs.length) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(currentJobs.map(job => job.id))
    }
  }

  const handleBulkApply = async () => {
    if (selectedJobs.length === 0) {
      toast.error('Veuillez sélectionner au moins une offre')
      return
    }

    // Vérifier que LinkedIn est connecté (vérification en temps réel)
    if (linkedInConnected === null) {
      // En cours de vérification, attendre un peu
      toast.info('Vérification de la connexion LinkedIn...', { autoClose: 2000 })
      await checkLinkedInConnection()
      // Attendre un peu pour que le statut se mette à jour
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (linkedInConnected === false) {
      toast.error('Vous devez connecter votre compte LinkedIn pour postuler', {
        autoClose: 5000
      })
      handleConnectLinkedIn()
      return
    }

    // Vérifier qu'un CV est sélectionné
    if (!selectedCvId) {
      toast.error('Veuillez sélectionner un CV avant de postuler', {
        autoClose: 3000
      })
      setShowCvSelector(true)
      return
    }

    if (!window.confirm(`Voulez-vous vraiment postuler à ces ${selectedJobs.length} offres avec le CV sélectionné ?`)) {
      return
    }

    try {
      setApplying(true)
      const response = await applicationService.bulkApply(selectedJobs, selectedCvId)

      toast.success(response.message || `Candidature envoyée pour ${response.success_count} offres !`)
      setSelectedJobs([])

      // Optional: Refresh jobs or mark them as applied visually
      // await loadJobs() 
    } catch (error: any) {
      console.error('Bulk apply error:', error)
      console.error('Error details:', {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.error,
        details: error.response?.data?.details
      })
      
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue'
      const errorCode = error.response?.data?.code
      
      // Messages d'erreur plus clairs selon le code d'erreur
      let userMessage = errorMessage
      let shouldRedirectToSettings = false
      
      if (errorCode === 'CV_NOT_FOUND' || errorCode === 'CV_FILE_NOT_FOUND') {
        userMessage = 'Aucun CV trouvé. Veuillez d\'abord uploader un CV dans la section "CVs".'
      } else if (errorCode === 'LINKEDIN_NOT_CONNECTED' || 
                 errorCode === 'LINKEDIN_TOKEN_EXPIRED' || 
                 errorCode === 'LINKEDIN_TOKEN_MISSING' ||
                 errorCode === 'LINKEDIN_REFRESH_TOKEN_EXPIRED' ||
                 errorCode === 'LINKEDIN_NO_REFRESH_TOKEN' ||
                 errorCode === 'LINKEDIN_REAUTH_REQUIRED') {
        // Message spécifique selon le code d'erreur
        if (errorCode === 'LINKEDIN_REAUTH_REQUIRED') {
          userMessage = '🔐 Votre session LinkedIn a expiré. Veuillez vous reconnecter à LinkedIn pour continuer.'
        } else if (errorCode === 'LINKEDIN_REFRESH_TOKEN_EXPIRED') {
          userMessage = '⏰ Votre session LinkedIn a expiré. Veuillez vous reconnecter à LinkedIn dans les paramètres.'
        } else {
          userMessage = '🔗 LinkedIn non connecté. Veuillez connecter votre compte LinkedIn dans les paramètres.'
        }
        shouldRedirectToSettings = true
      } else if (errorCode === 'NLP_SERVICE_ERROR' || errorCode === 'NLP_SERVICE_UNAVAILABLE') {
        userMessage = 'Service de candidature indisponible. Veuillez réessayer plus tard ou vérifier que le service NLP est démarré.'
      } else if (errorCode === 'TIMEOUT_ERROR') {
        userMessage = 'Timeout lors de la candidature. Le processus prend trop de temps. Essayez avec moins d\'offres.'
      } else if (errorCode === 'APPLICATION_ERROR') {
        userMessage = errorMessage || 'Erreur lors de la candidature. Vérifiez les logs pour plus de détails.'
      } else if (error.response?.status === 400) {
        // Vérifier si le message contient des informations sur l'authentification
        if (errorMessage.toLowerCase().includes('linkedin') || errorMessage.toLowerCase().includes('connect') || errorMessage.toLowerCase().includes('token')) {
          userMessage = 'LinkedIn non connecté. Veuillez connecter votre compte LinkedIn via OAuth dans les paramètres.'
          shouldRedirectToSettings = true
        } else if (errorMessage.toLowerCase().includes('cv') || errorMessage.toLowerCase().includes('fichier')) {
          userMessage = 'CV manquant ou invalide. Veuillez uploader un CV dans la section "CVs".'
        } else {
          userMessage = errorMessage || 'Requête invalide. Vérifiez que vous avez sélectionné des offres et que votre CV est uploadé.'
        }
      } else if (error.response?.status === 503) {
        userMessage = 'Service de candidature indisponible. Veuillez vérifier que le service NLP est démarré.'
      } else if (error.response?.status === 504) {
        userMessage = 'Timeout lors de la candidature. Essayez avec moins d\'offres.'
      }
      
      // Afficher le message d'erreur avec le code si disponible
      const displayMessage = errorCode 
        ? `${userMessage} (Code: ${errorCode})`
        : userMessage
      
      // Si redirection vers Settings nécessaire, afficher un message spécial
      if (shouldRedirectToSettings) {
        toast.error(
          <div>
            <div style={{ marginBottom: '10px', fontWeight: '600', fontSize: '15px' }}>
              {userMessage}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              Vous serez redirigé vers les paramètres dans 3 secondes...
            </div>
            <button
              onClick={() => {
                window.location.href = '/settings'
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0077b5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                width: '100%'
              }}
            >
              Aller aux paramètres maintenant →
            </button>
          </div>,
          {
            autoClose: 10000,
            style: { fontSize: '14px', minWidth: '350px' }
          }
        )
        
        // Redirection automatique après 3 secondes
        setTimeout(() => {
          if (window.confirm('Redirection vers les paramètres pour reconnecter LinkedIn ?')) {
            window.location.href = '/settings'
          }
        }, 3000)
      } else {
        toast.error(displayMessage, {
          autoClose: 8000,
          style: { fontSize: '14px' }
        })
      }
    } finally {
      setApplying(false)
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
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      {/* LinkedIn Connection Required Alert */}
      {linkedInConnected === false && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <FaExclamationTriangle size={28} color="#856404" />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#856404', marginBottom: '4px' }}>
              Connexion LinkedIn requise pour postuler
            </h3>
            <p style={{ color: '#856404', margin: 0, fontSize: '0.875rem' }}>
              Vous devez connecter votre compte LinkedIn pour pouvoir postuler automatiquement aux offres d'emploi.
            </p>
          </div>
          <button
            onClick={handleConnectLinkedIn}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0077b5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#005885'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0077b5'}
          >
            <FaLinkedin size={16} />
            Connecter LinkedIn
          </button>
        </div>
      )}

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
            <div style={{ marginLeft: '40px' }}>
              <MultiSelectDropdown
                options={KEYWORD_SUGGESTIONS}
                selected={Array.isArray(filters.keywords) ? filters.keywords : []}
                onChange={(selected: string[]) => setFilters(prev => ({ ...prev, keywords: selected }))}
                placeholder="Intitulé du poste (ex: Dev, Manager)"
                icon={<FaSearch />}
              />
            </div>
            <div style={{ position: 'absolute', right: '0', top: '10%', height: '80%', width: '1px', backgroundColor: '#e5e7eb' }} />
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ marginLeft: '40px' }}>
              <MultiSelectDropdown
                options={LOCATION_SUGGESTIONS}
                selected={Array.isArray(filters.location) ? filters.location : []}
                onChange={(selected: string[]) => setFilters(prev => ({ ...prev, location: selected }))}
                placeholder="Ville (ex: Paris, Lyon)"
                icon={<FaMapMarkerAlt />}
              />
            </div>
          </div>

          <button
            onClick={handleSearchAndSync}
            disabled={loading || syncing || (filters.keywords.length === 0 && filters.location.length === 0)}
            style={{
              padding: '0 32px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: (loading || syncing || (filters.keywords.length === 0 && filters.location.length === 0)) ? 'not-allowed' : 'pointer',
              opacity: (loading || syncing || (filters.keywords.length === 0 && filters.location.length === 0)) ? 0.7 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {(loading || syncing) ? (
              <>
                <FaSync className="spin" />
                Actualisation...
              </>
            ) : 'Rechercher'}
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Voulez-vous vraiment supprimer toutes les offres actuelles ?')) {
                try {
                  setLoading(true);
                  await jobService.deleteAll();
                  toast.success('Offres supprimées avec succès');
                  setAllJobs([]); // Clear local state
                  setLoading(false);
                } catch (error) {
                  console.error('Clear error:', error);
                  toast.error('Erreur lors de la suppression');
                  setLoading(false);
                }
              }
            }}
            disabled={loading || syncing}
            style={{
              padding: '0 24px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: (loading || syncing) ? 'not-allowed' : 'pointer',
              opacity: (loading || syncing) ? 0.7 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaTrash />
            Tout supprimer
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

          {/* Select All Toggle */}
          {allJobs.length > 0 && (
            <button
              onClick={toggleSelectAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {selectedJobs.length === currentJobs.length ? (
                <FaCheckSquare color="var(--primary-color)" size={18} />
              ) : (
                <FaSquare color="#d1d5db" size={18} />
              )}
              Tout sélectionner
            </button>
          )}
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
                  backgroundColor: selectedJobs.includes(job.id) ? '#eff6ff' : 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: selectedJobs.includes(job.id) ? '2px solid var(--primary-color)' : '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => toggleJobSelection(job.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  if (!selectedJobs.includes(job.id)) e.currentTarget.style.borderColor = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  if (!selectedJobs.includes(job.id)) e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {/* Checkbox Overlay */}
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                  {selectedJobs.includes(job.id) ? (
                    <FaCheckSquare color="var(--primary-color)" size={24} />
                  ) : (
                    <FaSquare color="#e5e7eb" size={24} />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', paddingRight: '40px' }}>
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
                      onClick={(e) => e.stopPropagation()}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      // Individual apply logic here if needed
                    }}
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

      {/* CV Selector Modal */}
      {showCvSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCvSelector(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Sélectionner un CV
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Choisissez le CV à utiliser pour postuler aux {selectedJobs.length} offres sélectionnées
            </p>

            {cvs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <FaFileAlt size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Aucun CV disponible. Veuillez d'abord uploader un CV dans la section "CVs".</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {cvs.map((cv) => (
                  <div
                    key={cv.id}
                    onClick={() => {
                      setSelectedCvId(cv.id)
                      setShowCvSelector(false)
                      toast.success(`CV "${cv.file_name}" sélectionné`)
                    }}
                    style={{
                      padding: '16px',
                      border: selectedCvId === cv.id ? '2px solid var(--primary-color)' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedCvId === cv.id ? '#eff6ff' : 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCvId !== cv.id) {
                        e.currentTarget.style.borderColor = 'var(--primary-color)'
                        e.currentTarget.style.backgroundColor = '#f0f9ff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCvId !== cv.id) {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FaFileAlt size={24} color={selectedCvId === cv.id ? 'var(--primary-color)' : '#6b7280'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {cv.file_name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {new Date(cv.created_at).toLocaleDateString('fr-FR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      {selectedCvId === cv.id && (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCvSelector(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mass Apply */}
      {selectedJobs.length > 0 && (
        <div className="fade-in" style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '16px 32px',
          borderRadius: '50px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          zIndex: 100,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}>
              {selectedJobs.length}
            </div>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>offres sélectionnées</span>
          </div>

          {/* CV Selector Button */}
          {selectedCvId && cvs.length > 0 && (
            <button
              onClick={() => setShowCvSelector(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#eff6ff',
                color: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
              title="Changer de CV"
            >
              <FaFileAlt size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cvs.find(cv => cv.id === selectedCvId)?.file_name || 'CV'}
              </span>
            </button>
          )}
          
          {!selectedCvId && cvs.length > 0 && (
            <button
              onClick={() => setShowCvSelector(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fbbf24',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Sélectionner un CV"
            >
              <FaFileAlt size={14} />
              Sélectionner CV
            </button>
          )}

          <button
            onClick={handleBulkApply}
            disabled={applying || !selectedCvId}
            style={{
              backgroundColor: applying || !selectedCvId ? '#9ca3af' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '24px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: applying || !selectedCvId ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              boxShadow: applying || !selectedCvId ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
            }}
            onMouseOver={(e) => !applying && selectedCvId && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => !applying && selectedCvId && (e.currentTarget.style.transform = 'scale(1)')}
            title={!selectedCvId ? 'Veuillez d\'abord sélectionner un CV' : 'Postuler à toutes les offres sélectionnées'}
          >
            {applying ? (
              <>
                <FaSync className="spin" /> Envoi...
              </>
            ) : (
              <>
                <FaPaperPlane /> Postuler à tout
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
