# OùQuandQui — V026 · Transports collectifs, pilote Grenoble

18 novembre 2026 · MULTIMODAL-01 · Complément du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), section 16 / TC-01 à TC-07 et lot L5. Les fonctionnalités routières, la [comparaison voiture/marche V015](OuQuandQui_API_V015_Comparaison_2026-11-18.md) et les [règles de fraîcheur V025](OuQuandQui_API_V025_Fraicheur_Prix_2026-11-18.md) restent distinctes.

## Parcours disponible

Après résolution d’un trajet, le bouton **Transports collectifs · pilote Grenoble** ouvre un panneau dédié avec les mêmes points de départ et d’arrivée. La consultation est directe, sans les arrêts carburant ou rencontres du trajet routier. Le véhicule, le budget, les stations et la comparaison routière restent conservés ; fermer le panneau restitue leur consultation.

L’utilisateur choisit une date et une heure de Paris, « Partir à partir de » ou « Arriver au plus tard à », puis la marche totale maximale. Le bouton de recherche indique l’action qui transmet les coordonnées et critères à Mobilités M. Aucun compte ou clé de visiteur. Aucun appel de transport à l’ouverture, au changement de critère, au retour de visibilité ou à la fermeture. Les résultats ne sont pas enregistrés dans le profil, le journal ou les préparations.

Chaque option détaille les heures avec date civile, marche d’accès, ligne et direction, montée et descente, attentes entre étapes, correspondances et marche finale. La durée couvre le début de la première étape à la fin de la dernière ; le délai entre l’heure de recherche et le départ est indiqué séparément, avec le temps jusqu’à l’arrivée. En recherche d’arrivée, la marge avant l’heure limite est affichée. Les minutes sont arrondies au supérieur à l’affichage ; les critères utilisent les valeurs reçues sans arrondi.

Le schéma ou la carte d’une option ne remplace pas le trajet routier. Le transport apparaît en bleu, la marche en pointillés. Les points portent les noms reçus ; les alternatives sont choisies dans la liste, sans nouveau calcul. Si le fond de carte n’est pas disponible, un schéma explicitement sans échelle représente les géométries reçues. Une géométrie absente ou invalide retire le dessin complet, en conservant les horaires vérifiés. Aucun segment droit n’est inventé pour combler un tracé.

## Périmètre du pilote

Les deux points doivent être compris entre 45,10 et 45,24° de latitude et 5,66 et 5,81° de longitude. Ce rectangle est une **limite volontaire du pilote**, pas une frontière administrative ni une description exhaustive du service. Les trajets sont limités à six heures et les recherches aux trente prochains jours. La marche totale admissible est de 100 à 5 000 mètres. Ces bornes sont propres à l’application ; elles ne prouvent ni la présence d’un arrêt ni la disponibilité d’horaires à toute date.

Un point extérieur provoque un message explicite, sans appel de transport. Le premier exemple réel qualifié relie les abords de Grenoble Gares à ceux de Polesud–Alpexpo, par la ligne A. La couverture nationale, l’interurbain national et le vélo ne sont pas livrés par ce pilote. La recherche reste actuellement accessible après un premier trajet résolu ; le parcours collectif autonome et la comparaison intégrée constituent un axe suivant.

## Source et conditions observées

La [documentation officielle Mobilités M](https://data.mobilites-m.fr/donnees) publie `GET /api/routers/default/plan` et renvoie à OpenTripPlanner. Elle ouvre les données sous ODbL. Les [mentions légales](https://data.mobilites-m.fr/mentions-legales) distinguent ces données du contenu éditorial et ne garantissent pas la continuité du service. L’interface et les échantillons redistribués conservent l’attribution SMMAG / Mobilités M et un lien vers la [licence ODbL](https://www.mobilites-m.fr/pdf/ODbL_fr_VF_1.pdf). Aucun texte, image ou habillage éditorial du portail n’est repris.

Consultations du 18 novembre 2026, sans clé : HTTP 200, accès navigateur interorigine autorisé (`Access-Control-Allow-Origin: *`), OpenTripPlanner 2.7.0 annoncé par `/api/routers/default/serverinfo`. Deux demandes pour le 19 novembre à 10 h au départ et 11 h à l’arrivée ont chacune renvoyé deux options tram exploitables et une proposition entièrement à pied, exclue de la vue collective. Les exemples publics sont conservés dans [les fixtures et leur attribution](../../tests/fixtures/transit/SOURCE.txt). Ce sont des instantanés, pas des horaires actualisés.

Le portail annonce aussi `/api/agencies`, mais l’URL a répondu 404 lors de la qualification. Aucun calendrier complet ni date de mise à jour de chaque jeu n’a donc été attesté par cet accès. L’application affiche cette absence et la date de consultation. La disponibilité ponctuelle d’une réponse n’est pas une garantie de disponibilité future ou de couverture commerciale. Aucun abonnement, serveur, compte ou service payant créé.

## Contrat de requête et qualification

| Élément | Traitement |
|---|---|
| Points | Coordonnées explicites, contrôlées dans le rectangle pilote ; aucun nom/adresse ou profil joint à la requête |
| Temps | `date`, `time`, `arriveBy` ; fuseau Europe/Paris. Dates impossibles, heure passée, saut printanier et heure automnale ambiguë refusés avant appel |
| Moteur | `mode=TRANSIT,WALK`, `numItineraries=3`, `locale=fr`, `maxWalkDistance` et `ignoreRealtimeUpdates=true` |
| Transport | Au moins une étape collective ; une proposition uniquement à pied ne devient pas une option collective |
| Limite de marche | Somme des distances de toutes les étapes WALK contrôlée localement ; le moteur peut retourner une proposition au-delà du paramètre demandé |
| Calendrier | Géré par OpenTripPlanner ; erreur de date hors calendrier explicitement présentée. Aucun calcul local de fréquence ou de jours de circulation |
| Réponse | `plan.date` doit correspondre exactement à l’instant demandé ; origine/destination reçues proches des coordonnées demandées |
| Cohérence | Nombres finis, étapes chronologiques, continuité des points, durées compatibles, arrêts/lignes présents, départ/arrivée conformes à la demande et aucun départ déjà passé au lancement |
| Correspondances | Nombre de montées moins un ; attentes calculées entre étapes. Interlignage non qualifié exclu plutôt qu’affiché comme correspondance certaine |
| Géométrie | Polyline contrôlée et bornée, extrémités cohérentes ; échec limité au dessin |
| Doublons | Même suite de modes, lignes, points et horaires regroupée en une seule option |

La [documentation OpenTripPlanner 2.7](https://docs.opentripplanner.org/en/v2.7.0/RouteRequest/) explicite le sens de `arriveBy` et `ignoreRealtimeUpdates`. Les réponses réelles ont confirmé le fuseau par l’horodatage retourné et fourni `realTime=false` pour les étapes retenues. Une étape sans qualification théorique explicite, annulée ou marquée temps réel est exclue dans ce pilote. Les dates de service ne sont pas supposées identiques aux dates civiles : une circulation après minuit peut appartenir au service précédent.

## Information manquante et accès externes

**Horaires théoriques**, sans retards ni perturbations vérifiés. **Prix total inconnu**, même si une réponse contient un produit tarifaire pour une seule étape : ce produit ne prouve pas le prix de l’itinéraire entier ou d’un groupe. Aucune réservation ni achat. Accessibilité, bagages et transport de vélo non vérifiés ; aucun filtre strict correspondant ne déclare ces inconnus compatibles.

La recherche ne fournit ni garantie de correspondance ni guidage en situation réelle. Le lien volontaire vers le réseau permet de vérifier conditions et perturbations. Les résultats de transport ne participent pas encore à un classement de coût ou de carbone et ne sont pas adoptables comme trajet principal.

Requête `GET` sans identifiants de session, sans référent transmis, sans cache applicatif. Coordonnées, horaire et limite de marche restent visibles par le fournisseur et dans les outils réseau de l’appareil. Les services de fond de carte conservent le fonctionnement existant. Aucun appel automatique au moteur de transport. Délai maximal de 20 secondes, intervalle minimal de trois secondes entre lancements ; annulation, fermeture ou modification des critères invalident les réponses en attente. Pas de réessai automatique ni substitution de moteur.

## Contrôles et réception

Sept contrôles du modèle couvrent les deux réponses publiques, frontière du pilote, calendrier, changement d’heure, délais/attentes/correspondance, bornes, marche réellement cumulée, données absentes ou incohérentes, doublons et dessin incomplet. Huit scénarios navigateur couvrent les quatre formats habituels : parcours et conservation de l’état routier, arrivée limite, hors périmètre, critères invalides, erreurs/quota/calendrier, annulation tardive, carte Leaflet et contenu extérieur, fermeture et nouveau trajet.

Le rapport d’inspection lié à chaque commit porte les nombres effectivement exécutés. Les scénarios contrôlés utilisent des réponses publiques figées ; ils sont distincts de la recette sur le service réel, avec lieux publics, métadonnées de publication, fichiers reçus et captures ordinateur/mobile. Aucun trajet physique, billet acheté, téléphone réel ou disponibilité future n’est attesté.

| Exigence | État de cette livraison |
|---|---|
| TC-01 · date, fuseau, départ/arrivée | Disponible dans le pilote |
| TC-02 · marche, lignes, arrêts, correspondances, total | Disponible dans le pilote ; interlignage non qualifié exclu |
| TC-03 · moteur éprouvé et calendrier | OpenTripPlanner ; calendrier source non réimplémenté, date de mise à jour inconnue |
| TC-04 · théorique, réel, perturbations | Théorique disponible ; autres états indiqués non vérifiés |
| TC-05 · prix et réservation | Inconnus / indisponibles, sans faux zéro |
| TC-06 · accessibilité, bagages, vélo | Non vérifiés ; aucun filtre trompeur |
| TC-07 · couverture | Secteur pilote explicitement borné ; extension nationale non livrée |
