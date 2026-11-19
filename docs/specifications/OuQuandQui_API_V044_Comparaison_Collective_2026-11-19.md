# V044 — Comparer les options collectives

BOU-COMPARAISON-COLLECTIVE-01 · 19 novembre 2026. Complète BOU-01/02/03/09, TC-02 et DOU-02 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [comparaison des temps V027](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md) et les [limites de correspondances V043](OuQuandQui_API_V043_Correspondances_2026-11-19.md). Éditions antérieures conservées.

## Valeurs comparables

Le tableau des options collectives apparaît dès qu'une recherche fournit des itinéraires qualifiés, sans imposer le calcul voiture, marche directe ou vélo. Il compare une même demande, les mêmes lieux, la même heure et une personne. Chaque option conserve son numéro dans le tableau, la fiche détaillée et la carte, quel que soit le tri.

Quatre tris croissants sont disponibles : temps comparé, durée en chemin, marche totale et correspondances. Pour un départ demandé, le temps comparé va de l'heure demandée à l'arrivée et inclut l'attente avant départ. Pour une arrivée limite, il va du départ à cette limite et inclut la marge d'arrivée. La durée en chemin va de la première à la dernière étape ; les deux durées restent affichées séparément. La marche totale additionne les étapes à pied ; les correspondances comptent les changements de véhicule qualifiés selon V043.

Le tri utilise la précision affichée : minutes et mètres arrondis à l'entier supérieur, correspondances entières. Les valeurs égales au critère choisi portent « Ex æquo ». La durée affichée puis le numéro d'option stabilisent l'ordre secondaire ; cet ordre ne constitue pas un avantage supplémentaire. Une valeur inconnue reste « Inconnu », placée après les valeurs connues, sans devenir zéro. Une option privée de valeur pour le tri est explicitement non classée. Le coût reste inconnu pour ce pilote et n'intervient donc pas comme départage.

## Contraintes, consultation et réversibilité

Les contraintes sont appliquées avant le tri. Les options qui dépassent une limite impérative de correspondances apparaissent dans une rubrique dépliable séparée, hors classement admissible, avec leurs valeurs brutes et le motif d'exclusion. Une préférence dépassée n'exclut pas une option. Un critère invalide rend les options non admissibles jusqu'à correction. Les contrôles d'horaires, de marche et de structure de réponse restent ceux de la recherche ; le tableau ne réintroduit aucune proposition refusée en amont.

Si aucune option n'est admissible, un message remplace le classement. Une référence écartée n'est jamais sélectionnée automatiquement. Le bouton d'une option ouvre sa fiche et son parcours ; après réordonnancement, il conserve cette même identité. La sélection courante reste signalée. Consulter explicitement une référence préserve son statut non admissible, y compris dans la préparation enregistrée.

Changer le tri ne lance aucun appel, ne modifie pas la carte sélectionnée, n'actualise pas la date de consultation et n'écrit pas dans le profil ni les préparations. Le tri est un choix de vue pour la session. Les critères de correspondances peuvent être réévalués localement selon V043. Un changement du contexte de recherche retire les anciennes comparaisons ; l'annulation et les réponses tardives ne les rétablissent pas. Pendant un calcul complémentaire, le tri local reste disponible mais la consultation de l'option attend la fin du calcul.

Le tableau utilise des en-têtes, légendes, état de tri annoncé et boutons accessibles au clavier. La sélection place le focus sur le titre de la bonne fiche. Les lignes admissibles et les références écartées restent distinctes sur petit écran.

## Périmètre et vérification

Cette vue ne produit ni score pondéré, ni tarif, ni classement carbone. La comparaison facultative avec voiture, marche directe et vélo reste séparée : leurs correspondances ou distances de marche ne sont pas assimilées à celles d'une chaîne collective. Aucune migration de données, nouvel hébergement, fournisseur, compte ou appel payant.

Le pilote reste limité au secteur de Grenoble et aux horaires théoriques du service Mobilités M. Le tableau classe les options reçues et qualifiées ; il ne garantit ni exhaustivité, ni circulation réelle, ni accessibilité ou place disponible.

Neuf contrôles de modèle couvrent les quatre tris, les seuils, valeurs inconnues, égalités, contraintes, stabilité, immutabilité et horaires. Quatorze scénarios navigateur, déclinés sur quatre formats, couvrent affichage, exclusions, consultation, sauvegarde, contexte, annulation, réponses tardives, absence de requêtes supplémentaires et navigation clavier vers les fiches. Les tests utilisent un jeu simulé contrôlé ; une recette séparée confronte les valeurs à une réponse réelle entre lieux publics de Grenoble. Les rapports sont conservés dans `quality/transit-comparison`, avec vérification de l'aperçu au commit livré. Aucune validation sur téléphone physique ou déplacement routier attesté.
