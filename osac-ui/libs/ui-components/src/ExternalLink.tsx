import type { ReactNode } from 'react';

import { toSafeExternalUrl } from './safeExternalUrl';

interface ExternalLinkProps {
  href?: string;
  children?: ReactNode;
  fallback?: ReactNode;
  /** When the URL fails validation, render the raw value as plain text instead of the fallback. */
  showUnsafeAsText?: boolean;
}

export const ExternalLink = ({
  href,
  children,
  fallback = '—',
  showUnsafeAsText = false,
}: ExternalLinkProps) => {
  const safeHref = toSafeExternalUrl(href);
  const label = children ?? href;

  if (safeHref) {
    return (
      <a href={safeHref} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  if (showUnsafeAsText && href) {
    return <>{href}</>;
  }

  return <>{fallback}</>;
};
