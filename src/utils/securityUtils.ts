import DOMPurify from 'dompurify';

/**
 * Security utilities for input validation and sanitization
 */

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim(), { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

// Validate UK postcode
export const validatePostcode = (postcode: string): boolean => {
  const sanitized = sanitizeInput(postcode);
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(sanitized);
};

// Validate email
export const validateEmail = (email: string): boolean => {
  const sanitized = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) && sanitized.length <= 254;
};

// Validate UK phone number
export const validatePhoneNumber = (phone: string): boolean => {
  const sanitized = sanitizeInput(phone);
  const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
  return phoneRegex.test(sanitized);
};

// Validate price range
export const validatePrice = (price: string, min = 1, max = 10000): boolean => {
  const sanitized = sanitizeInput(price);
  const numPrice = parseInt(sanitized);
  return !isNaN(numPrice) && numPrice >= min && numPrice <= max;
};

// Validate location name
export const validateLocation = (location: string): boolean => {
  const sanitized = sanitizeInput(location);
  const locationRegex = /^[a-zA-Z0-9\s,.\-'()]+$/;
  return locationRegex.test(sanitized) && sanitized.length >= 2 && sanitized.length <= 100;
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// SQL injection prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  const sanitized = sanitizeInput(query);
  // Remove SQL keywords and special characters
  return sanitized
    .replace(/['"`;\\]/g, '') // Remove SQL injection characters
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
    .trim();
};

// Secure password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Content Security Policy headers
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://maps.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
});

export default {
  sanitizeInput,
  validatePostcode,
  validateEmail,
  validatePhoneNumber,
  validatePrice,
  validateLocation,
  sanitizeSearchQuery,
  validatePassword,
  getSecurityHeaders,
  RateLimiter
};