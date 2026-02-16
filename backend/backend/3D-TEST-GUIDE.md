# Guide de Test 3D (Réservation & Étages)

Pour tester votre scène 3D avec le modèle `test_space_floors.gltf` généré, suivez ces étapes :

## 1. Import du Modèle

1. Lancez votre serveur Strapi.
2. Allez dans la **Media Library**.
3. Importez le fichier `test_space_floors.gltf` situé dans `backend/backend/`.
4. Allez dans votre collection **Coworking Spaces**.
5. Modifiez un centre existant (ou créez-en un) et ajoutez le fichier importé dans la section **Models**.

## 2. Configuration des Sous-Espaces

Pour que les objets soient cliquables, créez des entrées dans la collection **Spaces** avec ces `mesh_name` :

| Nom dans Strapi | mesh_name (CRITIQUE) | Étage (floor) |
| :-------------- | :------------------- | :------------ |
| Bureau Alpha    | `Bureau_101`         | 0             |
| Bureau Beta     | `Bureau_201`         | 1             |

Assurez-vous que ces `Spaces` sont liés au `Coworking Space` où vous avez chargé le modèle.

## 3. Test dans le Frontend

1. Allez sur la page `/spaces` de votre application React.
2. Cliquez sur "Explorer" pour le centre configuré.
3. **Navigation par étages** : Utilisez le sélecteur à gauche. Cliquer sur "1" doit estomper le RDC et afficher le bureau du haut.
4. **Réservation** : Cliquez sur un cube bleu. Le panneau latéral doit s'ouvrir avec les informations du bureau correspondant.
