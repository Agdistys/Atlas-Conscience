# OùQuandQui — Annuler une recherche de trajet

V057 · 20 novembre 2026 · TRA-ANNULATION-01. Complète TRA-08, GEO-07 et ERR-01/03/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [critères routiers V054](OuQuandQui_API_V054_Choix_Routiers_2026-11-20.md) et les [variantes cartographiques V056](OuQuandQui_API_V056_Variantes_Carte_2026-11-20.md). Éditions précédentes conservées.

## Parcours et commandes

« Trouver mon trajet » démarre une seule recherche. Pendant la résolution du départ, celle de l’arrivée et le calcul routier, « Annuler la recherche du trajet » reste accessible à côté du lancement. Les saisies et commandes concurrentes restent verrouillées. L’annulation les rend immédiatement disponibles, sans attendre une réponse du fournisseur ; le focus revient au lancement ou au départ si le lancement n’est pas disponible.

Fermer le choix d’un lieu, par sa croix ou par Échap, annule également cette recherche entière. Une annulation volontaire est annoncée sans icône d’erreur ni ouverture du diagnostic. Départ, arrivée, critère, véhicule, évitements et limites de marche sont conservés. Le profil, les favoris, les préparations et le journal ne sont pas enregistrés ou modifiés automatiquement.

Une nouvelle recherche retire les résultats précédents avant de commencer : aucun ancien trajet, arrêt ou variante n’est présenté comme le résultat d’une recherche annulée ou échouée. Les préparations déjà enregistrées restent consultables. Reprendre nécessite une nouvelle action explicite ; aucun redémarrage automatique.

## Réponses tardives et propriété du calcul

Chaque recherche dispose d’un identifiant, d’un contrôleur d’annulation et d’une révision des paramètres. La garde s’applique au véhicule et à la marche, entre toutes les étapes : espacement des appels, résolution, choix de lieu, réception et décodage de la réponse, routage principal et éventuelles alternatives.

Annuler interrompt les requêtes côté navigateur et invalide la recherche. Un serveur peut néanmoins terminer une demande déjà reçue : aucune garantie d’interruption de son traitement n’est déduite de l’annulation locale. Même si le transport ignore l’interruption, l’ancienne réponse ne peut plus modifier carte, métriques, indicateurs, état de progression ou verrous d’une recherche plus récente.

Les requêtes et délais utilisent le signal capturé par leur propre opération. La fin d’une ancienne tâche ne libère pas les commandes d’une nouvelle tâche. Une modification des paramètres invalide la révision, même si aucun événement de saisie n’a été émis. Les événements ordinaires permettent l’annulation immédiate ; la garde après réponse constitue une seconde protection.

Les fonctions de recherche de stations, de comparaison et de rencontre conservent leurs propres commandes. Ce lot ne transforme pas l’annulation principale en arrêt global de toutes les fonctions de l’application.

## Erreurs, délais et limites de service

Une absence de lieu, une absence de trajet, une panne réseau, un délai dépassé et une limite de service restent distincts. Les délais par requête restent bornés : 16 secondes pour les lieux, 20 secondes pour OSRM et 25 secondes pour IGN ou le relais routier configuré. Les attentes de choix d’un lieu restent des décisions humaines, sans expiration automatique.

Après une réponse HTTP 429 de routage, les nouveaux appels du même fournisseur sont retenus pendant le délai `Retry-After` lisible, en secondes ou sous forme de date HTTP. Sans valeur exploitable, le délai local minimal est de cinq secondes. Le délai restant est annoncé ; aucun appel n’est automatiquement répété à son expiration. Les évitements et le critère sont conservés.

Cette retenue est locale à la page et au fournisseur, commune aux appels de ses différents profils. Une réponse déjà conservée dans le cache IGN peut être consultée sans nouvel appel. La limite ne constitue ni un quota partagé entre visiteurs ni une garantie financière. Un en-tête non exposé par les règles CORS du fournisseur n’est pas lisible par le navigateur ; le repli local est alors utilisé. Le contrôle existant des limites du géocodage est conservé.

Un échec de la recherche facultative d’alternatives peut laisser le trajet principal déjà reçu disponible, avec sa réserve explicite. L’annulation, elle, empêche toute adoption tardive et toute nouvelle demande d’alternative. Aucun changement de moteur, de profil ou d’exclusion pour masquer une panne.

## Vérification et périmètre

Scénarios navigateur sur quatre formats : annulation aux deux étapes de géocodage, fermeture des choix, clavier, double lancement, ancienne réponse face à un nouveau calcul, décodage tardif, changement de paramètres avec et sans événement, IGN véhicule/marche sans repli, relais simulé et alternatives, délai, absence de route, panne et retenue après quota. Les simulations ignorent volontairement le signal d’interruption pour vérifier la garde indépendante du transport.

La recette de l’aperçu publié utilise des lieux publics et les services réellement raccordés. Les scénarios simulés du relais ne constituent pas son activation. Les preuves, les contrôles de la révision et les vues ordinateur/mobile sont consignés dans le suivi du lot. Aucun téléphone physique ni déplacement réel n’est attesté.

Aucun nouveau fournisseur, compte, coût, hébergement, format de sauvegarde ou service de navigation continue. Les limites de couverture, de péages nationaux, de caravanes et de poids lourds demeurent celles des éditions précédentes.
