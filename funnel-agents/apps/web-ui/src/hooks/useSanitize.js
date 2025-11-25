/**
 * @fileoverview React Hook for Content Sanitization
 *
 * Provides easy-to-use React hooks for sanitizing user content
 * to prevent XSS attacks.
 *
 * @module hooks/useSanitize
 */

import { useMemo } from 'react';
import {
  sanitizeHtml,
  sanitizeHtmlStrict,
  stripHtml,
  sanitizeUrl,
  sanitizeText,
  createSafeHtml,
} from '@/utils/sanitize';

/**
 * Hook to sanitize HTML content
 *
 * @param {string} html - HTML content to sanitize
 * @param {Object} config - DOMPurify configuration
 * @returns {string} Sanitized HTML
 *
 * @example
 * function Comment({ userComment }) {
 *   const safeComment = useSanitizeHtml(userComment);
 *   return <div dangerouslySetInnerHTML={{ __html: safeComment }} />;
 * }
 */
export function useSanitizeHtml(html, config) {
  return useMemo(() => {
    if (!html) return '';
    return sanitizeHtml(html, config);
  }, [html, config]);
}

/**
 * Hook to sanitize HTML with strict rules
 *
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML with minimal formatting
 *
 * @example
 * function UserBio({ bio }) {
 *   const safeBio = useSanitizeHtmlStrict(bio);
 *   return <p dangerouslySetInnerHTML={{ __html: safeBio }} />;
 * }
 */
export function useSanitizeHtmlStrict(html) {
  return useMemo(() => {
    if (!html) return '';
    return sanitizeHtmlStrict(html);
  }, [html]);
}

/**
 * Hook to strip all HTML tags
 *
 * @param {string} html - HTML content to strip
 * @returns {string} Plain text without HTML
 *
 * @example
 * function Preview({ content }) {
 *   const plainText = useStripHtml(content);
 *   return <p>{plainText}</p>;
 * }
 */
export function useStripHtml(html) {
  return useMemo(() => {
    if (!html) return '';
    return stripHtml(html);
  }, [html]);
}

/**
 * Hook to sanitize URL
 *
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 *
 * @example
 * function ExternalLink({ href, children }) {
 *   const safeUrl = useSanitizeUrl(href);
 *   return <a href={safeUrl} target="_blank" rel="noopener noreferrer">{children}</a>;
 * }
 */
export function useSanitizeUrl(url) {
  return useMemo(() => {
    if (!url) return '';
    return sanitizeUrl(url);
  }, [url]);
}

/**
 * Hook to sanitize plain text (escape HTML)
 *
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text with HTML entities escaped
 *
 * @example
 * function UserInput({ input }) {
 *   const safeInput = useSanitizeText(input);
 *   return <span dangerouslySetInnerHTML={{ __html: safeInput }} />;
 * }
 */
export function useSanitizeText(text) {
  return useMemo(() => {
    if (!text) return '';
    return sanitizeText(text);
  }, [text]);
}

/**
 * Hook to create safe HTML props object
 * Returns an object that can be spread directly onto a React element
 *
 * @param {string} html - HTML content to sanitize
 * @param {Object} config - DOMPurify configuration
 * @returns {Object} Props object with dangerouslySetInnerHTML
 *
 * @example
 * function RichContent({ content }) {
 *   const safeProps = useSafeHtml(content);
 *   return <div {...safeProps} />;
 * }
 */
export function useSafeHtml(html, config) {
  return useMemo(() => {
    if (!html) return { dangerouslySetInnerHTML: { __html: '' } };
    return createSafeHtml(html, config);
  }, [html, config]);
}

/**
 * Hook to sanitize multiple values at once
 *
 * @param {Object} values - Object with values to sanitize
 * @param {Function} sanitizer - Sanitization function to use
 * @returns {Object} Object with sanitized values
 *
 * @example
 * function UserProfile({ user }) {
 *   const { name, bio, website } = useSanitizeMultiple({
 *     name: user.name,
 *     bio: user.bio,
 *     website: user.website
 *   }, sanitizeHtml);
 *
 *   return (
 *     <div>
 *       <h1 dangerouslySetInnerHTML={{ __html: name }} />
 *       <p dangerouslySetInnerHTML={{ __html: bio }} />
 *       <a href={website}>Website</a>
 *     </div>
 *   );
 * }
 */
export function useSanitizeMultiple(values, sanitizer = sanitizeHtml) {
  return useMemo(() => {
    if (!values || typeof values !== 'object') return {};

    const sanitized = {};
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizer(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }, [values, sanitizer]);
}

/**
 * Default export: comprehensive sanitization hook
 *
 * @param {string} content - Content to sanitize
 * @param {Object} options - Sanitization options
 * @param {string} options.type - Type of sanitization ('html', 'strict', 'text', 'url')
 * @param {Object} options.config - DOMPurify configuration
 * @returns {string} Sanitized content
 *
 * @example
 * function Content({ data, type }) {
 *   const safe = useSanitize(data, { type });
 *   return <div dangerouslySetInnerHTML={{ __html: safe }} />;
 * }
 */
export default function useSanitize(content, options = {}) {
  const { type = 'html', config } = options;

  return useMemo(() => {
    if (!content) return '';

    switch (type) {
      case 'strict':
        return sanitizeHtmlStrict(content);
      case 'text':
        return sanitizeText(content);
      case 'strip':
        return stripHtml(content);
      case 'url':
        return sanitizeUrl(content);
      case 'html':
      default:
        return sanitizeHtml(content, config);
    }
  }, [content, type, config]);
}
