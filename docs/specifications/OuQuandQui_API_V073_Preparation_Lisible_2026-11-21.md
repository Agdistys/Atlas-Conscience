# V073 — Préparation et résultats lisibles

UX-PREPARATION-LISIBLE-01 · 21 novembre 2026. Complément à UX-01/02/05/07, PAR-01/02, STA-12 et PEA-08 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les capacités et limites de [V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md), la recherche station [V071](OuQuandQui_API_V071_Acces_Station_2026-11-21.md) et l’identité [V072](OuQuandQui_API_V072_Identite_Produit_2026-11-21.md) sont conservées.

## Calcul et réglages

Le bouton « Trouver mon trajet » suit les lieux et les cinq accès aux modes. Un récapitulatif présente le mode principal, les évitements demandés, le critère durée/distance, le départ et l’éventuelle heure limite. Les préférences de marche distinguent zéro, absence de limite et règle impérative. Un profil indisponible reste identifiable et bloqué ; le récapitulatif ne convertit pas une caravane en voiture.

Les boutons « Réglages du trajet » et « Horaires » rejoignent leurs champs. Une rubrique repliée s’ouvre avant de recevoir le focus. Les réglages restent dans la page et conservent leurs valeurs. Après calcul, des accès rejoignent le résumé, les arrêts et le budget. Ils disparaissent si le résultat est invalidé. Le calcul ne déplace pas le focus automatiquement : la navigation vers le résultat est volontaire.

Les accès n’exécutent aucun calcul, géocodage, localisation ou écriture. Pendant une recherche, les commandes restent soumises au verrouillage existant. Une erreur garde son résumé et rejoint le champ concerné, même si les horaires ou les options étaient repliés. Aucun bandeau fixe ne recouvre les champs ; le défilement reste possible en paysage et avec du texte agrandi.

## Recherche et lecture des stations

« Chercher les stations » suit l’intention et la distance choisies. Le récapitulatif rappelle carburant, litres achetés, consommation et filtres actifs. Les commandes rejoignent carburant/budget, quantité/autonomie et filtres ; les modifications conservent les invalidations et règles de recalcul existantes.

Après recherche, « Voir les stations » rejoint les fiches et leur contexte : nombre de fiches, groupe de fraîcheur, tri, filtres, caractère partiel éventuel et limites du coût. Depuis les résultats, les tris et filtres restent accessibles. Une station garde son numéro, ses badges, ses dates, sa fiche et son aperçu obligatoire avant adoption. Les boutons n’acceptent ni un arrêt ni un trajet à la place de la personne.

La couverture comporte un résumé court toujours visible : candidates examinées, comparables, reste à comparer, réponses limitées ou points en échec, absence d’exhaustivité. Le détail conserve le plan d’échantillonnage, les distances, les rejets, les dates et la méthode de continuation. Déplier ne consulte pas le fournisseur et ne rafraîchit pas les prix. « Comparer les autres stations » reste une action distincte, avec ses bornes et son retour du focus.

## Explications à la demande et limites visibles

Les méthodes longues du retour, de la distance de marche, du temps de plein, de la collecte, de la fraîcheur et des classements sont accessibles dans des rubriques natives dépliables. Leur contenu substantiel est conservé.

Restent visibles : indisponibilités près des options, critères demandés, erreurs, autonomie inconnue, recherche partielle, âge propre au prix, heures inconnues ou déclarées, prix exclus du budget, péages inconnus et coût partiel. Le classement carburant reste « achat + carburant du détour », hors péages et autres frais. L’ouverture et la disponibilité ne sont pas garanties. La durée de route reste une estimation ; une pause absente n’est pas zéro.

## Vérification du lot

Six nouveaux scénarios couvrent les accès au clavier et les récapitulatifs, une erreur horaire dans une rubrique fermée, le parcours jusqu’à l’aperçu station, la continuation volontaire, une saisie de collecte invalide et le paysage avec texte doublé. Les scénarios de modes, lecture et continuation restent présents. Deux nouveaux parcours deviennent obligatoires dans les quatre configurations Firefox/WebKit : cinquante-quatre cas par configuration, soit 216 exécutions. Le validateur refuse les anciens rapports incomplets.

Mesure locale avant/après sur la même préparation fictive : le bouton de trajet passe d’environ 1 954 à 863 pixels sous le début du panneau sur ordinateur, et de 2 024 à 897 pixels sur la fenêtre de 390 pixels. Le bouton des stations passe d’environ 972/990 à 349/350 pixels sous leur panneau. Ces distances mesurent une disposition à texte normal, pas la vitesse de compréhension ou une validation humaine. Les variantes au texte doublé restent défilables.

La recette requiert les contrôles, les essais locaux, l’inspection complète du commit, puis sa publication et un parcours avec les services réels configurés. Les preuves sont conservées dans `quality/preparation-readability` et le suivi automatique. Jeux simulés, aperçu réel, moteurs épinglés et appareils physiques demeurent distincts ; aucune certification d’accessibilité ni essai iOS/Android n’est déduit du banc.

La présentation centralisée reçoit une édition V010, avec sommaire et export actualisés. V009 et les exigences antérieures sont conservées. Aucun nouveau fournisseur, hébergement, compte, prix, abonnement ou changement de publication principale n’est introduit.
