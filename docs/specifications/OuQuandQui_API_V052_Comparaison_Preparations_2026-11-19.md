# OùQuandQui — Comparer deux préparations routières

V052 · 19 novembre 2026 · BOU-COMPARAISON-BUDGETS-01. Complète la lecture descriptive de BOU-02/03/09, PAR-05 et PEA-02/03/05/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [budget mémorisé V051](OuQuandQui_API_V051_Budget_Memorise_2026-11-19.md) et les [horaires V016](OuQuandQui_API_V016_Horaires_2026-11-18.md). Les éditions précédentes sont conservées.

## Parcours

Dans « Mes trajets préparés », rubrique « Route et marche », « Comparer deux préparations routières » devient disponible à partir de deux préparations automobiles chargées. Choisir explicitement A et B, puis « Afficher la comparaison ». Deux copies portant le même identifiant ne sont pas comparables. Les préparations à pied et les autres familles gardent leurs interfaces propres.

Les deux cartes présentent lieux, date du calcul, moteur, date de sauvegarde, distance, conduite, pause à la station, durée avec cette pause, départ et heure limite, arrivée estimée, véhicule/gabarit, carburant, consommation, prix de référence, carburant consommé, péages, total historique, arrêt, rencontres, évitements et critère de calcul. Chaque carte possède un volet des sources et hypothèses conservées et une action de reprise.

Sur ordinateur les cartes sont côte à côte ; sur petit écran elles se suivent. Les sélecteurs et actions restent utilisables au clavier. Le résultat reçoit le focus après l’action explicite. Fermer le comparateur, changer de rubrique ou fermer Mes trajets retire les résultats et les sélections. Modifier un choix retire immédiatement le résultat, sans nouveau calcul routier.

## Un périmètre historique explicite

Les montants concernent le véhicule entier. Aucun nombre de voyageurs, partage de frais ou affectation de péage n’est déduit des préparations. Stationnement, ferries et autres frais sont exclus. Le plein acheté ne s’ajoute pas au carburant consommé. Ce comparateur ne fournit ni score global, ni tri par coût actuel, ni « meilleur trajet », ni comparaison complète entre modes.

Les données mémorisées ne sont pas rafraîchies implicitement. Leur date et leur provenance restent visibles ; un fichier importé reste déclaratif. La comparaison de deux souvenirs ne confirme ni leur validité actuelle, ni leur passage effectif aux péages, ni le terrain ou la qualification d’une caravane/poids lourd.

## Écarts B moins A

Les distances et durées sont comparées seulement si les coordonnées de départ/arrivée et le type/gabarit du véhicule concordent exactement. Les libellés seuls ne suffisent pas. Les valeurs individuelles restent lisibles lorsque cette condition manque.

La conduite et la pause sont séparées. Sans arrêt mémorisé, aucune pause n’est ajoutée. Avec arrêt et durée de pause inconnue, la conduite reste connue mais le total conduite + pause, l’arrivée complète et leur écart restent inconnus. Une pause explicitement nulle reste zéro. Les autres pauses et le trafic ne sont pas estimés. L’arrivée est calculée sur les secondes originales ; l’heure limite reste informative, sans classement des solutions admissibles.

Un écart monétaire n’est affiché que si les deux budgets carburant + péages sont complets pour ce périmètre et reposent sur des hypothèses conservées concordantes : lieux, type/gabarit, carburant, consommation, prix de référence, départ daté et rencontres. Les dates de constitution des budgets doivent être identiques en heure de Paris ; les heures exactes restent visibles dans leurs sources. Un tarif global dont la classe/période ne sont pas documentées ne permet pas cet écart.

Les classes de péage doivent être uniques et concordantes lorsqu’elles sont présentes. Chaque date tarifaire doit correspondre au jour de départ et à la période de la source mémorisée ; le souvenir ne doit pas avoir été constitué après sa limite de consultation. Une absence de péage confirmée à cette date est distincte d’une somme partielle ou d’une donnée absente. La consultation actuelle n’étend jamais la validité d’un ancien tarif.

Les évitements hors péages doivent concorder. Une différence de consigne sur les péages reste visible et ne signifie pas absence de péage. Les critères de calcul et les arrêts peuvent différer : ces différences sont indiquées, leurs distances et détours étant déjà inclus dans les instantanés. Les différences d’heure limite restent visibles. Cette fonction ne calcule pas automatiquement une route avec/sans péage et ne couvre donc pas à elle seule toute l’exigence PEA-03.

Les écarts utilisent les mêmes arrondis que les valeurs présentées : 0,1 km, 0,1 minute et 0,01 €. Deux valeurs identiques à cette précision restent une égalité. Inverser A et B inverse le signe sans changer les données. Un prix manquant ne devient jamais zéro ; un budget incomplet n’est pas classé devant un budget complet. Les motifs de non-comparabilité sont affichés, tandis que les montants d’origine restent consultables.

## Stockage et reprise

La comparaison reste en mémoire de la page. Aucun format, clé de stockage ou contenu exporté n’est ajouté ; le format 11 et ses originaux 1–10 restent inchangés. Comparer n’écrit ni préparation, ni profil, ni journal et ne déclenche aucune requête de données ou d’itinéraire. Ouvrir volontairement un lien source demeure une navigation externe distincte.

Renommage, suppression et restauration par import retirent la comparaison. Avant comparaison et reprise, les onze copies route/marche sont recontrôlées contre celles chargées. Une modification externe, y compris d’une ancienne édition, ou un stockage devenu inaccessible retire le résultat et demande le rechargement de la page. Les brouillons ne sont ni effacés ni remplacés automatiquement. Les changements d’un autre environnement d’aperçu n’invalident pas cette liste.

« Préparer à nouveau A/B » utilise la reprise V051 : confirmation avant remplacement d’un trajet présent, conservation intégrale en cas de refus, chargement des paramètres puis nouveau calcul volontaire. Le budget courant est effacé, les anciens tarifs restent historiques. Aucun tracé, tarif ou déplacement effectué n’est adopté automatiquement. Une modification silencieuse des choix est recontrôlée avant cette action.

## Vérifications et limites

Contrôles du modèle : inconnus/zéro/partiel/complet, coûts consommés, dates/classes/périodes, gabarits, lieux aux noms semblables, rencontres, pauses, arrondis/égalités, inversion, anciens formats et données malformées. Parcours navigateur : choix, lecture des sources, textes hostiles, invalidation, concurrence, import, refus et acceptation de reprise, clavier et affichage ordinateur/mobile. Les simulations, consultations de services réels et contrôles GitHub sont consignés séparément dans l’état du chantier.

Aucun nouvel abonnement, compte fournisseur, appel payant, hébergement ou fusion sur le site principal. Pas de synchronisation, validation de téléphone physique, preuve de trajet réel ou couverture nationale nouvelle.
