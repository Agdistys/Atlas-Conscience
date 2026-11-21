# Stations — détour, services et couverture

Lot STA-FILTRES-01, 18 novembre 2026. Référence : cahier des charges V5, STA-06/10/12 et CAL-08/09/10. Ce lot ne clôt pas toutes les fonctions prévues par STA-10 : enseignes exclues et ouverture à l’arrivée restent à développer.

## Comportement livré

Après le calcul du trajet, la recherche conserve les accès routiers comparables. « Filtrer les stations » limite leur détour supplémentaire en kilomètres et/ou minutes. Un champ vide signifie sans limite ; zéro est une limite réelle. Valeur négative ou hors plage : résultat bloqué avec explication, jamais ignoré silencieusement.

Les services proposés viennent exclusivement des déclarations reçues pour les stations comparées. Tous les services cochés sont requis. Liste absente ou vide : services non renseignés. Liste connue sans le service demandé : service non déclaré, sans affirmer son absence réelle. Ces deux exclusions sont comptées séparément. Aucun horaire ou état d’ouverture n’est déduit de ces services. Les choix cochés restent actifs lors d’une nouvelle recherche, même s’ils n’apparaissent plus dans la nouvelle réponse.

Carte, compteurs, badges et liste utilisent le même ensemble filtré, y compris le filtre d’autonomie. Les numéros restent stables pendant la recherche. Toutes les stations éligibles sont accessibles dans la liste ; tris par distance depuis le départ, achat + carburant du détour, prix au litre ou durée du détour. Les égalités de prix au millième portent toutes le badge Pompe ; les minima de coût au centime et de durée portent leurs badges respectifs. Optimal désigne seulement le meilleur coût achat + carburant du détour parmi les stations comparées qui satisfont les critères ; péages et autres frais restent exclus.

En mode sélection, la liste regroupe sans doublon les recommandations et, pour « au plus tôt », les trois premiers accès. Les compteurs annoncent séparément points de carte et fiches. Un arrêt déjà choisi puis exclu par un filtre demeure dans le trajet : un message explicite et son point le distinguent des résultats. Il peut être retiré sans effacer les critères.

Un résultat vide explique la situation. Réinitialiser efface les limites de détour, services cochés et filtre strict d’autonomie ; la saisie de l’autonomie, le trajet et les calculs reçus sont conservés. Aucun appel réseau, recalcul ou élargissement implicite n’est déclenché par un filtre, un tri ou sa réinitialisation.

## Couverture et limites

Le compteur des stations reçues correspond aux stations uniques avec un prix exploitable pour le carburant choisi, retenues dans le corridor. Ce n’est pas le total national ni la somme des réponses qui se recouvrent. La couverture indique nombre de points échantillonnés, corridor, candidates retenues puis examinées, limite de candidates, requêtes en échec et réponses atteignant la limite du service. Le nombre effectivement comparable dans la plage routière est distinct du nombre après filtres. Les plafonds actuels restent 24 prélèvements et 20 candidates ; les filtres sont appliqués après calcul. Une limite atteinte propose une recherche ciblée à une autre distance, sans prétendre à l’exhaustivité ou paginer automatiquement.

Les informations de services sont déclaratives. Les distances et durées sont des calculs, pas une garantie d’accès sur place. Le routage spécialisé caravane/poids lourd et les autres réseaux de péages gardent leurs limites antérieures.

## Vérifications

`tests/e2e/station-filters.spec.mjs` : cinq parcours sur les quatre formats de la suite. Vérification des seuils inclusifs, services cumulés, valeurs inconnues, zéro et invalides, réinitialisation sans requête, cohérence autonomie/carte, classements et égalités, stabilité des points et ouverture clavier des fiches, arrêt sélectionné hors filtre, limite de candidates et réponses tronquées. Capture et audit automatisé d’accessibilité de l’état filtré sur chaque format.

Les jeux réseau de cette suite sont simulés. Les captures et le parcours sur aperçu public font l’objet d’une vérification séparée consignée au journal du lot ; aucun essai sur téléphone physique n’est déduit d’une fenêtre mobile. Le cache de l’application passe à shell-16 ; son test vérifie la conservation des caches des autres applications.
