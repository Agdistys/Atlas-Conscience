# V081 — Délais du routage et reprise des accès aux stations

FIO-QUOTAS-ROUTAGE-02 · 22 novembre 2026. Complète STA-06, ERR-02/04/05, DAT-03 et QUA-10 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [continuation des stations V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md), les [interruptions de trajet V057](OuQuandQui_API_V057_Annulation_Trajet_2026-11-20.md) et les [délais des services V080](OuQuandQui_API_V080_Delais_Services_2026-11-21.md). Les éditions précédentes restent conservées.

## Résultat attendu

Une limite de requêtes signalée par un moteur routier s’applique à toutes les actions qui sollicitent ce moteur dans la page. Le trajet principal, les variantes, les aperçus d’arrêt et les calculs d’accès aux stations partagent cette attente. Le moteur IGN partage également son délai entre voiture et marche. OSRM, IGN et le relais OpenRouteService disposent de retenues indépendantes ; aucun changement automatique de moteur ou de contraintes n’est effectué.

Une nouvelle action pendant la retenue indique le temps restant sans envoyer de demande. L’expiration n’entraîne aucun appel : une action volontaire reste nécessaire. Les critères, exclusions et caractéristiques du véhicule ne sont pas modifiés pour contourner une indisponibilité.

## Délais communs

La règle de V080 est étendue aux moteurs routiers : réponse 429, ou 503 avec en-tête Retry-After ; entier en secondes ou date HTTP ; référence à la date du serveur lorsqu’elle est exposée ; minimum local de cinq secondes. En l’absence de valeur lisible sur 429, le repli local annoncé passe de cinq secondes dans V057 à soixante secondes. La présente règle remplace uniquement ce repli routier de V057.

Après réception, l’attente utilise le temps monotone. Un changement d’heure civile ne permet pas une relance anticipée. Une retenue plus longue ne peut pas être raccourcie par une autre réponse. Un entier trop grand pour être représenté reste bloquant et ne devient pas une attente courte. Une panne 503 sans en-tête, une absence de chemin et un quota restent distincts.

Le relais traite le statut et le délai avant de décoder le corps de la réponse : un corps vide, illisible ou dont le décodage tarde ne masque pas une retenue déjà reçue. Une limite de la recherche facultative d’alternatives conserve le trajet de base valide et indique le délai dans la notice des alternatives.

L’état demeure local à la page, sans persistance ni synchronisation entre onglets ou visiteurs. Un rechargement réinitialise cet état ; ce mécanisme ne constitue pas un contrôle global de consommation ou de facturation.

## Stations déjà reçues et reprise

La matrice OSRM des accès et le calcul OSRM du trajet utilisent la même retenue. Une limite de la matrice bloque donc aussi un nouveau trajet auprès du même moteur ; une limite reçue par un aperçu d’arrêt bloque les prochaines matrices.

Une nouvelle collecte de stations demandée pendant une retenue routière connue est arrêtée avant l’appel carburants et avant l’effacement des résultats datés. Les fiches, les comparaisons obtenues et l’arrêt choisi restent consultables dans leur contexte. Modifier les critères continue d’invalider les anciens résultats conformément aux règles existantes.

La continuation ne relance pas la source carburants. Une matrice refusée ne consomme pas ses candidates. Avec un calcul individuel IGN ou OpenRouteService, les accès réussis avant l’erreur sont conservés ; la reprise repart de la première candidate dont l’accès n’a pas été obtenu. Les numéros des points déjà affichés restent stables. Une indisponibilité temporaire ne devient ni une station inaccessible ni l’affirmation qu’il n’existe aucune station.

Les réponses IGN déjà présentes dans le cache peuvent être consultées pendant une retenue sans nouvel appel, dans les mêmes limites de durée et de contexte. Les calculs manquants attendent. La source carburants reste indépendante : une fiche favorite peut être actualisée pendant une attente routière si cette source est disponible.

## Annulation et contexte

Une opération annulée ou dont les critères ont changé ne rétablit pas ses résultats et n’installe pas une retenue à partir d’une réponse tardive. Cette vérification s’applique également à la matrice des stations. Une nouvelle recherche principale effectivement lancée retire son ancien trajet conformément à ERR-03 ; elle ne conserve pas à l’écran un ancien trajet attribué aux nouveaux lieux.

La retenue ne modifie pas les favoris, les préparations, les profils ou le journal. Aucun nouvel enregistrement de données ni nouveau format de sauvegarde n’est ajouté.

## Vérification et portée

Les scénarios couvrent les échanges trajet/matrice, la reprise au bon point, les résultats acquis, la première matrice refusée, les dates serveur et changements d’horloge, les délais extrêmes, le repli local, la panne sans délai, les annulations, les changements de critères, les caches, les moteurs indépendants, le relais, les alternatives et les favoris. Les parcours de référence sont aussi exercés sous Firefox et WebKit ; petits écrans, clavier et texte doublé sont inclus.

Les quotas et indisponibilités avec délai sont simulés dans un navigateur isolé. Les consultations réelles entre lieux publics sont identifiées séparément dans les preuves ; aucun quota réel n’est volontairement épuisé. Les contrôles, ressources publiées et métadonnées sont rattachés au même commit. Une réussite simulée ne qualifie ni un relais public encore désactivé ni une disponibilité garantie.

Aucun fournisseur, compte, clé, abonnement, paiement, hébergement ou fusion sur le site principal n’est ajouté. Le périmètre ne qualifie ni téléphone physique, ni lecteur d’écran, ni déplacement, ni caravane, ni poids lourd. Les limites antérieures sur les péages, le routage et la couverture des modes restent applicables.
