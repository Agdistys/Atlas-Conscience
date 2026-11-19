# V049 — Concentrer la collecte des stations sur une portion du trajet

STA-COLLECTE-CIBLEE-01 · 19 novembre 2026. Complète STA-02/03/05/06/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [fenêtre V046](OuQuandQui_API_V046_Fenetre_Stations_2026-11-19.md) et la [collecte réglable V048](OuQuandQui_API_V048_Zone_Collecte_2026-11-19.md). Les éditions antérieures restent conservées.

## Choix et bornes avant recherche

« Où rechercher les stations ? » propose **Sur tout le trajet** et **Sur la portion recherchée**, dans les réglages de zone. Le tracé entier reste le choix initial ; aucune préparation ancienne ne change de sens automatiquement.

La portion suit l’intention « Quand faire le plein ? » : début du trajet jusqu’à la proximité maximale en mode proche, cible moins/plus marge en mode distance choisie, totalité en mode au plus tôt. Les bornes sont limitées par la longueur du trajet de référence, avant ajout du plein, comme en V046. Une cible dépassant le trajet est refusée sans déplacement ni élargissement implicite.

Avant toute requête, le résumé annonce le périmètre, les deux bornes depuis le départ, le rayon, le nombre de points, l’espacement et les plafonds. Le rayon géographique autour des points peut déborder de la portion ; seuls les accès routiers dans la fenêtre choisie sont comparables. Modifier le choix ou les distances ne lance aucune requête.

## Repérage proportionnel et géométrie

Les bornes de la fenêtre sont exprimées sur la distance routière de référence. Leurs proportions dans cette distance sont reportées sur la longueur cumulée des segments de la géométrie renvoyée par le moteur. Cette correspondance proportionnelle est une approximation de présélection, explicitée dans le résumé ; ce n’est ni une progression GPS ni une distance d’accès à une station.

Les deux extrémités de la portion sont interpolées dans les segments correspondants. Tous les sommets intermédiaires sont conservés : les points suivent donc les virages du tracé. Les extrémités originales sont reprises exactement lorsque la portion les atteint. Les petites portions et sommets répétés ne sont pas arrondis. Une portion ponctuelle peut produire un seul prélèvement. Un tracé sans longueur ne permet pas de localiser une portion intérieure et produit une erreur explicite.

Le maillage V048 s’applique à cette seule géométrie : espacement souhaité, plafond personnel, maximum global de 24 points, quatre requêtes simultanées au plus et cent lignes par réponse source. Un plafond atteint répartit les points entre les deux bornes. Aucune pagination de la source ni augmentation implicite de charge n’est ajoutée.

Les identifiants de stations sont dédupliqués ; la présélection latérale utilise la géométrie de la portion. L’ordre des candidates conserve leur repérage sur le trajet entier. Les distances routières d’accès, filtres de détour, services, horaires, fraîcheur, autonomie et continuation des candidates déjà reçues gardent leurs règles. Une candidate géographiquement proche mais accessible au-delà de la fenêtre est exclue des résultats comparables. Le nombre reçu, le nombre examiné, les accès hors plage et les erreurs restent distincts.

## Cohérence du parcours

Changer le périmètre, la fenêtre ou le trajet retire les résultats dépendants et la file de continuation. Le plein sélectionné est retiré ; les filtres conservés ne deviennent pas des recherches implicites. La signature inclut le périmètre. Les réponses tardives, y compris après un changement silencieux du champ, ne rétablissent pas l’ancienne recherche. Une modification de fenêtre pendant une collecte l’invalide également.

Annulation, erreurs ponctuelles et réponses limitées conservent leurs états explicites. La continuation ne consulte pas de nouveau le service carburants et garde la portion annoncée lors de la collecte. Un changement silencieux avant continuation oblige à relancer volontairement. Un résultat vide peut proposer un élargissement volontaire selon V046 ; cet élargissement doit être suivi d’une nouvelle recherche.

## Préparations, format 9

Les préparations automobiles ajoutent `stationScope`, limité à `route` ou `window`. La copie `dragonroute.prepared.v9.<environnement>` reçoit les écritures volontaires. Les formats 1 à 8 restent lisibles ; leur intention historique est « tracé entier ». Le format 8 garde ses trois réglages de rayon, espacement et plafond, sans retour aux valeurs initiales. Les copies originales ne sont ni réécrites ni supprimées lors de la migration en mémoire.

Un export exact de l’original format 8 complète les exports historiques. La copie 9, même vide ou invalide, reste prioritaire. Avant écriture ou effacement volontaire, les neuf copies observées sont contrôlées pour détecter les conflits visibles. Un ciblage absent ou inconnu est refusé dans le format 9 ; aucune valeur de secours n’est inventée. La reprise restitue les critères, demande un nouveau calcul de trajet et n’interroge pas automatiquement les stations. Les préparations piétonnes ne reçoivent pas de préférence carburant.

## Preuves et limites

Les modèles vérifient bornes, proportions, sommets, petites portions, tracés nuls, plafonds, migration et distinction des préparations. Les scénarios navigateur couvrent les requêtes ciblées, la différence entre proximité et accès routier, les invalidations, annulations, réponses partielles, continuation et sauvegardes. Les consultations réelles utilisent uniquement les lieux publics Lyon-Gorge-de-Loup et Valence, avec une fenêtre de 60 à 80 km, puis vérifient les stations et distances reçues.

Les preuves locales, GitHub et de l’aperçu exact sont consignées séparément dans `quality/station-targeted` et le suivi du chantier. Une vue mobile dans le navigateur ne vaut pas un essai sur téléphone physique ou en déplacement. Le ciblage réduit la zone consultée, sans garantir exhaustivité, accès du bon côté, sens de circulation, absence de retour, état des routes, ouverture réelle ni disponibilité. Aucun fournisseur, compte, coût ou hébergement ajouté.
