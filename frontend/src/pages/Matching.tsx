import { useState, useEffect } from 'react'
import { matchingService, cvService, jobService } from '../services/api'
import { toast } from 'react-toastify'
import { FaMagic, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface CV {
  id: number
  file_name: string
  parsed_data?: any
}

interface JobOffer {
  id: number
  title: string
  company: string
  location?: string
  platform: 'linkedin' | 'indeed'
  url?: string
}

interface MatchingResult {
  job_id: number
  score: number
  details: {
    matched_skills?: string[]
    missing_skills?: string[]
    experience_match?: number
    education_match?: number
    base_similarity?: number
    suggestions?: string[]
  }
  job?: JobOffer
}

export default function Matching() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null)
  const [results, setResults] = useState<MatchingResult[]>([])
  const [matching, setMatching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<MatchingResult | null>(null)

  useEffect(() => {
    loadCVs()
  }, [])

  const loadCVs = async () => {
    try {
      const data = await cvService.getAll()
      setCvs(data)
      if (data.length > 0 && !selectedCvId) {
        setSelectedCvId(data[0].id)
      }
    } catch (error: any) {
      toast.error('Erreur chargement CVs')
    }
  }

  const handleMatch = async () => {
    if (!selectedCvId) return toast.error('Sélectionnez un CV')
    const selectedCv = cvs.find(cv => cv.id === selectedCvId)
    if (!selectedCv?.parsed_data) return toast.error('Ce CV doit être analysé d\'abord')

    try {
      setMatching(true)
      const response = await matchingService.match({ cv_id: selectedCvId, limit: 100 })

      const resultsWithJobs = await Promise.all(
        response.results.map(async (result: MatchingResult) => {
          try {
            const job = await jobService.getById(result.job_id)
            return { ...result, job }
          } catch {
            return result
          }
        })
      )

      setResults(resultsWithJobs)
      toast.success(`${resultsWithJobs.length} matchs trouvés!`)
    } catch (error: any) {
      toast.error('Erreur matching: ' + (error.response?.data?.error || error.message))
    } finally {
      setMatching(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Matching Intelligent
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Trouvez les offres qui correspondent le mieux à votre profil grâce à l'IA.
        </p>
      </div>

      {/* Control Panel */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '32px',
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            Sélectionnez votre CV
          </label>
          <select
            value={selectedCvId || ''}
            onChange={(e) => setSelectedCvId(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              backgroundColor: '#f9fafb',
            }}
          >
            <option value="">Choisir un CV...</option>
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.file_name} {cv.parsed_data ? '(Analysé)' : '(Non analysé)'}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleMatch}
          disabled={matching || !selectedCvId}
          style={{
            padding: '12px 32px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: matching || !selectedCvId ? 'not-allowed' : 'pointer',
            opacity: matching || !selectedCvId ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
          }}
        >
          <FaMagic />
          {matching ? 'Analyse en cours...' : 'Lancer le matching'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {results.map((result) => (
            <div
              key={result.job_id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedResult(selectedResult?.job_id === result.job_id ? null : result)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {/* Score Circle */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: `4px solid ${getScoreColor(result.score)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: getScoreColor(result.score) }}>
                    {Math.round(result.score)}%
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {result.job?.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '12px' }}>
                        {result.job?.company} • {result.job?.location}
                      </p>
                    </div>
                    {result.job?.platform && (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: result.job.platform === 'linkedin' ? '#e0f2fe' : '#dbeafe',
                        color: result.job.platform === 'linkedin' ? '#0284c7' : '#2563eb',
                        textTransform: 'uppercase',
                      }}>
                        {result.job.platform}
                      </span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {selectedResult?.job_id === result.job_id && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }} className="fade-in">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCheckCircle /> Points forts
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {result.details.matched_skills?.map((skill, idx) => (
                              <span key={idx} style={{ padding: '4px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500' }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaExclamationTriangle /> Manquants
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {result.details.missing_skills?.map((skill, idx) => (
                              <span key={idx} style={{ padding: '4px 12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500' }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      {result.details.suggestions && result.details.suggestions.length > 0 && (
                        <div style={{ marginTop: '20px', backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaMagic /> Suggestions d'amélioration
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '0.875rem' }}>
                            {result.details.suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.job?.url && (
                        <div style={{ marginTop: '24px', textAlign: 'right' }}>
                          <a
                            href={result.job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '10px 24px',
                              backgroundColor: 'var(--primary-color)',
                              color: 'white',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              fontWeight: '600',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Voir l'offre complète
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div >
  )
}
