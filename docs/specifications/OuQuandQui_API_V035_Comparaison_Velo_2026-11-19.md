# V035 — Comparer les temps avec le vélo

DOU-VELO-03 · 19 novembre 2026. Complète DOU-01/02, PAR-06, BOU-02/03/07 et ERR-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [comparaison V015](OuQuandQui_API_V015_Comparaison_2026-11-18.md), les [horaires et limites V016](OuQuandQui_API_V016_Horaires_2026-11-18.md) et la [comparaison collective V027](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md). Le moteur cyclable et les sauvegardes sont définis en [V033](OuQuandQui_API_V033_Itineraires_Velo_2026-11-19.md) et [V034](OuQuandQui_API_V034_Preparations_Velo_2026-11-19.md). Éditions précédentes conservées.

## Ajout volontaire dans les deux comparateurs

Après un trajet routier ou piéton, « Comparer les modes » conserve les deux lieux confirmés et propose d'inclure le vélo classique. Cette option est décochée au départ. La distance cyclable souhaitée est facultative ; son dépassement reste un repère personnel, sans exclusion automatique. Le lancement calcule les modes demandés sur les mêmes coordonnées. Aucun nouveau géocodage, appel pendant la frappe, ouverture du panneau ou tri.

Le panneau des transports collectifs de Grenoble conserve son accès direct depuis les lieux saisis. Après activation de la comparaison voiture/marche, une seconde case permet d'ajouter le vélo. Désactiver la comparaison retire cet ajout et ses anciens résultats. Hors secteur pilote, la recherche collective et ses comparaisons ne sont pas lancées. Le comparateur routier reste distinct de ce pilote.

L'automobile utilise son moteur et ses contraintes ; la marche son profil piéton ; le vélo le graphe FOSSGIS `routed-bike` qualifié en V033. Un véhicule lourd ou une caravane non qualifiés restent indisponibles comme tels. Aucun changement de vitesse sur une route automobile ne produit une option cyclable.

## Valeurs, horaires et périmètres

La carte vélo indique distance, durée estimée, arrivée calculable, portions annoncées vélo à la main, repère personnel et date de consultation du résultat. Les tris existants par distance/durée conservent leurs arrondis et égalités ; les échecs sont séparés. Le filtre horaire strict du comparateur routier s'applique également au vélo. Une préférence de distance dépassée n'est pas une interdiction ; une arrivée incompatible avec l'heure limite reste exclue lorsque le filtre est activé.

Dans la comparaison collective, toutes les options concernent une personne, les mêmes lieux et la même heure de Paris : attente depuis l'heure de départ demandée ou marge avant la limite d'arrivée comprises. Le vélo utilise sa durée estimée pour déduire le départ ou l'arrivée ; un départ calculé déjà passé est refusé. Les limites existantes de cette comparaison — 150 km et six heures par trajet direct — restent appliquées. Elles ne définissent aucune aptitude physique.

Dans le comparateur routier, le groupe de 1 à 9 personnes est une hypothèse commune. Un vélo personnel est supposé disponible pour chaque personne ; matériel, allure du groupe, capacité et accessibilité ne sont pas vérifiés. La date, le groupe et la limite souhaitée ne sont pas envoyés au fournisseur cyclable. Les durées restent hors pauses et trafic ; aucune arrivée garantie.

Coût total et empreinte vélo restent **non estimés**, jamais nuls par défaut. Les tris par coût total et carbone restent indisponibles. Ni tarif de location, batterie, VAE, effort, pente, revêtement ou disponibilité matérielle déduits. La comparaison présente des trajets directs séparés : aucun train + vélo sans accès, location/restitution et temps associés. DOU-04 reste à développer.

## Consulter, conserver et reprendre

« Consulter le parcours vélo » ouvre le résultat reçu dans la fiche cyclable existante, sans nouvel appel. La carte principale, l'arrêt carburant, les péages et le profil sont préservés. Depuis la comparaison collective, la fermeture de cette fiche restitue le tableau et le bouton d'origine. Les déplacements voiture/marche continuent d'être sélectionnables selon le fonctionnement V015 ; le vélo est consulté dans son panneau dédié.

La fiche réutilise le vrai tracé, les voies, le repère personnel et la date originale. GPX et sauvegarde volontaire fonctionnent selon V033/V034. Enregistrer depuis la comparaison collective ferme les panneaux précédents avant d'ouvrir « Mes trajets → À vélo ». Aucune comparaison, consultation ou sauvegarde ne crée une entrée de déplacement effectué. Un nouveau calcul depuis la fiche reste explicite et conserve les lieux confirmés.

Le défilement vers une fiche vélo enregistrée réserve désormais la place de l'en-tête fixe afin de garder son titre visible.

## Réseau, cache et erreurs

La demande cyclable reste un GET vers l'endpoint exact de V033, avec les deux coordonnées, géométrie et étapes. Aucun nouveau fournisseur, compte, serveur, clé visiteur ou appel payant. Attribution FOSSGIS/OpenStreetMap visible ; conditions d'essai gratuit modéré inchangées. Commercialisation et forte fréquentation demandent toujours un cadre distinct.

La comparaison partage avec le calcul vélo direct le délai minimum de cinq secondes, les quotas et le cache en mémoire de huit résultats pendant cinq minutes. Un résultat du cache conserve sa date originale, explicitement affichée. Sa consultation peut être immédiate : le délai minimum protège les nouvelles requêtes, sans bloquer un résultat déjà reçu. Les quotas exposés par le fournisseur sont respectés ; aucun réessai automatique. Un quota IGN peut écarter le second mode IGN sans empêcher le vélo, fourni séparément.

Le calcul supplémentaire est borné à trente secondes, avec un contrôleur propre lié à l'annulation du comparateur. Fermeture, annulation ou contexte modifié empêchent toute adoption tardive et toute écriture dans le cache d'un résultat dépassé. Même si un transport ignore l'annulation, le délai libère les commandes et conserve les autres modes déjà obtenus. Une réponse cyclable invalide, un mode transport, une panne ou une source désactivée rendent seulement le vélo indisponible ; aucun ancien tracé ni profil voiture ne le remplace.

Les validations V033 sur métriques, géométrie, taille et modes restent intégrales. Un changement silencieux des lieux est recontrôlé après réponse et avant consultation. Les résultats anciens sont retirés. La fermeture pendant un calcul restitue le bouton de départ une fois les commandes libérées.

## Qualification et recette

Deux requêtes réelles distinctes sont conservées dans `tests/fixtures/cycling-comparison`, avec URL, date, en-têtes et empreinte :

- Le premier départ, sur un quai près de la gare de Grenoble, donne 4 927,2 m et inclut 125,5 m de mode `train`, « Lignes A, B et D ». Il est refusé comme trajet vélo direct. Le brut `grenoble.json` et sa provenance restent conservés comme cas négatif.
- Un second point public explicitement choisi devant la gare, à environ cinquante mètres, donne 4 875,4 m, 1 131,5 s et 295 points, uniquement `cycling`/`pushing bike`. Le brut `grenoble-cycle.json` conserve ses propres coordonnées et sa provenance. Ce choix d'essai ne devient pas un déplacement automatique du point demandé par une personne.

Le premier essai du modèle avait supposé le premier résultat cyclable admissible : sept contrôles sur huit l'ont refusé à cause du tram. Le validateur est conservé ; le cas négatif et le second exemple réel sont testés séparément. Neuf contrôles couvrent ensuite profils, paramètres envoyés, inconnus, limites, unités, horaires, minuit/changement d'heure, tri et refus du premier tracé.

Dix-sept scénarios navigateur sur quatre formats couvrent les deux comparateurs, choix volontaire, affichage et tris, heure limite, repère souple, cache daté/expiration, quota partagé, panne, profils non qualifiés, annulation, délai, réponse tardive, modification silencieuse, consultation, retour clavier, GPX et sauvegarde. Le premier essai ordinateur a détecté un retour de focus manquant après fermeture pendant le calcul ; correction avant la recette complète. Régression des comparateurs, vélo et sauvegardes existants ; captures ordinateur/mobile inspectées.

Les variantes d'erreur et horaires automatisés sont simulés. Les métadonnées du commit, contrôles GitHub, fichiers publiés et recettes sur services réels sont vérifiés séparément et consignés dans `quality/cycling-comparison` et l'état de développement. Aucun téléphone physique, trajet sur route, matériel disponible ou réalité d'un déplacement attestés.

La recette réelle depuis Place de la Gare a également reçu un segment de tram de 73,8 m, correctement refusé. Un autre essai explicite Place de Verdun → avenue Innsbruck fournit un parcours vélo direct. Le passage immédiat entre comparateurs a révélé que le délai réseau bloquait aussi le cache : correction et contrôle de réutilisation immédiate, sans nouvel appel. Les traces de ces essais restent conservées séparément.

Avant publication, la recette réelle Place de Verdun → 1 avenue d’Innsbruck a vérifié les deux comparateurs, les départs et arrivées à heure fixée, le cache partagé, le retour entre panneaux, le GPX et la sauvegarde exacte. Résultat cyclable reçu : 4 103,9 m, 1 082,4 s et 267 points. Les fichiers de l’aperçu doivent être revérifiés après publication ; ces chiffres datés ne constituent pas une promesse sur une requête future.
