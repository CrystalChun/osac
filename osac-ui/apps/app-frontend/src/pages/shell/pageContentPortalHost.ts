/** DOM host for overlays that should cover page content only (masthead + sidebar stay visible). */
export const PAGE_CONTENT_PORTAL_HOST_ID = 'osac-page-content-portal-host';

export const getPageContentPortalHost = (): HTMLElement | null => {
  return document.getElementById(PAGE_CONTENT_PORTAL_HOST_ID);
};
