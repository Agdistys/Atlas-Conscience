# OùQuandQui — Voir le trajet avec une station avant confirmation

V055 · 20 novembre 2026 · ARR-APERCU-01. Complète ARR-04/05, TRA-05/08 et CAL-04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [choix routiers V054](OuQuandQui_API_V054_Choix_Routiers_2026-11-20.md) et la [pause station V050](OuQuandQui_API_V050_Duree_Arret_2026-11-19.md). Les éditions précédentes sont conservées.

## Parcours

« Choisir cette station », depuis la liste ou la fiche, prépare maintenant un aperçu du trajet complet. Le trajet courant reste en place, avec son arrêt éventuel, son budget, ses rencontres et ses sauvegardes. L’aperçu ne constitue pas une adoption.

Une fenêtre affiche le tracé proposé en bleu foncé continu et le trajet actuel en bleu clair pointillé. Une commande permet de masquer puis de réafficher la référence. Départ, station, arrivée et rencontres sont numérotés ; une liste reprend leur ordre. Le fond de carte utilise le raccordement déjà présent ; sans Leaflet, un schéma géographique distinctement nommé reste disponible. Les commandes et le choix final sont utilisables au clavier.

« Conserver le trajet actuel » ou Échap ferme l’aperçu, y compris pendant le calcul. « Confirmer cet arrêt » adopte le résultat affiché. En présence d’un arrêt, il le remplace ; les rencontres restent conservées. Aucun enregistrement automatique dans les préparations, les favoris ou le journal.

## Calcul et correspondance

Les points confirmés, l’ordre des rencontres et de la station, le véhicule, le critère routier et les exclusions sont ceux du trajet courant. Le résultat déjà calculé pour une station contrainte peut être réutilisé ; sinon le moteur correspondant est interrogé. Aucun repli sur une route standard lorsque les contraintes sont incompatibles. Les limites totales des rencontres sont vérifiées de nouveau.

Les métriques doivent être finies, positives ou nulles et dans les bornes routières existantes. Une géométrie valide et des extrémités à moins de 500 mètres des lieux confirmés sont exigées. Les contrôles propres aux adaptateurs et aux étapes de rencontre restent actifs. Les points demandés ne constituent pas une inspection du terrain ni une garantie d’accès à une pompe.

L’aperçu est lié au contexte de départ et à la station consultée. Une réponse annulée ou tardive ne peut ni rouvrir la fenêtre ni remplacer une consultation plus récente. La confirmation revérifie le contexte ; un changement du trajet, des paramètres ou de la pause la rend inutilisable. Une erreur laisse les données précédentes en place et la confirmation désactivée.

## Distances, conduite, pause et budget

Deux cartes présentent les distances et durées : trajet actuel et trajet proposé avec la station. Les écarts sont la proposition moins le trajet actuel, à la précision affichée (0,1 km et 0,1 minute). Ils restent signés, y compris lorsqu’un recalcul produit une route plus courte. Un changement de géométrie est donc visible avant adoption.

La conduite et la pause carburant sont distinctes. Pause vide : durée totale et arrivée avec pause inconnues. Pause zéro : durée déclarée nulle, explicitement indiquée. Toute autre pause valide de 0 à 1 440 minutes est ajoutée une seule fois. L’arrivée utilise le départ prévu en heure de Paris ; trafic direct, autres pauses et garantie d’arrivée restent exclus.

Les litres consommés sont estimés avec la consommation commune : kilomètres × L/100 km ÷ 100. Le coût carburant applique seulement le prix de référence valide saisi. Un prix provenant de l’arrêt actuel n’est pas transféré à la proposition. Le plein acheté reste distinct de la consommation du trajet.

Aucun ancien tarif de péage n’est attribué au nouveau tracé avant vérification. Péages et autres frais inconnus ne valent pas zéro ; aucun total complet ni économie globale n’est annoncé. Après adoption, les mécanismes existants de budget et de requalification des tronçons s’appliquent.

## Prix, autonomie et horaires

L’accès à la station utilise les étapes du nouveau tracé lorsqu’elles sont complètes et cohérentes. À défaut, la distance de la comparaison précédente est affichée avec sa provenance et la mention « à vérifier ». Une distance absente reste inconnue. L’autonomie est celle déclarée depuis le départ ; aucun suivi continu ou carburant restant mesuré n’est inventé.

Une portée estimée insuffisante demande une reconnaissance explicite avant l’adoption dans la préparation. Un prix ancien ou non vérifiable demande aussi une reconnaissance distincte ; il reste exclu du budget. La fraîcheur est revérifiée au moment de confirmer, même si le prix a expiré depuis l’ouverture. L’aperçu ne transforme pas une reconnaissance de limite en garantie de trajet possible.

Après confirmation, les distances et durées d’accès connues du nouveau tracé remplacent celles de la comparaison pour cette station ; ses horaires d’arrivée sont mis à jour. En leur absence, l’origine comparative reste indiquée dans l’aperçu. Les horaires déclarés restent soumis à leurs limites existantes : aucune garantie d’ouverture, de carburant disponible ou d’absence de fermeture exceptionnelle.

## Après adoption et vérifications

Carte, sélection de station, distance, conduite, pause, arrivée, budget, navigation et GPX suivent le tracé confirmé. Retirer l’arrêt restaure le trajet de référence. Une sauvegarde demeure une action volontaire. Aucun nouveau format de stockage ni migration implicite.

Les tests vérifient l’adoption, le refus de remplacement, le budget conservé, la pause, l’expiration des prix, l’autonomie, l’annulation pendant calcul, les réponses tardives, le contexte périmé, les erreurs, les extrémités incohérentes, la fiche station et les deux rendus cartographiques. Les scénarios antérieurs passent désormais par une confirmation visuelle explicite, sans mécanisme caché d’acceptation.

Les raccordements simulés des tests ne qualifient pas un service public absent. La révision publiée, les vues ordinateur/mobile et la recette de service sur des lieux publics sont consignées séparément dans le suivi de développement. Aucun téléphone physique ni déplacement routier n’est attesté.
