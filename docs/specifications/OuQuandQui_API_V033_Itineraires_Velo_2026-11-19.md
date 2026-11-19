# V033 — Calculer un trajet à vélo

Lot DOU-VELO-01 · 19 novembre 2026. Complète DOU-01/02, DAT-01, ERR-01/05/06 et QUA-05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), après les [vélos partagés V032](OuQuandQui_API_V032_Velos_Partages_2026-11-19.md). Versions antérieures conservées.

## Parcours disponible

Depuis les champs départ/arrivée de « Mon trajet », l’accès « À vélo · essai » ouvre une consultation dédiée, sans calcul automobile préalable. Le bouton de calcul vérifie les lieux auprès de l’IGN, demande leur confirmation lorsqu’ils sont ambigus, puis interroge un moteur configuré pour le vélo. Un lieu mémorisé correspondant exactement à la saisie peut être réutilisé sans géocodage. Aucune demande vélo à l’ouverture ou pendant la frappe.

Le résultat donne le véritable tracé, la distance, la durée estimée hors pauses, les voies nommées par la source et les distances annoncées vélo à la main. Carte bleue avec contour et extrémités ; sans bibliothèque cartographique, schéma du tracé reçu explicitement sans échelle. Aucune ligne droite substituée. Une limite personnelle facultative entre 0,1 et 300 km signale le dépassement avant arrondi, sans modifier le tracé ni relancer le réseau. Ce repère n’est pas une autonomie ni une limite de sécurité.

Le bouton GPX exporte la géométrie affichée avec mode, source, attribution et date du calcul. Il ne crée ni altitude, ni horaire de passage, ni suivi GPS. Prix et empreinte restent non estimés. Les préparations et journaux existants ne changent pas ; aucun déplacement réputé effectué. La sauvegarde vélo dans « Mes trajets » reste le lot suivant.

Le profil disponible est vélo classique. VAE, batterie, effort, pente, revêtement, conditions réelles, guidage en déplacement et accessibilité ne sont pas qualifiés. Les réglages automobiles et rencontres ne sont pas transférés. Les stations Vélo’v sont consultables séparément : accès à pied, location, restitution et coûts ne sont pas inclus ; **DOU-04 reste à développer**.

## Source et conditions d’usage

- [Service FOSSGIS OSRM](https://routing.openstreetmap.de/about.html), données OpenStreetMap, consulté le 19 novembre 2026 : trois moteurs distincts, dont un vélo. Le [paramétrage officiel du client](https://github.com/fossgis-routing-server/osrm-frontend/blob/master/src/leaflet_options.js) pointe vers `routed-bike` ; le [profil cyclable publié](https://github.com/fossgis-routing-server/cbf-routing-profiles/blob/master/bike.lua) applique des accès et vitesses propres au vélo, avec des portions à pied et potentiellement des transports. Ces derniers sont refusés par ce raccordement.
- [API OSRM 5.x](https://project-osrm.org/docs/v5.24.0/api/) : le profil effectif dépend du graphe préparé sur le serveur. Le segment `driving` du chemin historique n’active pas un profil automobile sur `routed-bike`. L’endpoint qualifié, les modes des étapes et la source restent associés ; aucun changement de vitesse sur une route automobile.
- [Conditions officielles FOSSGIS, source du site](https://github.com/fossgis/fossgis-webseite/blob/master/content/arbeitsgruppen/osm-server/nutzungsbedingungen.md). Le site rendu a répondu par une protection Anubis ; le texte intégral a été lu dans le dépôt officiel, sans contournement de la protection. Attribution, lien de correction cartographique, contact de l’éditrice, référent valide, charge modérée, maximum une requête par seconde. Le contact reprend l’adresse déjà affichée sur la [page publique de l’éditrice](https://www.agdistys.fr/contact/).
- Activation **limitée à l’aperçu gratuit et modérément fréquenté**. Les conditions excluent un service commercial dont ce routage est une composante substantielle ainsi que les usages à fort trafic. Une offre payante ou une diffusion importante devra choisir un autre cadre, fournisseur ou accord avant activation ; ce lot n’en valide aucun. Aucun compte, achat, abonnement ou nouveau serveur.
- La piste Valhalla FOSSGIS demande une prise de contact lors de la publication d’applications. Aucun message envoyé ; OSRM vélo dispose de conditions directement examinables et suffit au parcours de ce lot.

L’attribution et « Signaler une erreur cartographique » sont visibles dans le panneau. Service communautaire révocable et sans disponibilité garantie. Les limites locales ne garantissent pas un plafond agrégé entre tous les visiteurs et appareils. L’aperçu ne vaut pas autorisation de commercialisation ou de publication principale.

## Qualification réelle datée

Premier appel sur deux lieux publics lyonnais : Place Bellecour (4.832126, 45.757974) → gare Part-Dieu (4.858507, 45.760146), HTTP 200, 2 578,1 m, 938,2 s, 164 points, 23 étapes `cycling`. Requête, horodatage, en-têtes, empreinte et réponse brute conservés dans `tests/fixtures/cycling`. Les scénarios automatisés dérivent explicitement leurs pannes et variantes de cette fixture ; ils ne sont pas des déplacements réels. Les recettes navigateur et aperçu sont consignées séparément dans `quality/cycling`.

Recette réelle dans Chrome après résolution IGN et choix explicite des deux lieux publics : 2 817,4 m, 1 076,4 s et 182 points. Les points géocodés diffèrent des coordonnées du premier exemple ; les deux preuves restent séparées. Un seul appel cyclable, GPX identique au tracé reçu, limite locale sans requête supplémentaire, stockage et trajet principal inchangés.

Premiers essais en France métropolitaine uniquement. Fenêtre technique longitude −5,5 à 9,7 et latitude 41 à 51,2 ; elle inclut des zones voisines et ne constitue pas une frontière administrative ni une certification de couverture. Outre-mer non qualifié. Limites d’essai : 150 km à vol d’oiseau entre les points et 300 km de parcours retourné. Ce sont des bornes de charge et de validation, pas une capacité physique recommandée.

## Contrat réseau et validation

Endpoint exact autorisé : `https://routing.openstreetmap.de/routed-bike/route/v1/driving/`, activé par `cyclingApi` dans la configuration. Vide ou endpoint non qualifié : commande désactivée, raison visible. Remplacement soumis à qualification, pas de relais libre vers une URL reçue.

Une seule requête GET avec les deux coordonnées WGS84 longitude/latitude, `overview=full`, `geometries=geojson`, `steps=true`, `alternatives=false`. Aucun profil, nom d’adresse, favori, prix, limite personnelle ou donnée Vélo’v transmis à FOSSGIS. Le géocodeur existant reçoit les textes nécessaires. Pas de cookies ; référent limité à l’origine de l’application. Le fournisseur conserve les demandes dans ses journaux, conformément à sa notice. Les essais utilisent uniquement des lieux publics.

Une requête vélo à la fois, intervalle minimal cinq secondes dans l’onglet ; huit résultats au maximum en mémoire pendant cinq minutes, clé incluant l’URL complète. La date originale reste visible à la réutilisation. Aucun cache persistant ni sondage automatique. `Retry-After` du 429 respecté lorsqu’exposé par CORS, au moins une minute ; sinon même délai minimal. Aucune relance automatique ni repli vers un moteur voiture.

Délai global de trente secondes comprenant la résolution, avec annulation et garde d’identité. Fermeture et changement de lieu invalident le calcul ; une réponse tardive ne remplace aucun résultat. L’échec retire le résultat vélo de la nouvelle recherche et laisse le trajet principal et les données locales intacts. La garde libère les commandes même si le transport ignore l’annulation.

Réponse bornée à 2 Mo pendant lecture, un seul itinéraire et une seule portion, 2–25 000 points, 2–1 500 étapes. Coordonnées et nombres strictement numériques et finis ; mètres et secondes positifs. Points rattachés à 150 m au maximum des lieux demandés, contrôle des extrémités. Étapes `cycling` et `pushing bike` seulement ; traversée, train, voiture ou mode inconnu bloquent le résultat direct. Sommes des distances/durées cohérentes avec portion et total à max(10 unités, 0,1 %). Géométrie sans saut supérieur à 5 km et longueur mesurée à max(75 m, 5 %) de la distance annoncée. Ces contrôles détectent des incohérences, pas les erreurs de terrain.

`NoRoute`/`NoSegment`, quota, panne HTTP, format illisible, réponse trop grosse, données incohérentes, délai et annulation restent distincts. Version des données éventuellement fournie, sinon inconnue ; date de consultation jamais substituée à celle des données. Textes rendus inertes, liens fixes, GPX échappé.

## Recette et suite

Contrôles unitaires du vrai exemple, mode adapté, bornes, géométrie, métriques, inconnus et GPX. Parcours navigateur sur quatre formats : carte/schéma, limite, clavier, lieux ambigus, export, stockage/préparations/trajet principal inchangés, pannes, quota, annulation, réponse tardive, cache et contenu hostile. Suite complète et aperçu liés au commit exact ; captures ordinateur/mobile relues. Aucun téléphone physique, Safari, location ou trajet sur route validé. Zéro violation automatique ne vaut pas certification d’accessibilité.

Prochaine capacité : sauvegarder, revoir, reprendre et exporter/importer une préparation vélo locale datée sans écraser les préparations des autres modes. La comparaison multimodale et la liaison aux stations partagées viendront avec leurs portions réellement calculées.
