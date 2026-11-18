# OùQuandQui — V028 · Informations du réseau collectif

18 novembre 2026 · MULTIMODAL-03 · Complément des exigences TC-04/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), de [V026, pilote Grenoble](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md) et [V027, accès collectif direct](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md). Les éditions antérieures sont conservées.

## Parcours utilisable

Chaque option collective propose **Consulter les infos réseau**. Cette action ouvre un panneau consacré à l’option : étapes de montée, prochains passages annoncés à ces arrêts et annonces du réseau recouvrant la période du parcours. Les informations sont consultées uniquement à la demande. L’ouverture du calculateur, les changements de critères et le retour à la fenêtre ne lancent aucun appel d’information réseau.

Le trajet calculé reste théorique. La consultation ne modifie ni ses heures ni son classement ; elle ne garantit aucune correspondance. Le tracé choisi, les comparaisons de temps, le trajet principal, les stations, le profil et les budgets restent préservés. Aucun billet, passage effectif ou réservation n’est déduit d’une annonce. Les informations de consultation ne sont pas enregistrées dans le profil ou la préparation.

Les lignes et arrêts consultés sont transmis à Mobilités M. Le destinataire est annoncé avant l’action. Aucun nouveau fournisseur, compte, clé visiteur, abonnement, serveur ou service payant n’est introduit. Le site et l’aperçu restent sur GitHub.

## Sources qualifiées et correspondances

Les endpoints publics de [Mobilités M / SMMAG](https://data.mobilites-m.fr/donnees) sont ceux du fournisseur déjà qualifié en V026. Attribution ODbL conservée. Trois requêtes exécutées dans un navigateur depuis `https://agdistys.github.io` le 18 novembre 2026 à 20:40 UTC ont obtenu une réponse HTTP 200 accessible : catalogue, passages filtrés à Grenoble Gares et alertes. Cette observation ponctuelle n’est ni un engagement de disponibilité ni une certification nationale.

| Usage | Endpoint | Clés et limites |
|---|---|---|
| Catalogue commercial / GTFS | `/api/routers/default/index/routes` | Association explicite et unique `gtfsId → id`. Exemple observé : `SEM:91 → SEM:A`. Aucune correspondance déduite du nom. |
| Prochains passages | `/api/routers/default/index/stops/{stopId}/stoptimes?route={commercialId}&showCancelledTrips=true` | Identifiant d’arrêt exact ; groupe de passages portant la ligne commerciale demandée. Lecture des champs `scheduledDeparture`, `realtimeDeparture`, `departureDelay`, `realtimeState`, `realtime`, `serviceDay` et `tripId`. |
| Annonces de perturbation | `/api/gtfs/realtime/alert/SMA?json=true` | Flux complet GTFS-RT 2.0, date de génération et périodes actives vérifiées. La documentation du fournisseur décrit le JSON comme un format de débogage : capacité expérimentale, format non supposé stable ; réponse non conforme refusée. |

Le catalogue observé comprend 561 lignes, le flux 26 annonces. Ces nombres sont des observations datées, pas des valeurs attendues par l’application. Les identifiants d’alertes observés tels que `SEMC` diffèrent des identifiants GTFS du calculateur et des codes commerciaux avec séparateur. Aucune suppression de séparateur ou ressemblance de nom n’autorise leur attribution au trajet.

Le service dynamique de ligne expose notamment `nsv_id` ; son sens n’étant pas qualifié dans cette intégration, il n’est pas utilisé pour déduire une interruption. Un nom de direction, de ligne ou d’arrêt ne vaut pas une preuve d’identité.

## Horaires et fraîcheur

Les prochains passages sont présentés dans une liste dépliable **distincte du trajet prévu**. Elle couvre au plus les trois prochaines heures, conserve les dates et directions, et limite l’affichage aux six premiers passages vérifiables par étape. Le nombre de passages supplémentaires ou écartés est annoncé. Un trajet prévu demain ne reprend donc pas les annonces de ce soir comme s’il s’agissait de son service.

Une concordance avec le service prévu exige simultanément : identifiant du service, arrêt de montée, date de service et horaire théorique cohérents à une seconde près. Le calcul conserve les secondes au-delà de minuit et la date de service d’origine. L’absence de concordance ne prouve ni annulation ni circulation. Les passages sans montée autorisée explicitement renseignée sont écartés si la source fournit une restriction.

Les horaires suivants restent distincts :

- **Horaire théorique** : source non actualisée, sans prévision ajoutée.
- **Passage annoncé** : estimation reçue avec écart cohérent entre horaire théorique et prévision. Les écarts affichent minutes et secondes ; douze secondes d’avance ne deviennent pas une minute. Un écart nul ne produit pas un badge « à l’heure ».
- **Annulation annoncée** : état fourni par la source, à confirmer auprès du réseau ; aucun remplacement inventé.

Le endpoint de passages ne fournit pas de date d’actualisation exploitable pour chaque enregistrement observé. Les estimations et annulations sont donc affichées sous **Actualisation non datée**. La date de consultation HTTP n’est pas présentée comme celle de la mise à jour du passage. Aucun badge « en direct » n’est ajouté. La consultation de passages est retirée après cinq minutes : c’est une règle locale de conservation, pas une garantie de fraîcheur de la source.

## Annonces de perturbation

La date du flux doit être présente, numérique, à moins de dix minutes et pas à plus d’une minute dans le futur. Le seuil de dix minutes suit la recommandation relative aux alertes des [bonnes pratiques GTFS-RT](https://gtfs.org/documentation/realtime/realtime-best-practices/). La [référence GTFS-RT](https://gtfs.org/documentation/realtime/reference/) distingue la création du flux de l’actualisation des enregistrements : un flux récemment généré ne prouve pas qu’une annonce a été récemment revue.

Toutes les bornes des périodes actives sont validées avant le filtrage ; une période sans borne reste ouverte. Une période totalement absente est traitée selon la sémantique GTFS-RT. Les extensions de périodes `communicationPeriod` et `impactPeriod`, lorsqu’elles sont renseignées, ne sont pas qualifiées ici : l’annonce concernée est écartée. Les identifiants d’annonces dupliqués sont tous écartés.

Une annonce est rapprochée d’une ligne ou d’un arrêt du trajet uniquement si un sélecteur natif exact correspond. Les contraintes d’un même sélecteur doivent toutes être satisfaites. Les sélecteurs inconnus ou comprenant d’autres contraintes ne sont pas simplifiés. Les autres annonces restent sous **Annonces du réseau pour cette période — non attribuées au trajet**. Une correspondance de ligne ou d’arrêt reste une invitation à lire la portée de l’annonce, sans interruption automatiquement affirmée.

Une liste vide ou non attribuable affiche **Perturbations du trajet non vérifiées**. Elle ne devient jamais « aucune perturbation ». Les annonces anciennes sont retirées ; les horaires théoriques restent disponibles. Les descriptions sont conservées jusqu’à 6 000 caractères avec indication explicite d’abrègement au-delà. Le texte reçu est échappé, jamais exécuté ; seuls les liens HTTPS sans identifiants ni port supplémentaire vers les domaines Mobilités M qualifiés sont proposés.

## Limites d’appel, annulation et erreurs

Une consultation comporte au plus cinq appels : catalogue, trois arrêts de montée, puis flux d’alertes. Les étapes non vérifiées au-delà de trois sont signalées. Aucun renouvellement automatique. Un délai de trente secondes interrompt la consultation ; les contrôles redeviennent utilisables. Un quota HTTP 429 empêche les appels suivants, sans réessai. Les erreurs partielles ne suppriment pas les autres informations consultables.

Une seconde demande immédiate est différée de dix secondes. L’ancienne consultation est retirée, pour éviter de lui attribuer le numéro d’une autre option. Fermer, annuler, modifier les critères ou relancer le calcul invalide la consultation et son contrôleur. Une réponse tardive ne rétablit ni information ni carte et ne déclenche pas d’appel supplémentaire. L’expiration est vérifiée localement toutes les trente secondes ou au retour dans la fenêtre ; elle ne déclenche aucune requête.

## Validation

Quatorze contrôles du modèle couvrent les réponses réellement observées, les correspondances ambiguës, les horaires et services exacts, minuit et changement d’heure, annulations, restrictions de montée, données incohérentes, doublons, horizons, dates de flux, sélecteurs, périodes, traductions et liens.

Neuf scénarios de navigateur sont exécutés dans les quatre formats de l’Inspectrice : demande volontaire et budget conservé, annulation d’un service synthétique concordant, indisponibilité partielle et quota, réponse tardive après annulation, retrait après modification de critères, expiration sans polling, contenu hostile et clavier, catalogue ambigu et flux invalide, interruption sur délai. Les réponses enregistrées de la source restent distinctes des mutations de test.

La recette publiée vérifie ensuite les services réels entre des lieux publics, les actifs du commit, les métadonnées d’aperçu, les captures ordinateur/mobile et l’absence d’appel d’information réseau implicite. Le rapport associé au commit porte les nombres effectivement exécutés. Aucun téléphone physique, déplacement, service annulé réel ou correspondance effectivement empruntée n’est attesté.

## Écarts restant ouverts

Le pilote reste Grenoble. Les passages demeurent non datés ; il n’existe pas encore de garantie de temps réel ni de recalcul fiable des correspondances. Le rattachement des alias commerciaux des alertes reste non qualifié. Couverture nationale, accessibilité, réservation, coût total, comparaison de groupes et adoption d’un trajet collectif dans la préparation principale restent des axes distincts. Aucune donnée inconnue ne satisfait un filtre strict et aucun prix absent ne devient zéro.
