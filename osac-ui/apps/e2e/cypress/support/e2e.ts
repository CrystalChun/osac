/**
 * E2E support — stub authenticated session without a real IdP.
 */
Cypress.Commands.add('loginStub', (username = 'e2e-user@example.com') => {
  cy.intercept('GET', '/api/login/info', {
    statusCode: 200,
    body: { username },
  }).as('loginInfo');
  cy.intercept('GET', '/api/login/refresh', {
    statusCode: 401,
  });
});

Cypress.Commands.add(
  'visitAuthenticated',
  (
    path: string,
    options?: {
      username?: string;
      role?: 'tenantUser' | 'tenantAdmin' | 'providerAdmin';
    },
  ) => {
    const username = options?.username ?? 'e2e-user@example.com';
    const role = options?.role ?? 'tenantUser';
    const tenant = role === 'providerAdmin' ? 'vertexa' : 'northstar';
    cy.loginStub(username);
    cy.visit(path, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('osac.persona', JSON.stringify({ tenant, role }));
      },
    });
  },
);

declare global {
  namespace Cypress {
    interface Chainable {
      loginStub(username?: string): Chainable<void>;
      visitAuthenticated(
        path: string,
        options?: {
          username?: string;
          role?: 'tenantUser' | 'tenantAdmin' | 'providerAdmin';
        },
      ): Chainable<void>;
    }
  }
}

export {};
