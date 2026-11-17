# OùQuandQui — Sources et services publics

Édition V003 · 17 novembre 2026. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les exigences de ce cahier restent la cible du produit ; leur présence ne vaut pas disponibilité.

Cette édition ajoute la reprise du trajet dans Google Maps ou Waze et le téléchargement du tracé GPX (ARR-07). La recherche française IGN/BAN/BD TOPO et le calcul sans autoroute sont conservés. [Édition V002 conservée](OuQuandQui_API_V002_Adresses_2026-11-17.md), ainsi que la V001.

## Décision de développement

Activer le calcul **sans autoroute pour un véhicule léger en France**, sans compte technique, sans clé à saisir et sans abonnement. Le calcul passe par la Géoplateforme IGN, ressource `bdtopo-osrm`. Le trajet standard continue d’utiliser OSRM. Si un serveur OpenRouteService est configuré par l’exploitant, il garde la priorité pour appliquer l’ensemble des options déjà prises en charge.

La sélection d’une station doit respecter les mêmes contraintes que le trajet : aucun accès, détour, classement ou arrêt ne doit être calculé avec un moteur sans exclusion alors que « éviter les autoroutes » est coché.

**Sans autoroute ne signifie pas sans péage.** Les ouvrages payants peuvent relever d’autres catégories. Le montant des péages reste inconnu, le total financier reste incomplet. Les caravanes, utilitaires et poids lourds ne deviennent pas compatibles par cette intégration. L’état réel du revêtement, la largeur disponible, les travaux et le trafic ne sont pas certifiés.

## Catalogue consulté et sélection

Le dépôt [public-apis/public-apis](https://github.com/public-apis/public-apis) sert à découvrir des fournisseurs. Il référence notamment Nominatim, OpenRouteService et Open-Meteo. La mention dans ce catalogue ne suffit pas à établir la gratuité, les droits commerciaux, la couverture française ou la disponibilité technique. Les sources nationales ci-dessous complètent cette recherche.

| Source | Utilité pour OùQuandQui | Situation vérifiée / décision |
|---|---|---|
| IGN Géoplateforme — itinéraire | Exclure les autoroutes et recalculer via une station | Service public sans clé ; limite annoncée de 5 appels/s/IP. Intégré dans ce lot pour le véhicule léger uniquement. |
| IGN Géoplateforme — géocodage / BAN | Résoudre les adresses françaises | Intégré : recherches explicites d’adresses BAN et de lieux BD TOPO, sans clé. Limite publiée : 50 appels/s/IP. L’ancienne API Adresse BAN reste dépréciée ; le nouveau point d’accès Géoplateforme est utilisé. |
| Données officielles des carburants | Prix, ruptures, horaires déclarés et services des stations | Déjà utilisé. Couverture déclarative et fraîcheur à afficher ; une donnée absente n’est ni zéro ni une confirmation d’ouverture. |
| transport.data.gouv.fr | Horaires, arrêts, aires de covoiturage et autres données de mobilité | Point d’accès aux jeux de données et aux API, pas un moteur national de réservation ni une liste de conducteurs disponibles. Licence, couverture et fraîcheur à vérifier jeu par jeu. |
| OpenRouteService / HeiGIT | Routage avancé et gabarit poids lourd | Connecteur serveur préparé. Compte, clé et quotas à vérifier auprès du fournisseur avant activation. Le logiciel libre ne rend pas son hébergement illimité. Aucune activation réalisée. |
| Geoapify | Exclusions péages/ferries/autoroutes et profils de véhicules | Candidat issu du catalogue : offre annoncée de 3 000 crédits/jour, compte et clé requis. Les étapes, exclusions et longues distances consomment plusieurs crédits ; le droit commercial reste soumis aux limites des conditions. À comparer à ORS, sans confondre un profil camion avec une caravane. Les évitements sont des préférences : le fournisseur peut les relâcher en l’absence d’alternative pratique. Un contrôle des segments serait requis avant toute promesse d’exclusion stricte. Non activé. |
| TollGuru | Estimation des péages sur un trajet | Piste complémentaire hors catalogue consulté. Offre d’essai avec clé, pas une gratuité permanente établie. La documentation interdit d’exposer la clé côté navigateur : une intégration serveur et une validation des classes françaises seront nécessaires. Non activé. |
| Open-Meteo | Météo sur le trajet | Intéressant pour un prototype. Offre gratuite sans usage commercial ; une application facturée doit prévoir une offre compatible. Pas de raccordement automatique dans ce lot. |
| Nominatim public | Ancien géocodage | Remplacé par IGN pour la France. Aucun appel ni repli automatique vers Nominatim dans cette version. Son plafond agrégé de 1 appel/s était inadapté à une ouverture large avec une simple temporisation par page. |

## Contrat du calcul IGN

- Requête HTTPS vers un endpoint fixe : `https://data.geopf.fr/navigation/itineraire`. Aucun domaine fourni par un visiteur.
- Ressource `bdtopo-osrm`, profil `car`, optimisation `fastest`, coordonnées longitude/latitude en `EPSG:4326`.
- Exclusion unique : `constraintType=banned`, `key=waytype`, `operator==`, `value=autoroute`, telle que publiée dans les capacités du service à la date de vérification.
- Unités demandées et contrôlées : mètres et secondes. La longueur du trajet, sa durée, sa géométrie, ses portions et l’exclusion renvoyée doivent être cohérentes. Une réponse sans exclusion confirmée est refusée.
- Lors d’un passage en station, `intermediates` transmet le point de passage. Les portions du trajet fournissent la distance routière depuis le départ. Une matrice OSRM non contrainte n’est jamais utilisée pour ce classement.
- Un point rattaché par le moteur à plus de 1 km du départ, de l’arrivée ou d’une station est refusé. Cette borne empêche les rattachements manifestement lointains ; elle ne certifie pas l’entrée exacte d’une station ni son accessibilité physique.
- Les recalculs plus courts ou plus rapides que la référence restent exclus de la comparaison, avec explication. Un détour négatif n’est jamais transformé en zéro.
- Appels séquentiels, espacés d’au moins 550 ms dans une page ; cache mémoire de 32 réponses au plus, expiration après 5 minutes. Les autres onglets/utilisateurs partageant une IP peuvent aussi consommer le quota.
- Délai maximal 25 secondes par appel. Un HTTP 429 arrête la recherche sans répétition automatique. Une erreur ne déclenche aucun repli vers un trajet autorisant les autoroutes.
- Annulation de la recherche de stations : le trajet de base reste disponible, aucune liste partielle n’est présentée comme complète.
- Aucun trajet alternatif inventé. Le service fournit ici un seul itinéraire ; cela est affiché.
- Attribution IGN / BD TOPO / Licence Ouverte 2.0 et version des données renvoyée par le fournisseur.
- Les coordonnées sont envoyées après une action explicite de recherche. Ni le nom du profil, ni la liste des favoris, ni le gabarit ne sont transmis à l’IGN dans ce lot. Aucun prix de carburant ou tarif de péage n’est demandé à l’IGN.

## Contrat de la recherche d’adresses IGN

- Recherche après « Trouver mon trajet » uniquement : aucune transmission pendant la frappe. Les deux recherches sont séquentielles.
- `https://data.geopf.fr/geocodage/search`, index `address,poi`, cinq propositions au maximum, `autocomplete=false`. Les index couvrent les données françaises disponibles ; le logiciel ne promet pas un géocodage mondial ni une couverture routière exhaustive outre-mer.
- La requête transmet le texte du départ puis de l’arrivée. Le nom du profil, la liste des adresses enregistrées et les favoris restent locaux. Utiliser une adresse enregistrée comme départ ou arrivée transmet cette adresse après l’action de recherche.
- Géométrie GeoJSON Point, coordonnées longitude/latitude numériques finies et dans les bornes WGS84, type de source connu et nom lisible requis. Les entrées invalides sont écartées ; si aucune n’est exploitable, aucun trajet n’est calculé. Une liste réellement vide indique un lieu introuvable et invite à préciser la commune ou le code postal.
- Les homonymes sont accompagnés du code postal, de la commune, du département lorsqu’il est fourni et du type de lieu nommé. Plusieurs propositions imposent une confirmation sans présélection ; une proposition unique valide peut être retenue directement. Le score fournisseur ne constitue pas une garantie d’exactitude.
- Les doublons strictement identiques (coordonnées et libellé enrichi) sont regroupés. Deux coordonnées différentes restent deux choix possibles. Les libellés sont affichés comme texte, jamais interprétés comme HTML.
- Le départ et l’arrivée retenus restent visibles dans le résumé. Annuler une sélection déverrouille le formulaire et ne conserve pas un ancien trajet comme résultat de la nouvelle recherche.
- Cache mémoire de 30 requêtes, expiration après cinq minutes, perdu à la fermeture/recharge. Espacement minimal de 250 ms entre appels dans une page. Le quota IP est partagé avec les autres pages et utilisateurs de la même connexion.
- Erreur HTTP 429 : aucune répétition automatique ; attente minimale de cinq secondes ou délai supérieur `Retry-After` s’il est lisible via CORS. Un nouvel appui pendant ce délai n’envoie aucune requête. Les réponses en erreur ne sont pas mises en cache.
- Pas de fournisseur de secours silencieux ; l’indisponibilité est affichée et une relance manuelle reste possible. La configuration conserve un point d’accès remplaçable par l’exploitant.
- Attribution IGN, BAN, BD TOPO et Licence Ouverte 2.0. La position GPS reste une action distincte et volontaire.

La fiche [Recherche d’adresses IGN](../acceptance/DragonRoute-Geocodage-IGN.md) distingue les tests simulés et les observations du service réel.

## Reprise du trajet et export — ARR-07

Après un calcul réussi, le bouton « Navigation et tracé GPS » ouvre une fenêtre présentant le trajet courant. Les liens sont produits à l’ouverture et supprimés à la fermeture ou à l’invalidation du trajet. Aucun appel à Google Maps ou Waze n’est envoyé par l’application avant l’ouverture volontaire d’un lien.

| Action | Données transmises | Limites affichées |
|---|---|---|
| Google Maps | Coordonnées du départ, de l’arrivée et de l’unique station confirmée ; mode voiture ; préférences d’évitement actives | Le service recalcule le parcours. La géométrie et la variante sélectionnée ne sont pas transmises. Certaines plateformes ne prennent pas en charge l’étape. |
| Waze vers la station | Coordonnées de la station confirmée ; mode voiture privée ; préférences actives | Une seule destination ; départ depuis la position utilisée par Waze. L’arrivée finale n’est pas une seconde étape de ce lien. |
| Waze vers l’arrivée | Coordonnées de l’arrivée ; mode voiture privée ; préférences actives | Ne reprend ni le départ prévu ni la station comme étape. |
| Télécharger GPX | Aucun envoi réseau par l’application ; fichier local comprenant le tracé affiché et les points de départ, d’arrêt confirmé et d’arrivée | Tracé préparé, sans carte hors ligne, guidage vocal ni enregistrement d’un déplacement effectué. Les restrictions et le gabarit sont descriptifs, pas des réglages appliqués au GPS importateur. |

Les liens Google Maps utilisent l’interface URLs publique `api=1`, sans clé. Les liens Waze utilisent `https://www.waze.com/ul`. Les évitements transmis restent des demandes au service externe, pas une garantie de leur application. Le parcours et les options doivent être contrôlés dans l’application destinataire. Les liens voiture ne sont proposés que pour un trajet léger : aucun lien voiture de substitution n’est fourni pour un poids lourd.

Le GPX est au format 1.1, coordonnées WGS84 écrites avec huit décimales. Il reprend la géométrie courante, y compris une variante sélectionnée ou le recalcul avec station confirmée. Il conserve les libellés des lieux, le moteur et les contraintes déclarées, la distance et la durée estimées hors arrêts, les dates du calcul initial et de confirmation d’arrêt lorsqu’il y en a un, ainsi que la date d’export. Il ne crée aucune altitude, heure de passage ou vitesse non mesurée. Les caractères réservés XML sont échappés et les contrôles interdits retirés. Un échec de téléchargement est signalé ; le message de succès décrit une demande de téléchargement, pas une confirmation de sauvegarde sur disque.

Les lieux inclus dans un fichier GPX deviennent accessibles à son destinataire si le fichier est partagé. Aucun compte, synchronisation de profil, abonnement ni nouvelle API payante n’est nécessaire pour ces trois actions. La [fiche d’acceptation Navigation](../acceptance/DragonRoute-Navigation.md) décrit les contrôles et leurs limites.

## Vérifications complémentaires du 17 novembre 2026

**Péages.** La documentation TollGuru exige une clé privée, interdit son exposition dans le code public ou côté navigateur et présente un essai soumis à compte et quota. Une clé ne sera pas placée dans GitHub Pages. Aucun compte ni abonnement n’a été créé. Le tarif reste indisponible ; l’exclusion des autoroutes ne permet pas de conclure à un tarif nul.

**Ferries IGN.** Les capacités de `bdtopo-pgr` publient une contrainte `nature=bac_ou_liaison_maritime`. Deux sondes ponctuelles ont donné des résultats différents : Couëron/Le Pellerin (`-1.726,47.212` vers `-1.755,47.199`) répond sans contrainte, mais la requête avec exclusion renvoie HTTP 404 ; Lyon/Valence répond avec cette exclusion et la répète dans sa réponse. Le premier calcul sans contrainte mentionne la ressource `bdtopo-valhalla` dans la réponse. Ces observations ne démontrent ni une panne générale ni une exclusion fiable sur un ensemble représentatif de traversées. L’option ferries n’est donc pas activée par cette livraison.

**Autres moteurs.** L’évitement Geoapify est documenté comme une préférence pouvant être relâchée. Cette propriété doit être prise en compte dans une future comparaison : un paramètre envoyé ne suffit pas à certifier une route sans péage, ferry ou autoroute.

## Ce qui reste à développer

L’exclusion des seuls péages, leur estimation tarifaire et les véhicules avec gabarit demandent une source adaptée et validée. Le catalogue ne résout pas à lui seul ces trois besoins. Les champs restent indisponibles lorsqu’aucun service compatible n’est activé.

Avant une diffusion à grande échelle : mesurer l’usage du géocodage IGN et vérifier l’usage des tuiles cartographiques, mesurer la charge réelle et arrêter le périmètre des premiers services de transport/covoiturage. Aucune souscription, clé privée, facturation, création de compte utilisateur ou promesse de couverture exhaustive n’est ajoutée par cette livraison.

La recette technique et les observations réelles sont consignées dans [la fiche d’acceptation IGN](../acceptance/DragonRoute-IGN.md). Les tests simulés ne démontrent pas une couverture France exhaustive ni la sécurité d’un trajet pour une caravane.

## Sources officielles consultées le 17 novembre 2026

- [IGN : calcul d’itinéraire](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/) et [capacités effectives du service](https://data.geopf.fr/navigation/getCapabilities).
- [IGN : conditions d’utilisation](https://cartes.gouv.fr/cgu/?lang=fr), gratuité des géoservices sauf licence spécifique ; [données IGN ouvertes](https://www.ign.fr/institut/des-donnees-et-logiciels-ouverts-au-service-de-la-nation), dont BD TOPO sous Licence Ouverte Etalab 2.0.
- [BAN : migration vers la Géoplateforme](https://adresse.data.gouv.fr/outils/api-doc/adresse).
- [IGN : géocodage](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/), [contrat OpenAPI](https://data.geopf.fr/geocodage/openapi) et [capacités](https://data.geopf.fr/geocodage/getcapabilities).
- [Données officielles des carburants](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/).
- [Point d’accès national aux données de transport](https://transport.data.gouv.fr/).
- [Offres HeiGIT / OpenRouteService](https://account.heigit.org/info/plans) — aucun quota contractuel figé dans ce document, offre à confirmer lors de l’activation.
- [Geoapify : routage et crédits](https://apidocs.geoapify.com/docs/route-planner/routing/), [conditions d’usage](https://www.geoapify.com/terms-and-conditions/) et [profils poids lourds](https://www.geoapify.com/truck-routing-with-routing-api/).
- [TollGuru : documentation et accès d’essai](https://tollguru.com/toll-api-docs?requestEditable=true).
- [Open-Meteo : offres et droit d’usage commercial](https://open-meteo.com/en/pricing).
- [Nominatim : politique du service public](https://operations.osmfoundation.org/policies/nominatim/).

- [Google Maps : URLs et paramètres de trajet](https://developers.google.com/maps/documentation/urls/get-started).
- [Waze : liens de navigation et préférences](https://developers.google.com/waze/deeplinks).
- [GPX 1.1 : contrat et schéma](https://www.topografix.com/GPX/1/1/).
- [Geoapify : portée des préférences d’évitement](https://apidocs.geoapify.com/how-to/routing/avoid-tolls-highways-ferries).
