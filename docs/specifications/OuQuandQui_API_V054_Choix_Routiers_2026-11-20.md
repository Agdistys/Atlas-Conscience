# OùQuandQui — Comparer les choix routiers

V054 · 20 novembre 2026 · BOU-CHOIX-ROUTIERS-01. Complète TRA-01/03/04/08 et BOU-01/02/05/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [critères V021](OuQuandQui_API_V021_Criteres_Routiers_2026-11-18.md) et les comparateurs existants. Les éditions précédentes sont conservées.

## Parcours livré

Après le calcul d’un trajet routier, « Comparer plus rapide / plus court » ouvre un panneau. Son ouverture ne déclenche aucun calcul ni enregistrement. Le trajet courant reste affiché jusqu’à l’adoption explicite d’un résultat.

Les points de départ et d’arrivée déjà confirmés, le véhicule et ses dimensions disponibles, les exclusions et le carburant sont conservés. Le panneau compare deux trajets directs : rencontres, arrêt carburant et pauses ne sont pas intégrés dans leurs métriques. Une confirmation est nécessaire pour retirer les rencontres ou leur brouillon, les stations comparées, l’arrêt et les péages liés au trajet précédent.

Le départ prévu, l’heure limite facultative et la consommation sont initialisés depuis la page. Le prix carburant commence vide : aucune reprise silencieuse du prix d’une station ou d’un ancien budget. Une même hypothèse de consommation et de prix est appliquée aux deux résultats, pour le véhicule entier.

## Calcul et capacités

Une demande explicite lance les deux critères séparément et séquentiellement. Le critère durée utilise le raccordement déjà disponible : OSRM standard, IGN lorsque l’autoroute est exclue, ou relais OpenRouteService configuré. Le critère distance utilise IGN, uniquement pour un véhicule léger et les exclusions déjà qualifiées. Les contraintes incompatibles, véhicules non pris en charge ou services désactivés restent indisponibles ; aucun remplacement par une route voiture standard.

La consultation peut réutiliser le cache existant du moteur, séparé par points, profil, critère et exclusions. Sa possibilité est indiquée avec la date d’obtention du résultat. Aucun rafraîchissement automatique ni répétition après erreur. Un quota IGN sur le premier calcul empêche la seconde demande IGN de ce groupe.

Les résultats exigent des métriques finies et positives ou nulles, un tracé géographique valide et des extrémités à moins de 500 mètres des points confirmés. Une réponse incohérente devient indisponible. Les validations spécifiques des adaptateurs restent actives.

Les moteurs et leurs réseaux peuvent différer. « Plus rapide » et « plus court » nomment des critères demandés ; ils ne garantissent ni un optimum entre tous les réseaux ni une route plus large ou plus sûre. Le routage caravane, le sans-péage public et les restrictions poids lourd ne deviennent pas disponibles par ce comparateur.

## Présentation et calculs

Chaque résultat indique son critère, moteur, exclusions, date d’obtention, distance en kilomètres, durée de conduite estimée, litres consommés et coût carburant si le prix personnel est renseigné. L’arrivée estimée reprend le modèle horaire existant, sans pauses ni trafic en direct.

Formules : litres = kilomètres × consommation / 100 ; carburant = litres × prix. Le plein acheté n’est pas ajouté à la consommation du trajet. Péages, stationnement et autres frais demeurent inconnus, donc le budget total est incomplet. Aucun classement par coût total ni score pondéré.

Le tri local porte uniquement sur les durées affichées (minutes arrondies au supérieur) ou distances affichées (0,1 km). Les ex æquo restent signalés. L’ordre par défaut est la durée, puis le critère durée en cas d’égalité. Les écarts « plus court moins plus rapide » soustraient les valeurs à la précision affichée, coût carburant au centime ; un prix absent donne un écart inconnu, jamais zéro.

Deux géométries exactement identiques sont réunies dans une carte avec les deux critères. Si leurs métriques diffèrent, les valeurs restent séparées. Des tracés qui partagent seulement leurs extrémités ne sont pas fusionnés.

## Arrivée limite et états incomplets

Le filtre horaire est facultatif et demande une heure limite. Un résultat en retard ou d’arrivée inconnue reste consultable mais son adoption est désactivée lorsque le filtre est actif. La comparaison à l’heure limite précède l’arrondi d’affichage ; l’égalité exacte est admissible. Sans filtre, les résultats disponibles restent sélectionnables.

Le changement de tri ou l’activation du filtre après calcul ne demande pas de route supplémentaire. Une modification des hypothèses ou du contexte retire les résultats devenus périmés et demande une nouvelle comparaison explicite.

Une panne peut laisser un seul critère utilisable ; deux erreurs laissent le trajet actuel intact. Le calcul et les paramètres concurrents sont verrouillés pendant la demande. Annuler ou fermer le panneau interrompt le groupe. Une réponse tardive ne reconstitue pas les cartes ni ne remplace le trajet affiché. La fermeture rend le focus au bouton d’accès après déverrouillage.

## Adoption et données

Choisir un résultat ne relance pas le routage. La carte, les kilomètres, la durée, le critère courant, l’arrivée et le budget reprennent le résultat choisi et ses hypothèses. Les comparaisons, rencontres, arrêt et tarifs précédents sont retirés après confirmation quand nécessaire. Les stations doivent être recherchées sur le nouveau trajet ; leurs calculs conservent le critère et les exclusions adoptés.

La navigation et l’export GPX utilisent le tracé retenu. Une préparation sauvegardée explicitement conserve son critère et son instantané. Les sauvegardes déjà présentes, le profil et le journal ne sont pas modifiés automatiquement ; aucun nouveau format de stockage.

Les appels transmettent aux moteurs les points et contraintes de routage selon les raccordements décrits dans [Sources et données V053](OuQuandQui_API_V053_Sources_Donnees_2026-11-19.md). Prix personnel, consommation, échéance et comparaison des coûts restent locaux. Aucun fournisseur ou relais activé par ce lot.

## Vérification

Contrôles du modèle : bornes, heures ambiguës, données absentes, regroupement géométrique, tri stable, égalités, écarts, échéance exacte, métriques et extrémités.

Recette automatisée navigateur sur quatre formats : ouverture sans appel, deux moteurs, adoption et budget, géométrie identique, exclusions et stations, échéance, entrées invalides, panne partielle, service désactivé, quota, annulation, fermeture, réponse tardive, hypothèses modifiées, conservation au refus, sauvegarde/GPX, deux pannes, brouillon de rencontre, profil poids lourd simulé sans substitution et réponse au mauvais lieu. Les raccordements des tests sont simulés ; ils ne qualifient pas un relais public absent.

L’inspection de la révision publiée et la recette avec lieux publics sont consignées dans le suivi de développement. Aucune certification d’accessibilité, validation sur téléphone physique, garantie de praticabilité ou déplacement réel n’est déduite des tests.

## Références et limites maintenues

- [API OSRM — Route service](https://project-osrm.org/docs/v5.24.0/api/#route-service) : durée, géométrie et alternatives selon le moteur ; alternatives non garanties.
- [Capacités du service IGN](https://data.geopf.fr/navigation/getCapabilities) : profils, critères et contraintes du service. Copie consultée le 20 novembre 2026, conservée dans les preuves locales du lot.

Le calcul économique complet avec et sans péages (PEA-03) reste distinct. Éviter l’autoroute n’équivaut pas à éviter les péages. Les simulations de relais ne constituent ni leur activation ni une autorisation de coût.
