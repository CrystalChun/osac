/**
 * E2E: OIDC sign-in entry — unauthenticated users are redirected to login.
 */
describe('sign-in-entry', () => {
  it('shows redirecting state on the home route when not authenticated', () => {
    cy.intercept('GET', '/api/login/info', { statusCode: 401 }).as('loginInfo');
    cy.intercept(
      {
        method: 'GET',
        pathname: '/api/login',
        query: { redirect_base: /.+/ },
      },
      {
        statusCode: 200,
        body: { url: 'https://idp.example.com/auth' },
      },
    ).as('loginStart');
    cy.visit('/');
    cy.contains('Redirecting to sign in').should('be.visible');
  });
});
