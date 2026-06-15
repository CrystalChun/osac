import type { ReactNode } from 'react';

import './PageDataSection.css';

interface PageDataSectionProps {
  children: ReactNode;
  className?: string;
  /** When true, scrolls internally when content overflows the viewport. */
  scrollable?: boolean;
}

export const PageDataSection = ({
  children,
  className,
  scrollable = false,
}: PageDataSectionProps) => {
  const classNames = [
    'osac-page-data-section',
    scrollable ? 'osac-page-data-section--scrollable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classNames}>{children}</div>;
};
