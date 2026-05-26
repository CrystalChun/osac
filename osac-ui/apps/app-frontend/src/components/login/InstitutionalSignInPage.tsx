/**
 * flow: institutional-sign-in
 * step: auth_sign_in_form
 *
 * Single shell (spec sign_in_shell.component: InstitutionalSignInPage); branding from
 * institutionalBrandingByTenant keyed by session selectedTenant (vertexa | northstar | evergreen).
 */
import {
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Page,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { LoginForm } from './LoginForm'
import { useSession } from '../../contexts/SessionContext'
import type { HeaderMarkSpec } from './institutionalBranding'
import { institutionalBrandingByTenant } from './institutionalBranding'

interface Props {
  defaultEmail: string
  onLoginSuccess: (email: string, password: string) => void
  onChooseAnother: () => void
  trustedIssuers?: string[]
  submitError?: string | null
}

function renderHeaderMark(spec: HeaderMarkSpec) {
  if (spec.kind === 'emoji') {
    return (
      <Content
        component="small"
        style={{ fontSize: '2.5rem', lineHeight: 1, margin: 0, display: 'inline-block' }}
      >
        {spec.emoji}
      </Content>
    )
  }
  return (
    <Bullseye
      style={{
        width: 40,
        height: 40,
        borderRadius: spec.borderRadius,
        background: spec.boxGradient,
        color: '#fff',
        fontWeight: 700,
        fontSize: spec.borderRadius === '50%' ? '1.1rem' : '1.2rem',
      }}
    >
      {spec.letter}
    </Bullseye>
  )
}

export function InstitutionalSignInPage({
  defaultEmail,
  onLoginSuccess,
  onChooseAnother,
  trustedIssuers,
  submitError,
}: Props) {
  const { selectedTenant, isLoginLoading } = useSession()

  if (!selectedTenant) {
    return null
  }

  const branding = institutionalBrandingByTenant[selectedTenant]

  return (
    <Page style={{ minHeight: '100%', background: branding.pageBackground }}>
      <PageSection style={{ background: branding.pageBackground }} isFilled>
        <Bullseye style={{ minHeight: '100%' }}>
          <Stack hasGutter style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
            <StackItem>
              <Stack hasGutter>
                <StackItem>
                  <Flex
                    justifyContent={{ default: 'justifyContentCenter' }}
                    alignItems={{ default: 'alignItemsCenter' }}
                    spaceItems={{ default: 'spaceItemsSm' }}
                  >
                    <FlexItem>{renderHeaderMark(branding.headerMark)}</FlexItem>
                    <FlexItem>
                      <Title
                        headingLevel="h1"
                        size="xl"
                        style={{ color: branding.titleColor, margin: 0 }}
                      >
                        {branding.displayName}
                      </Title>
                    </FlexItem>
                  </Flex>
                </StackItem>
                <StackItem>
                  <Content component="p" style={{ color: branding.subtitleColor, margin: 0 }}>
                    {branding.tagline}
                  </Content>
                </StackItem>
              </Stack>
            </StackItem>

            <StackItem>
              <Card style={branding.cardStyle}>
                <CardHeader>
                  <CardTitle style={branding.cardTitleStyle}>{branding.cardTitle}</CardTitle>
                </CardHeader>
                <CardBody>
                  <LoginForm
                    defaultEmail={defaultEmail}
                    emailLabel={branding.emailLabel}
                    emailType={branding.emailType}
                    showRememberMe={branding.showRememberMe}
                    isLoading={isLoginLoading}
                    onSubmit={onLoginSuccess}
                    onChooseAnother={onChooseAnother}
                    trustedIssuers={trustedIssuers}
                    submitError={submitError}
                  />
                </CardBody>
              </Card>
            </StackItem>
          </Stack>
        </Bullseye>
      </PageSection>
    </Page>
  )
}
