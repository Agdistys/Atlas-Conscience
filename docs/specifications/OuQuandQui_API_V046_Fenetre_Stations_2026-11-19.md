# V046 — Choisir la distance de recherche des stations

STA-FENETRE-01 · 19 novembre 2026. Complète STA-02, STA-03 et STA-07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md) et la [continuation des stations V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md). Les éditions et copies antérieures sont conservées.

## Trois intentions et bornes explicites

- **Au plus tôt** : classement par distance routière depuis le départ, dans la longueur du trajet de référence.
- **Bon compromis proche** : proximité maximale réglable, initialement 50 km ; zone entre zéro et le minimum de cette valeur et de la longueur du trajet.
- **Vers une distance choisie** : cible initiale 100 km, marge initiale ±20 km ; chaque valeur est réglable. La borne basse est `max(0, cible − marge)`, la haute `min(longueur du trajet, cible + marge)`.

La cible dispose d’un curseur utilisable au clavier et d’un champ numérique équivalent. Les décimales sont conservées dans les calculs et les sauvegardes ; les textes de synthèse affichent une décimale. Cible, marge et proximité doivent être des nombres entre 0,1 et 40 000 km, bornes techniques de saisie et non réglementation. Seuls les paramètres actifs conditionnent la recherche ; toutes les valeurs à conserver doivent être valides pour enregistrer une préparation.

La longueur est celle du trajet choisi, éventuellement avec les rencontres déjà adoptées, avant ajout du plein. Elle est vérifiée sans arrondi lors du filtrage des accès routiers. Les distances restent mesurées depuis le départ saisi, sans suivi permanent ni progression supposée. La présélection géographique reste distincte de cette vérification routière.

Une cible au-delà du trajet est conservée et signalée avant toute recherche de stations. Aucune requête carburant ou d’accès n’est lancée dans cet état. L’action explicite « Viser la fin du trajet » reprend la longueur exacte du trajet ; son libellé est affiché au dixième de kilomètre. La cible n’est jamais raccourcie silencieusement lors d’un changement de route ou d’une reprise sauvegardée. Une distance de proximité ou une marge dépassant le trajet reste enregistrée comme intention ; les bornes effectives sont affichées, limitées au trajet.

## Résultats vides et relance volontaire

Un résultat vide précise qu’aucune station n’a été trouvée avec ces critères **parmi les accès comparés**. Les éventuelles candidates non encore traitées restent accessibles par la continuation V045. Les limites et réponses partielles de la source ne disparaissent pas.

Pour les modes proche et distance choisie, lorsqu’une zone plus large reste possible, un bouton présente ses bornes proposées. Il augmente la proximité ou la marge au plus grand de son double ou de sa valeur plus vingt kilomètres, dans les limites de saisie et du trajet. Une zone déjà complète ne propose aucun élargissement.

L’action modifie les paramètres, retire les anciens résultats et l’arrêt associé comme toute modification de zone, puis place le focus sur « Chercher les stations ». Aucun appel n’est lancé avant ce nouveau choix. Les filtres de détour, services, horaires, fraîcheur et autonomie restent conservés. Deux autres actions ouvrent directement les champs de carburant et de filtres, sans les réinitialiser ni lancer de recherche.

Les nouvelles valeurs participent à la signature de recherche : une réponse tardive obtenue après modification de la cible, de la marge ou de la proximité ne rétablit pas les résultats anciens. La continuation reste liée à la plage initialement calculée.

## Préparations route et marche, format 7

Les préparations automobiles conservent `stopKm`, `stopTolerance` et `nearKm`. Le nom, les lieux, le véhicule, les autres filtres, l’instantané et les rencontres gardent leur sens. La marche n’ajoute aucun paramètre carburant et conserve sa préférence ou limite impérative.

Une nouvelle clé `dragonroute.prepared.v7.<environnement>` reçoit uniquement les écritures volontaires. Les formats 1 à 6 sont lus en mémoire et migrés avec leur marge historique de 20 km et leur proximité historique de 50 km. Aucun original n’est réécrit par la lecture ou la migration ; l’original format 6 dispose d’un export exact, espaces compris. Les exports antérieurs restent disponibles.

La copie de format 7 est prioritaire, même vide ou invalide. Une copie invalide bloque le remplacement et reste exportable, sans résurrection d’une ancienne liste. Avant toute écriture ou suppression, les sept copies observées sont comparées à l’état présent ; une modification dans un autre onglet bloque l’opération et conserve le brouillon. Les imports passent par validation et confirmation, avec export préalable proposé. Les champs obligatoires manquants, valeurs invalides et formats futurs sont refusés.

La reprise restitue les critères et exige un nouveau calcul explicite. Si le nouveau trajet est plus court que la cible conservée, celle-ci est signalée avant la recherche. Les autres livres de préparation, le profil, le journal et les autres environnements restent distincts. L’effacement volontaire des préparations route/marche concerne les sept copies de l’environnement courant.

## Vérification et périmètre

Contrôles du modèle : bornes, décimales, types et valeurs invalides, proposition sans mutation, limites du trajet, migration et export aller-retour. Parcours navigateur : commandes au clavier, cible hors trajet, recherche autour d’une distance, proximité, relance explicite, filtres, réponses tardives, sauvegarde/reprise, original format 6, copie prioritaire, conflit et import invalide. Les régressions des formats historiques et de la marche restent couvertes.

Les preuves locales, l’inspection GitHub et la recette de l’aperçu exact sont consignées dans `quality/station-window` et dans le suivi du chantier. Simulations et services réellement consultés sont distingués. Aucune qualification de téléphone physique ou de conduite n’est déduite des contrôles navigateur. Corridor, limites de source, tarifs et routage spécialisé restent inchangés ; aucun fournisseur, abonnement ou hébergement ajouté.
