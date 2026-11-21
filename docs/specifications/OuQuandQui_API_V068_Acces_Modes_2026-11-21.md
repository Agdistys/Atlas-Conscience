# OùQuandQui — Accès aux modes V068

Date : 21 novembre 2026. Lot UX-ACCES-MODES-01. Complément à E01, UX-02, UX-05, UX-07, PAR-06 et TC-07 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les capacités, contrats de données et limites des compléments V001–V067 restent applicables.

## Préparer les lieux, puis choisir le mode

Le départ et l’arrivée sont communs aux cinq accès. Le bloc « Comment se déplacer ? » suit les lieux et leur commande d’inversion, avant le véhicule mémorisé et les réglages routiers. Il présente cinq boutons lisibles au clavier et sur écran étroit :

| Accès | Action volontaire | Périmètre affiché |
| --- | --- | --- |
| En véhicule | Afficher les réglages du trajet principal, puis calculer avec « Trouver mon trajet ». | France, selon le véhicule et les capacités disponibles. |
| À pied | Afficher la limite de marche et masquer les réglages propres au véhicule, puis calculer. | France, parcours estimé ; conditions de terrain non vérifiées. |
| À vélo | Ouvrir la recherche autonome avec les lieux saisis ; calcul distinct à demander. | Métropole, vélo personnel. Les bornes et limites existantes restent appliquées. |
| Transports collectifs | Ouvrir la recherche collective avec ces lieux, puis préciser horaires et critères. | Pilote Grenoble. |
| Vélos partagés | Ouvrir les stations et la préparation des étapes avec les lieux saisis. Chargement et calcul restent explicites. | Pilote Lyon. |

L’accès « En véhicule » conserve le profil réel : il ne transforme pas une caravane ou un camion en voiture. Une couverture affichée ne certifie ni chaque route ni le terrain. Aucun mode supplémentaire, aucune extension géographique et aucun nouveau fournisseur ne sont introduits.

## États et conservation

Véhicule et marche sont deux états du trajet principal. Le bouton actif porte une coche, une bordure contrastée et un état accessible ; le titre des réglages indique « Trajet en véhicule » ou « Trajet à pied ». Les autres boutons annoncent l’ouverture d’une fenêtre propre à leur recherche. Ils ne sont pas présentés comme une sélection qui remplace le trajet principal.

Choisir véhicule ou marche ne calcule aucun parcours, ne demande aucune position et n’écrit pas dans le profil. Un changement réel retire le résultat devenu incompatible et demande explicitement un nouveau calcul. Réappuyer sur le mode déjà actif conserve le résultat. Les critères de l’autre mode restent disponibles au retour. Reprendre une préparation, appliquer un véhicule mémorisé ou choisir explicitement un résultat de comparaison actualise également l’état des boutons.

Ouvrir ou fermer vélo, collectif ou vélos partagés ne remplace pas le trajet principal, ses options, son véhicule ou ses sauvegardes. Ces recherches n’imposent aucun trajet voiture préalable. Les lieux déjà confirmés restent soumis aux contrôles de concordance existants ; aucun libellé nouveau ne vaut une coordonnée confirmée.

Pendant une opération qui verrouille le contexte commun, les cinq accès sont désactivés. L’annulation les rend disponibles. Les réponses tardives restent soumises aux contrôles de contexte et ne rétablissent pas un ancien mode. Fermer une fenêtre rend le focus à son déclencheur ; les accès restent disponibles après une erreur. Les liens du résumé d’erreurs ciblent des commandes visibles.

## Lecture et accessibilité

Les cinq accès sont regroupés en deux colonnes, puis une seule sur les écrans les plus étroits. Le défilement vertical reste possible, y compris en paysage et avec le texte agrandi. Les intitulés et limites se replient ; les zones d’action gardent une dimension minimale. La distinction du mode principal ne repose pas uniquement sur la couleur. Les fenêtres conservent leurs titres, commandes de fermeture et règles de focus.

## Vérifications et limites

Neuf nouveaux scénarios navigateur sont exécutés dans quatre formats : entrées et limites, absence d’appels et d’écriture, profil caravane inchangé, ouverture des trois recherches au clavier, lieux communs, retour du focus, résultat existant conservé, commandes verrouillées, annulation, réponse tardive, réparation d’erreur, paysage et texte agrandi. Les scénarios existants marche, comparaison et annulation utilisent désormais les boutons visibles tout en conservant leurs assertions métier.

Les preuves locales, celles de l’inspection GitHub et la recette de l’aperçu exact sont conservées dans `quality/mode-access` et dans le suivi du développement. Les données simulées des tests sont distinctes des consultations de services réels avec des lieux publics. Les essais de fenêtre redimensionnée et l’audit automatique ne qualifient ni un téléphone physique, ni un lecteur d’écran, ni un déplacement effectué. Les données personnelles, anciens liens, formats de sauvegarde et nom du produit sont conservés.
