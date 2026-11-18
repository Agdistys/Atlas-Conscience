# OùQuandQui — Comparaison des modes disponibles

V015 · 18 novembre 2026 · BOU-COMPARAISON-01. Complément de BOU-02/03/07, DOU-01 et EMP-06 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). [Marche V014](OuQuandQui_API_V014_Marche_2026-11-18.md), [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md) et éditions précédentes conservées.

## Parcours utilisable

Après un calcul de trajet, « Comparer voiture et marche » ouvre un panneau sur les deux lieux confirmés. Aucun nouveau géocodage ni calcul à l’ouverture. Le trajet affiché et son éventuel arrêt restent en place pendant la comparaison. Les hypothèses communes sont relues avant « Calculer la comparaison » : groupe de 1 à 9 personnes, départ souhaité facultatif en heure de Paris, consommation du véhicule, prix de carburant facultatif saisi et distance de marche souhaitée facultative.

Les deux modes sont calculés séparément sur le même aller simple, sans arrêt. La voiture conserve le profil léger et ses évitements ; la marche utilise le profil piéton IGN. La sélection d’une caravane ou d’un poids lourd n’est jamais transformée en voiture. La capacité du véhicule n’est pas déduite du nombre de personnes. La date et le groupe sont des hypothèses communes, non transmis aux moteurs ; aucun trafic temps réel, horaire de transport public, temps de pause ou arrivée garantie.

Les valeurs restent figées jusqu’à un changement de paramètres ou un nouveau calcul explicite. Tri par durée ou distance, à la précision affichée, ordre déterministe en cas d’égalité. Les échecs restent distincts des trajets calculés. Aucun score pondéré : la formule proposée dans V5 attend une validation distincte.

## Périmètres de coûts et inconnus

Le carburant est estimé pour le véhicule entier : `distance_m / 1000 × consommation_L_100km / 100 × prix_EUR_L`. Le nombre de personnes ne divise pas ce montant. Le prix de la comparaison est vide à l’ouverture : ni prix d’une station, ni moyenne automatique, ni budget d’un autre tracé repris.

Un montant de carburant connu est une **part connue**, pas un coût total. Péages, stationnement et autres frais restent inconnus pour les trajets nouvellement comparés. Sans prix saisi, le coût du véhicule n’est pas estimé. Le carburant automobile est sans objet pour la marche ; son budget complet n’est pas assimilé à zéro. Aucune empreinte calculée dans ce panneau, même si le journal dispose séparément de modèles carbone.

La donnée interne distingue `status: partial` et `status: unknown`, avec `total: null` et `carbonKg: null`. Aucun coût complet n’est disponible dans ce lot. Les tris par coût total et CO₂e sont donc indisponibles et libellés comme tels ; une absence de valeur n’améliore pas une position. Aucun classement de sous-totaux de périmètres différents.

## Calcul et concurrence

- Deux calculs séquentiels au maximum : adaptateur automobile déjà configuré (OSRM, IGN sans autoroute, ou service public OpenRouteService) puis IGN piéton. Les contrats existants, unités, contraintes, géométries, rattachements, délais et caches sont conservés. Aucun nouveau fournisseur ou endpoint.
- Aucun calcul pendant la saisie ou le tri. La marche ne reprend jamais la géométrie automobile avec une vitesse différente.
- Profil incompatible ou source désactivée : carte de résultat indisponible, sans requête de substitution. Un quota IGN rencontré sur le premier mode interdit le deuxième appel IGN de cette comparaison ; aucune répétition automatique.
- Échec d’un mode : résultat partiel, l’autre reste consultable et sélectionnable. Deux échecs : aucune nouvelle proposition sélectionnable, ancien trajet toujours identifiable sur la carte.
- Pendant le calcul, les paramètres sont bloqués et une annulation dédiée reste disponible. Une réponse tardive après annulation ou modification ne remplace ni les propositions ni le trajet. Le verrou est libéré après la fin de l’opération bornée, sans chevauchement de requêtes.
- Lieux, variante, mode, évitements, véhicule et hypothèses modifiés : groupe retiré ou invalidé avant une nouvelle sélection. Une empreinte des paramètres est aussi recontrôlée après la réponse et avant sélection. Le groupe n’est pas réordonné automatiquement à l’arrivée d’un nouveau candidat.

## Sélection et continuité

« Afficher ce trajet » sélectionne le tracé déjà calculé, sans nouvelle requête de routage. Les éventuelles stations, l’arrêt et les péages précédents nécessitent confirmation avant retrait. Le refus conserve le trajet et ses informations. Le nouveau tracé ne reprend aucun tarif de péage ; une activation antérieure de tarification automatique n’est pas relancée implicitement.

Le mode, les métriques, la carte et la provenance suivent la sélection. Le départ souhaité de la comparaison devient le départ de la préparation ; vide reste vide. Le véhicule reprend les hypothèses de consommation et de prix saisies, dans la session ; la marche reprend sa limite souhaitée. Aucun profil n’est écrit. Les préférences automobiles sont conservées lors du choix à pied.

Navigation, GPX, préparation sauvegardée et journal volontaire utilisent le trajet sélectionné. La comparaison et le nombre de personnes restent un brouillon de session : ils ne sont ni des passagers confirmés, ni un déplacement effectué, ni une nouvelle entrée du journal. Les sauvegardes conservent leur format 2 ; aucun nouveau format ou clé de stockage.

## Vérification

Contrôles du modèle : hypothèses bornées, heure inexistante/ambiguë, inconnus distincts de zéro, carburant du véhicule entier, total incomplet, tri stable sur valeurs affichées et échecs séparés. Scénarios navigateur : deux profils, choix sans nouvel appel, conservation du trajet initial, refus/acceptation du retrait d’arrêt, prix non transféré, sauvegarde et GPX du mode retenu, quota, service absent, profil caravane, double échec, annulation et réponse tardive, invalidation des hypothèses et changement de variante.

Les scénarios navigateur utilisent des réponses simulées ; les contrôles, captures, rapport GitHub et recette publiée avec lieux publics et services réels sont consignés séparément dans l’état de développement. Aucune validation de téléphone physique ou de terrain.

Cache de l’application : `shell-26`. Aucun abonnement, compte fournisseur ou nouvel hébergement ; aperçu GitHub uniquement.

## Périmètre restant

Comparer les arrivées estimées et une heure limite relève du lot suivant. Transports publics, vélo/VAE et tarifs complets demandent leurs propres sources. L’accessibilité de terrain et les restrictions caravane/poids lourd ne sont pas certifiées. Les formules pondérées ne sont pas activées par cette comparaison descriptive.
