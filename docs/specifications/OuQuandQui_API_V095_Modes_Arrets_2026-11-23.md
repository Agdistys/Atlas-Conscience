# V095 — Comparer les modes depuis un parcours à plusieurs arrêts

23 novembre 2026 · ARR-MULTI-08. Exigences ARR-06, BOU-02, BOU-03 et BOU-07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète les [priorités V078](OuQuandQui_API_V078_Priorites_Modes_2026-11-21.md), la [conservation V079](OuQuandQui_API_V079_Comparaisons_Conservees_2026-11-21.md), les [budgets V083](OuQuandQui_API_V083_Budgets_Modes_2026-11-22.md), leur [accès routier V084](OuQuandQui_API_V084_Budgets_Routiers_2026-11-22.md) et les parcours successifs V088–V094. Les éditions précédentes restent conservées.

## Accès et groupe commun

Le parcours adopté propose « Comparer les autres modes ». L’ouverture utilise le comparateur existant dans une fenêtre dédiée, sans géocodage, routage ni écriture. Le départ et la consommation restent ceux de la préparation adoptée et sont affichés en lecture seule. « Revoir le départ et les pauses » renvoie à la préparation ; confirmer puis adopter reste nécessaire avant d’en comparer une nouvelle version.

Le nombre de voyageurs est volontairement vide. Il faut renseigner de une à neuf personnes et confirmer que le même groupe effectue le trajet entier pour chaque mode, et que les stations servent au ravitaillement plutôt qu’à des visites nécessaires. Aucun effectif n’est repris d’une répartition de frais, dont le groupe pourrait ne partager qu’une portion. Changer l’effectif retire cette confirmation et les résultats précédents.

Un départ absent demande de renseigner les horaires et d’adopter à nouveau. Une copie historique ne devient pas un parcours courant à la lecture. Un parcours avec prise en charge et dépose affiche une explication avant tout calcul : un trajet direct à pied ou à vélo ne réalise pas les mêmes étapes pour les mêmes voyageurs. Sa comparaison reste à qualifier séparément ; aucune équivalence, occupation ou répartition du conducteur et des passagers n’est inventée.

## Tracés et durées

La voiture conserve exactement le tracé adopté, ses distances, évitements et portions. Aucun nouveau calcul automobile n’est demandé. La durée comparée additionne les durées non arrondies des portions et toutes les pauses carburant déclarées. Zéro minute est une déclaration recevable ; une pause absente rend la durée totale automobile inconnue, sans classement sur la seule conduite. Le résumé garde la distance et la conduite connues.

La marche et le vélo partagent les extrémités et le départ du parcours. Leurs tracés sont directs et n’empruntent pas les stations de ravitaillement. Le calcul volontaire utilise les moteurs déjà présents : IGN pour la marche, FOSSGIS pour le vélo classique facultatif. Seules les deux coordonnées nécessaires sont envoyées ; ni liste des stations, ni date de départ, ni groupe ou coûts ne sont ajoutés à ces requêtes.

Les limites qualifiées de chaque service restent applicables. Le vélo non demandé, la réponse en échec, le quota, la durée automobile inconnue et une contrainte non satisfaite gardent des états différents. Aucun échec d’un autre mode ne relance la voiture et aucune relance automatique n’est ajoutée. Annuler ou fermer ignore les réponses tardives.

Les valeurs brutes restent consultables et triables. Les cartes et le parcours adopté restent en place ; cette comparaison ne propose aucune adoption silencieuse d’un trajet direct. Le contexte indique les étapes automobiles, le temps de conduite, les pauses, le total, la date du calcul conservé et la date de consultation des autres modes. Trafic, état du terrain, matériel, capacité et allure réelle du groupe restent non attestés.

## Budgets, modèles et priorités

« Comparer les budgets et les empreintes » ouvre le panneau commun de V083/V084 sans nouvel appel. Le groupe y reste celui explicitement confirmé ; le modifier exige de revenir au comparateur des trajets. Les modèles et occupants restent à renseigner. Les empreintes gardent les périmètres et limites existants, notamment la marche inconnue et le vélo mécanique en construction seule.

Les cinq postes de frais du groupe commencent inconnus : billets/location, carburant consommé, péages, stationnement et autres frais directs. Aucune somme de la préparation automobile ni du partage des frais n’est reprise. Zéro exige une déclaration ; un sous-total ne devient pas un budget complet.

Une estimation volontaire du carburant du groupe utilise la distance complète du parcours automobile avec arrêts, la consommation et le prix renseignés dans ce panneau, et le rapport voyageurs/occupants. Les calculs et arrondis exacts de V083 restent inchangés. Les achats de carburant aux stations ne sont pas ajoutés à la consommation. Le montant des péages peut être déclaré ; l’outil de reprise des grilles du trajet routier de référence est masqué et son accès refusé pour ce parcours différent.

Le tri financier, les valeurs brutes et la pondération restent distincts. Contraintes impératives, dates passées et données inconnues précèdent les indices. Une heure limite automobile est évaluée sur conduite et pauses. Une pause inconnue ne devient pas un gain de temps. Un départ passé ou un recul incohérent de l’horloge retire les options actuelles ; revenir à la date précédente ne réactive pas les indices de la même consultation.

## Contexte, annulation et retour

Les lieux, la préparation adoptée, le départ, la consommation, le groupe, sa confirmation et les contraintes sont recontrôlés avant calcul, comparaison et conservation. Un changement silencieux des champs ne contourne pas les vérifications. Remplacer le parcours adopté ou revenir à la préparation de référence ferme cette comparaison.

La fenêtre utilise les commandes existantes sans modifier les réglages de la préparation de référence. À sa fermeture, les champs antérieurs sont restaurés ; une comparaison routière précédente encore cohérente peut retrouver ses résultats. Les prix, budgets, répartitions, observations de stations, sauvegardes et journal du parcours adopté restent inchangés. Aucun enregistrement de comparaison n’est implicite.

## Conservation et formats

Le dispositif de conservation V079 est réutilisé. Après gel volontaire, l’enregistrement demande son propre nom et sa confirmation. Les valeurs utilisées, les pauses, les étapes automobiles, le groupe, les dates, les composantes et les hypothèses restent dans le souvenir et ses exports JSON/TXT. Les coûts de démonstration sont des déclarations, même lorsque les itinéraires proviennent des services publics.

Aucun nouveau format de profil, de parcours successif ou de collection de comparaisons n’est introduit. Les budgets restent des budgets routiers de groupe du format existant ; la collection passe au format 3 lorsqu’elle contient ce type de budget, ou conserve un format plus récent déjà présent. Les contrôles, imports et conflits d’écriture existants continuent de s’appliquer. Relire un souvenir ne recharge aucun moteur et ne restaure aucun itinéraire courant.

## Critères d’Achèvement

Vérifier l’absence d’appel à l’ouverture et pour la voiture, les coordonnées envoyées aux seuls autres modes demandés, les pauses connues/inconnues et l’absence de groupe supposé. Tester la date absente, les rencontres non comparables, les quotas, l’annulation et les réponses tardives.

Contrôler les contraintes avant les indices, les modifications silencieuses, les dates passées, la séparation des coûts, la formule utilisant la distance avec arrêts et la conservation volontaire. Vérifier le retour à la préparation, le clavier, les formats étroits, le texte agrandi et la carte indisponible.

L’inspection complète et la recette publiée portent sur le même commit. Les itinéraires réellement consultés restent distincts des réponses simulées et des montants de démonstration. Ce lot ne qualifie ni trajet avec rencontres équivalent dans les autres modes, ni transports collectifs hors de leur pilote, ni véhicule lourd, caravane, trajet physique ou tarif final. Aucun nouveau fournisseur, compte, paiement, hébergement ou fusion.
