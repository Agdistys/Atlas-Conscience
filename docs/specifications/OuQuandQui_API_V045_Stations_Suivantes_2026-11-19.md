# V045 — Poursuivre la comparaison des stations

STA-COUVERTURE-01 · 19 novembre 2026. Complète STA-06/07/12 et CAL-08/09 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [filtres de stations](../acceptance/Stations_Filtres_V001_2026-11-18.md) et leur suivi de couverture. Les éditions antérieures sont conservées.

## Exploration explicite

La recherche initiale consulte le corridor géographique et présélectionne des candidates selon la distance demandée. Elle calcule un premier groupe de vingt accès au maximum. Si des candidates reçues restent à examiner, un bouton propose le groupe suivant avec son nombre exact. Chaque activation examine au plus vingt candidates ; aucun groupe suivant n'est lancé automatiquement.

La continuation utilise les stations déjà reçues et le même trajet de référence, ses contraintes, son carburant, ses quantités et sa plage de distance. Elle ne consulte pas à nouveau la source carburants. La date de chaque prix et la date de réception sont conservées ; poursuivre ne rajeunit aucune donnée. La politique de fraîcheur reste appliquée au moment de l'affichage. Pour actualiser les données ou changer de zone, une nouvelle recherche explicite est nécessaire.

La présélection géographique ne prouve pas l'accès routier. Une candidate est examinée lorsque son accès a fait l'objet d'une réponse exploitable : elle peut être comparable dans la plage, comparable mais hors plage, ou non comparable. Une erreur de transport ou une annulation ne vaut pas absence d'accès et ne fait pas avancer silencieusement la file.

## Cohérence du parcours

Les résultats s'ajoutent aux stations déjà comparées. Les numéros des points existants restent inchangés ; les nouveaux numéros suivent la même recherche. Les tris, égalités et badges sont recalculés sur l'ensemble comparable sous les filtres actifs. Les services nécessaires, limites de détour, autonomie, horaires et groupe de fraîcheur restent appliqués aux nouvelles stations. Le choix des services et de la vue est conservé.

Un arrêt déjà confirmé reste lié à la même station, au même tracé et à son prix de référence lorsqu'il a été adopté volontairement. Une station nouvellement moins chère ne remplace ni cet arrêt ni son prix. Un arrêt hors filtre conserve son signalement et son point. Les favoris, profil, préparations et journal ne sont pas modifiés par la continuation. Aucun format de stockage ne change.

Changer le contexte de recherche invalide la file. Le contexte est vérifié avant la continuation et avant chaque intégration : lieux, route, véhicule et exclusions, intention d'arrêt, distance cible, carburant, litres et consommation. Une réponse tardive ne rétablit pas les anciens résultats. Une nouvelle recherche recommence la sélection et la numérotation ; elle conserve le comportement existant de retrait de l'arrêt de la recherche précédente.

## Interruptions et erreurs

Avec une matrice routière, un groupe est intégré après réception et contrôle de la réponse complète. Une panne ou annulation conserve les groupes antérieurs ; la continuation reprend le groupe non obtenu, sans recalculer les groupes acquis.

Avec des trajets calculés individuellement sous contraintes, chaque accès qualifié est conservé à mesure de son obtention. Une erreur ou annulation laisse les réussites précédentes disponibles, y compris celles du groupe interrompu. La reprise commence à la première candidate non traitée. Une réponse explicite sans route ou une comparaison incohérente est comptée comme non comparable, sans fabriquer un détour nul. Les contraintes de rencontres de covoiturage restent appliquées.

Le bouton d'arrêt annule les requêtes en cours ; aucun groupe supplémentaire n'est lancé ensuite. Les erreurs restent visibles et la reprise est volontaire. Les opérations de lecture du trajet restent disponibles après la fin de l'opération. La continuation conserve la position de carte ; elle ne recentre pas automatiquement le trajet sur chaque groupe.

## Couverture et limites

Le panneau distingue les stations uniques reçues dans le corridor, les candidates examinées, les accès comparables dans la plage, les accès hors plage, les non comparables et les candidates restantes. Les éventuelles réponses tronquées ou erreurs de prélèvement restent signalées même quand toutes les candidates reçues ont été examinées.

Épuiser la file ne signifie pas avoir trouvé toutes les stations du territoire. Le corridor, l'échantillonnage maximal de vingt-quatre points et la limite de cent lignes par réponse source restent ceux du service existant. Ce lot ajoute la continuation des candidates reçues ; il ne prétend pas supprimer les plafonds géographiques ni paginer les réponses de la source carburants.

Les prix, services et horaires sont déclaratifs ; les distances sont des calculs. Les limites de routage spécialisé, de sécurité sur route, de péages et de couverture restent inchangées. Aucun fournisseur, compte, service d'hébergement ou appel payant ajouté.

## Vérifications

Huit contrôles du modèle vérifient les bornes, la progression, les identités, la numérotation, l'intégrité d'une réponse, les accès inconnus et la conservation des données antérieures. Les parcours navigateur couvrent la continuation, les filtres, les prix anciens, la sélection conservée, les interruptions, erreurs partielles et reprises, le changement de contexte et l'accès au clavier. Les simulations de routage contraint restent distinguées de la recette sur services réels entre lieux publics. Les preuves et la vérification du commit publié sont consignées dans `quality/station-coverage` et l'état du chantier. Aucun essai sur téléphone physique ou sur route déduit des tests navigateur.
