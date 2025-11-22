import api from './api';

export const linkedinService = {
  /**
   * Obtient l'URL d'autorisation LinkedIn
   */
  getAuthorizationUrl: () =>
    api.get('/linkedin/auth-url').then((res) => res.data),

  /**
   * Connecte l'utilisateur à LinkedIn avec le code d'autorisation
   */
  connect: (authorizationCode: string) =>
    api.post('/linkedin/connect', { authorization_code: authorizationCode }).then((res) => res.data),

  /**
   * Récupère le profil LinkedIn de l'utilisateur
   */
  getProfile: () =>
    api.get('/linkedin/profile').then((res) => res.data),

  /**
   * Vérifie le statut de la connexion LinkedIn
   */
  getTokenStatus: () =>
    api.get('/linkedin/token-status').then((res) => res.data),

  /**
   * Déconnecte l'utilisateur de LinkedIn
   */
  disconnect: () =>
    api.delete('/linkedin/disconnect').then((res) => res.data),
};

