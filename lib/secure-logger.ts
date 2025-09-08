/**
 * Secure logging utility that prevents sensitive data leakage
 * Automatically redacts sensitive information in production
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize user data for logging
 * Removes or masks sensitive information
 */
function sanitizeUser(user: any): any {
  if (!user) return null;
  
  return {
    id: user.id,
    // Mask email in production
    email: isProduction ? maskEmail(user.email) : user.email,
    // Remove other potentially sensitive fields
    role: user.role,
    created_at: user.created_at
  };
}

/**
 * Mask email address for production logging
 */
function maskEmail(email: string | null | undefined): string {
  if (!email) return 'no-email';
  
  const [local, domain] = email.split('@');
  if (!domain) return '***@unknown';
  
  const maskedLocal = local.length > 2 
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : '***';
    
  return `${maskedLocal}@${domain}`;
}

/**
 * Sanitize any object to remove sensitive fields
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'bearer', 'jwt', 'session', 'cookie', 'credential', 'private'
  ];
  
  const sanitized = { ...obj };
  
  for (const field of Object.keys(sanitized)) {
    const fieldLower = field.toLowerCase();
    
    // Remove or mask sensitive fields
    if (sensitiveFields.some(sensitive => fieldLower.includes(sensitive))) {
      sanitized[field] = '[REDACTED]';
    }
    
    // Recursively sanitize nested objects
    if (typeof sanitized[field] === 'object') {
      sanitized[field] = sanitizeObject(sanitized[field]);
    }
  }
  
  return sanitized;
}

/**
 * Secure logger that automatically sanitizes sensitive data
 */
export const secureLogger = {
  /**
   * Log user authentication events
   */
  logAuth(message: string, user?: any, additional?: any) {
    if (isProduction) {
      console.log(message, sanitizeUser(user), sanitizeObject(additional));
    } else {
      console.log(message, user, additional);
    }
  },

  /**
   * Log general information with automatic sanitization
   */
  info(message: string, data?: any) {
    if (isProduction) {
      console.log(message, sanitizeObject(data));
    } else {
      console.log(message, data);
    }
  },

  /**
   * Log errors with automatic sanitization
   */
  error(message: string, error?: any, data?: any) {
    if (isProduction) {
      console.error(message, 
        error ? { message: error.message, stack: error.stack?.split('\n')[0] } : error,
        sanitizeObject(data)
      );
    } else {
      console.error(message, error, data);
    }
  },

  /**
   * Log warnings with automatic sanitization
   */
  warn(message: string, data?: any) {
    if (isProduction) {
      console.warn(message, sanitizeObject(data));
    } else {
      console.warn(message, data);
    }
  },

  /**
   * Debug logging (only in development)
   */
  debug(message: string, data?: any) {
    if (!isProduction) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};

/**
 * Legacy console replacement for sensitive operations
 * Use this instead of console.log for any logging that might contain user data
 */
export const secureConsole = {
  log: secureLogger.info,
  error: secureLogger.error,
  warn: secureLogger.warn,
  debug: secureLogger.debug
};