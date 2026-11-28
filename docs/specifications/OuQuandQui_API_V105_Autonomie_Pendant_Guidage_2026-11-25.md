# V105 — Autonomie déclarée pendant le guidage

NAV-GPS-03 · 25 novembre 2026. Complète [V103 — Guidage intégré](OuQuandQui_API_V103_Guidage_GPS_Integre_2026-11-25.md), [V104 — Stations pendant le guidage](OuQuandQui_API_V104_Stations_Pendant_Guidage_2026-11-25.md) et AUT-01 à AUT-06 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions antérieures restent conservées.

## Déclaration actuelle et volontaire

Après le démarrage d’un trajet guidé, « Actualiser mon autonomie » ouvre une déclaration à consulter à l’arrêt. Le suivi est mis en pause ; une étape déjà atteinte reste identifiée comme telle. Ouvrir ce panneau ne demande aucune position ni aucun service routier. Le montant précédent reste daté ; aucune valeur du départ, du profil ou des litres à acheter n’est copiée comme quantité restante.

Deux unités exclusives sont proposées : kilomètres d’autonomie ou litres restants estimés. Changer l’unité efface la quantité. Une quantité vide reste inconnue ; zéro constitue une déclaration explicite. La consommation retenue et la réserve sont visibles et modifiables. La consommation précédente de la session, à défaut celle du formulaire carburant, est proposée avant confirmation. La réserve initiale est 30 km ; la réserve précédente de la session peut être reprise.

Les bornes sont 0 à 5 000 km, 0 à 2 000 L, 1 à 100 L/100 km et 0 à 500 km de réserve. Une conversion dépassant 5 000 km est refusée. La déclaration n’est ni une lecture de jauge ni une garantie d’atteignabilité.

## Confirmation depuis une position actuelle

« Confirmer puis reprendre le guidage » demande volontairement une position ponctuelle. Elle respecte les contrôles GPS existants : délai borné, coordonnées finies, précision annoncée de 50 m au plus, ancienneté de quinze secondes au plus. Une date future est refusée pour cette estimation. Le point doit se rattacher sans ambiguïté à la portion du trajet en cours.

Une position située de plus de 50 m en amont de la progression connue impose de recalculer le guidage avant la déclaration. Le point ne peut sauter une rencontre ou une station encore à visiter. Une permission refusée, une position ancienne, imprécise ou éloignée du trajet empêche l’enregistrement d’une nouvelle estimation. L’estimation historique précédente reste conservée, non courante.

Après une étape atteinte, le bouton indique explicitement « Confirmer puis reprendre après cette étape ». La position est alors rattachée à la portion suivante avant reprise. La quantité est celle déclarée maintenant, après le plein le cas échéant ; aucun achat ou plein n’est inféré de l’arrivée à la station.

## Calcul et progression retenue

Avec une déclaration en litres R et une consommation c, l’autonomie théorique initiale est 100 × R / c. Une déclaration en kilomètres fixe directement cette autonomie. Après une progression qualifiée D depuis cette nouvelle référence : autonomie restante estimée = max(0, autonomie initiale − D) ; consommation estimée = D × c / 100 ; portée estimée avec réserve = max(0, autonomie restante − réserve).

D provient de la progression rattachée à la géométrie du trajet, pas d’un compteur kilométrique du véhicule. Le dernier point de référence, sa date et la portion courante sont conservés seulement dans la session. La progression déjà acquise ne peut être débitée une deuxième fois. Un bruit négatif inférieur ou égal à un mètre est ramené à zéro sans reculer la référence ; un recul plus important invalide l’estimation.

Les deux positions successives doivent rester qualifiées sur la même portion et le même tracé, avec un intervalle de quinze secondes au plus. Un saut supérieur à 70 m/s × intervalle + 100 m invalide l’estimation ; ce seuil est un contrôle de cohérence, pas une mesure de vitesse. Les contrôles de position, de saut et d’ambiguïté du guidage continuent de s’appliquer en amont.

L’écran distingue autonomie et portée avec réserve, progression estimée, consommation théorique et dates. Quand la réserve est atteinte selon les hypothèses, cette limite est affichée. Le guidage ne prétend pas connaître la quantité réelle dans le réservoir et n’ajoute aucun coût au budget.

## Interruption et nouvelle référence

Une pause, une perte GPS, un délai entre positions, un recul de l’horloge, une sortie de route, un changement de portion ou de tracé rend l’estimation non courante. Le dernier montant et la consommation déjà estimée restent affichés comme une référence à réactualiser. La distance pendant l’interruption demeure inconnue ; aucune droite entre deux points ni longueur d’un détour non suivi ne la remplace.

Une nouvelle position fiable peut rétablir les indications de guidage, mais ne rend pas automatiquement l’ancienne autonomie courante. Une nouvelle déclaration explicite est nécessaire. Recalculer le trajet, ajouter une station ou reprendre une étape sans déclaration n’efface pas silencieusement les anciennes valeurs et ne reconstitue pas la consommation manquante.

Une confirmation après le plein crée une nouvelle référence datée et remet à zéro la progression estimée depuis cette référence. La consommation précédente n’est pas transformée en historique de déplacement. Effacer l’estimation ou fermer la session rend l’autonomie inconnue.

## Réutilisation dans la recherche de stations

La recherche de stations suspend le guidage selon V104. Le champ d’autonomie actuelle reste initialement vide. La dernière estimation datée et son éventuelle interruption sont présentées dans les critères. Un bouton explicite permet de confirmer personnellement qu’elle correspond encore à la situation actuelle, puis de reprendre autonomie, réserve et consommation dans le formulaire.

L’autonomie copiée est arrondie vers le bas au dixième de kilomètre. Le transfert n’effectue ni recherche réseau, ni demande GPS, ni reprise du suivi d’autonomie. Une valeur déjà saisie n’est remplacée que par cette action volontaire. Les champs restent modifiables et le prochain calcul utilise les contrôles de portée de V104, avec la distance routière d’accès cumulée.

Confirmer une estimation dans le formulaire de stations ne valide pas rétroactivement un intervalle GPS manquant. Après adoption d’une station, le suivi d’autonomie reste à réactualiser ; le plein n’est jamais déclaré automatiquement.

## Données et réponses tardives

Aucun nouveau fournisseur, compte, clé ou service. La déclaration ne fait pas de requête routière. Les profils, préparations, budgets, prix et journaux ne sont pas modifiés. La quantité et sa progression ne sont pas enregistrées dans le stockage local ; la fermeture de la session les oublie.

Modifier un champ pendant la demande de position annule cette confirmation. Fermer le panneau, changer le trajet propriétaire ou passer en arrière-plan empêche l’adoption d’une réponse devenue tardive. Le guidage reste en pause après une annulation. Les deux choix d’unité et les actions sont accessibles au clavier, avec libellés et retour du focus.

## Qualification et suite

Les contrôles distinguent calculs, scénarios navigateur, réponses de services réels et positions simulées. La comparaison vérifie aussi les fonctions de guidage et de stations déjà présentes. Le temps maximal des vérifications Firefox/WebKit passe de 22 à 25 minutes, avec arrêt externe à 26 minutes et enveloppe GitHub de 28 minutes ; aucun scénario ni contrôle n’est retiré.

Android demeure la plateforme pilote. Ces simulations ne qualifient ni la précision en conduite, ni un téléphone physique, ni l’écran verrouillé ou l’arrière-plan. La prochaine étape est la recette Android du parcours complet : préparer, guider, choisir une station, confirmer une nouvelle autonomie après le plein et reprendre. Une exécution physique sera nécessaire pour conclure sur l’usage réel.
