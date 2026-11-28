# V065 — Préparer le trajet retour

TRA-RETOUR-01 · 20 novembre 2026. Complète E01, GEO-01/02/04/07, TRA-01 et PEA-01/02/06 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [point GPS V047](OuQuandQui_API_V047_Origine_Ponctuelle_2026-11-19.md), l’[annulation V057](OuQuandQui_API_V057_Annulation_Trajet_2026-11-20.md) et les [saisies V058](OuQuandQui_API_V058_Validation_Trajet_2026-11-20.md). Éditions précédentes conservées.

## Inversion volontaire des lieux

« Inverser départ et arrivée », sous les deux champs, échange leurs valeurs et prépare un nouveau calcul. La commande fonctionne au clavier et avec des champs vides ou partiels. Les erreurs déjà affichées sont réaffectées au champ concerné ; aucune adresse manquante n’est inventée. Le focus reste sur la commande, permettant une seconde inversion.

L’action ne déclenche ni recherche d’adresse, ni calcul de trajet, ni géolocalisation, ni sauvegarde. « Trouver mon trajet » reste nécessaire. Le bouton est indisponible pendant une opération qui verrouille la préparation ; il faut terminer ou annuler cette opération avant d’inverser. La garde interne refuse également une activation synthétique pendant le verrouillage. Une ancienne réponse après annulation ne remplace pas le retour.

## Points confirmés et provenance

Les coordonnées d’un lieu confirmé sont transférées seulement si le libellé associé correspond encore à la saisie courante. Cela inclut les adresses favorites, les points d’une préparation reprise et les lieux effectivement résolus. Une modification manuelle détache le point ; une modification silencieuse est vérifiée à l’inversion. Les lieux non résolus ou ambigus restent à rechercher et à choisir explicitement.

Une nouvelle tentative de résolution retire l’ancienne liaison du champ avant le géocodage, après les accès directs aux points fixes et favoris. Un échec ou l’annulation d’un nouveau choix ambigu ne permet donc pas de récupérer discrètement une ancienne sélection. Une résolution réussie avant l’annulation d’une étape ultérieure reste confirmée.

Un lieu IGN confirmé conserve sa provenance et sa date lorsque la personne le copie ensuite volontairement dans une adresse favorite. Aucun point GPS ou point sans provenance IGN n’est réétiqueté IGN.

Un point GPS adopté devient un **point historique fixe**, avec date d’observation, précision annoncée et coordonnées. Les coordonnées de calcul gardent leur précision originale ; seul le libellé est arrondi à cinq décimales. Une seconde inversion conserve ce point daté, sans réactiver « Ma position » ni effectuer une nouvelle mesure. La fraîcheur exigée lors de l’adoption initiale ne transforme pas ce point historique en position actuelle.

Un libellé GPS saisi sans point adopté ne devient pas une adresse d’arrivée envoyée au géocodeur. Il exige une adresse fixe ou un point confirmé. Une proposition GPS non adoptée est abandonnée si l’inversion intervient ; son callback tardif reste sans effet.

## Nouveau contexte de déplacement

L’inversion retire le trajet calculé, variantes, arrêts, rencontres en cours, budgets et hypothèses carbone attachés à l’aller, ainsi que les résultats dépendants des panneaux collectifs et vélo. Les rappels de préparation sont détachés. Les préparations enregistrées, profils, véhicules, adresses, stations favorites et journaux restent conservés.

Le départ prévu, l’heure limite, son filtre et l’autonomie sont remis à renseigner : ils ne décrivent pas automatiquement le retour. Les critères du véhicule, exclusions, consommation, carburant et préférences de recherche restent ceux du formulaire. Aucune compatibilité supplémentaire du véhicule ou des exclusions n’est acquise.

Le nouveau calcul utilise les lieux dans le nouveau sens et le moteur correspondant au mode choisi. Il ne renverse pas simplement une géométrie existante et ne double ni les kilomètres, ni les durées, ni les péages. Cette commande prépare un aller simple inversé ; elle ne crée pas un budget cumulé aller-retour.

## Recette et limites

Scénarios automatisés : champs partiels/vides, clavier, erreurs accessibles, coordonnées confirmées et ambiguïtés, modifications silencieuses, favoris et préparations, GPS daté, propositions non adoptées, verrou et réponse tardive, invalidation des arrêts/rencontres/hypothèses, critères marche/route, contexte collectif et absence de requête ou d’écriture implicite. Les simulations utilisent notamment un aller et un retour de distances différentes pour détecter une fausse symétrie.

La recette publiée emploie des lieux publics et les services déjà raccordés. Elle vérifie les paramètres du sens retour, la correspondance avec les réponses archivées, les ressources du commit publié et les vues ordinateur/petit écran. Les scénarios simulés, les réponses réellement consultées, les contrôles GitHub et la relecture visuelle sont consignés séparément dans quality/route-return et le suivi de développement. Aucun téléphone physique ni trajet effectué n’est attesté.

Aucun nouveau fournisseur, compte, coût, hébergement ou format de stockage. Les limites des péages nationaux, du routage caravane/poids lourd, du trafic et de la couverture des autres modes restent inchangées.
