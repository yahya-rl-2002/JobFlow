import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { FaLinkedin, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Connexion réussie!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkedInLogin = async () => {
    try {
      // Get the LinkedIn authorization URL from the backend
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await fetch(`${API_BASE_URL}/linkedin/auth-url`)
      const data = await response.json()

      if (data.authorization_url) {
        // Redirect the user to LinkedIn for authentication
        window.location.href = data.authorization_url
      } else {
        toast.error('Impossible de se connecter avec LinkedIn')
      }
    } catch (error) {
      console.error('LinkedIn login error:', error)
      toast.error('Erreur lors de la connexion LinkedIn')
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--white)',
    }}>
      {/* Left Side - Hero Section */}
      <div style={{
        flex: '1',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }} className="hidden-mobile">
        {/* Abstract Shapes */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-5%',
          left: '-5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '24px', lineHeight: 1.2 }}>
            Boostez votre <br />carrière.
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '480px', lineHeight: 1.6 }}>
            Accédez à des milliers d'offres d'emploi et optimisez votre CV grâce à notre intelligence artificielle avancée.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: 'var(--white)',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }} className="fade-in">
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Bon retour !
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Email professionnel
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    outline: 'none',
                    backgroundColor: '#f9fafb',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  Mot de passe
                </label>
                <Link to="/forgot-password" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <FaLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    outline: 'none',
                    backgroundColor: '#f9fafb',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary-color)')}
            >
              {loading ? 'Connexion...' : (
                <>
                  Se connecter <FaArrowRight />
                </>
              )}
            </button>
          </form>

          <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            <span style={{ padding: '0 16px', color: '#9ca3af', fontSize: '0.875rem' }}>OU</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
          </div>

          <button
            type="button"
            onClick={handleLinkedInLogin}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'white',
              color: '#0077b5',
              border: '1px solid #0077b5',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <FaLinkedin size={20} />
            Continuer avec LinkedIn
          </button>

          <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

