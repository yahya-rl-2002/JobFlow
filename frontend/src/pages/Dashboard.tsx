import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { applicationService, cvService } from '../services/api'
import { linkedinService } from '../services/linkedinService'
import StatCard from '../components/StatCard'
import { FaFileAlt, FaBriefcase, FaClock, FaCheckCircle, FaPlus, FaSearch, FaLinkedin, FaExclamationTriangle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function Dashboard() {
  const navigate = useNavigate()
  const [linkedInConnected, setLinkedInConnected] = useState<boolean | null>(null)
  const [checkingLinkedIn, setCheckingLinkedIn] = useState(true)

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.getAll(),
  })

  const { data: cvs } = useQuery({
    queryKey: ['cvs'],
    queryFn: () => cvService.getAll(),
  })

  useEffect(() => {
    checkLinkedInConnection()
  }, [])

  const checkLinkedInConnection = async () => {
    try {
      const status = await linkedinService.getTokenStatus()
      setLinkedInConnected(status.connected)
    } catch (error) {
      setLinkedInConnected(false)
    } finally {
      setCheckingLinkedIn(false)
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

  const stats = {
    totalApplications: applications?.length || 0,
    pendingApplications: applications?.filter((a: any) => a.status === 'pending').length || 0,
    submittedApplications: applications?.filter((a: any) => a.status === 'submitted').length || 0,
    totalCVs: cvs?.length || 0,
  }

  return (
    <>
      {/* LinkedIn Connection Required Banner */}
      {!checkingLinkedIn && !linkedInConnected && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <FaExclamationTriangle size={32} color="#856404" />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#856404', marginBottom: '8px' }}>
              Connexion LinkedIn requise
            </h3>
            <p style={{ color: '#856404', margin: 0, fontSize: '0.875rem' }}>
              Pour utiliser toutes les fonctionnalités de JobFlow, notamment la candidature automatique aux offres d'emploi, 
              vous devez connecter votre compte LinkedIn. C'est rapide et sécurisé !
            </p>
          </div>
          <button
            onClick={handleConnectLinkedIn}
            style={{
              padding: '12px 24px',
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
            <FaLinkedin size={18} />
            Connecter LinkedIn
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Tableau de bord
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenue sur votre espace de gestion de carrière.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/jobs" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'white',
            color: 'var(--text-primary)',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}>
            <FaSearch /> Trouver un job
          </Link>
          <Link to="/cvs" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
            transition: 'all 0.2s',
          }}>
            <FaPlus /> Nouveau CV
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}>
        <StatCard
          title="Total CVs"
          value={stats.totalCVs}
          icon={FaFileAlt}
          color="#3b82f6"
          trend="+2"
        />
        <StatCard
          title="Candidatures"
          value={stats.totalApplications}
          icon={FaBriefcase}
          color="#10b981"
          trend="+5"
        />
        <StatCard
          title="En attente"
          value={stats.pendingApplications}
          icon={FaClock}
          color="#f59e0b"
        />
        <StatCard
          title="Soumises"
          value={stats.submittedApplications}
          icon={FaCheckCircle}
          color="#6366f1"
        />
      </div>

      {/* Recent Applications */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Candidatures récentes
          </h2>
          <Link to="/applications" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>
            Voir tout
          </Link>
        </div>

        {applications && applications.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.875rem' }}>Poste</th>
                  <th style={{ padding: '0 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.875rem' }}>Entreprise</th>
                  <th style={{ padding: '0 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.875rem' }}>Date</th>
                  <th style={{ padding: '0 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.875rem' }}>Statut</th>
                  <th style={{ padding: '0 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.875rem' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((app: any) => (
                  <tr key={app.id} style={{ transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px', backgroundColor: '#f9fafb', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {app.job_title}
                    </td>
                    <td style={{ padding: '16px', backgroundColor: '#f9fafb', color: 'var(--text-secondary)' }}>
                      {app.company}
                    </td>
                    <td style={{ padding: '16px', backgroundColor: '#f9fafb', color: 'var(--text-secondary)' }}>
                      {new Date(app.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', backgroundColor: '#f9fafb' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: app.status === 'submitted' ? '#dcfce7' : '#fef3c7',
                        color: app.status === 'submitted' ? '#166534' : '#92400e',
                      }}>
                        {app.status === 'submitted' ? 'Soumise' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', backgroundColor: '#f9fafb', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                      {app.match_score ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', width: '60px' }}>
                            <div style={{ width: `${app.match_score}%`, height: '100%', backgroundColor: app.match_score > 70 ? '#10b981' : '#f59e0b', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{app.match_score}%</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{ backgroundColor: '#f3f4f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FaBriefcase size={24} color="#9ca3af" />
            </div>
            <p style={{ fontWeight: '500' }}>Aucune candidature pour le moment</p>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Commencez par importer un CV ou chercher une offre.</p>
          </div>
        )}
      </div>
    </>
  )
}


