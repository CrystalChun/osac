/**
 * E2E: welcome-and-role-selection (flow id: welcome-and-role-selection)
 * Covers: wrs_welcome_landing step
 */
describe('welcome-and-role-selection', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows welcome heading and demo alert', () => {
    cy.contains('h1', 'Red Hat OSAC Prototypes').should('be.visible')
    cy.contains('Demo entry').should('be.visible')
  })

  it('shows three role columns with titles', () => {
    cy.contains('h2', 'Provider Admin').should('be.visible')
    cy.contains('h2', 'Tenant Admin').should('be.visible')
    cy.contains('h2', 'Tenant User').should('be.visible')
  })

  it('shows tenant org buttons under tenant admin and tenant user', () => {
    cy.get('[data-osac-welcome-role="tenantAdmin"]').within(() => {
      cy.contains('button', 'Northstar Bank').should('be.visible')
      cy.contains('button', 'Bluestone Financial Group').should('be.visible')
    })
    cy.get('[data-osac-welcome-role="tenantUser"]').within(() => {
      cy.contains('button', 'Northstar Bank').should('be.visible')
      cy.contains('button', 'Bluestone Financial Group').should('be.visible')
    })
  })

  it('clicking Enter on provider admin navigates to sign-in', () => {
    cy.contains('button', 'Enter').click()
    cy.url().should('include', '/sign-in')
    cy.contains('Vertexa').should('be.visible')
  })

  it('clicking Northstar Bank under Tenant User navigates to sign-in in the same tab', () => {
    cy.get('[data-osac-welcome-role="tenantUser"]').within(() => {
      cy.contains('button', 'Northstar Bank').click()
    })
    cy.url().should('include', '/sign-in')
    cy.contains('Northstar Bank').should('be.visible')
  })

  it('browser Back returns from sign-in to welcome', () => {
    cy.contains('button', 'Enter').click()
    cy.url().should('include', '/sign-in')
    cy.go('back')
    cy.url().should('match', /\/$/)
    cy.contains('h1', 'Red Hat OSAC Prototypes').should('be.visible')
  })
})
