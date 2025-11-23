import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * Page de callback pour l'authentification LinkedIn
 * Cette page reçoit le code d'autorisation et peut soit:
 * 1. Connecter l'utilisateur (login)
 * 2. Lier le compte LinkedIn (account linking) - transmet au parent (popup)
 */
export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');
  const intent = searchParams.get('intent'); // 'login' or 'link'
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double invocation in Strict Mode
    if (hasFetched.current) return;

    const handleCallback = async () => {
      // Handle errors
      if (error) {
        hasFetched.current = true;
        const errorMsg = errorDescription || error;

        // If popup mode (account linking), send error to parent
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'LINKEDIN_AUTH_ERROR',
              error,
              error_description: errorDescription,
            },
            window.location.origin
          );
          window.close();
        } else {
          toast.error(`Erreur LinkedIn: ${errorMsg}`);
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      if (!code) {
        hasFetched.current = true;
        toast.error('Code d\'autorisation manquant');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Lock immediately before any async operation
      hasFetched.current = true;
      setProcessing(true);

      // Handle account linking mode (popup)
      if (window.opener && intent !== 'login') {
        window.opener.postMessage(
          {
            type: 'LINKEDIN_AUTH_SUCCESS',
            code,
            state,
          },
          window.location.origin
        );
        window.close();
        return;
      }

      // Handle login mode  
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

        // Call backend to exchange code for token and login
        const response = await fetch(`${API_BASE_URL}/auth/linkedin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorization_code: code }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Échec de la connexion LinkedIn');
        }

        // Store token and login user
        if (data.token) {
          localStorage.setItem('token', data.token);
          toast.success('Connexion réussie ! Redirection vers votre tableau de bord...');

          // Small delay to let the user see the success message
          setTimeout(() => {
            navigate('/dashboard');
            window.location.reload(); // Ensure auth context updates
          }, 1000);
        } else {
          throw new Error('Token manquant dans la réponse');
        }
      } catch (err: any) {
        console.error('LinkedIn login error:', err);
        toast.error(err.message || 'Erreur lors de la connexion LinkedIn');
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [code, error, state, intent, navigate, errorDescription]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '20px',
      backgroundColor: '#f9fafb',
    }}>
      {processing || code ? (
        <>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Connexion avec LinkedIn...</p>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </>
      ) : error ? (
        <>
          <div style={{ fontSize: '48px', color: '#dc2626' }}>✗</div>
          <p style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px' }}>Erreur d'autorisation</p>
          {errorDescription && (
            <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '500px', textAlign: 'center' }}>
              {errorDescription}
            </p>
          )}
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Redirection vers la page de connexion...</p>
        </>
      ) : (
        <p style={{ color: '#6b7280' }}>Chargement...</p>
      )}
    </div>
  );
}
