# OùQuandQui — Sources et services publics

Édition V002 · 17 novembre 2026. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les exigences de ce cahier restent la cible du produit ; leur présence ne vaut pas disponibilité.

Cette édition ajoute la recherche des villes, adresses et lieux nommés par IGN/BAN et BD TOPO. [Édition V001 conservée](OuQuandQui_API_V001_2026-11-17.md).

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
| Geoapify | Exclusions péages/ferries/autoroutes et profils de véhicules | Candidat issu du catalogue : offre annoncée de 3 000 crédits/jour, compte et clé requis. Les étapes, exclusions et longues distances consomment plusieurs crédits ; le droit commercial reste soumis aux limites des conditions. À comparer à ORS, sans confondre un profil camion avec une caravane. Non activé. |
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
