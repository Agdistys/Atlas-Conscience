# V092 — Horaires des parcours à plusieurs arrêts

## Périmètre

Complément de [V088](OuQuandQui_API_V088_Arrets_Successifs_2026-11-22.md), [V090](OuQuandQui_API_V090_Budget_Arrets_2026-11-22.md) et [V091](OuQuandQui_API_V091_Trajet_Arrets_2026-11-23.md), pour ARR-06, CAL-05 et STA-10. Un parcours routier confirmé de deux ou trois stations, éventuellement accompagné d’une prise en charge et d’une dépose, peut recevoir un départ prévu et des pauses carburant. Les heures estimées sont consultables dans la préparation, sur les fiches des points de carte, dans la vue principale après adoption et dans les copies enregistrées.

## Saisie et confirmation

L’action « Préparer les horaires de ce parcours » ouvre un formulaire local. Le départ est facultatif, en heure de Paris, entre 2000 et 2099. Il n’est ni repris du trajet de référence ni rempli à l’ouverture. « Partir maintenant » copie explicitement l’heure courante à la minute ; cette valeur reste fixe. Une date passée reste identifiable comme estimation datée et ne se reporte pas automatiquement.

Chaque station possède une pause facultative de 0 à 1 440 minutes, décimales admises. Un champ vide signifie une durée inconnue ; zéro signifie aucune pause prévue. Un aperçu présente les arrivées avant et les départs après chaque pause. Une case et une confirmation distinctes appliquent les hypothèses à la préparation. Toute modification du formulaire invalide l’aperçu et son acceptation. Annuler conserve intégralement le dernier parcours confirmé.

L’opération réutilise les portions reçues : aucun nouvel appel de géocodage, routage, prix ou horaires de station. Elle ne modifie ni le parcours déjà adopté, ni le trajet de référence, ni les sauvegardes. Une nouvelle adoption est requise pour remplacer la vue principale ; un enregistrement explicite crée une nouvelle copie.

## Calcul et inconnus

Le départ local est résolu en un instant UTC. L’arrivée à une étape est cet instant augmenté de la somme des durées routières des portions précédentes et des seules pauses carburant précédentes. L’arrivée à une station précède sa propre pause. Le départ de cette station inclut sa pause. Aucun arrondi intermédiaire n’est appliqué ; les heures sont affichées à la minute. La durée totale d’un nouveau parcours horodaté utilise cette même somme des portions, même lorsque le total global du moteur diffère dans la tolérance de validation de deux secondes.

Sans départ, toutes les heures restent inconnues mais la durée peut être connue. Une pause inconnue conserve l’arrivée à sa station et rend inconnus son départ, toutes les arrivées suivantes et la durée totale avec pauses. Une pause nulle ne rompt pas la chaîne. Les temps d’embarquement et de dépose, attentes, autres pauses et effets du trafic ne sont pas estimés : cette exclusion accompagne les résultats. Les rencontres ne reçoivent pas de fausse durée d’arrêt.

Le passage de minuit, d’année et les changements d’heure sont calculés sur le temps écoulé, puis affichés en Europe/Paris. L’affichage comprend la date et le décalage UTC, pour distinguer les deux occurrences d’une heure d’automne. Un départ local inexistant au printemps ou ambigu en automne est refusé avec une explication. Le fuseau de l’appareil ne détermine pas le calcul.

## Stations et limites

Chaque arrivée reste une estimation de parcours. Les copies de stations du parcours ne contiennent pas une qualification complète des horaires d’ouverture : aucune station n’est déclarée ouverte sur la seule base d’une arrivée calculée. La mention « Ouverture à l’arrivée non vérifiée » accompagne les pauses. La consultation et la qualification des horaires des stations constituent un complément distinct.

## Budget, copies et reprise

La confirmation d’horaires retire le budget de la nouvelle préparation, après avertissement dans le formulaire. Il doit être examiné à nouveau. Les copies précédentes et le parcours déjà affiché conservent leur budget jusqu’à une adoption explicite d’une nouvelle version. Un budget créé après les horaires est lié à leur départ, fuseau, pauses, portions et autres hypothèses ; l’altération de cette liaison est refusée à l’import. Sa date tarifaire reste une déclaration distincte, sans déduction automatique à partir de l’heure de départ.

Le format de parcours 3 ajoute `timing` contenant exactement `departure` (date locale ou null) et `timeZone` (Europe/Paris), et un champ `budget` obligatoire (null ou budget validé). Les formats 1 et 2 restent lisibles sans migration ni écriture à la lecture. Une collection 3 peut contenir les trois formats ; elle ne régresse pas lors d’un import ancien ou d’un effacement. Un format futur, une collection incohérente ou une modification concurrente bloque l’écriture.

Une copie historique reste en lecture datée. Modifier exige une copie et un recalcul routier. Le départ passé est alors retiré de la nouvelle copie, avec indication explicite ; l’original reste intact. Un départ futur et les pauses sont conservés. Les copies ne sont jamais rajeunies à la lecture.

L’export JSON conserve les horaires et leurs hypothèses. Le GPX conserve le tracé et les points ordonnés sans inventer de dates de passage. Les liens de navigation ne transmettent pas les horaires ni les pauses. Aucun déplacement réel, arrivée effective ou dépense n’est inscrit automatiquement au journal.

## Critères d’Achèvement

Vérifier la chaîne d’arrivées et de pauses, les valeurs absentes et nulles, l’aperçu annulable, la nouvelle adoption distincte, la requalification du budget, les copies historiques et mixtes, les imports incohérents et les modifications concurrentes. Tester minuit, année, changements d’heure, départ ambigu et départ passé. Contrôler l’absence de nouvel appel de données lors de la préparation horaire, l’ordre des points et l’absence d’horaires de passage dans le GPX et les liens externes.

La validation exige les contrôles de modèle, les scénarios sur quatre formats Chromium, les parcours de compatibilité Firefox/WebKit, le clavier, le texte agrandi, la rotation et le repli sans carte. La publication est vérifiée sur le même commit, avec inspection complète réussie et lecture des ressources effectivement servies. Ces contrôles ne qualifient ni un téléphone physique, ni un lecteur d’écran, ni une application native de navigation, ni un trajet réellement effectué.
