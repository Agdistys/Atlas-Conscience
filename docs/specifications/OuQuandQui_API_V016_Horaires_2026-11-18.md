# OùQuandQui — Arrivées estimées et heure limite

V016 · 18 novembre 2026 · BOU-HORAIRES-01. Complément de PAR-06 et BOU-01/02 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), de la [comparaison V015](OuQuandQui_API_V015_Comparaison_2026-11-18.md) et des [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md). Les éditions précédentes sont conservées.

## Préparation temporelle

« Horaires du trajet », visible avant le calcul, regroupe le départ en heure de Paris, une heure limite facultative et la préférence de filtre pour la comparaison. Le départ de session prérempli reste modifiable ; le bouton « Partir maintenant » l’actualise explicitement. Un départ effacé ne devient jamais l’heure actuelle. Ce départ sert également aux horaires des stations et au brouillon de covoiturage, pour éviter des horloges contradictoires.

Après calcul, l’arrivée estimée du trajet affiché utilise sa durée effective : itinéraire choisi, ou détour routier par la station sélectionnée. Le temps du plein, les pauses et le trafic en direct ne sont pas inclus. Les horaires ne sont pas transmis aux moteurs routiers, qui fournissent des durées statiques. Aucune garantie d’arrivée, d’ouverture des stations ou d’accessibilité du terrain.

## Comparaison et filtre

Les deux modes existants, véhicule léger et marche, reprennent les mêmes lieux et le même départ. Une heure limite commune peut être saisie. L’arrivée de chaque mode vaut `départ_UTC_ms + durée_secondes × 1000` ; la compatibilité est évaluée sur la valeur exacte avant arrondi d’affichage. Une arrivée exactement à la limite est compatible selon cette estimation.

Quatre états sont conservés : arrivée estimée sans contrainte, compatibilité estimée, retard estimé, arrivée inconnue. Un départ ou une durée absent n’est pas admissible au filtre. Une erreur du moteur reste un résultat indisponible, distinct de l’absence de compatibilité. Le filtrage n’invente pas une solution et ne sélectionne aucun mode automatiquement.

Le filtre masque les trajets tardifs ou inconnus du groupe admissible, mais les conserve dans « Consulter les trajets écartés par l’heure limite ». Leurs valeurs et motifs restent lisibles ; leur bouton de sélection est indisponible tant que le filtre est actif. Désactiver le filtre les rend à nouveau sélectionnables, sans nouvel appel réseau. Le trajet déjà affiché reste consultable même lorsqu’il ne satisfait pas le nouveau filtre.

Modifier une hypothèse de date ou de durée retire le groupe calculé avant une nouvelle comparaison. Le filtre est une commande de présentation réversible sur ce groupe figé ; il ne recalcule pas les routes. Sélectionner un trajet copie son départ, sa limite et l’état du filtre dans la préparation courante, sans nouvel appel et sans écriture dans le profil ou le journal.

## Validation des dates

Saisie limitée aux années 2000–2099, en heure de Paris. Dates civiles invalides, heures inexistantes au passage à l’heure d’été et heures doubles au retour à l’heure d’hiver sont refusées. Il faut choisir une heure non ambiguë. Une limite antérieure au départ est refusée ; le filtre exige une limite. Une limite seule est permise, mais la compatibilité reste inconnue sans départ.

L’addition des durées porte sur des instants UTC ; l’affichage revient ensuite en heure de Paris. Passage de minuit et changements d’heure ne sont pas calculés en ajoutant des heures civiles. Un départ passé reste identifiable comme tel et doit être actualisé pour un déplacement futur.

## Préparations au format 3

Chaque préparation ajoute `timing: {departure, arriveBy, onlyBefore}`. Les dates sont des chaînes locales Paris `YYYY-MM-DDTHH:mm` ou `null` ; le filtre est un booléen. La date automobile historique dans `preferences.departure` est conservée pour la continuité du format, avec obligation de concordance. Les modes automobile et marche conservent désormais les mêmes hypothèses temporelles. Le groupe de voyageurs et les résultats de comparaison restent en session.

- Nouvelle clé locale `dragonroute.prepared.v3.<environnement>`. Les originaux v2 et v1 restent conservés, exportables séparément, sans réécriture automatique. Aucune migration n’écrit avant une action explicite d’enregistrement, renommage, suppression ou import.
- Lecture prioritaire v3, sinon v2, sinon v1. Une édition plus ancienne n’est pas utilisée pour contourner un format courant invalide. Formats futurs ou données incohérentes : blocage conservatoire, sans écrasement.
- Migration v1/v2 : départ automobile historique repris ; départ piéton, heure limite et filtre inconnus/non demandés. Aucun champ étranger à ces anciens formats n’est promu en hypothèse nouvelle.
- À la reprise, un départ passé ou absent entraîne une nouvelle saisie du départ et de sa limite ; le filtre est désactivé. L’instantané original reste intact et consultable. Aucune date n’est déplacée silencieusement au jour courant.
- Les écritures et l’effacement contrôlent les trois clés contre une modification dans un autre onglet ou une ancienne édition de l’application. Une divergence bloque l’opération et demande un rechargement. Pas de fusion implicite entre éditions.
- Export, import vérifiable avec confirmation, limites de 20 préparations / 2 Mo et séparation public/aperçus inchangés. L’effacement explicite porte sur les trois éditions de préparations du même environnement, sans toucher profil, journal ou autres aperçus.

## Recette et limites

Contrôles du modèle : frontière exacte, zéro connu et inconnus, valeurs non finies, date antérieure, calendrier, changements d’heure, passage de minuit, migration et reprise sans modification de l’original. Scénarios navigateur : un/aucun trajet admissible, exclus consultables, filtre sans requête, dates incohérentes sans appel, invalidation du groupe, sauvegarde/export/reprise à pied, migration v2 et conflit entre éditions, détour de station inclus dans la durée.

Les tests simulés, le rapport CI et la recette de l’aperçu avec services réels sont consignés séparément dans l’état de développement. Les contrôles d’accessibilité automatiques ne constituent pas une qualification complète. Aucun téléphone physique ou déplacement réel testé.

Cache de l’application : `shell-27`. Aucun fournisseur, compte, hébergement ou appel payant ajouté. Les tests navigateur ont une limite de 15 minutes ; le travail CI dispose de 25 minutes incluant installation et archivage. Ce lot ne livre ni transport public, ni score pondéré, ni qualification d’accessibilité (BOU-06).
