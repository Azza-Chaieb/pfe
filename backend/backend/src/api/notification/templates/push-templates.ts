/**
 * Templates for Push Notifications (FCM)
 */

export const reservationTemplates = {
  created: (spaceName: string) => ({
    title: "Demande enregistrée 📅",
    body: `Votre demande pour l'espace "${spaceName}" est en attente de validation.`,
  }),
  confirmed: (spaceName: string) => ({
    title: "Réservation confirmée ! ✅",
    body: `Votre réservation pour "${spaceName}" a été validée par notre équipe.`,
  }),
  cancelled: (spaceName: string) => ({
    title: "Réservation annulée ❌",
    body: `Votre réservation pour "${spaceName}" a malheureusement été annulée.`,
  }),
  reminder: (spaceName: string, time: string) => ({
    title: "Rappel de réservation ⏰",
    body: `Votre session à "${spaceName}" commence bientôt (${time}).`,
  }),
};

export const paymentTemplates = {
  submitted: (amount: number) => ({
    title: "Preuve reçue 💳",
    body: `Nous avons bien reçu votre preuve de virement de ${amount} DT.`,
  }),
  confirmed: (amount: number) => ({
    title: "Paiement validé 💰",
    body: `Votre paiement de ${amount} DT a été confirmé avec succès.`,
  }),
};
