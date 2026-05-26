/**
 * E2E: application-shell-session (flow id: application-shell-session)
 * Covers: shell_primary_workspace after login as provider admin
 */
function loginAsProviderAdmin() {
  cy.visit('/')
  cy.contains('button', 'Enter').first().click()
  cy.contains('button', 'Log in').click()
  cy.url({ timeout: 5000 }).should('include', '/provider/dashboard')
}

describe('application-shell-session', () => {
  beforeEach(loginAsProviderAdmin)

  it('shows masthead with provider operating mode label', () => {
    cy.contains('Provider console').should('be.visible')
  })

  it('shows sidebar nav with Management and System groups', () => {
    cy.contains('Management').should('be.visible')
    cy.contains('System').should('be.visible')
  })

  it('navigates to tenant organizations page', () => {
    cy.contains('Tenant organizations').click()
    cy.url().should('include', '/provider/organizations')
  })

  it('navigates to recent activities via bell icon', () => {
    cy.get('[aria-label="Recent activities"]').click()
    cy.url().should('include', '/activities')
    cy.contains('Recent activities').should('be.visible')
  })

  it('logs out and returns to welcome page', () => {
    cy.get('[aria-label="Account menu"]').click()
    cy.contains('Log out').click()
    cy.url({ timeout: 3000 }).should('eq', `${Cypress.config('baseUrl')}/`)
  })
})
