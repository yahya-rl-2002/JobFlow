import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { FaLinkedin, FaEnvelope, FaLock, FaArrowRight, FaUser } from 'react-icons/fa'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas')
    }

    setLoading(true)

    try {
      await register(email, password)
      toast.success('Compte créé avec succès!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
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
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            Rejoignez <br />l'aventure.
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '480px', lineHeight: 1.6 }}>
            Créez votre compte gratuitement et commencez à optimiser vos candidatures dès aujourd'hui.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
              Créer un compte
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Remplissez le formulaire ci-dessous pour commencer.
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
                    e.target.style.borderColor = '#10b981';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Mot de passe
              </label>
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
                    e.target.style.borderColor = '#10b981';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    e.target.style.borderColor = '#10b981';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
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
                backgroundColor: '#10b981',
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
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#059669')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#10b981')}
            >
              {loading ? 'Création...' : (
                <>
                  S'inscrire <FaArrowRight />
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
            S'inscrire avec LinkedIn
          </button>

          <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
