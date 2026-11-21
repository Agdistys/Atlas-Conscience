# V075 — Carte et résultats, aller et retour

UX-CARTE-LISTE-01 · 21 novembre 2026. Complète UX-02/05/06 et STA-11/12 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [points V060](OuQuandQui_API_V060_Points_Stations_2026-11-20.md), les [accès de préparation V073](OuQuandQui_API_V073_Preparation_Lisible_2026-11-21.md) et les [pages V074](OuQuandQui_API_V074_Pages_Stations_2026-11-21.md). Éditions antérieures conservées.

## Consulter une station sur la carte

Chaque fiche propose « Voir sur la carte ». La commande rejoint la carte, indique le numéro et l’adresse de la station, et signale qu’il s’agit d’une consultation. Avec Leaflet, elle centre la vue sur ses coordonnées ; sur le schéma de secours, elle repère ce même point sans prétendre fournir un fond cartographique. Un contour distinct de la couleur d’arrêt choisi identifie la station consultée. Dans un groupe de points superposés, elle devient le représentant visible ; les autres identités restent accessibles dans le choix des stations.

Le trajet, son arrêt confirmé et les favoris restent inchangés. Aucun aperçu d’adoption n’est accepté implicitement. La commande existante de choix d’un arrêt conserve son aperçu et sa confirmation.

## Revenir sans perdre la fiche

Au-dessus de la carte, une commande « Revenir au point N » rejoint le bouton de la même station dans sa page de résultats. Le retour utilise l’identifiant stable, même après un nouveau rendu. Tris, filtres et classement restent conservés. Une station écartée par les filtres ou l’évolution de la fraîcheur ne force pas leur effacement : le retour rejoint le titre des résultats. Un arrêt confirmé hors filtre demeure conservé sur la carte selon les règles précédentes.

Les accès généraux « Voir la carte » sont disponibles depuis le trajet et les résultats des stations. Le retour rejoint leur section d’origine ; sans trajet, il rejoint le départ. Une nouvelle recherche retire l’ancienne consultation et son retour. Pendant un calcul, les commandes restent verrouillées ; une continuation annulée conserve les résultats précédemment disponibles et leur consultation.

## Vue d’ensemble et lecture

« Vue d’ensemble » recadre le trajet et les points déjà affichés, retire le repère de consultation, et conserve le retour à la fiche. Cette action ne sélectionne pas de station. Les commandes occupent leur propre espace dans le flux, à côté du panneau sur ordinateur et au-dessus de la carte sur petit écran. Elles ne recouvrent ni champ ni point. La carte mobile reste bornée entre 230 et 420 pixels ; le panneau et les commandes restent défilables, y compris en paysage et avec texte doublé.

Le focus est placé sur le titre de la carte à l’aller et sur la commande de la fiche au retour. Les actions sont nommées et utilisables au clavier. Les chemins de retour des fenêtres de détail restent ceux de V074.

## Données et vérification

Ces raccourcis ne déclenchent aucun géocodage, calcul de trajet, recherche carburant, localisation ou écriture personnelle. Le cadrage Leaflet peut charger les tuiles du fournisseur cartographique déjà utilisé. La vue d’ensemble réutilise les géométries reçues ; elle ne recherche pas de nouvel itinéraire.

Huit scénarios dédiés, exécutés sur quatre formats, couvrent les deux rendus, les pages, les filtres, la fraîcheur, les favoris, l’arrêt confirmé, l’annulation, une nouvelle recherche et le texte doublé. Deux parcours sont obligatoires dans les quatre configurations Firefox/WebKit : 58 cas par configuration, 232 essais attendus. Les contrôles surveillent l’absence d’appels de données et d’écritures pendant la consultation.

Le relevé initial sur 60 stations fictives place la fiche du point 31 à environ 11 930 pixels de la carte dans une fenêtre de 390 pixels. Les raccourcis remplacent ce parcours de défilement par un aller et un retour explicites. Cette mesure de disposition n’est ni une mesure de vitesse, ni une preuve de compréhension. Les résultats définitifs des tests et de la publication sont liés au commit dans le rapport et le suivi automatique. Les consultations de lieux publics sur services réels restent distinctes des simulations et d’un essai sur téléphone physique.
