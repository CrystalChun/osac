/**
 * Per-tenant branding for institutional sign-in (docs/specs/ui-flows/institutional-sign-in.yaml
 * branding_profiles + pre_login theme/document behavior reflected in layout).
 */
import type { DemoTenantId } from '@osac/api-contracts'
import type { CSSProperties } from 'react'

export type HeaderMarkSpec =
  | {
      kind: 'letter'
      letter: string
      boxGradient: string
      borderRadius: string
    }
  | { kind: 'emoji'; emoji: string }

export interface InstitutionalBranding {
  /** Matches spec branding_profiles[].id */
  profileId: string
  displayName: string
  tagline: string
  cardTitle: string
  emailLabel: string
  emailType: 'email' | 'text'
  showRememberMe: boolean
  pageBackground: string
  titleColor: string
  subtitleColor: string
  cardStyle: CSSProperties
  cardTitleStyle?: CSSProperties
  headerMark: HeaderMarkSpec
}

export const institutionalBrandingByTenant: Record<DemoTenantId, InstitutionalBranding> = {
  vertexa: {
    profileId: 'vertexa_provider',
    displayName: 'Vertexa Cloud Solutions',
    tagline: 'Provider platform portal',
    cardTitle: 'Sign in to your account',
    emailLabel: 'Work email',
    emailType: 'email',
    showRememberMe: false,
    pageBackground: 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)',
    titleColor: '#fff',
    subtitleColor: 'rgba(255,255,255,0.6)',
    cardStyle: { background: 'transparent', border: 'none', boxShadow: 'none' },
    cardTitleStyle: { color: '#fff' },
    headerMark: {
      kind: 'letter',
      letter: 'V',
      boxGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderRadius: '10px',
    },
  },
  northstar: {
    profileId: 'northstar_bank',
    displayName: 'Northstar Bank',
    tagline: 'Smart banking starts here.',
    cardTitle: 'Online banking sign-in',
    emailLabel: 'Username or email',
    emailType: 'email',
    showRememberMe: true,
    pageBackground: 'linear-gradient(180deg, #001f4d 0%, #003380 100%)',
    titleColor: '#fff',
    subtitleColor: 'rgba(255,255,255,0.7)',
    cardStyle: { background: 'transparent', border: 'none', boxShadow: 'none' },
    cardTitleStyle: { color: '#fff' },
    headerMark: { kind: 'emoji', emoji: '⭐' },
  },
  evergreen: {
    profileId: 'bluestone_financial',
    displayName: 'Bluestone Financial Group',
    tagline: 'Secure access to your financial workspace',
    cardTitle: 'Sign in',
    emailLabel: 'Email address',
    emailType: 'email',
    showRememberMe: false,
    pageBackground: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)',
    titleColor: '#0d47a1',
    subtitleColor: '#546e7a',
    cardStyle: { background: 'transparent', border: 'none', boxShadow: 'none' },
    headerMark: {
      kind: 'letter',
      letter: 'B',
      boxGradient: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
      borderRadius: '50%',
    },
  },
}
