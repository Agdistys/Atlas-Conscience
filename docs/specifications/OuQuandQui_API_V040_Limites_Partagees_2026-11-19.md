# V040 — Limites personnelles de marche et de vélo partagé

DOU-PARTAGE-04 · 19 novembre 2026. Complète DOU-02/04, BOU-01, PRO-03/04/05 et ERR-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [parcours partagé V037](OuQuandQui_API_V037_Parcours_Velo_Partage_2026-11-19.md), les [préparations V038](OuQuandQui_API_V038_Preparations_Partagees_2026-11-19.md) et le [journal V039](OuQuandQui_API_V039_Journal_Partage_2026-11-19.md). Les versions précédentes restent conservées.

## Choisir deux limites indépendantes

Le panneau du pilote lyonnais propose une distance maximale souhaitée pour la marche totale et une autre pour le vélo. Chaque distance peut être une **préférence** ou une **limite impérative**. Les champs sont initialement vides, sans préférence cachée ; zéro signifie zéro kilomètre explicitement demandé. Une limite impérative sans distance est invalide et doit être renseignée ou replacée en préférence.

La marche additionne les deux étapes d'accès et de sortie. Le vélo utilise la distance de l'étape cyclable ; les mètres annoncés vélo à la main restent inclus dans cette étape, sans double addition aux marches. Les valeurs décimales sont acceptées de 0 à 600 km pour le total des marches et de 0 à 300 km pour le vélo, bornes cohérentes avec les capacités des préparations. Ces plafonds techniques ne sont pas des recommandations de distance.

Le calcul des trois étapes reste explicite. Il examine les stations choisies et ne prétend pas chercher d'autres stations ou un itinéraire plus court pour satisfaire les limites. Les critères ne sont transmis à aucun fournisseur ; ils sont appliqués localement aux distances reçues.

## Lire le résultat

Chaque mode affiche sa distance calculée, son maximum demandé, la règle choisie et le résultat : non demandé, respecté, dépassé ou non vérifiable. Les limites sont inclusives. La comparaison utilise les mètres avant arrondi d'affichage, avec une tolérance numérique de 0,000001 m pour les erreurs de représentation. Un dépassement inférieur à un mètre est signalé comme tel même si les kilomètres affichés paraissent identiques.

Une préférence dépassée n'exclut pas le parcours. Une limite impérative dépassée ou non vérifiable le rend non admissible pour ces critères : les étapes et les tracés restent consultables, mais aucune durée assemblée admissible n'est proposée. Le filtre de disponibilité et les règles de raccordement/temps de V037 restent indépendants et doivent aussi être satisfaits. Aucune faible durée ou disponibilité positive ne compense une limite impérative non satisfaite.

Les métriques de source ne sont ni arrondies dans les données conservées, ni raccourcies pour satisfaire une limite. Une donnée absente n'est pas zéro. Les validateurs des moteurs continuent de refuser un parcours incomplet ; le comparateur de limites ne traite jamais une distance inconnue comme une contrainte satisfaite. Aucune nouvelle solution n'est inventée.

Changer une distance ou sa règle après calcul réévalue le résultat sans requête. La remise à zéro des limites conserve les stations, les tracés, les temps personnels et le filtre de disponibilité. Un changement pendant un calcul annule ce calcul ; une réponse tardive ne réaffiche pas le parcours abandonné. Des critères invalides empêchent le nouveau lancement et la sauvegarde ; le résultat ancien n'est pas présenté comme admissible.

La comparaison porte uniquement sur les étapes calculées, hors accès fin aux bornes, pente ou terrain non mesurés. Elle ne constitue pas une garantie physique de distance, d'accessibilité, d'effort, d'autonomie ou de sécurité. Aucune prise en charge VAE ou train + vélo n'est ajoutée.

## Conserver et reprendre les critères

Les nouvelles préparations conservent `criteria.limits.walk` et `criteria.limits.bike`, chacun avec `maxKm: nombre|null` et `strict: booléen`. Le détail historique et l'aperçu d'import présentent ces critères et leur résultat sur les distances conservées. Une préparation hors limite impérative reste sauvegardable comme référence, avec son état non admissible explicite ; elle n'est pas transformée en proposition conforme.

La reprise remplit les lieux, stations, temps et limites sans appel réseau. Le catalogue doit ensuite être consulté et les identités des stations confirmées selon V038. Le nouveau calcul explicite réexamine les limites sur les nouvelles distances. La préparation d'origine reste inchangée. Modifier les limites n'écrit pas dans le profil, les autres rubriques de Mes trajets ou le journal.

Une déclaration de déplacement dans le journal reste indépendante des préférences de préparation. Elle conserve les trois étapes et la provenance minimale de V039 ; les limites personnelles ne deviennent pas des faits sur le déplacement effectué, ni une confirmation de sa réalisation.

## Format 2 et copies anciennes

Le livre devient `dragonroute-shared-bike-preparations`, **version 2**, stocké dans `dragonroute.shared-bike-prepared.v2.` suivi du périmètre public ou du chemin de l'aperçu. L'ancienne clé `dragonroute.shared-bike-prepared.v1.` est conservée. En l'absence de clé nouvelle, un ancien livre valide est chargé en mémoire avec limites non demandées ; aucune écriture n'a lieu à la lecture.

La première écriture volontaire produit le format 2 dans sa nouvelle clé et laisse la copie de format 1 intacte. Un bouton permet d'exporter exactement cette copie ancienne. L'export habituel fournit le format actuel, comprenant les limites explicites. La présence d'un nouveau livre, même vide, empêche la réapparition des anciennes préparations. Un nouveau format invalide/futur bloque les écritures sans repli silencieux vers l'ancien. Son brut et la copie ancienne restent exportables.

Les imports 1 et 2 sont acceptés et normalisés en mémoire avant confirmation. Un format 1 contenant les nouveaux champs de limites est refusé comme ambigu ; un format 2 doit fournir ses limites explicitement. Nombres incohérents, types non numériques, règle sans maximum et versions futures sont refusés. Champs étrangers supprimés, textes rendus inertes, 20 préparations et 2 000 000 octets conservés comme limites de capacité.

Avant écriture ou effacement, les **deux clés** sont comparées aux copies chargées. Un changement observable dans un autre onglet bloque l'opération ; quota, refus de stockage et conflit conservent le formulaire et les anciennes données. Il ne s'agit pas d'une transaction atomique entre onglets. L'effacement volontaire annonce qu'il concerne aussi la copie ancienne de cette rubrique ; les autres données restent conservées. Pas de synchronisation entre appareils.

## Vérifications

Douze contrôles de modèle : conversion en mémoire sans mutation de l'original, types et bornes, marche additionnée, zéro/inconnu, préférence/contrainte, décimales, conservation des critères, formats ambigus/futurs, doublons, champs étrangers et absence de modification des sources.

Dix-huit scénarios navigateur sur quatre formats : valeurs initiales, réévaluation sans appel, limites inclusives, zéro/vide, critères invalides, remise à zéro, annulation et réponse tardive, sauvegarde/export, reprise, anciennes copies, import vide, conflit entre onglets sur copie ancienne, version future, quota, imports invalides, espaces public/aperçu, source incomplète et petit dépassement. Les tests existants de parcours, préparations et journal partagés sont repris avec le format actuel ; le fichier de référence de format 1 reste inchangé.

Les recettes des services réels utilisent seulement des lieux publics lyonnais et les stations 2002/3011. Préférences, contrainte dépassée, retrait/rétablissement local de durée, sauvegarde/export, consultation hors réseau et reprise recalculée sont vérifiés séparément des disponibilités simulées des tests. Les preuves, résultats exécutés et captures ordinateur/mobile sont conservés dans `quality/shared-bike-limits` et l'état du chantier. Aucun téléphone physique, location ou déplacement réel n'est attesté.
