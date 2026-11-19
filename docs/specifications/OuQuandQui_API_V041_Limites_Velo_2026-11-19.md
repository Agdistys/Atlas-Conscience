# V041 — Limite impérative du vélo personnel

DOU-VELO-04 · 19 novembre 2026. Complète DOU-02, BOU-01/02/03, PRO-03/04/05 et ERR-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [calcul cyclable V033](OuQuandQui_API_V033_Itineraires_Velo_2026-11-19.md), les [préparations V034](OuQuandQui_API_V034_Preparations_Velo_2026-11-19.md), les [comparaisons V035](OuQuandQui_API_V035_Comparaison_Velo_2026-11-19.md) et les [limites partagées V040](OuQuandQui_API_V040_Limites_Partagees_2026-11-19.md). Éditions précédentes conservées.

## Choix personnel et résultat direct

Le calcul vélo direct, le comparateur routier et la comparaison collective proposent une distance maximale facultative et une règle explicite : **Préférence** ou **Limite impérative**. La préférence reste le choix initial. Les anciens repères ne sont jamais transformés en interdictions.

Le champ accepte de 0 à 300 km. Vide signifie non demandé ; zéro demande explicitement zéro kilomètre. Une limite impérative sans valeur est invalide. Le plafond technique de 300 km conserve la borne du calculateur ; il ne constitue pas une recommandation d'effort ou d'autonomie. Le format ancien conserve ses règles historiques, dont l'absence de zéro demandé.

Le résultat distingue préférence dépassée, limite impérative respectée, dépassée ou non vérifiable. Une distance inconnue ne satisfait jamais une limite impérative. La comparaison utilise les mètres reçus avant arrondi, avec une tolérance numérique de 0,000001 m ; un dépassement inférieur à un mètre reste annoncé. Les passages vélo à la main sont déjà compris dans la distance cyclable et ne sont pas ajoutés une seconde fois.

Une limite dépassée ne raccourcit pas la géométrie et ne recherche pas un autre parcours. Les métriques, étapes et tracés restent visibles avec l'état non admissible. Un export GPX ou une sauvegarde reste possible comme référence historique. Des critères invalides bloquent la sauvegarde et la déclaration depuis le calcul tant qu'ils ne sont pas corrigés ; le tracé déjà reçu reste consultable.

## Comparateurs : contraintes avant classement

Dans le comparateur routier, un parcours cyclable hors limite impérative est placé parmi les trajets écartés. Il ne figure plus dans les options admissibles triées par distance ou durée. Ses valeurs brutes et son détail restent consultables ; le choix est transmis à la fiche et à sa sauvegarde. Le filtre horaire reste indépendant : assouplir la distance ne rend pas admissible une arrivée refusée par ce filtre. La consultation depuis une option écartée par l'heure limite conserve le comportement de V035.

Dans le comparateur collectif, le vélo hors limite porte l'état « Écarté » et sort du classement des durées admissibles. Le tableau n'affiche pas de durée comparable avantageuse pour cette option. La distance et la durée théorique restent lisibles dans sa fiche explicative, avec le motif d'exclusion. Les autres modes, l'option collective et sa carte restent inchangés. Une erreur horaire, dont un départ calculé déjà passé, reste une erreur après assouplissement de la distance.

Le tri place d'abord les options admissibles, puis les options écartées ou indisponibles dans un ordre déterministe. Les minutes ex æquo restent ex æquo. Une donnée manquante ou une option écartée ne reçoit aucun coût, temps comparable ou avantage fictif. Prix et empreinte vélo restent non estimés.

Modifier la valeur ou la règle après calcul réévalue localement les résultats sans requête, sans rajeunir la date du calcul ni changer les lieux. Corriger des critères invalides restitue l'état compatible avec les données déjà reçues. Un autre changement de contexte exige le recalcul existant. Pendant un calcul, modifier la limite l'annule ; une réponse tardive ne restitue ni résultat ni cache abandonné. Les gardes existantes de contexte, délai et quotas restent actives.

## Préparations : format 2 et originaux

Le livre `dragonroute-cycling-preparations` devient version 2. Chaque entrée conserve `criteria.maxKm` numérique ou `null`, et `criteria.strict` booléen obligatoire. La nouvelle clé est `dragonroute.cycling-prepared.v2.` suivie du périmètre public ou de l'aperçu. La clé de version 1 est conservée séparément.

En l'absence de livre récent, la version 1 est lue en mémoire avec `strict: false`, sans écriture. Une sauvegarde ou modification volontaire écrit ensuite la version 2, sans toucher à l'original, exportable à l'identique. Un livre récent présent, même vide ou invalide, empêche le retour silencieux à l'ancien. Les formats futurs restent protégés et exportables en brut.

Les imports 1 et 2 sont vérifiés avant confirmation. Un ancien format contenant le nouveau champ `strict` est refusé comme ambigu. La version 2 doit fournir la règle ; valeur invalide, règle non booléenne et contrainte sans distance sont refusées sans remplacement. Les limites de vingt entrées, 2 Mo, noms, coordonnées, dates, profils et géométries de V034 restent appliquées. Les champs étrangers sont écartés et les textes restent inertes. La règle fait partie de l'identité des critères pour détecter les doublons.

Les deux copies sont comparées avant écriture ou effacement pour détecter un changement observable dans un autre onglet. Quota ou conflit conservent les données et le formulaire. L'effacement volontaire annonce qu'il concerne également les copies anciennes de cette rubrique, dans cet environnement seulement. Ce contrôle n'est pas une transaction atomique entre processus ; aucune synchronisation entre appareils.

La consultation historique et l'aperçu d'import présentent la règle et l'état du parcours. La reprise prépare les lieux et les critères sans requête, puis demande un nouveau calcul explicite. Elle ne modifie pas la préparation d'origine. Les autres rubriques, le profil et le journal ne changent pas ; une contrainte personnelle ne devient ni une preuve de déplacement effectué ni un fait déclaré dans le journal.

## Vérification et limites

Les contrôles de modèle couvrent zéro/vide, types et bornes, seuil inclusif et petit dépassement, distance inconnue, priorité des contraintes, indépendance des horaires, ordre stable, formats anciens/futurs, critères conservés et origine intacte. Les parcours navigateur couvrent les trois points d'entrée, la réévaluation locale, les erreurs et annulations, la consultation et la conservation depuis les comparaisons, la reprise, les deux copies, les conflits entre onglets et les espaces public/aperçu.

Les recettes réelles utilisent uniquement des lieux publics à Grenoble, séparément des données simulées des tests. Les métriques sont confrontées aux réponses reçues ; les traces du calculateur, exports, fichiers publiés, métadonnées de commit et captures ordinateur/mobile sont conservés dans `quality/cycling-limits`. Le fichier d'état du chantier consigne les contrôles réellement exécutés, leurs résultats et les limites. Aucun téléphone physique ni parcours sur route attesté.

Le fournisseur et les conditions d'essai gratuit modéré de V033 restent inchangés. Aucun nouveau compte, service, hébergement ou coût. Distances théoriques uniquement : pente, terrain, effort, matériel, VAE, batterie, autonomie et sécurité non qualifiés. Une commercialisation ou une forte fréquentation demandent toujours un autre cadre. Aucune combinaison train + vélo ni couverture nationale de location déduite de ces limites.
