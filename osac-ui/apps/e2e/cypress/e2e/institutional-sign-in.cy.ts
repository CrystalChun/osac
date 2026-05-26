/**
 * E2E: institutional-sign-in (flow id: institutional-sign-in)
 * Covers: auth_sign_in_form step — Vertexa branded surface
 */
describe('institutional-sign-in', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('button', 'Enter').first().click()
  })

  it('shows the Vertexa branded login page', () => {
    cy.contains('Vertexa Cloud Solutions').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
  })

  it('pre-fills the provider admin email', () => {
    cy.get('input[type="email"]').should('have.value', 'alex.johnson@vertexacloud.com')
  })

  it('clicking choose another institution returns to welcome', () => {
    cy.contains('Choose another institution').click()
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`)
  })

  it('submitting the login form triggers loading then navigates to provider dashboard', () => {
    cy.contains('button', 'Log in').click()
    cy.contains('button', 'Log in').should('be.disabled')
    cy.url({ timeout: 5000 }).should('include', '/provider/dashboard')
  })
})
