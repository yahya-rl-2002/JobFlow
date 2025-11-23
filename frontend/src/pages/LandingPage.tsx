import { Link } from 'react-router-dom'
import { FaBriefcase, FaSearch, FaMagic, FaCheckCircle, FaUserTie, FaArrowRight, FaLinkedin, FaTwitter, FaFacebook } from 'react-icons/fa'

export default function LandingPage() {
    return (
        <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
            {/* Header */}
            <header style={{
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6',
                position: 'sticky',
                top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaBriefcase size={32} color="var(--primary-color)" />
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>JobFlow</span>
                </div>

                <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <a href="#features" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }} className="nav-link">Fonctionnalités</a>
                    <a href="#testimonials" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }} className="nav-link">Témoignages</a>
                    <a href="#contact" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }} className="nav-link">Contact</a>
                </nav>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <Link to="/login" style={{
                        textDecoration: 'none',
                        color: 'var(--primary-color)',
                        fontWeight: '600',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                    }} className="login-btn">
                        Se connecter
                    </Link>
                    <Link to="/register" style={{
                        textDecoration: 'none',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        fontWeight: '600',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }} className="cta-btn">
                        S'inscrire
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                padding: '80px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1200px',
                margin: '0 auto',
                gap: '60px'
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        lineHeight: '1.2',
                        marginBottom: '24px',
                        background: 'linear-gradient(to right, #1e40af, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Optimisez vos opportunités de carrière avec JobFlow
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.6' }}>
                        Notre système intelligent fait correspondre votre CV aux offres d'emploi les plus pertinentes pour vous, en quelques clics. Ne perdez plus de temps à chercher, laissez les opportunités venir à vous.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/register" style={{
                            textDecoration: 'none',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            padding: '16px 32px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'transform 0.2s',
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                        }}>
                            Commencer maintenant <FaArrowRight />
                        </Link>
                        <Link to="/login" style={{
                            textDecoration: 'none',
                            backgroundColor: 'white',
                            color: 'var(--text-primary)',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            padding: '16px 32px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            transition: 'background-color 0.2s'
                        }}>
                            Démo en direct
                        </Link>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '500px',
                        aspectRatio: '1',
                        backgroundColor: '#eff6ff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaBriefcase size={200} color="#93c5fd" style={{ opacity: 0.5 }} />
                        <div style={{
                            position: 'absolute',
                            top: '20%',
                            right: '0',
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '12px' }}>
                                <FaCheckCircle size={24} color="#16a34a" />
                            </div>
                            <div>
                                <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Match Parfait !</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Score: 98%</p>
                            </div>
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: '20%',
                            left: '-20px',
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '12px' }}>
                                <FaSearch size={24} color="#2563eb" />
                            </div>
                            <div>
                                <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>+500 Offres</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Synchronisées</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: '100px 40px', backgroundColor: '#f9fafb' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                            Tout ce dont vous avez besoin pour réussir
                        </h2>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
                            Une suite complète d'outils pour gérer votre recherche d'emploi de A à Z.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        {[
                            { icon: FaUserTie, title: 'Gestion des Candidats', desc: 'Créez votre profil, importez vos CVs et laissez notre IA analyser vos compétences.' },
                            { icon: FaSearch, title: 'Recherche Intelligente', desc: 'Accédez à des milliers d\'offres d\'emploi agrégées depuis LinkedIn et Indeed.' },
                            { icon: FaMagic, title: 'Matching IA', desc: 'Notre algorithme compare votre profil aux offres pour identifier les meilleures opportunités.' },
                            { icon: FaCheckCircle, title: 'Suivi des Candidatures', desc: 'Gérez vos candidatures, suivez leur statut et ne manquez aucune opportunité.' }
                        ].map((feature, idx) => (
                            <div key={idx} style={{
                                backgroundColor: 'white',
                                padding: '40px',
                                borderRadius: '24px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    backgroundColor: '#eff6ff',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '24px',
                                    color: 'var(--primary-color)'
                                }}>
                                    <feature.icon size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>{feature.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" style={{ padding: '100px 40px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '60px', color: 'var(--text-primary)' }}>
                        Ils ont trouvé leur job de rêve
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        {[
                            { name: 'Sarah M.', role: 'Développeuse Fullstack', text: "Grâce à JobFlow, j'ai trouvé un poste qui correspondait exactement à mes attentes en moins de 2 semaines. Le matching est impressionnant !" },
                            { name: 'Thomas D.', role: 'Product Manager', text: "L'interface est super intuitive et le gain de temps est énorme. Je recommande vivement à tous ceux qui cherchent activement." },
                            { name: 'Julie L.', role: 'UX Designer', text: "J'adore la fonctionnalité de synchronisation des offres. Plus besoin de passer des heures sur différents sites, tout est centralisé." }
                        ].map((t, idx) => (
                            <div key={idx} style={{
                                backgroundColor: '#f9fafb',
                                padding: '40px',
                                borderRadius: '24px',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '4rem', color: '#dbeafe', position: 'absolute', top: '20px', left: '20px', fontFamily: 'serif' }}>"</div>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '24px', position: 'relative', zIndex: 1, fontStyle: 'italic' }}>
                                    {t.text}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></div>
                                    <div>
                                        <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{t.name}</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '100px 40px', backgroundColor: 'var(--primary-color)', color: 'white', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '24px' }}>Prêt à booster votre carrière ?</h2>
                    <p style={{ fontSize: '1.25rem', marginBottom: '40px', opacity: 0.9 }}>
                        Rejoignez des milliers de candidats qui utilisent JobFlow pour trouver les meilleures opportunités.
                    </p>
                    <Link to="/register" style={{
                        display: 'inline-block',
                        textDecoration: 'none',
                        backgroundColor: 'white',
                        color: 'var(--primary-color)',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        padding: '20px 48px',
                        borderRadius: '16px',
                        transition: 'transform 0.2s',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                    }}>
                        Créer un compte gratuit
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" style={{ padding: '60px 40px', backgroundColor: '#111827', color: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <FaBriefcase size={24} color="white" />
                            <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>JobFlow</span>
                        </div>
                        <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
                            La plateforme intelligente pour votre recherche d'emploi.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>Produit</h4>
                        <ul style={{ listStyle: 'none', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Fonctionnalités</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Tarifs</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Entreprises</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>Légal</h4>
                        <ul style={{ listStyle: 'none', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Confidentialité</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Conditions</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>Suivez-nous</h4>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a href="#" style={{ color: 'white', fontSize: '1.5rem' }}><FaLinkedin /></a>
                            <a href="#" style={{ color: 'white', fontSize: '1.5rem' }}><FaTwitter /></a>
                            <a href="#" style={{ color: 'white', fontSize: '1.5rem' }}><FaFacebook /></a>
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: '1200px', margin: '60px auto 0', paddingTop: '32px', borderTop: '1px solid #374151', textAlign: 'center', color: '#6b7280' }}>
                    © 2024 JobFlow. Tous droits réservés.
                </div>
            </footer>
        </div>
    )
}
