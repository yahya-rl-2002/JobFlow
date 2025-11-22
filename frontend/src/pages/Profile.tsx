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
      const [profileData, prefsData] = await Promise.all([
        userService.getProfile(),
        userService.getPreferences(),
      ]);
      setProfile(profileData);
      setPreferences(prefsData);
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
      </div>
    </div>
  );
}
