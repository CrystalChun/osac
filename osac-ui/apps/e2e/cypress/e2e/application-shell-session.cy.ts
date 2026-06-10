/**
 * E2E: application shell with stubbed OIDC session.
 */
describe('application-shell-session', () => {
  beforeEach(() => {
    cy.visitAuthenticated('/provider/dashboard', {
      username: 'provider.admin@example.com',
      role: 'providerAdmin',
    });
  });

  it('shows masthead with user display name', () => {
    cy.contains('provider.admin@example.com').should('be.visible');
  });

  it('shows sidebar nav with Management group', () => {
    cy.contains('Management').should('be.visible');
    cy.contains('Tenant organizations').should('be.visible');
  });
});
