
export default async ({ strapi }) => {
    const testEmail = 'votre-email@exemple.com'; // À MODIFIER PAR L'UTILISATEUR

    console.log('--- DÉBUT DES TESTS EMAILS ---');

    // 1. Trouver un utilisateur test
    const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: testEmail }
    });

    if (!user) {
        console.error(`Utilisateur non trouvé pour l'email: ${testEmail}`);
        return;
    }

    const emailService = strapi.service('api::email.email-service');

    // Test Reservation
    console.log('Envoi test Réservation...');
    await emailService.sendReservationConfirmation(testEmail, user.fullname || user.username, {
        spaceName: 'Espace Solaire - Test',
        date: 'Lundi 17 Février 2025',
        startTime: '09:00',
        endTime: '18:00',
        location: 'Tunis',
        reservationId: 'TEST-123'
    });

    // Test Payment
    console.log('Envoi test Paiement...');
    await emailService.sendPaymentConfirmation(testEmail, user.fullname || user.username, {
        paymentId: 'PAY-TEST-999',
        amount: '50 DT',
        date: '14 Février 2025',
        itemDescription: 'Abonnement Coworking - Pack Test',
        userName: user.fullname || user.username
    });

    console.log('--- TESTS TERMINÉS - Vérifiez votre boîte mail ---');
};
