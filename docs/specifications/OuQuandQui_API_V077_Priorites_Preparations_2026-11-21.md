# V077 — Priorités des préparations historiques

BOU-PREFERENCES-PREPARATIONS-01 · 21 novembre 2026. Complète les exigences BOU-01/02/03/07/08/09 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [comparaison de préparations V052](OuQuandQui_API_V052_Comparaison_Preparations_2026-11-19.md) et la [pondération routière V076](OuQuandQui_API_V076_Priorites_2026-11-21.md). Les éditions et fonctions précédentes sont conservées.

## Usage volontaire

Dans Mes trajets préparés, sélectionner deux préparations routières et afficher leur comparaison. « Comparer selon mes priorités » ouvre ensuite un panneau distinct. Les cartes A/B, leurs sources, les écarts bruts et les actions de reprise restent accessibles. Les poids durée et budget commencent à zéro. Aucun indice, voyageur commun ou prix actuel n’est présumé.

Une confirmation explicite indique que les deux préparations concernent le même groupe de voyageurs. Elle ne renseigne aucun nombre de personnes et ne calcule aucune part individuelle. Les valeurs concernent le véhicule entier. Une confirmation absente laisse les références visibles mais interdit le classement.

Les poids, entiers de 0 à 10, représentent une préférence relative. Zéro ignore ce critère pour tout le groupe ; il ne signifie ni durée nulle ni dépense nulle. Aucun prix du temps en euros par heure n’est demandé. « Figer les préparations et appliquer » copie les données validées et les hypothèses présentes. Les poids peuvent ensuite varier sur cette copie datée, sans requête fournisseur.

## Groupe comparable

Les coordonnées de départ et d’arrivée, le type/gabarit du véhicule, le carburant, le départ daté et son heure, l’heure limite et son caractère impératif, les exclusions hors péages et les rencontres de covoiturage doivent correspondre. Des noms similaires ne suffisent pas. Une différence concernant les péages peut être comparée lorsque les budgets respectent les autres conditions ; une consigne d’évitement ne prouve jamais l’absence de péage.

Le même groupe de voyageurs est déclaré pour cette consultation ; aucune occupation ne provient automatiquement d’un profil ou d’une préparation. Les arrêts carburant et les critères de calcul peuvent différer, avec leurs détours et pauses conservés. Le panneau ne certifie ni capacité du véhicule, ni praticabilité d’un attelage, ni passage réel aux péages.

La durée couvre la conduite et la pause déclarée à la station. Sans arrêt mémorisé, aucune pause n’est ajoutée. Avec arrêt et pause inconnue, la durée totale reste inconnue ; une pause explicitement nulle reste zéro. Trafic, autres pauses et autres temps restent hors périmètre.

Une heure limite impérative s’applique avant toute pondération. Une arrivée trop tardive ou impossible à estimer ne devient pas admissible grâce à un faible coût. Le calcul de cette contrainte conserve les secondes d’origine, avant arrondi. Si les contraintes des deux préparations diffèrent, le contexte est non comparable et aucun indice n’est produit.

## Budget historique, périmètre limité

Le montant pondéré est le carburant consommé estimé plus les péages mémorisés. Le plein acheté ne s’y ajoute pas. Stationnement, ferries et autres frais sont exclus : ce montant n’est pas un coût total de voyage. Le panneau le nomme « Budget historique carburant + péages ».

Les règles V052 restent requises : deux budgets complets pour ce périmètre, même consommation et prix de référence, même date de constitution en heure de Paris, mêmes lieux, départ, gabarit, rencontres et exclusions pertinentes ; classes de péage uniques et concordantes, dates tarifaires correspondant au départ et aux périodes des sources. Un tarif global sans classe/période vérifiable ne suffit pas. Une absence de péage confirmée à cette date est distincte d’une somme partielle ou absente.

Si le couple ne satisfait pas ces règles, le budget n’est comparable pour aucune des deux options dans cet indice. Les montants individuels demeurent lisibles, avec leurs dates, sources et motifs de non-comparabilité. Mettre le poids budgétaire à zéro permet une comparaison de durée uniquement si le contexte commun est valide. Aucun poids n’est redistribué différemment par option.

Les anciennes préparations sans budget restent sans budget. Une importation reste déclarative, même si son format est accepté. Aucun tarif n’est rafraîchi, aucune validité prolongée et aucun montant actuel déduit de ce souvenir. La comparaison économique automatique des routes avec/sans péage et la couverture nationale restent distinctes.

## Formule et résultats

La formule facultative `ami-minmax-v1-proposition` est celle de V076, présentée comme proposition en essai. Pour chaque critère actif, normalisation `(valeur − minimum) / (maximum − minimum)`, ou zéro si toutes les valeurs sont égales. Indice sur 100 : somme des contributions pondérées divisée par la somme des poids. Plus petit signifie plus proche des préférences dans ce groupe seulement.

Les valeurs utilisées suivent la précision de V052 : 0,1 minute et 0,01 €. Les bornes sont communes aux options admissibles et complètes pour tous les critères actifs. Chaque contribution expose valeur, minimum, maximum, poids et points. L’indice est affiché au dixième ; une égalité visible conserve le même rang. L’ordre secondaire stabilise la lecture sans annoncer une supériorité supplémentaire.

Tous les poids nuls donnent une vue sans indice. Un contexte non comparable, un critère actif inconnu ou moins de deux options admissibles et complètes empêchent la recommandation. Deux préparations distinctes avec des valeurs égales restent des références historiques séparées et ex æquo ; la même identité ne peut être sélectionnée deux fois. Les indices ne se comparent pas entre recherches.

L’empreinte carbone n’est pas pondérée dans ce panneau : aucun facteur n’est injecté dans les souvenirs. Aucun score de sécurité, d’éthique, de liberté, de vie privée ou d’accessibilité n’est ajouté.

## Invalidation et données personnelles

Changer la confirmation des voyageurs retire les indices et exige une actualisation volontaire, même après rétablissement du choix précédent. Les poids seuls recalculent sur le groupe figé. Changer une sélection A/B, renommer, supprimer, importer une liste, changer d’onglet ou fermer le comparateur retire les résultats. Réouvrir commence sans poids ni confirmation.

Les copies locales des onze formats route/marche sont relues avant chaque action de pondération. Une modification externe, même silencieuse, ou un stockage devenu inaccessible bloque le recalcul et demande le rechargement sans effacer les brouillons. Un changement des sélections sans événement est également relu. Les autres environnements d’aperçu restent distincts.

La consultation ne modifie aucune préparation, profil, journal, clé ou format de stockage. Les poids et indices ne sont pas exportés implicitement. La version de formule et les hypothèses accompagnent le résultat affiché. Reprendre A/B reste une action séparée, avec les confirmations existantes et un nouveau calcul volontaire ; aucune préparation n’est adoptée par le score.

## Vérification et limites

Les contrôles du modèle couvrent budgets et contributions, voyageurs non confirmés, contexte incompatible, heure limite, inconnus et pauses, sources monétaires divergentes, égalités, copies figées et anciens formats. Les parcours navigateur couvrent les réglages, la remise à zéro, la fermeture, les changements de sélection et de stockage, l’import, la reprise, le clavier et les petits écrans avec texte agrandi.

La recette publiée distingue les itinéraires obtenus des services réels, comparés sans montant inventé, et des témoins synthétiques importés pour vérifier l’arbitrage durée/budget. Les témoins ne constituent ni une grille tarifaire réelle ni une preuve de voyage. Les preuves du commit, de la publication, des moteurs de navigateur et des ressources publiées figurent dans le suivi du chantier. Aucun appareil physique, lecteur d’écran ou terrain qualifié par ces contrôles.

Aucun nouveau fournisseur, compte, abonnement, appel payant, hébergement ou fusion sur le site principal. Les limites du [bilan V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md) restent applicables.
