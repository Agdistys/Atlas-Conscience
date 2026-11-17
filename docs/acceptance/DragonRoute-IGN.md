# DragonRoute — Véhicule léger sans autoroute via IGN

Lot du 17 novembre 2026, préparé depuis `main` `1df1b43051c040b9c8ad9283abcba63cafe4336d`. Complète les recettes de septembre ; leurs constats de disponibilité restent datés.

## Comportement attendu

Sans serveur avancé configuré, « Les autoroutes » devient sélectionnable en véhicule léger. « Les péages », « Les ferries » et les véhicules non pris en charge gardent un état indisponible visible. Aucun compte technique n’est requis. Décocher l’option invalide le trajet et les stations précédents avant un nouveau calcul standard.

Le trajet, la comparaison des stations et l’arrêt sélectionné emploient la même exclusion. Les erreurs et réponses incohérentes arrêtent le calcul, sans trajet standard de substitution. Péages inconnus et total incomplet demeurent affichés.

## Recette reproductible

`npm install --no-audit --no-fund`, `npx playwright install chromium`, `npm run inspect`, `npm run test:preview`.

Alternative locale : `PLAYWRIGHT_CHANNEL=chrome npm run inspect` utilise Chrome déjà installé. La CI conserve Chromium fourni par Playwright. Le téléchargement local de Chromium a rencontré un espace disque insuffisant ; il a été interrompu sans suppression de fichiers utilisateur.

`tests/e2e/ign.spec.mjs` couvre sur les quatre formats existants :

- trajet, ordre des coordonnées, unités, exclusion et passages intermédiaires ; absence de matrice/route OSRM ; cache, temporisation, sélection/retrait de l’arrêt et changement d’option ; accessibilité et débordements ;
- panne, quota sans répétition, mauvaise unité, exclusion absente, portions incohérentes, géométrie absente et rattachement distant ; relance réussie ;
- recherche de stations en panne ou annulée : conservation du seul trajet de base ;
- tentative d’option non prise en charge refusée avant appel ; désactivation du connecteur possible en configuration.

La migration du cache PWA conserve les caches des autres applications et remplace l’ancien shell. Les scénarios ORS, profils, géocodage, budget, autonomie et carte restent exécutés par Inspectrice.

## Observations du service réel

Le 17 novembre 2026, appels sans clé sur les coordonnées de centres-villes Lyon `4.8357,45.764` et Valence `4.8924,44.9334` :

| Calcul IGN | Distance renvoyée | Durée renvoyée |
|---|---:|---:|
| Standard, sans contrainte | 102 001,8 m | 5 334 s |
| Exclusion autoroute | 116 847,4 m | 8 781,6 s |

Les réponses annoncent `resourceVersion=2026-11-17`, unités mètres/secondes et `Access-Control-Allow-Origin: *`. L’exclusion est renvoyée dans la réponse contrainte. Un appel via le point `4.871,45.4` confirme deux portions avec `getSteps=false` et conserve l’exclusion ; ce point technique n’est pas présenté comme une station réelle. Le résultat via est plus court mais plus lent que la référence : l’application doit l’exclure de son classement plutôt que produire un détour négatif.

Ces observations établissent l’accès au service et la différence des calculs. Elles ne constituent pas une inspection de chaque tronçon sur le terrain. Les métriques sont datées et ne sont pas des durées avec trafic réel.

Essai dans Chrome le même jour : trajet sans autoroute affiché à **116,8 km / 146 min**, 20 stations comparées parmi 156 reçues, 22 objets de carte relevés et aucune erreur JavaScript. IGN, carburants et Leaflet sont réels ; le géocodage a été remplacé par les deux coordonnées publiques fixes ci-dessus pour isoler cette intégration. Les 21 réponses IGN (trajet + 20 passages en station) confirment l’exclusion. Il ne s’agit pas d’une validation du géocodage ni d’un essai routier.

## Limites

Pas d’exclusion des seuls péages, de tarif automatique, de certificat caravanes/poids lourds, de détection des routes non revêtues ou d’alternative IGN dans ce lot. Les contrôles navigateur utilisent des données simulées ; les essais réels sont rapportés séparément. La charge agrégée de plusieurs onglets ou utilisateurs n’est pas limitée globalement par ce code client.

Référentiel : [Sources et services publics V001](../specifications/OuQuandQui_API_V001_2026-11-17.md).
