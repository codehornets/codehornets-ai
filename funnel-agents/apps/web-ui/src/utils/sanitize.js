/**
 * @fileoverview XSS Sanitization Utilities
 *
 * Provides sanitization functions to prevent XSS attacks on user-generated content.
 * Uses DOMPurify for HTML sanitization and provides additional utilities for
 * text content sanitization.
 *
 * @module utils/sanitize
 */

import DOMPurify from 'dompurify';

/**
 * Default DOMPurify configuration
 * Customize based on your application's needs
 */
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Strict configuration for minimal HTML
 * Only allows basic text formatting
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
};

/**
 * Plain text configuration
 * Strips all HTML tags
 */
const TEXT_ONLY_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param {string} dirty - Potentially unsafe HTML string
 * @param {Object} config - DOMPurify configuration options
 * @returns {string} Sanitized HTML string
 *
 * @example
 * const clean = sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>');
 * // Returns: '<p>Safe content</p>'
 */
export function sanitizeHtml(dirty, config = DEFAULT_CONFIG) {
  if (typeof dirty !== 'string') {
    console.warn('sanitizeHtml: input is not a string', typeof dirty);
    return '';
  }

  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('sanitizeHtml: Error sanitizing HTML', error);
    return '';
  }
}

/**
 * Sanitize HTML with strict rules (minimal formatting only)
 *
 * @param {string} dirty - Potentially unsafe HTML string
 * @returns {string} Sanitized HTML string with minimal formatting
 *
 * @example
 * const clean = sanitizeHtmlStrict('<a href="#">Link</a><p>Text</p>');
 * // Returns: '<p>Text</p>'
 */
export function sanitizeHtmlStrict(dirty) {
  return sanitizeHtml(dirty, STRICT_CONFIG);
}

/**
 * Strip all HTML tags and return plain text
 *
 * @param {string} dirty - HTML string to convert to plain text
 * @returns {string} Plain text without HTML tags
 *
 * @example
 * const text = stripHtml('<p>Hello <strong>World</strong></p>');
 * // Returns: 'Hello World'
 */
export function stripHtml(dirty) {
  return sanitizeHtml(dirty, TEXT_ONLY_CONFIG);
}

/**
 * Sanitize a URL to prevent javascript: and data: URIs
 *
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string if invalid
 *
 * @example
 * const safe = sanitizeUrl('javascript:alert("xss")');
 * // Returns: ''
 *
 * const safe2 = sanitizeUrl('https://example.com');
 * // Returns: 'https://example.com'
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }

  // Remove whitespace
  const trimmed = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    console.warn('sanitizeUrl: Blocked dangerous URL protocol', trimmed);
    return '';
  }

  // Allow relative URLs, http, https, mailto, tel
  const allowedPattern = /^(https?:|mailto:|tel:|\/|\.\/|\.\.\/)/i;
  if (!allowedPattern.test(trimmed) && trimmed.length > 0) {
    // If it doesn't match allowed patterns and isn't empty, assume it's relative
    // But be cautious with URLs starting with unusual characters
    if (/^[a-z0-9]/i.test(trimmed)) {
      return trimmed;
    }
    console.warn('sanitizeUrl: Blocked suspicious URL', trimmed);
    return '';
  }

  return trimmed;
}

/**
 * Sanitize user input text (escape HTML entities)
 *
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text with HTML entities escaped
 *
 * @example
 * const safe = sanitizeText('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

/**
 * Sanitize object properties recursively
 * Useful for sanitizing API responses or form data
 *
 * @param {Object} obj - Object to sanitize
 * @param {Function} sanitizer - Sanitization function (default: sanitizeHtml)
 * @returns {Object} Object with sanitized string values
 *
 * @example
 * const clean = sanitizeObject({
 *   name: '<script>alert("xss")</script>John',
 *   bio: '<p>Hello</p>',
 *   nested: { comment: '<img src=x onerror=alert(1)>' }
 * });
 */
export function sanitizeObject(obj, sanitizer = sanitizeHtml) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizer));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a sanitized React component for rendering HTML
 * Use this when you need to render user-generated HTML in React
 *
 * @param {string} html - HTML string to render
 * @param {Object} config - DOMPurify configuration
 * @returns {Object} Props object for dangerouslySetInnerHTML
 *
 * @example
 * function Comment({ content }) {
 *   return <div {...createSafeHtml(content)} />;
 * }
 */
export function createSafeHtml(html, config = DEFAULT_CONFIG) {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHtml(html, config)
    }
  };
}

/**
 * Validate and sanitize email addresses
 *
 * @param {string} email - Email to validate and sanitize
 * @returns {string} Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize filename to prevent path traversal attacks
 *
 * @param {string} filename - Filename to sanitize
 * @returns {string} Safe filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, '');

  // Remove path separators
  safe = safe.replace(/[\/\\]/g, '');

  // Remove dangerous characters
  safe = safe.replace(/[<>:"|?*\x00-\x1F]/g, '');

  // Limit length
  safe = safe.slice(0, 255);

  return safe.trim();
}

// Export DOMPurify instance for advanced usage
export { DOMPurify };

// Export configurations
export const SANITIZE_CONFIGS = {
  DEFAULT: DEFAULT_CONFIG,
  STRICT: STRICT_CONFIG,
  TEXT_ONLY: TEXT_ONLY_CONFIG,
};
