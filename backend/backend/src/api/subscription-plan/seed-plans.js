/**
 * TÂCHE-056 : Script de seed pour les plans d'abonnement
 * 
 * Usage: Exécuter ce script depuis la console Node.js de Strapi
 * OU copier/coller dans un fichier bootstrap.ts temporaire
 * 
 * Plans définis selon les spécifications fonctionnelles:
 * - Basique  : 5 réservations/mois, 10h de salles de réunion
 * - Premium  : 20 réservations/mois, 50h de salles de réunion
 * - Entreprise: Réservations illimitées
 */

const SUBSCRIPTION_PLANS = [
    {
        name: 'Basique',
        description: 'Idéal pour les freelances et travailleurs indépendants.',
        price: 49,
        duration_days: 30,
        type: 'basic',
        max_credits: 5,
        features: [
            '5 réservations/mois',
            '10 heures de salle de réunion',
            'Accès open-space en semaine',
            'WiFi haut débit',
            'Café et thé inclus',
            'Support par email',
        ],
        publishedAt: new Date().toISOString(),
    },
    {
        name: 'Premium',
        description: 'Le meilleur rapport qualité/prix pour les professionnels actifs.',
        price: 99,
        duration_days: 30,
        type: 'premium',
        max_credits: 20,
        features: [
            '20 réservations/mois',
            '50 heures de salle de réunion',
            'Accès open-space 7j/7',
            'Bureau semi-privatif',
            'Impression 100 pages/mois',
            'Casier personnel',
            'Support prioritaire',
        ],
        publishedAt: new Date().toISOString(),
    },
    {
        name: 'Entreprise',
        description: 'Pour les équipes et entreprises avec des besoins intensifs.',
        price: 199,
        duration_days: 30,
        type: 'enterprise',
        max_credits: 9999, // illimité
        features: [
            'Réservations illimitées',
            'Accès 24h/7j à tous les espaces',
            'Bureau privatif dédié',
            'Salles de réunion illimitées',
            'Impression illimitée',
            'Domiciliation commerciale',
            'Gestionnaire de compte dédié',
            'Facturation mensuelle entreprise',
        ],
        publishedAt: new Date().toISOString(),
    },
];

/**
 * Fonction à appeler depuis bootstrap.ts ou un script Node.js Strapi
 */
async function seedSubscriptionPlans(strapi) {
    console.log('[Seed] Vérification des plans d\'abonnement existants...');

    for (const plan of SUBSCRIPTION_PLANS) {
        const existing = await strapi.entityService.findMany('api::subscription-plan.subscription-plan', {
            filters: { name: plan.name },
        });

        if (existing && existing.length > 0) {
            console.log(`[Seed] Plan "${plan.name}" existe déjà, mise à jour...`);
            await strapi.entityService.update('api::subscription-plan.subscription-plan', existing[0].id, {
                data: plan,
            });
        } else {
            console.log(`[Seed] Création du plan "${plan.name}"...`);
            await strapi.entityService.create('api::subscription-plan.subscription-plan', {
                data: plan,
            });
        }
    }

    console.log('[Seed] ✅ Plans d\'abonnement configurés avec succès !');
}

module.exports = { seedSubscriptionPlans, SUBSCRIPTION_PLANS };
