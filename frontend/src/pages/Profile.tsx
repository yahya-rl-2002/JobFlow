import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userService } from '../services/api';
import { linkedinService } from '../services/linkedinService';
import LinkedInConnect from '../components/LinkedInConnect';
import { toast } from 'react-toastify';
import { FaUser, FaCog, FaSave, FaLinkedin, FaEnvelope, FaPhone, FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaLaptopHouse, FaRobot } from 'react-icons/fa';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
    const linkedinCode = searchParams.get('linkedin_code');
    if (linkedinCode) {
      handleLinkedInCallback(linkedinCode);
    }
  }, []);

  const loadData = async () => {
    try {
      const [profileData, prefsData, credsData] = await Promise.all([
        userService.getProfile(),
        userService.getPreferences(),
        userService.getCredentials().catch(() => null), // Ne pas échouer si pas encore configuré
      ]);
      setProfile(profileData);
      setPreferences(prefsData);
      setCredentials(credsData);
    } catch (error: any) {
      toast.error('Erreur chargement profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInCallback = async (code: string) => {
    try {
      await linkedinService.connect(code);
      toast.success('LinkedIn connecté!');
      window.history.replaceState({}, '', '/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur connexion LinkedIn');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
      };
      await userService.updateProfile(data);
      toast.success('Profil mis à jour');
      await loadData();
    } catch (error: any) {
      toast.error('Erreur mise à jour profil');
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        job_keywords: formData.get('job_keywords')?.toString().split(',').map(s => s.trim()),
        locations: formData.get('locations')?.toString().split(',').map(s => s.trim()),
        job_types: formData.get('job_types')?.toString().split(',').map(s => s.trim()),
        salary_min: formData.get('salary_min') ? parseInt(formData.get('salary_min') as string) : null,
        salary_max: formData.get('salary_max') ? parseInt(formData.get('salary_max') as string) : null,
        remote_only: formData.get('remote_only') === 'on',
        auto_apply: formData.get('auto_apply') === 'on',
        min_match_score: formData.get('min_match_score') ? parseFloat(formData.get('min_match_score') as string) : 70.0,
      };
      await userService.updatePreferences(data);
      toast.success('Préférences mises à jour');
      await loadData();
    } catch (error: any) {
      toast.error('Erreur mise à jour préférences');
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        linkedin_email: formData.get('linkedin_email')?.toString() || undefined,
        linkedin_password: formData.get('linkedin_password')?.toString() || undefined,
        indeed_email: formData.get('indeed_email')?.toString() || undefined,
        indeed_password: formData.get('indeed_password')?.toString() || undefined,
      };
      
      // Ne pas envoyer les mots de passe vides
      if (!data.linkedin_password) delete data.linkedin_password;
      if (!data.indeed_password) delete data.indeed_password;
      
      await userService.updateCredentials(data);
      toast.success('Identifiants mis à jour avec succès');
      await loadData();
    } catch (error: any) {
      toast.error('Erreur mise à jour identifiants: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="fade-in" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Chargement...</div>;

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Mon Profil
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gérez vos informations personnelles et vos préférences de recherche.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>

        {/* Left Column: Personal Info & LinkedIn */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* LinkedIn Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaLinkedin color="#0077b5" /> Connexion LinkedIn
            </h2>
            <LinkedInConnect />
          </div>

          {/* Personal Info Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaUser color="var(--primary-color)" /> Informations personnelles
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <FaEnvelope style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    defaultValue={profile?.first_name || ''}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    defaultValue={profile?.last_name || ''}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Téléphone
                </label>
                <div style={{ position: 'relative' }}>
                  <FaPhone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={profile?.phone || ''}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
              >
                <FaSave /> Enregistrer
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Preferences */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          height: 'fit-content',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCog color="var(--primary-color)" /> Préférences de recherche
          </h2>
          <form onSubmit={handleUpdatePreferences}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Mots-clés
              </label>
              <div style={{ position: 'relative' }}>
                <FaBriefcase style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                <input
                  type="text"
                  name="job_keywords"
                  defaultValue={preferences?.job_keywords?.join(', ') || ''}
                  placeholder="Ex: developer, python, react"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Séparés par des virgules</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Localisations
              </label>
              <div style={{ position: 'relative' }}>
                <FaMapMarkerAlt style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                <input
                  type="text"
                  name="locations"
                  defaultValue={preferences?.locations?.join(', ') || ''}
                  placeholder="Ex: Paris, Lyon, Remote"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Types de postes
              </label>
              <input
                type="text"
                name="job_types"
                defaultValue={preferences?.job_types?.join(', ') || ''}
                placeholder="Ex: CDI, CDD, Stage"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Salaire min (€)
                </label>
                <div style={{ position: 'relative' }}>
                  <FaMoneyBillWave style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="number"
                    name="salary_min"
                    defaultValue={preferences?.salary_min || ''}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Salaire max (€)
                </label>
                <div style={{ position: 'relative' }}>
                  <FaMoneyBillWave style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="number"
                    name="salary_max"
                    defaultValue={preferences?.salary_max || ''}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="remote_only"
                    defaultChecked={preferences?.remote_only || false}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaLaptopHouse /> Télétravail uniquement
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="auto_apply"
                    defaultChecked={preferences?.auto_apply || false}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaRobot /> Postulation automatique
                  </span>
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '26px', marginTop: '4px' }}>
                  Postuler automatiquement aux offres avec un score élevé.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Score minimum pour auto-apply (%)
                </label>
                <input
                  type="number"
                  name="min_match_score"
                  defaultValue={preferences?.min_match_score || 70}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
            >
              <FaSave /> Mettre à jour les préférences
            </button>
          </form>
        </div>

        {/* Section Credentials pour l'automatisation */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <FaRobot size={24} color="var(--primary-color)" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Identifiants pour Candidature Automatique
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Configurez vos identifiants LinkedIn/Indeed pour postuler automatiquement
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateCredentials}>
            {/* LinkedIn Credentials */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                <FaLinkedin color="#0077b5" />
                LinkedIn
              </label>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input
                  type="email"
                  name="linkedin_email"
                  placeholder="Email LinkedIn"
                  defaultValue={credentials?.linkedin_email || ''}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
                <input
                  type="password"
                  name="linkedin_password"
                  placeholder={credentials?.has_linkedin_password ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe LinkedIn'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Indeed Credentials */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                <FaBriefcase color="#2164f3" />
                Indeed
              </label>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input
                  type="email"
                  name="indeed_email"
                  placeholder="Email Indeed"
                  defaultValue={credentials?.indeed_email || ''}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
                <input
                  type="password"
                  name="indeed_password"
                  placeholder={credentials?.has_indeed_password ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe Indeed'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              <strong>🔒 Sécurité :</strong> Vos mots de passe sont chiffrés et stockés de manière sécurisée. Ils sont uniquement utilisés pour automatiser vos candidatures.
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
            >
              <FaSave /> Enregistrer les identifiants
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
