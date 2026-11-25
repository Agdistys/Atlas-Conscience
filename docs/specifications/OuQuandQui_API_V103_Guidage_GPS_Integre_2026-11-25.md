# V103 — Guidage GPS intégré et priorité de la première version

NAV-GPS-01 · 25 novembre 2026. Complète le [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions précédentes restent conservées.

## Exigence prioritaire

**La première version utilisable doit proposer le guidage GPS continu directement dans OùQuandQui.** Le parcours de développement suit désormais l’usage : préparer et suivre un trajet automobile, choisir une station sur ce trajet, puis enrichir les fonctions de covoiturage et les alternatives. Le renvoi vers une autre application reste facultatif. L’exclusion initiale du guidage continu dans V5 est remplacée par cette exigence ; les fonctions déjà livrées restent conservées.

NAV-GPS-01 apporte une première session de guidage au premier plan. La qualification du téléphone, de la précision en déplacement et de l’ensemble du parcours reste nécessaire avant de déclarer la première version opérationnelle sur route. Écran verrouillé, fonctionnement en arrière-plan et navigation native constituent des exigences distinctes à qualifier.

## Entrée et activation

Après le calcul et le choix du trajet, une commande ouvre le guidage intégré. Cette ouverture ne demande ni position ni instructions au fournisseur. Le démarrage explicite demande les manœuvres du même moteur, vérifie leur concordance avec le trajet, puis active le suivi GPS haute précision. Aucun suivi automatique au chargement, à l’ouverture du profil ou à la reprise d’une préparation.

Le guidage utilise le trajet courant : variante effectivement choisie, station confirmée, rencontres ou parcours à plusieurs arrêts adopté. Les points restent dans leur ordre. Un changement des lieux, du véhicule, du moteur, des options ou de la préparation invalide la session. Fermer puis préparer de nouveau le guidage est nécessaire.

## Instructions et moteurs

Le périmètre qualifié est le profil voiture des moteurs existants IGN et OSRM. Les manœuvres proviennent des réponses détaillées de ces moteurs. Le profil, l’optimisation et les exclusions déjà acceptées restent conservés lors de chaque demande ; aucun repli vers un moteur ou profil différent. Les profils poids lourd, caravane et autres moteurs ne sont pas déclarés qualifiés par ce lot.

Les coordonnées, la géométrie complète, les portions et leur ordre, les départs et arrivées, les distances et durées, les positions de manœuvre OSRM et l’accès aux points sont contrôlés. Les instructions doivent reconstituer le même tracé ; une réponse devenue différente depuis la préparation impose un nouveau choix du trajet avant démarrage. Les ronds-points exigent un numéro de sortie vérifiable. Les instructions inconnues ou incomplètes empêchent l’activation du GPS.

Les arrondis géométriques restent bornés : concordance du tracé à 1,5 m, continuité des instructions à 2 m, accès aux points à 100 m au plus ; ces tolérances ne qualifient pas l’accès physique à une entrée précise. Maximum 12 points, 6 000 manœuvres et 150 000 coordonnées détaillées. Aucun virage n’est inventé à partir du dessin de la ligne.

## Suivi, carte et manœuvres

Le guidage présente la prochaine instruction, sa distance approximative, la distance restante et une durée de conduite estimée hors trafic et pauses. Le tracé bleu bordé de blanc et la position sont affichés sur une carte recentrée ; déplacer la carte interrompt le recentrage jusqu’à activation de « Suivre ma position ». Un schéma local reste disponible lorsque le fond de carte ne se charge pas.

Les positions acceptées ont des coordonnées finies, une précision annoncée de 50 m au plus et une ancienneté de 15 secondes au plus. La progression est rattachée à la portion en cours, avec contrôle des sauts et des portions spatialement ambiguës. Les positions de date non croissante sont ignorées. La date et la précision de la dernière position restent visibles ; une position périmée retire les indications et le point présenté comme actuel.

Une position imprécise, un délai dépassé, une perte GPS, un saut incohérent ou une ambiguïté suspend les consignes. Un refus de permission arrête le suivi et permet une reprise explicite après autorisation dans le navigateur. Une nouvelle position fiable peut rétablir les indications après une perte temporaire.

## Arrêts, pause et arrivée

L’arrivée près d’une étape exige une proximité géométrique et une confirmation par des positions espacées d’au moins deux secondes. Le GPS s’arrête à l’étape ; « Reprendre après cette étape » active la portion suivante. L’arrivée finale termine le suivi. Une arrivée ne crée aucune entrée dans le journal et n’atteste pas un déplacement effectué.

Mettre en pause, fermer, quitter la page ou passer en arrière-plan arrête le suivi, les annonces et le maintien d’écran. Le retour au premier plan ne redémarre pas le GPS automatiquement. Les réponses de position ou de routage devenues tardives restent sans effet. La fermeture rend le focus à la commande du trajet.

## Sortie de route et recalcul

Un écart doit être confirmé par au moins trois positions sur cinq secondes, au-delà du seuil tenant compte de la précision. Un écart isolé ne provoque pas de recalcul. Un retour de plus de 60 m derrière la progression acquise exige également trois positions sur cinq secondes avant de proposer un recalcul. Le bouton de recalcul utilise la dernière position fiable et les étapes encore à visiter, avec le même moteur, le même véhicule et les mêmes options.

Le recalcul automatique est facultatif, décoché à l’ouverture et choisi avant démarrage. Il transmet la position actuelle et les étapes restantes au moteur existant. Les tentatives automatiques sont espacées d’au moins trente secondes ; après panne ou réponse invalide, une nouvelle tentative exige une action volontaire. Les quotas existants restent applicables et aucun autre fournisseur n’est appelé.

Le nouveau tracé appartient à la session de guidage. La préparation, son budget, ses horaires, les prix des stations et les souvenirs restent conservés et ne sont pas présentés comme recalculés. Cette séparation est indiquée après recalcul. La prochaine étape de développement doit raccorder les besoins de carburant à la progression réelle, sans réutiliser des distances ou budgets devenus périmés.

## Voix, écran et données

Les annonces sont facultatives et utilisent uniquement une voix française déclarée locale par le navigateur. Une voix distante seule ne peut activer cette fonction ; le guidage visuel reste disponible. Les annonces sont bornées aux approches des manœuvres et ne se répètent pas à chaque position identique. La pause ou la fermeture annule la parole.

Le maintien de l’écran allumé est demandé lorsque l’appareil le permet. Son refus ou sa libération par le système reste explicite et ne constitue pas une garantie de fonctionnement écran verrouillé.

Les positions restent en mémoire pendant la session ; aucune trace GPS, entrée de journal ou sauvegarde automatique n’est créée. Les requêtes de manœuvres et de recalcul utilisent les services routiers déjà présents. Le fond de carte utilise le fournisseur cartographique existant. Aucun nouveau fournisseur, compte, clé visiteur, paiement ou hébergement.

## Recette et limites

Les contrôles du modèle portent sur les réponses réelles archivées IGN et OSRM, la cohérence des manœuvres, la progression, les arrivées, les coordonnées douteuses, les sauts, les ambiguïtés et la confirmation d’un écart. Les scénarios navigateur couvrent démarrage volontaire, carte et schéma, pause, reprise, fermeture, arrière-plan, permission, délai, réponse tardive, manœuvre absente, tracé changé, recalcul manuel et automatique, panne sans répétition, contraintes IGN, étapes et arrivée pendant un recalcul.

Les scénarios utilisent des positions simulées. Les tests de plusieurs arrêts isolent aussi le contrat du guidage avec un parcours confirmé construit dans le banc d’essai. Ces preuves ne valent pas qualification d’une antenne GPS, d’une conduite réelle, d’un téléphone, d’une route accessible ou d’un usage écran verrouillé. La recette publiée et la consultation des moteurs réels sont consignées séparément.

Sources techniques consultées le 25 novembre 2026 : [calcul d’itinéraire IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/), [manœuvres OSRM](https://project-osrm.org/docs/v5.24.0/api/#stepmaneuver-object), [suivi de position navigateur](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) et [maintien de l’écran](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

## Prochain axe

Consolider le parcours « départ → guidage → station → reprise » : recherche de carburant depuis la progression actuelle, arrêts atteignables et autonomie, renouvellement des informations après recalcul. La qualification sur téléphone demeure un jalon obligatoire avant usage réel. Les alternatives collectives et le lot COV-MODES-TC-05 sont différés jusqu’à consolidation de ce parcours prioritaire.

