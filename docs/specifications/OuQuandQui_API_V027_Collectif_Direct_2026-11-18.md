# OùQuandQui — V027 · Accès collectif direct et comparaison des temps

18 novembre 2026 · MULTIMODAL-02 · Complément du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), TC-01/02/03/07 et parcours de comparaison. Cette édition prolonge [V026, pilote Grenoble](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md), [V015, comparaison voiture/marche](OuQuandQui_API_V015_Comparaison_2026-11-18.md) et [V002, lieux IGN](OuQuandQui_API_V002_Adresses_2026-11-17.md). Les éditions antérieures sont conservées.

## Accès dès les lieux saisis

Le bouton **Transports collectifs · pilote Grenoble** est accessible immédiatement après les champs Départ et Arrivée. Le calcul d’un trajet routier n’est plus un préalable. Un profil caravane ou un moteur voiture indisponible n’empêchent pas la recherche collective.

Ouvrir le panneau n’effectue aucun appel de transport ou de géocodage. La recherche vérifie d’abord la présence des deux lieux, la date/heure et la limite de marche. Une saisie impossible n’est pas envoyée aux services. Les lieux mémorisés correspondant exactement à la saisie sont réutilisés avec leurs libellés. Sinon, le géocodage IGN vérifie les lieux ; une réponse ambiguë exige un choix, sans première suggestion automatiquement adoptée. Une annulation n’envoie pas une demande collective avec des coordonnées supposées.

Le panneau annonce les destinataires avant le lancement : IGN si les lieux doivent être recherchés, puis Mobilités M pour le calcul collectif. Le fournisseur, les conditions et le périmètre du pilote sont ceux de V026 ; aucun compte, clé visiteur, nouvel hébergement ni service payant. Le code ne déclenche aucune recherche au changement de champ ou à la fermeture.

Les résultats restent dans le panneau dédié. Aucun budget routier, profil de véhicule, arrêt carburant ou parcours principal n’est remplacé par la recherche ou par la consultation d’une carte collective. Fermer le panneau restitue l’état précédent, y compris lorsqu’aucun trajet routier n’a été calculé. Les lieux vérifiés peuvent ensuite servir aux actions explicites de mémorisation existantes ; aucun trajet collectif n’est enregistré automatiquement.

## Comparaison facultative

La case **Comparer aussi les temps avec la voiture et la marche**, désactivée par défaut, autorise des calculs routiers supplémentaires lors du lancement. Le groupe de comparaison est explicitement limité à **une personne**. Aucune capacité ou place disponible n’est déduite d’un horaire ; aucune comparaison de billets ou d’empreinte carbone n’est produite.

Les trois modes partagent les mêmes coordonnées résolues, date et heure de Paris. Les trajets sont directs, sans arrêt intermédiaire. Les évitements, le critère et le profil saisis sont conservés pour le calcul routier. Un profil lourd, caravane ou autre profil non qualifié reste indisponible dans cette comparaison ; il ne devient pas une voiture légère. Le parcours à pied utilise son moteur dédié et la même limite totale de marche que le collectif. Une marche directe trop longue reste identifiée comme indisponible, avec le motif et la limite.

| Demande | Temps comparé | Horaires routiers estimés |
|---|---|---|
| Départ à partir d’une heure | De l’heure demandée à l’arrivée. Pour le collectif, attente avant départ comprise | Départ à l’heure demandée, arrivée après la durée du moteur |
| Arrivée au plus tard à une heure | Du départ à l’heure limite. Pour le collectif, éventuelle avance à l’arrivée comprise | Arrivée à l’heure limite, départ obtenu en retranchant la durée du moteur |

La colonne des horaires conserve les heures effectives de l’option reçue et la durée en chemin. Cette durée inclut les accès et correspondances pour le collectif. Elle reste distincte du temps comparé lorsque le départ est différé ou l’arrivée anticipée. Les durées routières sont des estimations hors trafic et pauses : la soustraction ne constitue pas une garantie d’arrivée. Un départ routier antérieur à l’instant de recherche est exclu.

Le tableau trie les temps en minutes affichées, avec égalités conservées. Les options collectives restent identifiées par leur numéro. Aucun badge de meilleur coût, classement global ou prix nul n’est attribué. Une donnée de prix absente reste inconnue. La carte demeure celle de l’option collective choisie ; le tableau ne substitue pas un tracé routier à ce dessin.

## Échecs, annulation et concurrence

Une erreur de géocodage ou un point extérieur au secteur pilote arrête la demande avant le calcul collectif et avant les calculs routiers facultatifs. Les contrôles de date, fuseau, changement d’heure, géométrie et horaires qualifiés de V026 restent appliqués.

Si le service collectif renvoie une erreur exploitable, les modes routiers explicitement demandés peuvent encore être calculés ; le collectif apparaît indisponible, sans trajet de secours présenté sous son nom. Si un calcul routier échoue, les autres résultats restent consultables. Une limite de quota IGN empêche le deuxième calcul utilisant ce même service. Il n’y a pas de réessai automatique.

Une seule recherche est active à la fois. Annuler, fermer ou modifier un critère invalide l’opération et retire ses résultats. Les réponses tardives ne créent pas de nouvelle carte, de ligne de comparaison ou de lieu mémorisé après une annulation. Le verrou est libéré lorsque l’opération interrompue s’est terminée, pour éviter qu’une ancienne requête utilise le contrôleur d’une nouvelle demande. Une fenêtre de choix d’adresse liée à la recherche peut être annulée sans laisser de promesse en attente.

Les contrôles restent utilisables après une erreur. Une modification des lieux principaux retire le contexte collectif précédent. Aucune sauvegarde automatique ni synchronisation de trajet n’est ajoutée.

## Validation et limites

Le modèle temporel vérifie départ/arrivée, durées finies, marche maximale, départ déjà passé, attente avant départ, avance avant limite, égalités et inconnus. Les contrôles de minuit, saut printanier et service annulé sont désormais intégrés aux tests versionnés.

Dix scénarios navigateur couvrent accès sans voiture, comparaison commune, choix de lieu ambigu, annulation pendant le géocodage et la comparaison, saisies invalides, secteur extérieur, indisponibilité collective/routière, quota sans second appel, lieux modifiés sans événement et profil caravane conservé. Les parcours V026 et ceux du géocodage/comparateur existants restent à vérifier avec ce lot. Le rapport d’inspection du commit porte les nombres réellement exécutés.

La recette publiée utilise des lieux publics de Grenoble, les services accessibles, les deux sens de recherche horaire et la comparaison facultative. Les captures ordinateur/mobile et les fichiers reçus sont contrôlés séparément des réponses simulées. Aucun téléphone physique, trajet réalisé, billet acheté ou présence à bord n’est attesté.

Le collectif reste limité au secteur de Grenoble, aux horaires théoriques et à une consultation. Tarifs, perturbations, accessibilité, bagages, vélo à bord, réservation, adoption dans la préparation principale et comparaison de groupes restent non qualifiés ou non intégrés. Le routage caravane/poids lourd n’est pas certifié par ce lot. Ces absences restent visibles et ne satisfont aucun filtre strict.
