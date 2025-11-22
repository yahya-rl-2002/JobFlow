import { useState } from 'react'
import { userService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import {
    FaUserCog,
    FaBell,
    FaLock,
    FaShieldAlt,
    FaMoon,
    FaGlobe,
    FaExclamationTriangle,
    FaDownload,
    FaTrash,
    FaLinkedin
} from 'react-icons/fa'
import LinkedInConnect from '../components/LinkedInConnect'

export default function Settings() {
    const { logout } = useAuth()
    const [activeTab, setActiveTab] = useState('general')
    const [loading, setLoading] = useState(false)

    // Password Change State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('Les nouveaux mots de passe ne correspondent pas')
        }
        if (passwords.newPassword.length < 6) {
            return toast.error('Le mot de passe doit contenir au moins 6 caractères')
        }

        try {
            setLoading(true)
            await userService.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            })
            toast.success('Mot de passe modifié avec succès')
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors du changement de mot de passe')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            try {
                setLoading(true)
                await userService.deleteAccount()
                toast.success('Compte supprimé avec succès')
                logout()
            } catch (error: any) {
                toast.error('Erreur lors de la suppression du compte')
                setLoading(false)
            }
        }
    }

    const tabs = [
        { id: 'general', label: 'Général', icon: FaUserCog },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
        { id: 'security', label: 'Sécurité', icon: FaLock },
        { id: 'privacy', label: 'Confidentialité', icon: FaShieldAlt },
    ]

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px', letterSpacing: '-0.025em' }}>
                    Mon Profil
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Gérez vos informations personnelles, vos préférences de sécurité et vos connexions externes.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'start' }}>
                {/* Sidebar Menu */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.01)',
                    position: 'sticky',
                    top: '20px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px 20px',
                                    border: 'none',
                                    borderRadius: '16px',
                                    backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                                    color: activeTab === tab.id ? '#2563eb' : '#64748b',
                                    fontWeight: activeTab === tab.id ? '700' : '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left',
                                    fontSize: '1rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                        e.currentTarget.style.color = '#334155';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#64748b';
                                    }
                                }}
                            >
                                <tab.icon style={{ fontSize: '1.2rem' }} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '40px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.01)',
                    minHeight: '600px'
                }}>

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '32px', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
                                Paramètres Généraux
                            </h2>

                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '12px', color: '#0284c7' }}>
                                        <FaLinkedin size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#334155', margin: 0 }}>
                                        Compte LinkedIn
                                    </h3>
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s hover:shadow-md' }}>
                                    <LinkedInConnect />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '12px', color: '#4b5563' }}>
                                            <FaGlobe size={20} />
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', margin: 0 }}>
                                            Langue
                                        </h3>
                                    </div>
                                    <select style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#f8fafc',
                                        fontSize: '1rem',
                                        color: '#334155',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 14px center',
                                        backgroundSize: '20px'
                                    }}>
                                        <option value="fr">Français</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '12px', color: '#4b5563' }}>
                                            <FaMoon size={20} />
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', margin: 0 }}>
                                            Apparence
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '2px solid #2563eb',
                                            backgroundColor: '#eff6ff',
                                            color: '#2563eb',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}>
                                            <input type="radio" name="theme" value="light" defaultChecked style={{ accentColor: '#2563eb' }} />
                                            Clair
                                        </label>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#f8fafc',
                                            color: '#94a3b8',
                                            fontWeight: '600',
                                            cursor: 'not-allowed'
                                        }}>
                                            <input type="radio" name="theme" value="dark" disabled />
                                            Sombre
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '32px', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
                                Notifications
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    { title: "Nouvelles offres d'emploi", desc: "Recevoir un email quand une offre correspond à votre profil", default: true },
                                    { title: "Statut des candidatures", desc: "Être notifié lors d'un changement de statut", default: true },
                                    { title: "Newsletter", desc: "Actualités et conseils carrière", default: false }
                                ].map((item, idx) => (
                                    <label key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '24px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#334155', fontSize: '1.1rem', marginBottom: '4px' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.95rem', color: '#64748b' }}>{item.desc}</div>
                                        </div>
                                        <div style={{ position: 'relative', width: '52px', height: '32px' }}>
                                            <input type="checkbox" defaultChecked={item.default} style={{
                                                appearance: 'none',
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#cbd5e1',
                                                borderRadius: '32px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                position: 'relative'
                                            }}
                                                onClick={(e: any) => {
                                                    e.target.style.backgroundColor = e.target.checked ? '#2563eb' : '#cbd5e1';
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '4px',
                                                left: '4px', // Dynamic left would need state, simplifying for now with standard checkbox or just styled toggle
                                                width: '24px',
                                                height: '24px',
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                transition: 'all 0.3s',
                                                pointerEvents: 'none',
                                                transform: item.default ? 'translateX(20px)' : 'translateX(0)'
                                            }} />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '32px', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
                                Sécurité
                            </h2>

                            <form onSubmit={handlePasswordChange} style={{ maxWidth: '600px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.95rem', color: '#334155' }}>
                                        Mot de passe actuel
                                    </label>
                                    <input
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.95rem', color: '#334155' }}>
                                            Nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            required
                                            minLength={6}
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.95rem', color: '#334155' }}>
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            required
                                            minLength={6}
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        padding: '16px 32px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {loading ? 'Modification en cours...' : 'Mettre à jour le mot de passe'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Privacy Tab */}
                    {activeTab === 'privacy' && (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '32px', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
                                Confidentialité et Données
                            </h2>

                            <div style={{ marginBottom: '32px', padding: '32px', backgroundColor: '#f0f9ff', borderRadius: '24px', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '16px', height: 'fit-content', color: '#0284c7', boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.1)' }}>
                                        <FaDownload size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#0c4a6e' }}>
                                            Export des données
                                        </h3>
                                        <p style={{ marginBottom: '20px', color: '#0369a1', lineHeight: '1.6' }}>
                                            Vous pouvez demander une copie complète de vos données personnelles, incluant vos CVs, votre historique de candidatures et vos préférences, au format JSON standardisé.
                                        </p>
                                        <button
                                            onClick={() => toast.info('Export en cours... (Fonctionnalité simulée)')}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: 'white',
                                                color: '#0284c7',
                                                border: '1px solid #bae6fd',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            Exporter mes données
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '32px', backgroundColor: '#fef2f2', borderRadius: '24px', border: '1px solid #fecaca' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '16px', height: 'fit-content', color: '#dc2626', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}>
                                        <FaExclamationTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#991b1b' }}>
                                            Zone de danger
                                        </h3>
                                        <p style={{ marginBottom: '20px', color: '#7f1d1d', lineHeight: '1.6' }}>
                                            La suppression de votre compte est une action définitive et irréversible. Toutes vos données seront effacées de nos serveurs.
                                        </p>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={loading}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                        >
                                            <FaTrash /> Supprimer mon compte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
