# OùQuandQui · V110 · Une portion payante choisie

Date : 27 novembre 2026. Lot NAV-TOLLS-01. Complément de V109, conservé. État : préparation locale et essais simulés ; fonction non activée dans l’application publique.

## 🛣️ Demande et résultat attendu

Un trajet évite les péages par défaut. Dans le détail de l’itinéraire, une portion payante peut être choisie, dans un sens et entre deux accès précis. Seule cette portion devient autorisée ; les péages restent évités avant et après. Une simple étape près d’une gare de péage ne satisfait pas cette demande. La portion et ses raccordements doivent être parcourables dans le sens annoncé.

Le périmètre initial porte sur une portion à la fois et le routage automobile. Une classe tarifaire 1 ou 2 n’atteste pas la compatibilité du véhicule avec la route : caravane, poids lourd, hauteur, largeur, poids réel et restrictions demandent leur propre qualification. Le prototype ne valide aucun gabarit ni état matériel de la chaussée.

## 👆 Sélection et comparaison

Le détail textuel et la carte doivent désigner la même portion : nom de la route, accès d’entrée, accès de sortie, sens, distance et source. Les noms d’accès restent inconnus si la source ne les fournit pas ; ils ne sont pas déduits d’un péage voisin. Le choix doit proposer « Comparer cette portion », puis « Prendre seulement cette portion ». La proposition n’adopte pas le tracé avant cette seconde action.

La comparaison porte sur les mêmes adresses, véhicule, date et autres évitements : durée et distance du parcours entièrement sans péage, durée et distance avec l’exception, différence et tarif de la portion lorsqu’il est connu. Les dépenses totales ne sont pas déduites du seul péage. Changer de trajet, d’option, de portion ou de plafond invalide l’ancienne proposition. Annuler conserve le trajet précédent.

## 🧩 Trois parties, une seule exception

Le calcul est préparé en trois parties : départ vers entrée avec péages exclus ; entrée vers sortie avec cette portion autorisée ; sortie vers arrivée avec péages exclus. Les trois réponses doivent avoir un réseau identique, des limites raccordées et des attributs couvrant chaque segment. La partie centrale doit reprendre exactement le tracé et le sens sélectionnés. Aucune substitution automatique d’une portion voisine ou inversée n’est acceptable.

L’évitement des ferries reste actif partout s’il a été demandé. Lorsque les autoroutes sont aussi exclues et que la portion choisie est autoroutière, une permission distincte et locale est requise. Elle ne modifie pas les deux raccordements. Si les raccordements sont impossibles, ambigus, incomplets ou payants, la proposition est refusée ; le moteur ne doit pas relâcher silencieusement les contraintes.

## 💰 Prix connu, inconnu et plafond

Le tarif doit être rattaché à l’entrée, la sortie, au sens, à la classe déclarée, à la date et à une source identifiable. Un prix absent reste « inconnu ». Sans plafond, une proposition peut afficher cette incertitude ; avec un plafond, elle est refusée tant qu’un prix valide ne respecte pas ce plafond. Les tables datées déjà disponibles restent distinctes d’une couverture nationale complète.

Dans le modèle préparé, la structure et le rattachement du tarif sont contrôlés ; l’authenticité de la source et l’exactitude du montant doivent encore être garanties par un adaptateur qualifié. Une URL HTTPS et un montant bien formé ne suffisent pas à prouver un tarif. L’exemple de 2 € du prototype est fictif.

## ⏳ Proposition, confirmation et validité

Le modèle copie les paramètres avant le premier calcul et conserve une proposition immuable. Il refuse les tracés anciens de plus de cinq minutes, les dates de réception futures, les changements de réseau, les propositions expirées, annulées ou provenant d’un autre calculateur. La confirmation compare une révision du trajet ; elle n’est utilisable qu’une fois. Une erreur du service ne déclenche aucune répétition automatique.

Le modèle effectue au maximum trois calculs successifs pour une proposition, après obtention préalable du trajet de référence et du trajet sans péage. Ces deux recherches préalables et une éventuelle recherche tarifaire sont supplémentaires ; elles ne sont pas dissimulées dans ce plafond. L’intégration devra limiter les demandes, permettre l’annulation et conserver la dernière version validée lors d’un échec.

## 🧭 Guidage, stations et sortie de route

L’intégration au guidage reste à réaliser. Les instructions des trois parties devront être raccordées, les indices géométriques ajustés et la continuité contrôlée avant le démarrage. Les arrêts en station, les variantes et les recalculs devront réappliquer le même contrat. Une exception tarifaire ne devient jamais une autorisation générale d’emprunter tous les péages.

Avant la portion, le recalcul peut encore la proposer si les contraintes restent respectées ; après sa traversée, cette permission ne doit pas conduire à y revenir. Pendant la portion, le système doit distinguer la position réellement confirmée d’un point GPS incertain. Tout changement de portion ou dépassement du plafond exige une nouvelle comparaison. Ces comportements ne sont pas encore implémentés ni validés sur Android.

## 🔎 Capacités des services vérifiées

Les capacités IGN consultées le 27 novembre ne comportent pas d’exclusion des péages. Le moteur OSRM IGN propose notamment les types autoroute, tunnel et pont ; le moteur PGR offre d’autres contraintes, mais pas l’attribut requis. Éviter les autoroutes ne prouve pas l’absence de péages sur d’autres ouvrages. Les capacités effectives, plutôt que les seuls noms d’options, font référence : [documentation IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/).

Sur les services publics OSRM et FOSSGIS examinés, les demandes automobiles avec `exclude=toll` sont rejetées par HTTP 400, « Exclude flag combination is not supported ». Les recherches ordinaires Lyon–Valence réussissent. Il s’agit d’une capacité absente, non d’une erreur de saisie. L’API générale permet des exclusions lorsque le profil du serveur les prend en charge : [API OSRM](https://project-osrm.org/docs/v5.24.0/api/), [service FOSSGIS](https://routing.openstreetmap.de/about.html). Les réponses et capacités sont conservées dans les preuves locales du lot.

## 🔌 Raccordement proposé, non activé

Le projet possède déjà un relais préparatoire pour openrouteservice, actuellement inactif. Ce moteur documente des attributs `tollways` et `waycategory` pour l’automobile ; leur présence, couverture et signification doivent encore être vérifiées sur ses réponses réelles. [Attributs openrouteservice](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/extra-info/), [catégories routières](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/extra-info/waycategory).

La proposition consiste à conserver le site sur GitHub Pages et à utiliser un relais de calcul protégé, avec la clé côté serveur et des quotas explicites. GitHub Pages héberge un site statique, sans exécuter le service Node du projet : [limites GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Un compte de calcul et un hébergement du relais hors de Pages nécessitent une décision distincte. Aucun compte, clé, nouveau fournisseur, hébergement ni dépense n’a été activé dans ce lot. Aucune gratuité ou capacité contractuelle n’est présumée.

Après cette décision, le travail porte sur les réponses réelles du fournisseur, les bornes exactes et accès routiers, le tarif disponible, les quotas, la protection du relais et enfin le branchement aux arrêts et au guidage. Le relais actuel retire encore les attributs et instructions nécessaires : son simple déploiement ne suffirait pas à terminer la fonction.

## 🧪 Réalisation locale et preuves

Un module de préparation sans accès réseau, stockage ni GPS et un prototype autonome illustrent le choix, la comparaison et la confirmation. Les données de parcours et de prix du prototype sont fictives ; aucune application publiée n’est modifiée. Le module vérifie une couverture complète des attributs, les trois raccordements, la géométrie centrale, les exclusions, le tarif rattaché, l’annulation et la validité de la confirmation. Le contrôle des coordonnées est volontairement strict ; sa compatibilité avec le rattachement routier réel reste à qualifier. Les attributs cartographiques ne garantissent pas l’état réel des routes.

35 essais du nouveau modèle et 11 essais du relais existant réussissent, soit 46. Le prototype passe les scénarios sur Chromium et Firefox, aux largeurs 1440 et 390 pixels : clavier, textes agrandis, confirmation, modification des paramètres, prix inconnu, plafond, raccordement payant et sens inversé. Aucun appel extérieur ni erreur JavaScript n’a été observé dans ces quatre parcours. WebKit n’a pas pu démarrer localement ; il n’est donc pas validé dans ce lot. Aucune recette physique Android, inspection GitHub complète ou publication n’est revendiquée pour ce complément.

## ✅ Conditions avant activation publique

La fonction ne devient disponible qu’après qualification de réponses réelles : une portion exacte, ses deux accès et son sens ; deux raccordements sans péage ; respect des autres exclusions ; absence d’adoption sur donnée manquante ou changement de réseau ; prix inconnu explicite et plafond respecté ; annulation et comparaison ; instructions de guidage raccordées ; ajout de station et sortie de route sans extension de la permission. Des essais au clavier, sur petit écran et sur Android complètent la qualification.

La version d’essai actuellement publiée reste celle du lot précédent. La présentation et le prototype de ce complément sont locaux. Le planificateur automatique reste en pause ; le lot fonctionnel NAV-TOLLS-01 reste ouvert en attente du raccordement, et la recette physique NAV-GPS-04 demeure ouverte.
