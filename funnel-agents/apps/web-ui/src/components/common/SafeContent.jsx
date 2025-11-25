/**
 * @fileoverview SafeContent Components
 *
 * Pre-built React components that automatically sanitize user-generated content
 * to prevent XSS attacks. Use these components whenever displaying untrusted content.
 *
 * @module components/common/SafeContent
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  useSanitizeHtml,
  useSanitizeHtmlStrict,
  useStripHtml,
  useSanitizeUrl,
  useSafeHtml,
} from '@/hooks/useSanitize';

/**
 * SafeHtml - Renders sanitized HTML content
 *
 * @example
 * <SafeHtml html={userGeneratedHtml} />
 */
export function SafeHtml({ html, strict = false, className = '', ...props }) {
  // Always call both hooks unconditionally
  const sanitizedStrict = useSanitizeHtmlStrict(html);
  const sanitized = useSanitizeHtml(html);

  // Choose which sanitized content to use based on strict flag
  const finalSanitized = strict ? sanitizedStrict : sanitized;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: finalSanitized }}
      {...props}
    />
  );
}

SafeHtml.propTypes = {
  html: PropTypes.string.isRequired,
  strict: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * SafeText - Renders plain text from HTML (strips all tags)
 *
 * @example
 * <SafeText html={userHtml} />
 */
export function SafeText({ html, className = '', as: Component = 'p', ...props }) {
  const text = useStripHtml(html);

  return (
    <Component className={className} {...props}>
      {text}
    </Component>
  );
}

SafeText.propTypes = {
  html: PropTypes.string.isRequired,
  className: PropTypes.string,
  as: PropTypes.elementType,
};

/**
 * SafeLink - Renders a safe external link
 * Automatically sanitizes URL and adds security attributes
 *
 * @example
 * <SafeLink href={userProvidedUrl}>Visit Website</SafeLink>
 */
export function SafeLink({
  href,
  children,
  className = '',
  target = '_blank',
  ...props
}) {
  const safeUrl = useSanitizeUrl(href);

  // If URL is invalid after sanitization, render text only
  if (!safeUrl) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={safeUrl}
      className={className}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
}

SafeLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  target: PropTypes.string,
};

/**
 * SafeImage - Renders an image with sanitized src
 *
 * @example
 * <SafeImage src={userImageUrl} alt="User avatar" />
 */
export function SafeImage({
  src,
  alt = '',
  className = '',
  fallbackSrc = '/images/placeholder.png',
  ...props
}) {
  const safeSrc = useSanitizeUrl(src);
  const [imgSrc, setImgSrc] = React.useState(safeSrc || fallbackSrc);
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

SafeImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  fallbackSrc: PropTypes.string,
};

/**
 * SafeUserContent - Comprehensive component for user-generated content
 * Combines all safety features and provides consistent styling
 *
 * @example
 * <SafeUserContent
 *   content={userComment}
 *   author={userName}
 *   timestamp={commentDate}
 * />
 */
export function SafeUserContent({
  content,
  author,
  timestamp,
  avatar,
  className = '',
  contentClassName = '',
  strict = false,
}) {
  // Always call both hooks unconditionally
  const safeContentStrict = useSanitizeHtmlStrict(content);
  const safeContentNormal = useSanitizeHtml(content);

  // Choose which sanitized content to use based on strict flag
  const safeContent = strict ? safeContentStrict : safeContentNormal;
  const safeAvatar = useSanitizeUrl(avatar);

  return (
    <div className={`safe-user-content ${className}`}>
      {(author || avatar) && (
        <div className="safe-user-content__header">
          {safeAvatar && (
            <SafeImage
              src={safeAvatar}
              alt={`${author}'s avatar`}
              className="safe-user-content__avatar"
            />
          )}
          {author && (
            <div className="safe-user-content__meta">
              <span className="safe-user-content__author">{author}</span>
              {timestamp && (
                <span className="safe-user-content__timestamp">
                  {new Date(timestamp).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <div
        className={`safe-user-content__body ${contentClassName}`}
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />
    </div>
  );
}

SafeUserContent.propTypes = {
  content: PropTypes.string.isRequired,
  author: PropTypes.string,
  timestamp: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
  avatar: PropTypes.string,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  strict: PropTypes.bool,
};

/**
 * SafeMarkdown - Renders markdown content safely
 * Note: Requires markdown parser integration (react-markdown recommended)
 *
 * @example
 * <SafeMarkdown markdown={userMarkdown} />
 */
export function SafeMarkdown({ markdown, className = '', ...props }) {
  // Using basic HTML sanitization as fallback
  // In production, integrate with react-markdown for proper parsing
  const safeHtml = useSanitizeHtml(markdown);

  return (
    <div
      className={`safe-markdown ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      {...props}
    />
  );
}

SafeMarkdown.propTypes = {
  markdown: PropTypes.string.isRequired,
  className: PropTypes.string,
};

/**
 * SafeRichText - Component for rich text editor output
 * Uses strict sanitization by default
 *
 * @example
 * <SafeRichText html={richEditorContent} />
 */
export function SafeRichText({ html, className = '', allowedTags, ...props }) {
  const safeProps = useSafeHtml(html, allowedTags ? { ALLOWED_TAGS: allowedTags } : undefined);

  return (
    <div
      className={`safe-rich-text ${className}`}
      {...safeProps}
      {...props}
    />
  );
}

SafeRichText.propTypes = {
  html: PropTypes.string.isRequired,
  className: PropTypes.string,
  allowedTags: PropTypes.arrayOf(PropTypes.string),
};

// Export all components
export default {
  SafeHtml,
  SafeText,
  SafeLink,
  SafeImage,
  SafeUserContent,
  SafeMarkdown,
  SafeRichText,
};
