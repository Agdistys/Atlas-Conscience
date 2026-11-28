# Carte et navigation des parcours à plusieurs arrêts — recette V001

ARR-MULTI-02, 22 novembre 2026. Référentiel : [V089](../specifications/OuQuandQui_API_V089_Carte_Navigation_Arrets_2026-11-22.md). Complète la préparation V088 sans migrer son stockage.

| Cas | Résultat attendu |
|---|---|
| Lire une copie avec deux stations de mêmes coordonnées | Carte et liste locales, repère groupé, sélection de chaque station au clavier, aucune requête routière ou tarifaire ni modification de stockage |
| Demander le fond puis recevoir une erreur | Signalement visible, tracé et liste conservés ; masquer puis fermer libère les tuiles |
| Bibliothèque cartographique absente | Schéma ouvert et liste utilisable, commandes de fond indisponibles |
| Trois stations et deux rencontres | Deux liens Google Maps, au plus trois points intermédiaires par lien, tous les points dans l’ordre et jonction partagée |
| Ouvrir la préparation de navigation | Aucun lien actif avant accord ; accord sans requête ; retrait de l’accord retire les destinations |
| Choisir Waze | Une destination identifiée par lien, sans départ imposé ni prétendue transmission de tous les arrêts |
| Changer de copie ou modifier puis confirmer | Anciens liens retirés, nouvel accord nécessaire, anciennes sauvegardes conservées |
| Texte doublé et rotation | Cibles et liste lisibles, commandes accessibles, absence de débordement horizontal |
| Noms contenant du HTML | Texte inerte dans les vues, noms absents des URL |

Commandes ciblées : `node --test tests/multi-map.test.mjs`, `npx playwright test tests/e2e/multi-map.spec.mjs tests/e2e/multi-stops.spec.mjs`. Les deux scénarios essentiels carte locale et navigation segmentée font également partie de la matrice Firefox/WebKit. L’inspection complète, l’assemblage et la publication portent sur le commit exact livré.

Le 22 novembre, les vérifications locales ont réussi : 594 contrôles de modèle, syntaxe et contrat, 84 scénarios Chromium sur quatre formats, quatre scénarios Firefox. Les quatre lancements WebKit locaux ont échoué avant l’ouverture de l’application avec une erreur du navigateur système ; la qualification WebKit reste confiée au conteneur de l’inspection distante, sans neutraliser les tests ni ajouter de relance automatique.

La preuve de publication, les captures ordinateur/mobile et les résultats complets sont archivés dans `quality/multi-map/` et le suivi central de développement. Aucun résultat de guidage natif ou de déplacement sur route n’est déduit d’un lien correctement construit ou d’une ouverture simulée.
