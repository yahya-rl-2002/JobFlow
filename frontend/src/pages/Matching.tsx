import { useState, useEffect } from 'react'
import { matchingService, cvService, jobService } from '../services/api'
import { toast } from 'react-toastify'
import {
  FaMagic,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaBuilding,
  FaChevronDown,
  FaExternalLinkAlt,
  FaFileAlt
} from 'react-icons/fa'

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
      setResults([]) // Clear previous results
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
    if (score >= 80) return '#10b981' // Emerald 500
    if (score >= 60) return '#f59e0b' // Amber 500
    return '#ef4444' // Red 500
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{
          fontSize: '3rem',
          fontWeight: '800',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          Matching Intelligent
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.125rem',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Notre IA analyse votre CV et trouve les offres qui correspondent parfaitement à vos compétences et votre expérience.
        </p>
      </div>

      {/* Control Panel */}
      <div className="glass-panel" style={{
        padding: '32px',
        borderRadius: '24px',
        marginBottom: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            fontSize: '0.95rem'
          }}>
            <FaFileAlt style={{ color: 'var(--primary-color)' }} />
            Sélectionnez le CV à analyser
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCvId || ''}
              onChange={(e) => setSelectedCvId(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'white',
                appearance: 'none',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">Choisir un CV...</option>
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.file_name} {cv.parsed_data ? '✓' : '(Non analysé)'}
                </option>
              ))}
            </select>
            <FaChevronDown style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: selectedCvId ? '#dbeafe' : '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedCvId ? 'var(--primary-color)' : '#9ca3af',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}>
              {selectedCvId ? cvs.find(c => c.id === selectedCvId)?.file_name.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
        </div>

        <button
          onClick={handleMatch}
          disabled={matching || !selectedCvId}
          style={{
            padding: '16px 48px',
            background: matching ? '#9ca3af' : 'linear-gradient(135deg, var(--primary-color) 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            fontWeight: '700',
            fontSize: '1.1rem',
            cursor: matching || !selectedCvId ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s',
            boxShadow: matching ? 'none' : '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
            transform: matching ? 'scale(0.98)' : 'scale(1)',
          }}
          onMouseEnter={(e) => !matching && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !matching && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {matching ? (
            <>
              <div className="spinner" style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Analyse en cours...
            </>
          ) : (
            <>
              <FaMagic />
              Lancer le matching
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {matching && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }} className="fade-in">
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>L'IA travaille...</h3>
          <p>Comparaison de votre profil avec des centaines d'offres.</p>
        </div>
      )}

      {/* Results */}
      {!matching && results.length > 0 && (
        <div style={{ display: 'grid', gap: '24px' }} className="slide-down">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Résultats ({results.length})
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Trié par pertinence
            </div>
          </div>

          {results.map((result, index) => (
            <div
              key={result.job_id}
              className="modern-card"
              style={{
                padding: '0',
                overflow: 'hidden',
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* Card Header / Main Info */}
              <div
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'flex-start'
                }}
                onClick={() => setSelectedResult(selectedResult?.job_id === result.job_id ? null : result)}
              >
                {/* Score Badge */}
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: `${getScoreColor(result.score)}15`, // 10% opacity
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `2px solid ${getScoreColor(result.score)}30`
                }}>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: getScoreColor(result.score)
                  }}>
                    {Math.round(result.score)}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', color: getScoreColor(result.score), textTransform: 'uppercase' }}>
                    Match
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                      {result.job?.title}
                    </h3>
                    {result.job?.platform && (
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: result.job.platform === 'linkedin' ? '#0077b5' : '#2164f3',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {result.job.platform}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaBuilding style={{ color: '#9ca3af' }} /> {result.job?.company}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaMapMarkerAlt style={{ color: '#9ca3af' }} /> {result.job?.location || 'Non spécifié'}
                    </span>
                  </div>

                  {/* Mini Tags Preview */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {result.details.matched_skills?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} style={{
                        padding: '4px 10px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <FaCheckCircle size={10} /> {skill}
                      </span>
                    ))}
                    {(result.details.matched_skills?.length || 0) > 3 && (
                      <span style={{ padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#6b7280', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                        +{(result.details.matched_skills?.length || 0) - 3} autres
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  alignSelf: 'center',
                  color: '#9ca3af',
                  transition: 'transform 0.3s',
                  transform: selectedResult?.job_id === result.job_id ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  <FaChevronDown size={20} />
                </div>
              </div>

              {/* Expanded Details */}
              {selectedResult?.job_id === result.job_id && (
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                  padding: '24px',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

                    {/* Matched Skills */}
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#059669', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <FaCheckCircle /> Compétences validées
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {result.details.matched_skills?.map((skill, idx) => (
                          <span key={idx} style={{
                            padding: '6px 12px',
                            backgroundColor: 'white',
                            border: '1px solid #d1fae5',
                            color: '#059669',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {skill}
                          </span>
                        ))}
                        {(!result.details.matched_skills || result.details.matched_skills.length === 0) && (
                          <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucune compétence spécifique détectée.</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#dc2626', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <FaExclamationTriangle /> Compétences manquantes
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {result.details.missing_skills?.map((skill, idx) => (
                          <span key={idx} style={{
                            padding: '6px 12px',
                            backgroundColor: 'white',
                            border: '1px solid #fee2e2',
                            color: '#dc2626',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {skill}
                          </span>
                        ))}
                        {(!result.details.missing_skills || result.details.missing_skills.length === 0) && (
                          <span style={{ color: '#059669', fontWeight: '500' }}>Aucune compétence manquante ! 🎉</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {result.details.suggestions && result.details.suggestions.length > 0 && (
                    <div style={{ marginTop: '32px', backgroundColor: '#fffbeb', padding: '20px', borderRadius: '16px', border: '1px solid #fcd34d' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#b45309', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <FaMagic /> Conseils de l'IA
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {result.details.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  {result.job?.url && (
                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                      <a
                        href={result.job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="modern-card"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 24px',
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
                        }}
                      >
                        Voir l'offre originale <FaExternalLinkAlt size={14} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
