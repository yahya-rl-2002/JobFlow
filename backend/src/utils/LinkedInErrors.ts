/**
 * Classes d'erreurs personnalisées pour LinkedIn
 */

export class LinkedInError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public originalError?: any
  ) {
    super(message);
    this.name = 'LinkedInError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class LinkedInAuthError extends LinkedInError {
  constructor(message: string, originalError?: any) {
    super(message, 'LINKEDIN_AUTH_ERROR', 401, originalError);
    this.name = 'LinkedInAuthError';
  }
}

export class LinkedInTokenError extends LinkedInError {
  constructor(message: string, originalError?: any) {
    super(message, 'LINKEDIN_TOKEN_ERROR', 401, originalError);
    this.name = 'LinkedInTokenError';
  }
}

export class LinkedInAPIError extends LinkedInError {
  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message, 'LINKEDIN_API_ERROR', statusCode, originalError);
    this.name = 'LinkedInAPIError';
  }
}

export class LinkedInRateLimitError extends LinkedInError {
  constructor(message: string = 'Rate limit exceeded', originalError?: any) {
    super(message, 'LINKEDIN_RATE_LIMIT', 429, originalError);
    this.name = 'LinkedInRateLimitError';
  }
}

export class LinkedInScopeError extends LinkedInError {
  constructor(message: string = 'Insufficient scopes', originalError?: any) {
    super(message, 'LINKEDIN_SCOPE_ERROR', 403, originalError);
    this.name = 'LinkedInScopeError';
  }
}

