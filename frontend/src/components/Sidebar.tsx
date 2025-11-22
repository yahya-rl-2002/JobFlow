import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaFileAlt, FaBriefcase, FaCog, FaSignOutAlt, FaUserCircle, FaSearch, FaMagic } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
    const location = useLocation()
    const { logout, user } = useAuth()

    const menuItems = [
        { path: '/', icon: FaHome, label: 'Vue d\'ensemble' },
        { path: '/jobs', icon: FaSearch, label: 'Offres d\'emploi' },
        { path: '/matching', icon: FaMagic, label: 'Matching' },
        { path: '/applications', icon: FaBriefcase, label: 'Candidatures' },
        { path: '/cvs', icon: FaFileAlt, label: 'Mes CVs' },
    ]

    return (
        <div style={{
            width: '280px',
            backgroundColor: 'white',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 50,
        }}>
            {/* Logo Area */}
            <div style={{ padding: '32px', borderBottom: '1px solid #f3f4f6' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaBriefcase /> JobFlow
                </h1>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '24px 16px' }}>
                <ul style={{ listStyle: 'none' }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <li key={item.path} style={{ marginBottom: '8px' }}>
                                <Link
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                        textDecoration: 'none',
                                        fontWeight: isActive ? '600' : '500',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <item.icon style={{ marginRight: '12px', fontSize: '1.2rem' }} />
                                    {item.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User Profile & Logout */}
            <div style={{ padding: '24px', borderTop: '1px solid #f3f4f6' }}>
                <Link to="/settings" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', textDecoration: 'none', color: 'inherit', padding: '8px', borderRadius: '8px', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e0e7ff',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                    }}>
                        <FaUserCircle size={24} />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                        <p style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.email?.split('@')[0] || 'Utilisateur'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Compte Gratuit</p>
                    </div>
                    <FaCog style={{ color: 'var(--text-secondary)' }} />
                </Link>
                <button
                    onClick={logout}
                    style={{
                        width: '100%',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                >
                    <FaSignOutAlt /> Déconnexion
                </button>
            </div>
        </div>
    )
}
