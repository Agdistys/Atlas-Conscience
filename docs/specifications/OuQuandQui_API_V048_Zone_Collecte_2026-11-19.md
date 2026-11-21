# V048 — Régler la collecte des stations autour du trajet

STA-CORRIDOR-01 · 19 novembre 2026. Complète STA-05/06/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [continuation V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md) et la [fenêtre de distance V046](OuQuandQui_API_V046_Fenetre_Stations_2026-11-19.md). Les éditions précédentes sont conservées.

## Réglages et effort annoncé

La rubrique « Zone de recherche autour du trajet » propose trois paramètres : rayon autour de chaque point de prélèvement, espacement souhaité sur le tracé et maximum de points consultés. Les valeurs initiales restent 12 km, 30 km et 24 points.

Le rayon accepte de 1 à 30 km et l’espacement de 5 à 100 km, décimales comprises. Le maximum de points est un entier de 2 à 24. Ce sont des bornes techniques de cette version, sans promesse d’exhaustivité. Une valeur vide, invalide ou hors bornes bloque la recherche avant toute requête et dirige le focus vers le champ à corriger. Aucun arrondi ou remplacement silencieux n’est appliqué.

Avant la recherche, l’application annonce le nombre de points, le rayon, l’espacement demandé et le plus grand intervalle prévu. Si le nombre requis dépasse le plafond choisi, elle indique les deux nombres et la couverture partielle. Lorsque le plus grand intervalle dépasse deux fois le rayon, des espaces potentiellement non consultés sont signalés. Leur absence dans ce diagnostic ne certifie pas la couverture de toute la bande latérale.

## Maillage du tracé et collecte

La longueur de présélection est calculée sur les segments de la géométrie retournée par le moteur. Les distances cumulées utilisent la distance sphérique entre sommets ; les positions intermédiaires sont interpolées dans ces segments. Cette approximation sert uniquement à placer les requêtes géographiques, jamais à annoncer un accès routier ou un détour.

Le départ et l’arrivée sont conservés exactement. Sans plafond atteint, les points suivent l’espacement demandé, avec un dernier intervalle éventuellement plus court. Avec plafond atteint, le nombre de points est limité et réparti sur toute la longueur du tracé. Un segment long contenant peu de sommets reçoit des points intermédiaires. Les segments de longueur nulle ne créent pas une division par zéro ; un tracé entièrement nul produit un seul point.

Chaque point interroge le service carburants existant avec le rayon choisi et au plus cent lignes. Le plafond global `maxFuelSamples` reste une borne supérieure ; aucune pagination supplémentaire de la source n’est ajoutée. Au plus quatre requêtes sont lancées ensemble, comme précédemment. Les réponses limitées et les échecs ponctuels restent visibles. Si toutes les requêtes échouent, le trajet reste consultable et aucune absence de station n’est déduite de la panne.

Les stations sont dédupliquées par leur identifiant source, puis filtrées selon leur distance géographique au tracé. La fenêtre de distance V046 et les accès routiers sont calculés séparément. Les stations de l’autre côté d’un obstacle ne sont pas réputées accessibles grâce à leur seule proximité. Les groupes successifs V045 continuent à utiliser les candidates déjà reçues, sans nouvelle consultation de la source carburants.

## Cohérence et modification

Modifier le rayon, l’espacement ou le plafond retire les résultats, la file de continuation et l’arrêt dépendants de la collecte précédente. Le trajet de référence, la destination et les filtres restent conservés. Une nouvelle recherche explicite est nécessaire ; aucun appel n’est déclenché au changement d’un champ.

Les trois paramètres participent à la signature de recherche. Un changement pendant une requête, y compris silencieux, interdit l’intégration des réponses anciennes et le lancement du groupe suivant. Annuler interrompt les requêtes en cours ; une reprise de collecte exige une nouvelle action. Le résumé de couverture conserve les paramètres réellement utilisés par la recherche, même lorsque toutes ses candidates ont été examinées.

## Préparations, format 8

Les préparations automobiles ajoutent `stationRadiusKm`, `stationSpacingKm` et `stationMaxPoints`. La nouvelle clé `dragonroute.prepared.v8.<environnement>` reçoit uniquement les écritures volontaires. La reprise charge les trois choix, demande un nouveau calcul de trajet et annonce à nouveau le plan de collecte ; elle ne recherche pas les stations automatiquement.

Les formats 1 à 7 sont lus et migrés en mémoire avec leurs paramètres historiques fixes : 12 km, 30 km, 24 points. Les copies originales restent intactes. Un export exact de l’original format 7, espaces compris, complète les exports antérieurs. La marche conserve ses propres préférences et n’acquiert aucun paramètre carburant.

La copie 8 est prioritaire même vide ou invalide. Une copie invalide bloque le remplacement et reste exportable ; aucune ancienne liste ne la remplace automatiquement. Les huit copies observées sont contrôlées avant écriture ou effacement pour détecter une modification concurrente. Champs manquants, types incorrects, bornes dépassées, plafond non entier et formats futurs sont refusés à l’import. Les autres profils, journaux, livres et environnements restent distincts. L’effacement explicite route/marche concerne les huit copies de l’environnement courant.

## Vérification et limites

Les contrôles couvrent les bornes, l’interpolation, les tracés longs ou dégénérés, les plafonds, les migrations et l’intégrité des originaux. Les parcours navigateur vérifient les requêtes, la présélection distincte des accès, la déduplication, la continuation, les erreurs partielles, l’annulation, les réponses tardives, la sauvegarde et les conflits entre copies.

La recette entre lieux publics Lyon-Gorge-de-Loup → Valence vérifie les paramètres effectivement transmis au service, les identifiants et adresses des stations, les distances issues de la matrice routière et la reprise d’une préparation. Les tests déterministes simulent les services ; les preuves locales et publiées consignent séparément les consultations réelles, l’inspection du commit exact et les vues ordinateur/mobile. Aucun téléphone physique ou déplacement n’est attesté.

La collecte demeure répartie sur tout le trajet, même lorsque la fenêtre V046 vise une portion précise. Une collecte ciblée sur cette portion reste un prochain axe, sans augmentation implicite des plafonds. La pagination de la source, la couverture nationale exhaustive, le sens d’accès, le côté de route, l’ouverture réelle et la disponibilité sur place ne sont pas acquis. Aucun fournisseur, compte, achat, hébergement ou service payant ajouté.
