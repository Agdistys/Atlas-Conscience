# OùQuandQui — Repérer les Gares de la Portion

Complément V116 · 28 novembre 2026 · NAV-TOLLS-01. Ce complément précise l’aide cartographique à la déclaration tarifaire V115 ; il ne la transforme pas en prix automatiquement certifié.

## Parcours Disponible

Dans « Une portion payante », choisir une portion puis ouvrir « 💰 Estimer le péage ». « 📍 Repérer les gares » affiche les points candidats P1, P2… dans le sens de la portion et sur la carte. Le repérage utilise les données déjà embarquées ; il ne transmet aucune coordonnée et n’ajoute aucun calcul routier.

Si exactement deux repères non ambigus ont chacun un nom tarifaire concordant unique, dans le même réseau, et qu’une ligne tarifaire existe dans ce sens, un bouton propose la paire. L’action remplit réseau, entrée et sortie ; la confirmation de couverture reste décochée. La comparaison puis l’adoption du trajet restent volontaires.

Plusieurs repères, correspondances multiples, visites répétées d’une même gare, sens tarifaire absent ou aucune gare proche : aucune paire n’est choisie automatiquement. Le choix manuel reste disponible. Un inventaire indisponible produit un message récupérable sans remplacer le trajet.

## Sources et Correspondances

L’inventaire géographique est celui du [Ministère de la Transition écologique, au 1 janvier 2025](https://www.data.gouv.fr/datasets/gares-de-peage-du-reseau-routier-national-concede), licence ODC-By. La page consultée le 28 novembre 2026 propose toujours les ressources 2025. La copie conservée contient 1 266 positions, regroupées en 831 repères. Les empreintes, coordonnées converties et limites sont conservées dans data/toll-gates/2025.

Le fichier CSV utilisé ne contient pas d’identifiant tarifaire ni d’exploitant, même si la description générale du jeu mentionne la société gestionnaire. Aucun réseau n’est donc déduit du code routier. Le rapprochement de noms normalise accents, casse et espaces, et retire seulement le préfixe routier explicite des libellés ASF. Plusieurs noms concordants restent ambigus.

Une correspondance de libellé explicite relie les lignes 228/229 « Valence Nord », code 26A900710CD, au libellé ASF « A7 · VALENCE-N ». Elle est bornée à ce groupe, ce nom, ce code et ce libellé ; aucune abréviation cardinale générale n’est extrapolée. La référence de prix vient des grilles datées V115, dont [la grille ASF](https://public-content.vinci-autoroutes.com/PDF/Tarifs-peage-asf/Tarifs_ASF.txt). Un nom concordant ne certifie ni l’exploitant actuel ni l’accès réellement emprunté.

## Contrat Géométrique

Le repérage porte sur toute la géométrie de la portion choisie, et non sur ses seules extrémités. Le corridor fixe est de 30 mètres. Les distances et positions le long du tracé sont des estimations géométriques ; le seuil sert à limiter les candidates, sans certifier un passage. Des voies parallèles peuvent rester proches.

Les positions sources sont projetées sur les segments, ordonnées depuis le début de la portion puis regroupées par identifiant de gare. Deux passages candidats séparés de plus de 150 mètres le long du tracé rendent l’ordre ambigu. Les segments nuls sont ignorés ; une portion dégénérée est refusée. L’affichage est limité aux 40 premiers repères, avec indication du nombre total. Une paire n’est proposée que pour exactement deux repères, espacés de plus de 150 mètres dans l’ordre géométrique et sans ambiguïté de nom ni de sens tarifaire.

Les repères « Début de portion » et « Fin de portion » désignent des limites du graphe routier. Ils restent distincts des gares P1/P2. Aucun point candidat ne devient un point de passage imposé au calcul ; le tracé choisi est conservé.

## Déclaration, Prix et Invalidation

Le résultat géographique porte le statut GEOGRAPHIC_CANDIDATES_ONLY. La proposition de paire ne contient ni montant, ni confirmation de passage, ni prix vérifié. Après confirmation explicite des gares, le tarif garde le statut DECLARED_NOT_ROUTE_VERIFIED de V115. Il ne satisfait pas un plafond strict.

Proposer une paire retire toute confirmation précédente et invalide une comparaison prête à adopter. Changer de portion ou recommencer une comparaison retire les points précédents. Les changements de classe, de date ou de source restent soumis aux validations tarifaires de V115. Fermer la fenêtre ne modifie ni le trajet précédent ni les données enregistrées.

## Qualification et Limites

L’archive d’un calcul réel public openrouteservice du 28 novembre 2026 permet de reproduire hors réseau le repérage Vienne–Valence nord. Les deux candidates sont à moins de trois mètres du tracé archivé ; la gare de Vienne apparaît environ neuf kilomètres après le début de la portion payante. Cela explique pourquoi chercher seulement la gare la plus proche de l’extrémité serait insuffisant. Des accès voisins, notamment Auberives, sont hors du corridor de 30 mètres sur cet exemple. Ce constat ne certifie pas les accès physiques actuels.

Les contrôles couvrent l’ordre inverse sans prix inverse inventé, les boucles, voies parallèles, sommets répétés, noms ambigus ou corrompus, inventaire absent, nombres excessifs et conservation des entrées. Les parcours navigateur couvrent proposition volontaire, confirmation distincte, absence de données, retrait des anciens repères, comparaison et budget. La recette publiée et les résultats par moteur restent rattachés au commit de livraison ; les tests simulés ne remplacent pas un essai Android physique.

## Suite du Parcours

La prochaine étape consiste à conserver puis reprendre explicitement la portion choisie et sa référence datée, avec recalcul et reconfirmation avant adoption. Le choix fin d’accès intermédiaires, le rattachement tarifaire automatiquement vérifié et le plafond strict restent ouverts. Le service de calcul et l’hébergement conservent les offres gratuites autorisées ; aucune fusion dans le site principal ni publication Webnode n’est comprise dans cette édition.
