import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { linkedinService } from '../services/linkedinService';
import { FaLinkedin, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

export default function LinkedInRequiredBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const status = await linkedinService.getTokenStatus();
      setIsConnected(status.connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authorization_url } = await linkedinService.getAuthorizationUrl();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authorization_url,
        'LinkedIn Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
          const { code } = event.data;
          try {
            await linkedinService.connect(code);
            await checkConnection();
            setIsDismissed(false);
            // Notifier toutes les pages que LinkedIn est connecté
            window.dispatchEvent(new CustomEvent('linkedin-connected'));
          } catch (error: any) {
            console.error('LinkedIn connection error:', error);
          } finally {
            window.removeEventListener('message', messageListener);
            if (popup) popup.close();
          }
        } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          if (popup) popup.close();
        }
      };

      window.addEventListener('message', messageListener);

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting to LinkedIn:', error);
    }
  };

  // Ne pas afficher si connecté, en chargement, ou si l'utilisateur a fermé le banner
  if (isLoading || isConnected || isDismissed) {
    return null;
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#fff3cd',
      borderBottom: '2px solid #ffc107',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <FaExclamationTriangle size={24} color="#856404" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', color: '#856404', marginBottom: '4px', fontSize: '1rem' }}>
            ⚠️ Connexion LinkedIn requise
          </div>
          <div style={{ color: '#856404', fontSize: '0.875rem' }}>
            Vous devez connecter votre compte LinkedIn pour utiliser toutes les fonctionnalités, notamment la candidature automatique aux offres d'emploi.
          </div>
        </div>
        <button
          onClick={handleConnect}
          style={{
            padding: '10px 20px',
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
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#005885'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0077b5'}
        >
          <FaLinkedin size={16} />
          Connecter LinkedIn
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            marginLeft: '12px',
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Fermer"
        >
          <FaTimes size={18} />
        </button>
      </div>
    </div>
  );
}

