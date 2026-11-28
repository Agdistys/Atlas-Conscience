# OùQuandQui — Sources et services publics

Édition V001 · 17 novembre 2026. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les exigences de ce cahier restent la cible du produit ; leur présence ne vaut pas disponibilité.

## Décision de développement

Activer le calcul **sans autoroute pour un véhicule léger en France**, sans compte technique, sans clé à saisir et sans abonnement. Le calcul passe par la Géoplateforme IGN, ressource `bdtopo-osrm`. Le trajet standard continue d’utiliser OSRM. Si un serveur OpenRouteService est configuré par l’exploitant, il garde la priorité pour appliquer l’ensemble des options déjà prises en charge.

La sélection d’une station doit respecter les mêmes contraintes que le trajet : aucun accès, détour, classement ou arrêt ne doit être calculé avec un moteur sans exclusion alors que « éviter les autoroutes » est coché.

**Sans autoroute ne signifie pas sans péage.** Les ouvrages payants peuvent relever d’autres catégories. Le montant des péages reste inconnu, le total financier reste incomplet. Les caravanes, utilitaires et poids lourds ne deviennent pas compatibles par cette intégration. L’état réel du revêtement, la largeur disponible, les travaux et le trafic ne sont pas certifiés.

## Catalogue consulté et sélection

Le dépôt [public-apis/public-apis](https://github.com/public-apis/public-apis) sert à découvrir des fournisseurs. Il référence notamment Nominatim, OpenRouteService et Open-Meteo. La mention dans ce catalogue ne suffit pas à établir la gratuité, les droits commerciaux, la couverture française ou la disponibilité technique. Les sources nationales ci-dessous complètent cette recherche.

| Source | Utilité pour OùQuandQui | Situation vérifiée / décision |
|---|---|---|
| IGN Géoplateforme — itinéraire | Exclure les autoroutes et recalculer via une station | Service public sans clé ; limite annoncée de 5 appels/s/IP. Intégré dans ce lot pour le véhicule léger uniquement. |
| IGN Géoplateforme — géocodage / BAN | Résoudre les adresses françaises | Candidat prioritaire pour remplacer le géocodage public Nominatim avant une ouverture large. L’ancienne API Adresse BAN est dépréciée ; utiliser la nouvelle documentation, pas une ancienne URL du catalogue. Non intégré dans ce lot. |
| Données officielles des carburants | Prix, ruptures, horaires déclarés et services des stations | Déjà utilisé. Couverture déclarative et fraîcheur à afficher ; une donnée absente n’est ni zéro ni une confirmation d’ouverture. |
| transport.data.gouv.fr | Horaires, arrêts, aires de covoiturage et autres données de mobilité | Point d’accès aux jeux de données et aux API, pas un moteur national de réservation ni une liste de conducteurs disponibles. Licence, couverture et fraîcheur à vérifier jeu par jeu. |
| OpenRouteService / HeiGIT | Routage avancé et gabarit poids lourd | Connecteur serveur préparé. Compte, clé et quotas à vérifier auprès du fournisseur avant activation. Le logiciel libre ne rend pas son hébergement illimité. Aucune activation réalisée. |
| Geoapify | Exclusions péages/ferries/autoroutes et profils de véhicules | Candidat issu du catalogue : offre annoncée de 3 000 crédits/jour, compte et clé requis. Les étapes, exclusions et longues distances consomment plusieurs crédits ; le droit commercial reste soumis aux limites des conditions. À comparer à ORS, sans confondre un profil camion avec une caravane. Non activé. |
| TollGuru | Estimation des péages sur un trajet | Piste complémentaire hors catalogue consulté. Offre d’essai avec clé, pas une gratuité permanente établie. La documentation interdit d’exposer la clé côté navigateur : une intégration serveur et une validation des classes françaises seront nécessaires. Non activé. |
| Open-Meteo | Météo sur le trajet | Intéressant pour un prototype. Offre gratuite sans usage commercial ; une application facturée doit prévoir une offre compatible. Pas de raccordement automatique dans ce lot. |
| Nominatim public | Résolution d’adresses actuelle | Déjà utilisé, sans autocomplétion. Plafond de 1 appel/s pour l’ensemble de l’application, pas par visiteur : la temporisation d’une seule page ne suffit pas pour une ouverture large. |

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

## Ce qui reste à développer

L’exclusion des seuls péages, leur estimation tarifaire et les véhicules avec gabarit demandent une source adaptée et validée. Le catalogue ne résout pas à lui seul ces trois besoins. Les champs restent indisponibles lorsqu’aucun service compatible n’est activé.

Avant une diffusion à grande échelle : remplacer ou encadrer le géocodage public Nominatim, vérifier l’usage des tuiles cartographiques, mesurer la charge réelle et arrêter le périmètre des premiers services de transport/covoiturage. Aucune souscription, clé privée, facturation, création de compte utilisateur ou promesse de couverture exhaustive n’est ajoutée par cette livraison.

La recette technique et les observations réelles sont consignées dans [la fiche d’acceptation IGN](../acceptance/DragonRoute-IGN.md). Les tests simulés ne démontrent pas une couverture France exhaustive ni la sécurité d’un trajet pour une caravane.

## Sources officielles consultées le 17 novembre 2026

- [IGN : calcul d’itinéraire](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/) et [capacités effectives du service](https://data.geopf.fr/navigation/getCapabilities).
- [IGN : conditions d’utilisation](https://cartes.gouv.fr/cgu/?lang=fr), gratuité des géoservices sauf licence spécifique ; [données IGN ouvertes](https://www.ign.fr/institut/des-donnees-et-logiciels-ouverts-au-service-de-la-nation), dont BD TOPO sous Licence Ouverte Etalab 2.0.
- [BAN : migration vers la Géoplateforme](https://adresse.data.gouv.fr/outils/api-doc/adresse).
- [Données officielles des carburants](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/).
- [Point d’accès national aux données de transport](https://transport.data.gouv.fr/).
- [Offres HeiGIT / OpenRouteService](https://account.heigit.org/info/plans) — aucun quota contractuel figé dans ce document, offre à confirmer lors de l’activation.
- [Geoapify : routage et crédits](https://apidocs.geoapify.com/docs/route-planner/routing/), [conditions d’usage](https://www.geoapify.com/terms-and-conditions/) et [profils poids lourds](https://www.geoapify.com/truck-routing-with-routing-api/).
- [TollGuru : documentation et accès d’essai](https://tollguru.com/toll-api-docs?requestEditable=true).
- [Open-Meteo : offres et droit d’usage commercial](https://open-meteo.com/en/pricing).
- [Nominatim : politique du service public](https://operations.osmfoundation.org/policies/nominatim/).
