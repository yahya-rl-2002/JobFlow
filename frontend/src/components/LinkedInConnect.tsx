import { useState, useEffect } from 'react';
import { linkedinService } from '../services/linkedinService';
import { toast } from 'react-toastify';

export default function LinkedInConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<any>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await linkedinService.getTokenStatus();
      setIsConnected(status.connected);
      setTokenStatus(status);
    } catch (error: any) {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const { authorization_url } = await linkedinService.getAuthorizationUrl();
      
      // Ouvrir la fenêtre d'autorisation LinkedIn
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authorization_url,
        'LinkedIn Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Écouter le message du callback
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
          const { code } = event.data;
          
          try {
            await linkedinService.connect(code);
            toast.success('LinkedIn connecté avec succès!');
            await checkConnection();
          } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur de connexion LinkedIn');
          } finally {
            window.removeEventListener('message', messageListener);
            if (popup) popup.close();
          }
        } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
          const errorMsg = event.data.error_description || event.data.error || 'Erreur d\'autorisation LinkedIn';
          toast.error(errorMsg, { autoClose: 5000 });
          window.removeEventListener('message', messageListener);
          if (popup) popup.close();
        }
      };

      window.addEventListener('message', messageListener);

      // Vérifier si la popup est fermée manuellement
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
        }
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la connexion LinkedIn');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await linkedinService.disconnect();
      toast.success('LinkedIn déconnecté');
      setIsConnected(false);
      setTokenStatus(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de déconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !tokenStatus) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ marginBottom: '20px' }}>Connexion LinkedIn</h2>

      {isConnected ? (
        <div>
          <div style={{
            padding: '15px',
            backgroundColor: '#d4edda',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <p style={{ color: '#155724', margin: 0 }}>
              ✓ LinkedIn est connecté
            </p>
            {tokenStatus && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#155724' }}>
                <p>Expire dans: {Math.floor((tokenStatus.expires_in || 0) / 86400)} jours</p>
                {tokenStatus.has_refresh_token && (
                  <p>✓ Refresh token disponible</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Déconnecter LinkedIn
          </button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Connectez votre compte LinkedIn pour accéder aux offres d'emploi et soumettre des candidatures.
          </p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0077b5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {isLoading ? 'Connexion...' : 'Se connecter à LinkedIn'}
          </button>
        </div>
      )}
    </div>
  );
}

