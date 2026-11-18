# OùQuandQui — V025 · Fraîcheur des prix des stations

18 novembre 2026 · STA-FRAICHEUR-01 · Complément du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), section 23 / DEC-10 ; STA-04/09, FIC-01/06/07, CAL-08/09/10. Les éditions précédentes restent conservées.

## Comportement

La recherche conserve les accès routiers calculés et les numéros des stations. Le groupe présenté par défaut ne compare que les prix déclarés depuis sept jours ou moins. Trois vues explicites distinguent les prix utilisables pour la comparaison, les prix anciens et les dates non vérifiables. Les filtres de détour, services, horaires et autonomie se cumulent dans chaque vue ; la carte affiche le même groupe et conserve séparément un arrêt déjà choisi.

| Âge de la déclaration du carburant choisi | Affichage | Classement et reprise dans le budget |
|---|---|---|
| De 0 à 48 heures incluses | Prix récent ; date précise | Admis |
| Plus de 48 heures, jusqu’à 168 heures incluses | Avertissement « prix à vérifier » ; date précise | Admis avec avertissement |
| Plus de 168 heures | Prix ancien ; consultation séparée | Exclu |
| Date absente, invalide, future, ou horloge antérieure à la réception | Non vérifiable ; motif explicite | Exclu |

Ces seuils sont une règle de l’application, pas une garantie du fournisseur. Les prix anciens/non vérifiables sont affichés comme valeurs déclarées ; ils n’obtiennent aucun badge OPTIMAL/POMPE/RAPIDE, aucun coût d’achat/détour recommandé, ni tri monétaire. Leur consultation reste ordonnée par distance routière depuis le départ. Le groupe récent conserve ses tris et égalités. La réinitialisation des filtres revient au groupe récent, sans nouvel appel réseau.

Un arrêt ancien ou non vérifiable peut être adopté après confirmation explicite, uniquement comme étape routière. Sa position et ses services restent consultables ; son prix est exclu du budget. La fraîcheur est contrôlée après le calcul de l’accès, y compris lorsque le prix dépasse la limite pendant l’attente. L’annulation conserve le trajet précédent.

## Dates et prix de référence

La date utilisée est exclusivement le champ `<carburant>_maj`, conservé tel que reçu. La date de réception ne le remplace jamais. Un horodatage complet, avec secondes et fuseau explicite, est requis ; les dates de calendrier impossibles, heures invalides, fuseaux absents et décalages inconnus sont rejetés. L’affichage civil indique le fuseau de Paris, y compris ses changements saisonniers. Un recul de l’horloge avant la réception rend le prix non vérifiable.

Une reprise volontaire du prix de l’arrêt conserve en session son carburant, sa déclaration et sa réception. Les calculs du budget et du partage de frais contrôlent encore cette provenance. Si le prix expire, il est retiré ; la quantité de carburant estimée et l’arrêt routier restent disponibles. Un retour de l’horloge ne le réintroduit pas automatiquement. Une saisie personnelle reste une hypothèse explicitement saisie, distincte d’un prix officiel contrôlé.

Un contrôle local a lieu à la reprise de visibilité/focus et chaque minute lorsque l’application est disponible. Les actions de sélection et de reprise de prix vérifient directement la date, sans attendre ce contrôle. Aucun rafraîchissement réseau silencieux ni suivi GPS n’est ajouté. Une nouvelle recherche demeure une action explicite. L’horloge de l’appareil reste nécessaire ; aucune heure serveur certifiée n’est promise.

## Fiches, favoris et indisponibilités

La fiche distingue date du prix et réception des informations. Les horaires gardent leur statut déclaratif défini dans [V011](OuQuandQui_API_V011_Horaires_Stations_2026-11-18.md) : la date du prix ne date pas les horaires. Les favoris enregistrent l’identité et la position, jamais un prix à réutiliser. Une fiche favorite hors des résultats courants est relue auprès de la source. Une réponse tardive ne peut remplacer une autre fiche ; une rupture, une absence de prix ou une panne n’entraîne aucun prix de secours. Dans les résultats courants, la fiche utilise le même instantané que la comparaison, daté et requalifié localement.

Le changement de carburant retire les résultats et le prix de référence associés. Les ruptures déclarées et les prix absents/hors plage restent exclus en amont, conformément au comportement existant. Ce lot ne transforme pas ces stations en offres disponibles.

## Qualification de la source

Source inchangée : [DGCCRF, flux instantané v2](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/). Le schéma consulté identifie `e10_maj` et `gazole_maj` comme dates de mise à jour propres à chaque carburant, de type `datetime`. Un [échantillon borné de 100 enregistrements](../../data/station-freshness/qualification-2026-11-18.json) conserve la date de consultation, l’URL, le schéma pertinent et les champs publics nécessaires. Aucun trajet personnel, compte, clé ou fournisseur supplémentaire.

Les dates réelles reçues portent un décalage explicite. Leur qualification de forme ne prouve ni une mise à jour effective sur place, ni la disponibilité du carburant. La recherche conserve sa couverture partielle et sa limite de candidates : le filtre de fraîcheur ne déclenche pas d’élargissement automatique. Un résultat vide ne prouve pas l’absence de station récente hors de l’échantillon.

## Vérification et limites

Six contrôles du modèle couvrent les seuils à la milliseconde, fuseaux, calendrier, date absente/future, recul de l’horloge, réception distincte et échantillon réel. Huit scénarios navigateur couvrent les vues/carte/badges, filtres cumulés, arrêt ancien, budget expiré, réponse de routage tardive, carburant/rupture, favoris indisponibles et concurrence entre fiches. Les scénarios sont exécutables sur les quatre formats habituels ; le rapport d’inspection du commit indique l’exécution effective.

Les contrôles simulés restent distincts de la recette publiée avec DGCCRF et routage réels entre lieux publics, consignée dans les preuves locales du lot. Aucun trajet effectué, prix payé, téléphone physique ou garantie d’ouverture n’est attesté. Les autres limitations — péages nationaux, caravanes/poids lourds et transports non raccordés — restent celles des éditions précédentes.
