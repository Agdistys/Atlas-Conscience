# V076 — Comparer selon des priorités mesurables

BOU-PREFERENCES-MESURABLES-01 · 21 novembre 2026. Complète BOU-01/02/03/07/08/09 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md) dans le périmètre des [choix routiers V054](OuQuandQui_API_V054_Choix_Routiers_2026-11-20.md). Les autres comparateurs, les [allocations V064](OuQuandQui_API_V064_Groupes_2026-11-20.md), les exigences et les éditions précédentes sont conservés.

## Un parcours volontaire

Après « Calculer les deux choix », « Comparer selon mes priorités » ouvre un panneau dans le comparateur routier. Son ouverture ne calcule ni itinéraire ni indice et ne choisit aucun trajet. Les poids commencent à zéro, le modèle carbone reste vide. Les cartes, valeurs brutes, tris durée/distance et actions d’adoption restent disponibles indépendamment du panneau.

Les poids sont des entiers de 0 à 10. Zéro ignore le critère pour toutes les options ; un nombre positif exprime son importance relative. Il ne s’agit pas d’un prix du temps en euros par heure. « Figer les options et appliquer » prend une copie datée des résultats et hypothèses présents. Les changements de poids recalculent ensuite localement sur cette copie. « Remettre les poids à zéro » retire la pondération ; « Retirer la pondération » ferme le panneau et revient à sa commande d’accès.

La formule du cahier V5 est mise à disposition comme **proposition facultative dans la version d’essai**. Son implémentation et ses vérifications ne constituent pas une approbation d’un barème universel ou une validation scientifique. Aucun score de sécurité, d’éthique, de vie privée, de liberté ou d’accessibilité n’est ajouté.

## Groupe et unités

Les deux résultats proviennent des lieux confirmés, du même départ daté, du même véhicule et des mêmes exclusions. La comparaison suppose le même groupe de voyageurs sur ces deux routes et porte sur le véhicule entier, sans division par personne, nombre d’occupants supposé ni qualification de capacité. Elle concerne des trajets directs, sans rencontre, arrêt carburant ou pause. Les moteurs et leurs réseaux peuvent différer ; leurs noms et dates restent dans les cartes d’origine.

La durée utilisée est la conduite estimée, en minutes, calculée sur les secondes reçues. Le panneau des priorités la présente au dixième ; les cartes routières gardent leurs minutes arrondies au supérieur. Les valeurs non arrondies servent à la formule. La date peut être historique : figer une comparaison ne rend ni une ancienne estimation actuelle ni une arrivée garantie. Un départ absent interdit l’indice comparatif.

L’empreinte exige un modèle automobile choisi explicitement, compatible avec le carburant. Les deux routes utilisent ce même facteur du catalogue conservé `impactco2-2026-11-18-bece7af` : kilomètres × (construction + énergie), en kg CO₂e pour le véhicule entier. La source, la version, les unités et un exemple de calcul nommé restent accessibles. Aucun ajustement selon le chargement, la consommation réelle ou la météo ; infrastructures et alimentation humaine restent hors périmètre. Aucun modèle n’est substitué pour un carburant ou véhicule non qualifié.

Le coût total n’est pas disponible dans ce comparateur : péages, stationnement et autres frais sont inconnus. Son poids est donc désactivé, à zéro, avec une explication. Le coût carburant existant demeure un montant partiel ; il n’est pas transformé en budget total. La pondération de budgets historiques complets du comparateur V052, le coût actuel entre modes et la comparaison économique avec/sans péage restent des travaux distincts.

## Contraintes, inconnus et copies identiques

L’heure limite impérative est appliquée avant la pondération. Un résultat hors limite est conservé comme référence exclue, sans indice ; aucune bonne valeur carbone ne le rend admissible. Une panne reste une option indisponible. Les options sans valeur ou périmètre compatible pour un critère actif restent « comparaison incomplète », sans transformation d’une absence en zéro et sans poids renormalisés différemment pour chaque option.

Un modèle manquant avec un poids carbone positif empêche l’indice. La correction consiste à choisir un modèle compatible puis actualiser le groupe, ou à mettre le poids carbone à zéro pour l’ensemble du groupe. Une saisie de poids vide, négative, non entière ou supérieure à dix retire les indices jusqu’à correction. Les valeurs brutes restent consultables dans les cartes routières.

Deux réponses avec géométrie, distance et durée identiques donnent une seule option portant les deux critères. La même géométrie avec des métriques différentes garde deux estimations explicitement nommées comme telles. Il faut au moins deux options admissibles et complètes pour les critères actifs. Une réponse unique, deux copies identiques ou un groupe dont une seule option reste admissible ne reçoivent pas un vainqueur artificiel.

## Formule et explication

Le résultat porte la version `ami-minmax-v1-proposition`. Pour chaque critère actif à minimiser, la valeur normalisée est `(x − minimum) / (maximum − minimum)`. Si minimum et maximum sont égaux, elle vaut zéro. L’indice est `100 × somme(poids × valeur normalisée) / somme(poids)` ; plus petit signifie plus proche de ces priorités dans ce groupe uniquement.

Les bornes sont communes aux options admissibles possédant tous les critères actifs. Les références exclues, indisponibles ou incomplètes n’y participent pas. Chaque ligne expose sa valeur, les bornes, le poids et sa contribution en points. Les contributions sont affichées au centième, l’indice au dixième ; les calculs restent non arrondis jusqu’à leur présentation.

Les indices égaux au dixième restent ex æquo et partagent le même rang. Durée, coût connu puis identifiant servent uniquement à stabiliser l’ordre de lecture. Toutes les valeurs égales produisent des indices nuls ex æquo. Tous les poids nuls donnent une vue sans indice. Aucun score comparable entre deux groupes ou deux recherches n’est promis.

## Actualisation et durée de vie

Les options et hypothèses sont figées pendant l’ajustement des poids. Un changement de modèle ou de filtre horaire retire les indices et exige « Actualiser le groupe et appliquer », même après retour au réglage précédent. Le tri des cartes brutes ne modifie pas le groupe figé. Une modification silencieuse des champs est relue à l’action suivante ; elle ne permet pas de réutiliser un ancien résultat sous un nouveau contexte.

Une nouvelle comparaison, une modification des lieux ou hypothèses, une adoption et la fermeture du comparateur retirent le panneau. Réouvrir commence avec des poids nuls et sans modèle. Le choix d’une route reste l’action explicite du comparateur existant, avec ses confirmations lorsqu’il remplace des arrêts ou rencontres. Aucune sélection n’est déclenchée par le score.

Les poids, modèle et indices restent en mémoire de consultation. La version de formule accompagne le résultat et son explication ; elle n’est pas ajoutée implicitement aux préparations, au profil, au journal ou à leurs exports. Aucun format, clé de stockage, transfert de modèle entre panneaux ou déclaration de déplacement n’est créé.

## Vérification et limites

Les contrôles numériques couvrent contributions, bornes communes, inconnus et zéros, unités, contraintes, absence de date, copies, groupe trop petit, égalités visibles, poids invalides, version de formule et absence de mutation. Les parcours navigateur couvrent l’usage volontaire, les variations de poids, les modèles et filtres modifiés, les erreurs, les carburants sans facteur, les pannes, les changements silencieux, les tris bruts, la fermeture, l’adoption, le clavier et le texte doublé en paysage. Les contrôles surveillent l’absence d’appel fournisseur et d’écriture personnelle pendant la consultation.

La recette réelle porte sur des lieux publics et des modèles choisis comme hypothèses, sans observation du véhicule. Les preuves du commit, des trois moteurs de navigateur, de la publication et des formats contrôlés sont consignées dans le suivi. Aucune qualification de téléphone physique, de lecteur d’écran ou de terrain. Le score reste borné aux choix routiers reçus ; la Boussole globale entre modes, les budgets complets, la mémorisation volontaire et les barèmes non numériques restent distincts.

Aucun nouveau fournisseur, compte, abonnement, appel payant, hébergement ou fusion sur le site principal. Les limites du [bilan V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md) sur véhicules, tarifs et couverture restent applicables.
