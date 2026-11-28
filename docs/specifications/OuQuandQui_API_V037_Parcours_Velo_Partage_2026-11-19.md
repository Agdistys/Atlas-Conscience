# V037 — Marche, vélo partagé et marche à Lyon

DOU-PARTAGE-02 · 19 novembre 2026. Complète DOU-01 à DOU-05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [consultation Vélo’v V032](OuQuandQui_API_V032_Velos_Partages_2026-11-19.md), le [moteur vélo V033](OuQuandQui_API_V033_Itineraires_Velo_2026-11-19.md) et son [cache partagé V035](OuQuandQui_API_V035_Comparaison_Velo_2026-11-19.md). Le [journal V036](OuQuandQui_API_V036_Journal_Velo_2026-11-19.md) reste indépendant. Éditions précédentes conservées.

## Parcours proposé

Dans « Vélos partagés · pilote Lyon », charger les stations, choisir explicitement « Prendre un vélo ici » et « Rendre le vélo ici », puis lancer « Calculer marche + vélo partagé ». La recherche, les filtres et les marqueurs existants restent disponibles. Les numéros relient toujours les cartes et les stations ; le choix est conservé lors d’un filtre ou d’un changement de page.

Les lieux de « Mon trajet » sont copiés à l’ouverture dans deux champs propres à cette préparation. Ils peuvent être modifiés sans changer le trajet principal. Les favoris ou lieux déjà résolus sont réutilisés seulement pour une correspondance exacte ; sinon l’IGN est interrogé, avec confirmation des lieux ambigus. Aucun géocodage ni routage à l’ouverture, à la frappe ou au choix d’une station.

Les trois étapes sont calculées dans l’ordre : marche du départ à la station de prise, vélo classique entre les deux stations, marche de la station de restitution à l’arrivée. Les portions à pied utilisent le profil piéton IGN ; le vélo utilise le graphe cyclable FOSSGIS déjà qualifié. Aucun tracé automobile ni conversion de vitesse. Deux stations identiques, éloignées de moins de 10 m, absentes ou hors du catalogue sont refusées. Départ et arrivée doivent rester dans la fenêtre du pilote lyonnais déjà utilisée en V032 ; cette fenêtre n’est pas une frontière administrative.

Chaque étape présente ses lieux, distance, durée estimée, source, consultation et version de données lorsqu’elle existe. Les passages annoncés vélo à la main restent compris dans la portion cyclable et visibles. La consultation d’un résultat IGN peut utiliser son cache de cinq minutes ; la date affichée n’est pas présentée comme une nouvelle acquisition du réseau. Le résultat cyclable conserve sa date d’origine lorsqu’il provient du cache.

## Temps de prise et de restitution

Deux champs facultatifs acceptent de 0 à 120 minutes, décimales comprises. Une valeur vide est inconnue ; zéro est une durée explicitement renseignée. Aucune valeur moyenne ne vient remplacer la donnée manquante. Ces temps sont des hypothèses personnelles, jamais attribuées à Vélo’v.

La somme des distances et des temps de déplacement des trois étapes reste visible. La durée incluant les temps renseignés n’est proposée que si les deux temps sont valides et les raccordements des tracés satisfont la règle ci-dessous. Modifier ces temps après calcul actualise la présentation localement, sans requête. Prix de location, empreinte, réservation, accès au service, batterie et autonomie restent non estimés ou non confirmés.

Les durées par étape et la somme finale sont arrondies au plafond en minutes pour l’affichage, après addition des secondes brutes. Additionner visuellement des minutes déjà arrondies peut donc donner un autre résultat. Les valeurs brutes ne sont pas remplacées par cet arrondi.

## Raccordements et carte

Les trois géométries reçues sont dessinées séparément : marche violette en pointillés, vélo bleu, contour clair. Aucune ligne droite ni chemin fictif ne joint les étapes. Le cadrage est réajusté au changement de taille de la carte pour conserver toutes les étapes visibles. Sans Leaflet, un schéma des trois géométries reçues reste disponible, explicitement sans fond de carte ni échelle.

Les distances à vol d’oiseau entre fin de marche/début vélo et fin vélo/début de marche sont présentées. Au-delà de **30 m** pour l’un de ces écarts, la durée assemblée est retirée. Ce seuil est une règle conservatrice de l’application, pas une mesure de l’accès aux bornes ni une validation de terrain. En dessous, la somme reste une estimation des étapes et des temps renseignés, hors accès fin non mesuré. La validation de chaque moteur autorise un rattachement aux points demandés de 150 m au maximum ; aucune continuité physique n’est garantie par le rapprochement des points.

Si le point de départ ou d’arrivée est strictement identique à celui de sa station, la marche correspondante est explicitement présentée comme « même point demandé » avec zéro distance/durée, sans requête. Une simple proximité ne déclenche jamais cette substitution.

## Disponibilités

Le filtre facultatif « Exiger un vélo mécanique et une place annoncés récemment » réutilise les règles V032 : installation, ouverture du service concerné, compte strictement positif, type mécanique explicitement identifié pour la prise, date de station et date du flux d’au plus cinq minutes avec tolérance d’horloge. Inconnu, ancien ou incohérent ne satisfait pas le filtre.

Lorsque le filtre est actif, une donnée insuffisante empêche le lancement. Lorsqu’il est retiré, une préparation exploratoire reste possible ; les annonces non confirmées sont signalées, sans promesse de disponibilité. Le vieillissement est réévalué localement sans sondage réseau. Une préparation déjà calculée est conservée, mais sa durée assemblée est retirée de la présentation admissible lorsque le filtre actif n’est plus satisfait. Retirer ce filtre ne change aucune annonce.

Actualiser le catalogue réinitialise les stations choisies et le parcours : la page l’annonce avant l’action. Les lieux et temps saisis dans le panneau restent présents. Un choix de station, un changement de lieu ou la fermeture retire le résultat préparé. Un changement de paramètre pendant un calcul annule ce calcul. Après calcul, temps et filtre sont réévalués sans routage.

## Réseau, erreurs et conservation

Les trois flux GBFS restent chargés volontairement, séparément du calcul de parcours. Les adresses sont adressées à l’IGN pour le géocodage ; les points des marches sont transmis à son calculateur. FOSSGIS reçoit uniquement les coordonnées des deux stations. Aucun profil, favori complet ou journal transmis. Conditions et licences déjà examinées en V032/V033 conservées ; FOSSGIS reste limité à l’essai gratuit modéré.

Au maximum deux géocodages, deux marches et un parcours vélo par calcul, hors réutilisation des caches ou marche de même point. Requêtes séquentielles, caches et délais existants conservés ; aucune relance automatique après quota ou panne. Une seule préparation active, annulation disponible, commandes incompatibles désactivées. Délai global 90 secondes, englobant le choix des lieux, et délais propres à chaque service. Réponses tardives et changements de contexte ne réaffichent aucun résultat abandonné.

Une étape refusée ou indisponible interrompt le calcul et nomme l’étape en cause. Aucun parcours complet ni durée totale de remplacement n’est présenté ; un ancien résultat est retiré au nouveau lancement. Les lieux et choix peuvent être corrigés puis une nouvelle recherche explicitement lancée. Les données d’un moteur automobile ou d’un mode cyclable non qualifié sont refusées par les validateurs existants.

Préparation en mémoire uniquement : fermeture ou rechargement la perdent. Aucun enregistrement dans Mes trajets, déplacement confirmé, empreinte, export de profil ou modification du trajet principal n’est réalisé. La sauvegarde de cette chaîne et une liaison vers le journal restent des lots distincts. La préparation est vélo classique ; VAE, état des routes, pente, accessibilité et réservation ne sont pas qualifiés. Elle ne relie pas le pilote Grenoble au réseau Lyon et ne prétend pas couvrir une chaîne train + vélo ni la France entière.

## Qualification et vérifications

Réponses réelles figées dans `tests/fixtures/shared-bike-trip`, avec URL, date, en-têtes et empreintes : point public de Bellecour vers la station 2002 (216,7 m, 142,4 s), station 2002 vers 3011 (2 565,2 m, 901,7 s), station 3011 vers un point public de Part-Dieu (347,2 m, 343,6 s). Ces points ne sont ni des localisations personnelles ni des preuves de déplacement. Les géocodages des recettes navigateur peuvent choisir d’autres points publics et restent consignés séparément.

Huit contrôles de modèle : réponses réelles, temps inconnus/zéro, sélection et territoire, disponibilité, vieillissement, raccordements, incohérences et coûts absents. La première passe a révélé trois assertions trop strictes sur l’addition décimale en virgule flottante ; tolérance numérique corrigée dans les assertions sans arrondir les calculs de production.

Seize scénarios navigateur sur quatre formats couvrent parcours, carte/schéma, confirmations, temps, disponibilités, expiration, caches, invalidations, erreurs, quotas, profils incohérents, annulation, délais, noms inertes et conservation des données. Les comptes et dates des disponibilités sont explicitement simulés dans ces scénarios ; ils ne sont pas une preuve de vélos présents. Recette réelle distincte avant et après publication, avec captures ordinateur/mobile, vérification des fichiers et du commit. Les résultats exécutés figurent dans `quality/shared-bike-trip` et l’état du chantier. La première recette visuelle a repéré un cadrage coupé lors du passage ordinateur/mobile ; le redimensionnement recadre désormais les trois étapes, vérifié à nouveau avec les services réels. Aucun téléphone physique, location, accès aux bornes ou déplacement sur route attesté.
