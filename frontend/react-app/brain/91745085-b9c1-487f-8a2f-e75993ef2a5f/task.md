# US-029: Build course player interface (TERMINÉE ✅)

- [x] Créer le composant `CoursePlayer.jsx`
- [x] Concevoir la barre latérale des leçons avec navigation
- [x] Ajouter un fil d'Ariane (breadcrumb)
- [x] Implémenter les boutons de leçon précédente/suivante
- [x] Afficher la barre de progression
- [x] Ajouter la fonctionnalité « Marquer comme terminé »
- [x] Mettre à jour les routes dans `App.jsx` pour inclure le lecteur de cours

# TASK-075: Implement video player for lessons (TERMINÉE ✅)
- [x] Installer la bibliothèque `react-player`
- [x] Intégrer `ReactPlayer` dans la zone de contenu de `CoursePlayer.jsx`
- [x] Activer les commandes de lecture/pause, recherche, vitesse et plein écran
- [x] Implémenter le suivi de la progression de la vidéo

# TASK-076: Add document viewer for course materials (TERMINÉE ✅)
- [x] Installer la bibliothèque `react-pdf`
- [x] Intégrer la visionneuse PDF pour les leçons de type "document"
- [x] Ajouter les options de téléchargement et d'impression
- [x] Implémenter les commandes de zoom (avant/arrière)
- [x] Gérer l'affichage d'autres formats si nécessaire (images)

# TASK-077: Implement progress tracking (TERMINÉE ✅)
- [x] Mettre à jour le schéma `enrollment` avec `lesson_progress` (JSON)
- [x] Créer le contrôleur et la route `POST /api/enrollments/update-progress`
- [x] Charger la progression (`lesson_progress`) au montage de `CoursePlayer.jsx`
- [x] Mettre à jour l'interface (video watchTime, status complété) selon les données API
- [x] Lier la progression vidéo en temps réel et le bouton 'Marquer comme terminé' à la nouvelle API
- [x] Mettre à jour le pourcentage global sur le lecteur


# US-031: En tant qu'enseignant, je souhaite gérer des groupes d'étudiants afin d'organiser les classes (NOUVEAU 🆕)

## TASK-081: Concevoir le modèle de base de données pour les groupes d'étudiants
- [ ] Définir la table `StudentGroup` (nom, description, enseignant).
- [ ] Créer la relation `GroupMember` (jonction avec les utilisateurs).
- [ ] Ajouter un champ pour la capacité du groupe.
- [ ] Prévoir le support pour la messagerie de groupe (relation/champ dédié).
- [ ] Ajouter le suivi des devoirs/affectations par groupe.

# US-030: Créer des sessions de formation en direct (EN COURS DE VÉRIFICATION 🔄)

## TASK-078: Concevoir un modèle de base de données (TERMINÉE ✅)
- [x] Définir la table `session` (date, heure, durée) dans Strapi.
- [x] Ajouter l'énumération `SessionType` (webinaire, atelier).
- [x] Créer le suivi des inscriptions (`students` relation).
- [x] Ajouter un champ `meetingUrl` (lien visioconférence).
- [x] Créer un suivi de présence (`attendance` JSON).

## TASK-079: Créer des API de gestion de session (TERMINÉE ✅)
- [x] Créer les points de terminaison API (`create-live`, `mine`, `register`, `attendance`).
- [x] Gérer les limites de capacité et les inscriptions.
- [x] Déboguer et finaliser les permissions Strapi 5.
- [x] Préparer la logique des rappels de session (squelette d'envoi).

## TASK-080: Créer une interface de planification (TERMINÉE ✅)
- [x] Créer le composant `LiveSessionModal.jsx` et l'intégrer au dashboard.
- [x] Concevoir le formulaire de création (titre, cours, capacité).
- [x] Ajouter un sélecteur de date et d’heure.
- [x] Lier l’outil de visioconférence (`meetingUrl`).
- [x] Ajouter l'option de session récurrente (UI).
