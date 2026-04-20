describe('QA Automation - BioBalance Final Check', () => {

  it('Verifica el flujo completo: Login -> Pre-ingreso -> Dashboard', () => {
    cy.visit('http://localhost:3000/login'); 

    // 1. Login
    cy.get('input[type="email"]').should('be.visible').type('test@biobalance.com', { force: true });
    cy.get('input[type="password"]').should('be.visible').type('password123', { force: true });
    cy.get('button').contains('INGRESAR AL SISTEMA').click();

    // 2. Pre-Ingreso
    cy.url({ timeout: 15000 }).should('include', '/pre-ingreso');
    cy.wait(2000);
    cy.contains('button', /Iniciar test/i).should('be.visible').click();

    // 3. Dashboard (Pantalla Principal)
    cy.wait(4000); 
    // Si llegamos a ver la palabra Check-in, el éxito es total
    cy.contains(/Check-in/i, { timeout: 15000 }).should('be.visible');
    
    cy.log('¡SISTEMA VERIFICADO INTEGRALMENTE!');
  });

});